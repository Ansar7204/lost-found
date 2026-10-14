using LostAndFound.Api.Features.Chat;
using MongoDB.Driver;

namespace LostAndFound.Api.Infrastructure.Persistence;

public static class ChatIndexes
{
    public static async Task EnsureCreatedAsync(
        ChatDbContext db,
        CancellationToken cancellationToken = default)
    {
        var conversationKeys = Builders<Conversation>.IndexKeys;

        await db.Conversations.Indexes.CreateManyAsync(
            new[]
            {
                new CreateIndexModel<Conversation>(
                    conversationKeys
                        .Ascending(x => x.FoundItemId)
                        .Ascending(x => x.InitiatorUserId),
                    new CreateIndexOptions
                    {
                        Name = "ux_item_initiator",
                        Unique = true
                    }),

                new CreateIndexModel<Conversation>(
                    conversationKeys
                        .Ascending(x => x.OwnerUserId)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions
                    {
                        Name = "ix_owner_created"
                    }),

                new CreateIndexModel<Conversation>(
                    conversationKeys
                        .Ascending(x => x.InitiatorUserId)
                        .Descending(x => x.CreatedAt),
                    new CreateIndexOptions
                    {
                        Name = "ix_initiator_created"
                    })
            },
            cancellationToken: cancellationToken);

        var messageKeys = Builders<ChatMessage>.IndexKeys;

        await db.Messages.Indexes.CreateManyAsync(
            new[]
            {
                new CreateIndexModel<ChatMessage>(
                    messageKeys
                        .Ascending(x => x.ConversationId)
                        .Ascending(x => x.SenderUserId)
                        .Ascending(x => x.ClientMessageId),
                    new CreateIndexOptions
                    {
                        Name = "ux_message_client",
                        Unique = true
                    }),

                new CreateIndexModel<ChatMessage>(
                    messageKeys
                        .Ascending(x => x.ConversationId)
                        .Descending(x => x.CreatedAt)
                        .Descending(x => x.Id),
                    new CreateIndexOptions
                    {
                        Name = "ix_conversation_history"
                    })
            },
            cancellationToken: cancellationToken);
    }
}