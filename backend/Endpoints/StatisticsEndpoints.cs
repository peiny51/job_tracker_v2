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
            // 先检查 User 是否存在
            var userExists = await db.AppUsers
                .AnyAsync(user => user.Id == userId);

            if (!userExists)
            {
                return Results.NotFound("User not found.");
            }

            // 找出这个用户已经拥有的 SkillId, userSkillIds = [1, 2, 6]
            var userSkillIds = await db.UserSkills
                .Where(userSkill => userSkill.UserId == userId)
                .Select(userSkill => userSkill.SkillId)
                .ToListAsync();

            // 统计这个用户所有 JobApplication 中，
            // 他目前还没有的 skill 出现了多少次
            // group by: 把相同的skill合并， 计算这个skill一共出现了多少次
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
    }
}