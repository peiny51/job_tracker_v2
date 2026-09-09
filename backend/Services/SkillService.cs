using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class SkillService
{
    private readonly AppDbContext _db;

    public SkillService(AppDbContext db)
    {
        _db = db;
    }

    public string PreprocessSkillName(string input)
    {
        return input
            .Trim()
            .ToLower()
            .Replace("-", " ")
            .Replace("_", " ");
    }

    public async Task<Skill> GetOrCreateSkillAsync(string skillName)
    {
        var processedName = PreprocessSkillName(skillName);

        var existingAlias = await _db.SkillAliases
            .Include(skillAlias => skillAlias.Skill)
            .FirstOrDefaultAsync(
                skillAlias => skillAlias.Alias == processedName
            );

        if (existingAlias != null)
        {
            return existingAlias.Skill;
        }

        var newSkill = new Skill
        {
            Name = skillName.Trim()
        };

        _db.Skills.Add(newSkill);

        await _db.SaveChangesAsync();

        var newAlias = new SkillAlias
        {
            SkillId = newSkill.Id,
            Alias = processedName
        };

        _db.SkillAliases.Add(newAlias);

        await _db.SaveChangesAsync();

        return newSkill;
    }
}