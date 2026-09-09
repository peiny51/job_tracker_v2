using System.Text;
using System.Text.Json;
using backend.DTOs;

namespace backend.Services;

public class JobExtractionService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public JobExtractionService(HttpClient httpClient)
    {
        _httpClient = httpClient;

        _apiKey =
            Environment.GetEnvironmentVariable("GEMINI_API_KEY")
            ?? throw new InvalidOperationException(
                "GEMINI_API_KEY is not set."
            );
    }


    public async Task<JobExtractionResult> ExtractJobAsync(
        string jobDescription
    )
    {
        var prompt = $$"""
You are extracting structured information from a job posting.Extract the following information:

- company
- job title
- location
- job URL, only if explicitly present
- technical skills required or preferred for the role

For skills, include:
- programming languages
- frameworks
- libraries
- databases
- cloud platforms
- AI / ML techniques
- LLM frameworks
- APIs
- developer tools
- concrete architecture concepts
- concrete technical platforms

Do NOT include as skills:
- years of experience
- degrees
- salary
- work authorization
- generic soft skills
- vague phrases such as "problem solving"
- generic responsibilities

For every extracted skill:
- Use a concise, canonical, industry-standard name.- Normalize equivalent names to the same representation.- Prefer widely recognized names.- Use common abbreviations when the abbreviation is the standard industry term.- Do not create multiple names for the same underlying skill.- Do not preserve awkward wording from the original job post if a standard name exists.Examples:
- "retrieval augmented generation" -> "RAG"
- "retrieval-augmented generation (RAG)" -> "RAG"
- "OpenAI APIs" -> "OpenAI API"
- "postgres" -> "PostgreSQL"
- "postgresql database" -> "PostgreSQL"
- "js" -> "JavaScript"
- "javascript" -> "JavaScript"
- "ts" -> "TypeScript"
- "dotnet" -> ".NET"
- ".net framework" -> ".NET Framework"
- "asp.net core" -> "ASP.NET Core"
- "amazon web services" -> "AWS"
- "google cloud platform" -> "Google Cloud"
- "microsoft azure" -> "Azure"

Do not extract overly broad or contextless technical terms as standalone skills.Examples of terms that should NOT be standalone skills:
- Functions
- APIs
- Services
- Development
- Architecture
- Testing
- Cloud
- Databases

If such a term is part of a specific technology, extract the full technology name instead.Examples:
- "Azure Functions" -> "Azure Functions"
- "REST APIs" -> "REST API"
- "cloud services on AWS" -> "AWS"
- "relational databases such as PostgreSQL" -> "PostgreSQL"

Prefer specific named technologies when available.Do not invent information.If company, job title, location, or job URL is not present,
return null for that field.Job posting:

{{jobDescription}}
""";


        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new
                        {
                            text = prompt
                        }
                    }
                }
            },

            generationConfig = new
            {
                responseMimeType = "application/json",

                responseJsonSchema = new
                {
                    type = "object",

                    properties = new
                    {
                        company = new
                        {
                            type = new[]
                            {
                                "string",
                                "null"
                            }
                        },

                        jobTitle = new
                        {
                            type = new[]
                            {
                                "string",
                                "null"
                            }
                        },

                        location = new
                        {
                            type = new[]
                            {
                                "string",
                                "null"
                            }
                        },

                        jobUrl = new
                        {
                            type = new[]
                            {
                                "string",
                                "null"
                            }
                        },

                        skills = new
                        {
                            type = "array",

                            items = new
                            {
                                type = "string"
                            },

                            description =
                                "Concrete technical skills required or preferred in the job posting."
                        }
                    },

                    required = new[]
                    {
                        "company",
                        "jobTitle",
                        "location",
                        "jobUrl",
                        "skills"
                    }
                }
            }
        };


        var json =
            JsonSerializer.Serialize(requestBody);


        using var request =
            new HttpRequestMessage(
                HttpMethod.Post,
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"
            );


        request.Headers.Add(
            "x-goog-api-key",
            _apiKey
        );


        request.Content =
            new StringContent(
                json,
                Encoding.UTF8,
                "application/json"
            );


        var response =
            await _httpClient.SendAsync(request);


        if (!response.IsSuccessStatusCode)
        {
            var errorText =
                await response.Content
                    .ReadAsStringAsync();

            throw new Exception(
                $"Gemini API failed: {errorText}"
            );
        }


        var responseText =
            await response.Content
                .ReadAsStringAsync();


        using var document =
            JsonDocument.Parse(responseText);


        var modelText =
            document
                .RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();


        if (string.IsNullOrWhiteSpace(modelText))
        {
            return new JobExtractionResult();
        }


        var result =
            JsonSerializer.Deserialize<JobExtractionResult>(
                modelText,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }
            );


        return result
            ?? new JobExtractionResult();
    }
}