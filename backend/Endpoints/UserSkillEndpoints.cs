using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class UserSkillEndpoints
{
    public static void MapUserSkillEndpoints(this WebApplication app)
    {
        // ======================================================
        // POST /api/users/{userId}/skills/{skillId}
        // 给用户添加一个已有 Skill
        // ======================================================

        app.MapPost("/api/users/{userId}/skills/{skillId}", async (
            int userId,
            int skillId,
            AppDbContext db) =>
        {
            var userExists = await db.AppUsers
                .AnyAsync(user => user.Id == userId);

            if (!userExists)
            {
                return Results.NotFound("User not found.");
            }

            var skillExists = await db.Skills
                .AnyAsync(skill => skill.Id == skillId);

            if (!skillExists)
            {
                return Results.NotFound("Skill not found.");
            }

            var alreadyExists = await db.UserSkills
                .AnyAsync(userSkill =>
                    userSkill.UserId == userId &&
                    userSkill.SkillId == skillId
                );

            if (alreadyExists)
            {
                return Results.Conflict(
                    "User already has this skill."
                );
            }

            var userSkill = new UserSkill
            {
                UserId = userId,
                SkillId = skillId
            };

            db.UserSkills.Add(userSkill);
            await db.SaveChangesAsync();

            return Results.Created(
                $"/api/users/{userId}/skills/{skillId}",
                new
                {
                    userId,
                    skillId
                }
            );
        });


        // ======================================================
        // GET /api/users/{userId}/skills
        // 获取用户全部 Skills
        // ======================================================

        app.MapGet("/api/users/{userId}/skills", async (
            int userId,
            AppDbContext db) =>
        {
            var skills = await db.UserSkills
                .Where(userSkill =>
                    userSkill.UserId == userId
                )
                .Select(userSkill => new
                {
                    userSkill.Skill.Id,
                    userSkill.Skill.Name
                })
                .OrderBy(skill => skill.Name)
                .ToListAsync();

            return Results.Ok(skills);
        });


        // ======================================================
        // DELETE /api/users/{userId}/skills/{skillId}
        // 只删除 UserSkill relation，不删除 Skill
        // ======================================================

        app.MapDelete("/api/users/{userId}/skills/{skillId}", async (
            int userId,
            int skillId,
            AppDbContext db) =>
        {
            var userSkill = await db.UserSkills
                .FirstOrDefaultAsync(userSkill =>
                    userSkill.UserId == userId &&
                    userSkill.SkillId == skillId
                );

            if (userSkill == null)
            {
                return Results.NotFound();
            }

            db.UserSkills.Remove(userSkill);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }
}