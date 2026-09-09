namespace backend.Models;

public class AppUser
{
    public int Id { get; set; }

    public string Email { get; set; } = "";

    // 这个用户有哪些技能
    public List<UserSkill> UserSkills { get; set; } = new();

    // 这个用户保存了哪些职位
    public List<JobApplication> JobApplications { get; set; } = new();
}