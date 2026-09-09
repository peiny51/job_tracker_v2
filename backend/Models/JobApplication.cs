namespace backend.Models;

public class JobApplication
{
    public int Id { get; set; }

    // 这个 Job 属于哪个用户
    public int UserId { get; set; }

    public string Company { get; set; } = "";

    public string JobTitle { get; set; } = "";

    // 原始招聘页面
    public string? JobUrl { get; set; }

    // 网站原始 skill tag list
    public string? RawSkillTags { get; set; }
    
    // 整个原始 Job Post / Requirements
    public string RawJobDescription { get; set; } = "";

    // 当前申请状态
    public string Status { get; set; } = "Saved";

    // 什么时候添加/申请的，用于按时间排序
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public AppUser User { get; set; } = null!;

    public List<JobApplicationSkill> JobApplicationSkills { get; set; } = new();

}