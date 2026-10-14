namespace  LostAndFound.Api.Features.Items;
using System;
public class FoundItem
{
    public Guid Id { get; private set; }
    public Guid UserFoundId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public ItemCategory Category { get; private set; }
    public string Cabinet { get; private set; } = string.Empty;
    public FoundItemStatus Status { get; private set; }
    public DateTimeOffset FoundAt { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public string? PhotoKey {get;private set;}

    private FoundItem()
    { }

    public FoundItem(
        Guid userFoundId,
        string name,
        string description,
        ItemCategory category,
        string cabinet,
        FoundItemStatus status,
        DateTime foundAt,
        // DateTime createdAt,
        string? photoKey)
    {
        Id = Guid.NewGuid();
        UserFoundId = userFoundId;
        Name = name;
        Description = description;
        Category = category;
        Cabinet = cabinet;
        Status = FoundItemStatus.Open;
        FoundAt = foundAt.ToUniversalTime();
        CreatedAt = DateTimeOffset.UtcNow;
        PhotoKey = photoKey;
    }

    public void MarkReturned()
    {
        Status = FoundItemStatus.Returned;
    }
    public void SetPhoto(string photoKey)
    {
        if (string.IsNullOrWhiteSpace(photoKey))
            throw new ArgumentException("Photo key cannot be empty.", nameof(photoKey));

        PhotoKey = photoKey;
    }
}
