using System.ComponentModel.DataAnnotations;

namespace LostAndFound.Api.Features.Items.Create;

/// <summary>US-02. Limits agreed with the frontend: title ≤ 150, description ≤ 1024.</summary>
public sealed class CreateFoundItemRequest
{
    [Required(ErrorMessage = "Say what you found."), StringLength(150)]
    public string Name { get; init; } = string.Empty;

    /// <summary>Optional: the finder may leave details out on purpose.</summary>
    [StringLength(1024)]
    public string? Description { get; init; }

    [Required, EnumDataType(typeof(ItemCategory))]
    public ItemCategory? Category { get; init; }

    /// <summary>Place + detail, e.g. "Library · 2nd floor".</summary>
    [Required(ErrorMessage = "Where on campus?"), StringLength(100)]
    public string Cabinet { get; init; } = string.Empty;

    /// <summary>Where the item is now: "With finder", "Security desk", "Library desk".</summary>
    [StringLength(50)]
    public string? HeldAt { get; init; }

    [Required]
    public DateTimeOffset? FoundAt { get; init; }
}
