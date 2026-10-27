using System.Linq.Expressions;

namespace LostAndFound.Api.Features.Items;

/// <summary>One item as the frontend sees it. Used by list, details and create.</summary>
public sealed record FoundItemDto(
    Guid Id,
    int Number,
    Guid UserFoundId,
    string FinderName,
    string Name,
    string Description,
    ItemCategory Category,
    string Cabinet,
    string HeldAt,
    FoundItemStatus Status,
    DateTimeOffset FoundAt,
    DateTimeOffset CreatedAt,
    string? PhotoUrl)
{
    /// <summary>EF-translatable projection, so only the needed columns are read.</summary>
    public static readonly Expression<Func<FoundItem, FoundItemDto>> Projection = x => new FoundItemDto(
        x.Id,
        x.Number,
        x.UserFoundId,
        x.FinderName,
        x.Name,
        x.Description,
        x.Category,
        x.Cabinet,
        x.HeldAt,
        x.Status,
        x.FoundAt,
        x.CreatedAt,
        x.PhotoKey == null ? null : "/api/items/" + x.Id + "/photo");

    private static readonly Func<FoundItem, FoundItemDto> Map = Projection.Compile();

    public static FoundItemDto From(FoundItem item) => Map(item);
}
