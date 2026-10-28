namespace LostAndFound.Api.Features.Items;

/// <summary>
/// Stored and sent as numbers, so existing values must never change.
/// New values are appended (agreed list with the frontend in Sprint 1).
/// </summary>
public enum ItemCategory
{
    Accessory = 0,
    Clothing = 1,
    Electronics = 2,
    Documents = 3,   // UI: "Cards & IDs"
    Keys = 4,
    Other = 5,
    Bottles = 6,
    BooksAndNotes = 7
}
