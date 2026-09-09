namespace backend.Models;


public class JobApplicationSkill
{
    public int Id { get; set; }

    public int JobApplicationId { get; set; }

    public int SkillId { get; set; }

    // Navigation
    public JobApplication JobApplication { get; set; } = null!;

    public Skill Skill { get; set; } = null!;
}