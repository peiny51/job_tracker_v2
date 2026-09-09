//test
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Endpoints;

public static class SkillEndpoints
{
    public static void MapSkillEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/skills");


        // =========================================================
        // GET /api/skills
        // 获取所有 canonical skills
        // =========================================================
        group.MapGet("/", async (AppDbContext db) =>
        {
            var skills = await db.Skills
                .OrderBy(skill => skill.Name)
                .Select(skill => new
                {
                    skill.Id,
                    skill.Name
                })
                .ToListAsync();

            return Results.Ok(skills);
        });


        // =========================================================
        // GET /api/skills/{id}
        // 获取一个 skill + aliases
        // =========================================================
        group.MapGet("/{id}", async (
            int id,
            AppDbContext db) =>
        {
            var skill = await db.Skills
                .Where(skill => skill.Id == id)
                .Select(skill => new
                {
                    skill.Id,
                    skill.Name,

                    Aliases = skill.Aliases
                        .Select(alias => new
                        {
                            alias.Id,
                            alias.Alias
                        })
                        .OrderBy(alias => alias.Alias)
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (skill == null)
            {
                return Results.NotFound();
            }

            return Results.Ok(skill);
        });


        // =========================================================
        // POST /api/skills
        // 创建 skill
        //
        // 实际上复用 SkillService：
        // 如果 alias 已经存在，返回已有 skill
        // 如果不存在，创建 Skill + canonical alias
        // =========================================================
        group.MapPost("/", async (
            string name,
            SkillService skillService) =>
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return Results.BadRequest("Skill name is required.");
            }

            var skill = await skillService
                .GetOrCreateSkillAsync(name);

            return Results.Ok(new
            {
                skill.Id,
                skill.Name
            });
        });


        // =========================================================
        // DELETE /api/skills/{id}
        //
        // 只有没有 UserSkill / JobApplicationSkill 引用时才能删
        // 因为 DbContext 里 Skill -> these relationships 是 Restrict
        // =========================================================
        group.MapDelete("/{id}", async (
            int id,
            AppDbContext db) =>
        {
            var skill = await db.Skills
                .FirstOrDefaultAsync(skill => skill.Id == id);

            if (skill == null)
            {
                return Results.NotFound();
            }

            var isUsedByUser = await db.UserSkills
                .AnyAsync(userSkill =>
                    userSkill.SkillId == id
                );

            var isUsedByJob = await db.JobApplicationSkills
                .AnyAsync(jobSkill =>
                    jobSkill.SkillId == id
                );

            if (isUsedByUser || isUsedByJob)
            {
                return Results.Conflict(
                    "This skill is currently used by a user or job."
                );
            }

            db.Skills.Remove(skill);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });


        // =========================================================
        // GET /api/skills/{id}/aliases
        // 获取一个 skill 的所有 aliases
        // =========================================================
        group.MapGet("/{id}/aliases", async (
            int id,
            AppDbContext db) =>
        {
            var skillExists = await db.Skills
                .AnyAsync(skill => skill.Id == id);

            if (!skillExists)
            {
                return Results.NotFound("Skill not found.");
            }

            var aliases = await db.SkillAliases
                .Where(alias => alias.SkillId == id)
                .OrderBy(alias => alias.Alias)
                .Select(alias => new
                {
                    alias.Id,
                    alias.Alias
                })
                .ToListAsync();

            return Results.Ok(aliases);
        });


        // =========================================================
        // POST /api/skills/{id}/aliases
        // 给 canonical skill 添加一个 alias
        // =========================================================
        group.MapPost("/{id}/aliases", async (
            int id,
            string alias,
            AppDbContext db,
            SkillService skillService) =>
        {
            var skillExists = await db.Skills
                .AnyAsync(skill => skill.Id == id);

            if (!skillExists)
            {
                return Results.NotFound("Skill not found.");
            }

            if (string.IsNullOrWhiteSpace(alias))
            {
                return Results.BadRequest("Alias is required.");
            }

            var processedAlias =
                skillService.PreprocessSkillName(alias);

            var existingAlias = await db.SkillAliases
                .FirstOrDefaultAsync(skillAlias =>
                    skillAlias.Alias == processedAlias
                );

            if (existingAlias != null)
            {
                if (existingAlias.SkillId == id)
                {
                    return Results.Conflict(
                        "This alias already belongs to this skill."
                    );
                }

                return Results.Conflict(
                    "This alias already belongs to another skill."
                );
            }

            var newAlias = new SkillAlias
            {
                SkillId = id,
                Alias = processedAlias
            };

            db.SkillAliases.Add(newAlias);
            await db.SaveChangesAsync();

            return Results.Created(
                $"/api/skills/{id}/aliases/{newAlias.Id}",
                new
                {
                    newAlias.Id,
                    newAlias.Alias
                }
            );
        });


        // =========================================================
        // DELETE /api/skills/{skillId}/aliases/{aliasId}
        // 删除某个 alias
        // =========================================================
        group.MapDelete("/{skillId}/aliases/{aliasId}", async (
            int skillId,
            int aliasId,
            AppDbContext db) =>
        {
            var alias = await db.SkillAliases
                .FirstOrDefaultAsync(alias =>
                    alias.Id == aliasId &&
                    alias.SkillId == skillId
                );

            if (alias == null)
            {
                return Results.NotFound();
            }

            // 不允许删到这个 Skill 一个 alias 都不剩。
            // 因为我们的设计要求所有 text -> Skill lookup 都走 SkillAliases。
            var aliasCount = await db.SkillAliases
                .CountAsync(alias =>
                    alias.SkillId == skillId
                );

            if (aliasCount <= 1)
            {
                return Results.Conflict(
                    "A skill must keep at least one alias."
                );
            }

            db.SkillAliases.Remove(alias);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }
}