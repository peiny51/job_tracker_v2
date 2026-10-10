using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class StatisticsEndpoints
{
    public static void MapStatisticsEndpoints(this WebApplication app)
    {
        app.MapGet("/api/statistics/skill-gaps", async (
            int userId,
            AppDbContext db) =>
        {
            // Make sure the requested user exists before calculating statistics.
            var userExists = await db.AppUsers.AnyAsync(user => user.Id == userId);

            if (!userExists)
            {
                return Results.NotFound("User not found.");
            }

            // Get the skills this user already has so they can be excluded from the gap list.
            var userSkillIds = await db.UserSkills
                .Where(userSkill => userSkill.UserId == userId)
                .Select(userSkill => userSkill.SkillId)
                .ToListAsync();

            // Count how many of this user's saved applications require each missing skill.
            var missingSkills = await db.JobApplicationSkills
                .Where(jobSkill =>
                    jobSkill.JobApplication.UserId == userId &&
                    !userSkillIds.Contains(jobSkill.SkillId)
                )
                .GroupBy(jobSkill => new
                {
                    jobSkill.SkillId,
                    jobSkill.Skill.Name
                })
                .Select(group => new
                {
                    SkillId = group.Key.SkillId,
                    Name = group.Key.Name,
                    JobCount = group.Count()
                })
                .OrderByDescending(skill => skill.JobCount)
                .ThenBy(skill => skill.Name)
                .ToListAsync();

            return Results.Ok(new
            {
                UserId = userId,
                MissingSkills = missingSkills
            });
        });


        // Return the specific applications that require one skill.
        // This supports drilling down from "Redis - 3 jobs" to those 3 applications.
        app.MapGet("/api/statistics/skill-gaps/{skillId}/applications", async (
            int skillId,
            int userId,
            AppDbContext db) =>
        {
            var userExists = await db.AppUsers.AnyAsync(user => user.Id == userId);

            if (!userExists)
            {
                return Results.NotFound("User not found.");
            }

            var skill = await db.Skills
                .Where(skill => skill.Id == skillId)
                .Select(skill => new
                {
                    skill.Id,
                    skill.Name
                })
                .FirstOrDefaultAsync();

            if (skill == null)
            {
                return Results.NotFound("Skill not found.");
            }

            // Only return applications belonging to this user that require the selected skill.
            var applications = await db.JobApplicationSkills
                .Where(jobSkill =>
                    jobSkill.SkillId == skillId &&
                    jobSkill.JobApplication.UserId == userId
                )
                .OrderByDescending(jobSkill => jobSkill.JobApplication.CreatedAt)
                .Select(jobSkill => new
                {
                    jobSkill.JobApplication.Id,
                    jobSkill.JobApplication.Company,
                    jobSkill.JobApplication.JobTitle,
                    jobSkill.JobApplication.Status,
                    jobSkill.JobApplication.CreatedAt
                })
                .ToListAsync();

            return Results.Ok(new
            {
                SkillId = skill.Id,
                SkillName = skill.Name,
                JobCount = applications.Count,
                Applications = applications
            });
        });
    }
}