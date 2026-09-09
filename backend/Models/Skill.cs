namespace backend.Models;
public class Skill
{
    public int Id { get; set; }

    public string Name { get; set; } = "";

    // JavaScript -> javascript / js 等
    public List<SkillAlias> Aliases { get; set; } = new();

    // 哪些用户拥有这个 Skill
    public List<UserSkill> UserSkills { get; set; } = new();

    // 哪些 Job 使用这个 Skill
    public List<JobApplicationSkill> JobApplicationSkills { get; set; } = new();
}