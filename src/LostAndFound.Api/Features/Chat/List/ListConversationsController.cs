using System.ComponentModel.DataAnnotations;
using LostAndFound.Api.Features.Chat;
using LostAndFound.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.Resource;
using MongoDB.Driver;

namespace LostAndFound.Api.Features.Chat.List;

[ApiController]
[Route("api/conversations")]
[Authorize]
[RequiredScope("access_as_user")]
public sealed class ListConversationsController(
    ChatDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] ListConversationsRequest request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.GetObjectId(), out var userId))
        {
            return Unauthorized();
        }

        var filters = Builders<Conversation>.Filter;

        var filter = filters.Or(
            filters.Eq(x => x.OwnerUserId, userId),
            filters.Eq(x => x.InitiatorUserId, userId));

        var totalCount = await db.Conversations.CountDocumentsAsync(
            filter,
            cancellationToken: cancellationToken);

        var conversations = await db.Conversations
            .Find(filter)
            .Sort(Builders<Conversation>.Sort
                .Descending(x => x.CreatedAt)
                .Descending(x => x.Id))
            .Skip((request.Page - 1) * request.PageSize)
            .Limit(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = conversations
            .Select(x => new ConversationListItemResponse(
                x.Id,
                x.FoundItemId,
                x.OwnerUserId == userId
                    ? x.InitiatorUserId
                    : x.OwnerUserId,
                x.CreatedAt))
            .ToArray();

        return Ok(new ListConversationsResponse(
            items,
            totalCount,
            request.Page,
            request.PageSize));
    }
}

public sealed class ListConversationsRequest
{
    [Range(1, 1_000_000)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;
}

public sealed record ConversationListItemResponse(
    Guid Id,
    Guid FoundItemId,
    Guid OtherUserId,
    DateTime CreatedAt);

public sealed record ListConversationsResponse(
    IReadOnlyList<ConversationListItemResponse> Items,
    long TotalCount,
    int Page,
    int PageSize);