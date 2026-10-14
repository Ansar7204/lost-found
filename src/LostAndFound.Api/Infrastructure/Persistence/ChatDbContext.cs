using LostAndFound.Api.Features.Chat;
using MongoDB.Driver;
namespace LostAndFound.Api.Infrastructure.Persistence;

public sealed class ChatDbContext
{
    public IMongoCollection<Conversation> Conversations { get; }

    public IMongoCollection<ChatMessage> Messages { get; }

    public ChatDbContext(IMongoDatabase database)
    {
        Conversations = database.GetCollection<Conversation>("conversations");

        Messages = database.GetCollection<ChatMessage>("messages");
    }
}