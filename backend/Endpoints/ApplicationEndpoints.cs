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
        // 获取 Job 列表 + 搜索 + 分页
        // ======================================================

        app.MapGet("/api/applications", async (
            AppDbContext db,
            string? keyword = null,
            int page = 1,
            int pageSize = 10) =>
        {
            if (page <= 0)
            {
                page = 1;
            }

            if (pageSize <= 0)
            {
                pageSize = 10;
            }

            var query = db.JobApplications.AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(job =>
                    EF.Functions.ILike(job.Company, $"%{keyword}%") ||
                    EF.Functions.ILike(job.JobTitle, $"%{keyword}%") ||
                    EF.Functions.ILike(job.RawJobDescription, $"%{keyword}%") ||
                    (job.RawSkillTags != null &&
                     EF.Functions.ILike(job.RawSkillTags, $"%{keyword}%")) ||
                    EF.Functions.ILike(job.Status, $"%{keyword}%")
                );
            }

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
                    ? BuildKeywordPreview(
                        job.RawJobDescription,
                        job.RawSkillTags,
                        keyword
                    )
                    : BuildDefaultPreview(
                        job.Skills,
                        job.RawJobDescription
                    )
            });

            return Results.Ok(new
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,

                TotalPages = (int)Math.Ceiling(
                    (double)totalCount / pageSize
                ),

                Items = results
            });
        });


        // ======================================================
        // GET /api/applications/{id}
        // 点击列表后查看完整 Job
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

            if (job == null)
            {
                return Results.NotFound();
            }

            return Results.Ok(job);
        });


        // ======================================================
        // POST /api/applications
        // 创建 Job + 自动处理 skill tags
        // ======================================================

        app.MapPost("/api/applications", async (
            JobApplication newApplication,
            AppDbContext db,
            SkillService skillService) =>
        {
            // 先保存 Job，这样数据库会生成 Id
            db.JobApplications.Add(newApplication);
            await db.SaveChangesAsync();

            // 如果 Job Post 提供 skill tags
            if (!string.IsNullOrWhiteSpace(newApplication.RawSkillTags))
            {
                var skillTags = newApplication.RawSkillTags
                    .Split(
                        '\n',
                        StringSplitOptions.RemoveEmptyEntries
                    );

                foreach (var skillTag in skillTags)
                {
                    var skill = await skillService
                        .GetOrCreateSkillAsync(skillTag);

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
        // 完整修改 Job（备用）
        // ======================================================

        app.MapPut("/api/applications/{id}", async (
            int id,
            JobApplication updatedJob,
            AppDbContext db,
            SkillService skillService) =>
        {
            var job = await db.JobApplications
                .FirstOrDefaultAsync(job => job.Id == id);

            if (job == null)
            {
                return Results.NotFound();
            }

            job.Company = updatedJob.Company;
            job.JobTitle = updatedJob.JobTitle;
            job.JobUrl = updatedJob.JobUrl;
            job.RawJobDescription = updatedJob.RawJobDescription;
            job.RawSkillTags = updatedJob.RawSkillTags;
            job.Status = updatedJob.Status;

            // 删除旧的 Job-Skill relations
            var oldJobSkills = await db.JobApplicationSkills
                .Where(jobSkill =>
                    jobSkill.JobApplicationId == id
                )
                .ToListAsync();

            db.JobApplicationSkills.RemoveRange(oldJobSkills);

            // 根据新的 tags 重建
            if (!string.IsNullOrWhiteSpace(updatedJob.RawSkillTags))
            {
                var skillTags = updatedJob.RawSkillTags
                    .Split(
                        '\n',
                        StringSplitOptions.RemoveEmptyEntries
                    );

                foreach (var skillTag in skillTags)
                {
                    var skill = await skillService
                        .GetOrCreateSkillAsync(skillTag);

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
        // 实际最常用：只修改申请状态
        // ======================================================

        app.MapPatch("/api/applications/{id}/status", async (
            int id,
            string status,
            AppDbContext db) =>
        {
            var job = await db.JobApplications
                .FirstOrDefaultAsync(job => job.Id == id);

            if (job == null)
            {
                return Results.NotFound();
            }

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
            var job = await db.JobApplications
                .FirstOrDefaultAsync(job => job.Id == id);

            if (job == null)
            {
                return Results.NotFound();
            }

            db.JobApplications.Remove(job);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });


        // ======================================================
        // GET /api/applications/{jobId}/match?userId=1
        // 比较 Job skills 和 User skills
        // ======================================================

        app.MapGet("/api/applications/{jobId}/match", async (
            int jobId,
            int userId,
            AppDbContext db) =>
        {
            var job = await db.JobApplications
                .FirstOrDefaultAsync(job => job.Id == jobId);

            if (job == null)
            {
                return Results.NotFound("Job not found.");
            }

            var jobSkills = await db.JobApplicationSkills
                .Where(jobSkill =>
                    jobSkill.JobApplicationId == jobId
                )
                .Select(jobSkill => new
                {
                    jobSkill.SkillId,
                    jobSkill.Skill.Name
                })
                .ToListAsync();

            var userSkillIds = await db.UserSkills
                .Where(userSkill =>
                    userSkill.UserId == userId
                )
                .Select(userSkill =>
                    userSkill.SkillId
                )
                .ToListAsync();

            var matchedSkills = jobSkills
                .Where(jobSkill =>
                    userSkillIds.Contains(jobSkill.SkillId)
                )
                .Select(jobSkill => jobSkill.Name)
                .ToList();

            var missingSkills = jobSkills
                .Where(jobSkill =>
                    !userSkillIds.Contains(jobSkill.SkillId)
                )
                .Select(jobSkill => jobSkill.Name)
                .ToList();

            var matchPercentage = jobSkills.Count == 0
                ? 0
                : Math.Round(
                    (double)matchedSkills.Count /
                    jobSkills.Count * 100,
                    1
                );

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
    // 默认列表 Preview
    // 没有 keyword 时显示前四个 skills
    // =========================================================

    private static string BuildDefaultPreview(
        List<string> skills,
        string rawJobDescription)
    {
        if (skills.Count > 0)
        {
            return string.Join(
                " · ",
                skills.Take(4)
            );
        }

        if (rawJobDescription.Length <= 120)
        {
            return rawJobDescription;
        }

        return rawJobDescription[..120] + "...";
    }


    // =========================================================
    // 搜索时显示 keyword 附近文字
    // =========================================================

    private static string BuildKeywordPreview(
        string rawJobDescription,
        string? rawSkillTags,
        string keyword)
    {
        var text = rawJobDescription;

        var index = text.IndexOf(
            keyword,
            StringComparison.OrdinalIgnoreCase
        );

        // JD 没找到时再尝试 RawSkillTags
        if (index == -1 && rawSkillTags != null)
        {
            text = rawSkillTags;

            index = text.IndexOf(
                keyword,
                StringComparison.OrdinalIgnoreCase
            );
        }

        if (index == -1)
        {
            return "";
        }

        var start = Math.Max(0, index - 50);

        var length = Math.Min(
            120,
            text.Length - start
        );

        var preview = text.Substring(
            start,
            length
        );

        if (start > 0)
        {
            preview = "..." + preview;
        }

        if (start + length < text.Length)
        {
            preview += "...";
        }

        return preview;
    }
}