namespace backend.DTOs;

public class JobExtractionResult
{
    public string? Company { get; set; }

    public string? JobTitle { get; set; }

    public string? Location { get; set; }

    public string? JobUrl { get; set; }

    public List<string> Skills { get; set; } = new();
}