namespace backend.Models;

public class UserSkill
{
    public int Id { get; set; }

    // FK -> AppUser
    public int UserId { get; set; }

    // FK -> Skill
    public int SkillId { get; set; }

    // Navigation
    public AppUser User { get; set; } = null!;

    public Skill Skill { get; set; } = null!;
}