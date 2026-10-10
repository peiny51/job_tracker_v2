using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class ApplicationEndpoints
{
    public static void MapApplicationEndpoints(this WebApplication app)
    {
        // ======================================================
        // GET /api/applications
        // Job list + search + status filter + status counts + pagination
        // ======================================================

        app.MapGet("/api/applications", async (
            AppDbContext db,
            string? keyword = null,
            string? status = null,
            int page = 1,
            int pageSize = 10) =>
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 10;

            // baseQuery contains the keyword search but not the selected status.
            // This lets status counts show all categories for the current search.
            var baseQuery = db.JobApplications.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                baseQuery = baseQuery.Where(job =>
                    EF.Functions.ILike(job.Company, $"%{keyword}%") ||
                    EF.Functions.ILike(job.JobTitle, $"%{keyword}%") ||
                    EF.Functions.ILike(job.RawJobDescription, $"%{keyword}%") ||
                    (job.RawSkillTags != null && EF.Functions.ILike(job.RawSkillTags, $"%{keyword}%")) ||
                    EF.Functions.ILike(job.Status, $"%{keyword}%")
                );
            }

            // Count every status before applying the selected status filter.
            var statusCountRows = await baseQuery
                .GroupBy(job => job.Status)
                .Select(group => new
                {
                    Status = group.Key,
                    Count = group.Count()
                })
                .ToListAsync();

            int CountStatus(string targetStatus)
            {
                return statusCountRows
                    .FirstOrDefault(item => string.Equals(item.Status, targetStatus, StringComparison.OrdinalIgnoreCase))
                    ?.Count ?? 0;
            }

            var allCount = statusCountRows.Sum(item => item.Count);

            var query = baseQuery;

            // "All" means no status filter. Mobile can either send All or omit status completely.
            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(job => job.Status == status);
            }

            // This count belongs to the currently filtered list and is used for pagination.
            var totalCount = await query.CountAsync();

            var jobs = await query
                .OrderByDescending(job => job.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(job => new
                {
                    job.Id,
                    job.Company,
                    job.JobTitle,
                    job.Status,
                    job.CreatedAt,

                    Skills = job.JobApplicationSkills
                        .Select(jobSkill => jobSkill.Skill.Name)
                        .ToList(),

                    job.RawJobDescription,
                    job.RawSkillTags
                })
                .ToListAsync();

            var results = jobs.Select(job => new
            {
                job.Id,
                job.Company,
                job.JobTitle,
                job.Status,
                job.CreatedAt,

                Preview = !string.IsNullOrWhiteSpace(keyword)
                    ? BuildKeywordPreview(job.RawJobDescription, job.RawSkillTags, keyword!)
                    : BuildDefaultPreview(job.Skills, job.RawJobDescription)
            });

            return Results.Ok(new
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize),

                StatusCounts = new
                {
                    All = allCount,
                    Watched = CountStatus("Watched"),
                    Applied = CountStatus("Applied"),
                    Interview = CountStatus("Interview"),
                    Offer = CountStatus("Offer"),
                    Rejected = CountStatus("Rejected")
                },

                Items = results
            });
        });


        // ======================================================
        // GET /api/applications/{id}
        // View one complete application
        // ======================================================

        app.MapGet("/api/applications/{id}", async (
            int id,
            AppDbContext db) =>
        {
            var job = await db.JobApplications
                .Where(job => job.Id == id)
                .Select(job => new
                {
                    job.Id,
                    job.Company,
                    job.JobTitle,
                    job.JobUrl,
                    job.Status,
                    job.CreatedAt,

                    Skills = job.JobApplicationSkills
                        .Select(jobSkill => new
                        {
                            jobSkill.Skill.Id,
                            jobSkill.Skill.Name
                        })
                        .ToList(),

                    job.RawJobDescription,
                    job.RawSkillTags
                })
                .FirstOrDefaultAsync();

            if (job == null) return Results.NotFound();

            return Results.Ok(job);
        });


        // ======================================================
        // POST /api/applications
        // Create an application and process its skill tags
        // ======================================================

        app.MapPost("/api/applications", async (
            JobApplication newApplication,
            AppDbContext db,
            SkillService skillService) =>
        {
            // Save first so PostgreSQL generates the application ID.
            db.JobApplications.Add(newApplication);
            await db.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(newApplication.RawSkillTags))
            {
                var skillTags = newApplication.RawSkillTags.Split('\n', StringSplitOptions.RemoveEmptyEntries);

                foreach (var skillTag in skillTags)
                {
                    var skill = await skillService.GetOrCreateSkillAsync(skillTag);

                    var jobSkill = new JobApplicationSkill
                    {
                        JobApplicationId = newApplication.Id,
                        SkillId = skill.Id
                    };

                    db.JobApplicationSkills.Add(jobSkill);
                }

                await db.SaveChangesAsync();
            }

            return Results.Created(
                $"/api/applications/{newApplication.Id}",
                new
                {
                    newApplication.Id,
                    newApplication.UserId,
                    newApplication.Company,
                    newApplication.JobTitle,
                    newApplication.JobUrl,
                    newApplication.RawSkillTags,
                    newApplication.RawJobDescription,
                    newApplication.Status,
                    newApplication.CreatedAt,

                    Skills = newApplication.JobApplicationSkills
                        .Select(jobSkill => jobSkill.Skill.Name)
                        .ToList()
                }
            );
        });


        // ======================================================
        // PUT /api/applications/{id}
        // Full update endpoint kept as a backend capability
        // ======================================================

        app.MapPut("/api/applications/{id}", async (
            int id,
            JobApplication updatedJob,
            AppDbContext db,
            SkillService skillService) =>
        {
            var job = await db.JobApplications.FirstOrDefaultAsync(job => job.Id == id);

            if (job == null) return Results.NotFound();

            job.Company = updatedJob.Company;
            job.JobTitle = updatedJob.JobTitle;
            job.JobUrl = updatedJob.JobUrl;
            job.RawJobDescription = updatedJob.RawJobDescription;
            job.RawSkillTags = updatedJob.RawSkillTags;
            job.Status = updatedJob.Status;

            var oldJobSkills = await db.JobApplicationSkills
                .Where(jobSkill => jobSkill.JobApplicationId == id)
                .ToListAsync();

            db.JobApplicationSkills.RemoveRange(oldJobSkills);

            if (!string.IsNullOrWhiteSpace(updatedJob.RawSkillTags))
            {
                var skillTags = updatedJob.RawSkillTags.Split('\n', StringSplitOptions.RemoveEmptyEntries);

                foreach (var skillTag in skillTags)
                {
                    var skill = await skillService.GetOrCreateSkillAsync(skillTag);

                    var jobSkill = new JobApplicationSkill
                    {
                        JobApplicationId = job.Id,
                        SkillId = skill.Id
                    };

                    db.JobApplicationSkills.Add(jobSkill);
                }
            }

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                job.Id,
                job.Company,
                job.JobTitle,
                job.JobUrl,
                job.RawSkillTags,
                job.RawJobDescription,
                job.Status
            });
        });


        // ======================================================
        // PATCH /api/applications/{id}/status
        // Update only the application status
        // ======================================================

        app.MapPatch("/api/applications/{id}/status", async (
            int id,
            string status,
            AppDbContext db) =>
        {
            var job = await db.JobApplications.FirstOrDefaultAsync(job => job.Id == id);

            if (job == null) return Results.NotFound();

            job.Status = status;
            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                job.Id,
                job.Status
            });
        });


        // ======================================================
        // DELETE /api/applications/{id}
        // ======================================================

        app.MapDelete("/api/applications/{id}", async (
            int id,
            AppDbContext db) =>
        {
            var job = await db.JobApplications.FirstOrDefaultAsync(job => job.Id == id);

            if (job == null) return Results.NotFound();

            db.JobApplications.Remove(job);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });


        // ======================================================
        // GET /api/applications/{jobId}/match?userId=1
        // Compare application requirements with user skills
        // ======================================================

        app.MapGet("/api/applications/{jobId}/match", async (
            int jobId,
            int userId,
            AppDbContext db) =>
        {
            var job = await db.JobApplications.FirstOrDefaultAsync(job => job.Id == jobId);

            if (job == null) return Results.NotFound("Job not found.");

            var jobSkills = await db.JobApplicationSkills
                .Where(jobSkill => jobSkill.JobApplicationId == jobId)
                .Select(jobSkill => new
                {
                    jobSkill.SkillId,
                    jobSkill.Skill.Name
                })
                .ToListAsync();

            var userSkillIds = await db.UserSkills
                .Where(userSkill => userSkill.UserId == userId)
                .Select(userSkill => userSkill.SkillId)
                .ToListAsync();

            var matchedSkills = jobSkills
                .Where(jobSkill => userSkillIds.Contains(jobSkill.SkillId))
                .Select(jobSkill => jobSkill.Name)
                .ToList();

            var missingSkills = jobSkills
                .Where(jobSkill => !userSkillIds.Contains(jobSkill.SkillId))
                .Select(jobSkill => jobSkill.Name)
                .ToList();

            var matchPercentage = jobSkills.Count == 0
                ? 0
                : Math.Round((double)matchedSkills.Count / jobSkills.Count * 100, 1);

            return Results.Ok(new
            {
                job.Id,
                job.Company,
                job.JobTitle,
                MatchPercentage = matchPercentage,
                MatchedSkills = matchedSkills,
                MissingSkills = missingSkills
            });
        });
    }


    // =========================================================
    // Default preview: show up to four skills, otherwise JD text
    // =========================================================

    private static string BuildDefaultPreview(List<string> skills, string rawJobDescription)
    {
        if (skills.Count > 0) return string.Join(" · ", skills.Take(4));

        if (rawJobDescription.Length <= 120) return rawJobDescription;

        return rawJobDescription[..120] + "...";
    }


    // =========================================================
    // Search preview: show text around the matching keyword
    // =========================================================

    private static string BuildKeywordPreview(string rawJobDescription, string? rawSkillTags, string keyword)
    {
        var text = rawJobDescription;

        var index = text.IndexOf(keyword, StringComparison.OrdinalIgnoreCase);

        // If the JD does not contain the keyword, try the stored skill tags.
        if (index == -1 && rawSkillTags != null)
        {
            text = rawSkillTags;
            index = text.IndexOf(keyword, StringComparison.OrdinalIgnoreCase);
        }

        if (index == -1) return "";

        var start = Math.Max(0, index - 50);
        var length = Math.Min(120, text.Length - start);
        var preview = text.Substring(start, length);

        if (start > 0) preview = "..." + preview;
        if (start + length < text.Length) preview += "...";

        return preview;
    }
}