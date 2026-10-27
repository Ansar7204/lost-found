using System.ComponentModel.DataAnnotations;
using LostAndFound.Api.Features.Identity;
using LostAndFound.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web.Resource;

namespace LostAndFound.Api.Features.Items.Search;

/// <summary>US-03: browse found items by category (and status), newest first, paged.</summary>
[ApiController]
[Route("api/items")]
[Authorize]
[RequiredScope("access_as_user")]
public sealed class SearchFoundItemsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<SearchFoundItemsResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] SearchFoundItemsRequest request, CancellationToken cancellationToken)
    {
        var query = db.FoundItems.AsNoTracking();

        if (request.Category is { } category)
        {
            query = query.Where(x => x.Category == category);
        }
        if (request.Status is { } status)
        {
            query = query.Where(x => x.Status == status);
        }
        if (!string.IsNullOrWhiteSpace(request.Cabinet))
        {
            var cabinet = request.Cabinet.Trim();
            query = query.Where(x => x.Cabinet == cabinet);
        }
        if (request.Mine)
        {
            if (User.GetUserId() is not { } userId) return Unauthorized();
            query = query.Where(x => x.UserFoundId == userId);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Number)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(FoundItemDto.Projection)
            .ToListAsync(cancellationToken);

        return Ok(new SearchFoundItemsResponse(items, totalCount, request.Page, request.PageSize));
    }
}

public sealed class SearchFoundItemsRequest
{
    [EnumDataType(typeof(ItemCategory))]
    public ItemCategory? Category { get; init; }

    [EnumDataType(typeof(FoundItemStatus))]
    public FoundItemStatus? Status { get; init; }

    [StringLength(100)]
    public string? Cabinet { get; init; }

    /// <summary>Only items the current user posted ("Posted by me").</summary>
    public bool Mine { get; init; }

    [Range(1, 1_000_000)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
}

public sealed record SearchFoundItemsResponse(
    IReadOnlyList<FoundItemDto> Items,
    int TotalCount,
    int Page,
    int PageSize);
