namespace backend.Models;

public class SkillAlias
{
    public int Id { get; set; }

    // 外键：这个 alias 属于哪个标准 Skill
    public int SkillId { get; set; }

    // preprocessing 后用于匹配
    public string Alias { get; set; } = "";

    // 正向 navigation
    public Skill Skill { get; set; } = null!;
}