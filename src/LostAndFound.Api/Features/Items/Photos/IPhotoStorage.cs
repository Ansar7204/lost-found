namespace LostAndFound.Api.Features.Items.Photos;

public interface IPhotoStorage
{
    Task<string> SaveAsync(Stream content, string contentType, CancellationToken cancellationToken);

    Task<StoredPhoto?> OpenAsync(string key, CancellationToken cancellationToken);

    Task DeleteAsync(string key, CancellationToken cancellationToken);
}

public sealed record StoredPhoto(Stream Content, string ContentType);