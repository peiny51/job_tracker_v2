using backend.DTOs;
using backend.Services;

namespace backend.Endpoints;

public static class JobExtractionEndpoints
{
    public static void MapJobExtractionEndpoints(
        this WebApplication app
    )
    {
        app.MapPost(
    "/api/job-extraction/analyze",
    async (
        JobExtractionRequest request,
        JobExtractionService extractionService
    ) =>
    {
        if (string.IsNullOrWhiteSpace(
            request.JobDescription
        ))
        {
            return Results.BadRequest(
                "Job description is required."
            );
        }

        var result =
            await extractionService
                .ExtractJobAsync(
                    request.JobDescription
                );

        return Results.Ok(result);
    }
);
    }
}