using LostAndFound.Api.Features.Items.Photos;

namespace LostAndFound.Api.Infrastructure.Storage;

public sealed class LocalPhotoStorage : IPhotoStorage
{
    private readonly string _directory;

    public LocalPhotoStorage(IWebHostEnvironment environment)
    {
        _directory = Path.Combine(
            environment.ContentRootPath,
            "App_Data",
            "photos");

        Directory.CreateDirectory(_directory);
    }

    public async Task<string> SaveAsync(
        Stream content,
        string contentType,
        CancellationToken cancellationToken)
    {
        var extension = contentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            _ => throw new ArgumentException(
                "Only JPEG and PNG are supported.",
                nameof(contentType))
        };

        var key = $"{Guid.NewGuid():N}{extension}";
        var path = Path.Combine(_directory, key);

        try
        {
            await using var output = new FileStream(
                path,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 81920,
                useAsync: true);

            await content.CopyToAsync(output, cancellationToken);
        }
        catch
        {
            File.Delete(path);
            throw;
        }

        return key;
    }

    public Task<StoredPhoto?> OpenAsync(
        string key,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var path = GetPath(key);

        if (path is null)
            return Task.FromResult<StoredPhoto?>(null);

        try
        {
            var stream = new FileStream(
                path,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 81920,
                useAsync: true);

            var contentType = key.EndsWith(".jpg", StringComparison.Ordinal)
                ? "image/jpeg"
                : "image/png";

            return Task.FromResult<StoredPhoto?>(
                new StoredPhoto(stream, contentType));
        }
        catch (FileNotFoundException)
        {
            return Task.FromResult<StoredPhoto?>(null);
        }
        catch (DirectoryNotFoundException)
        {
            return Task.FromResult<StoredPhoto?>(null);
        }
    }

    public Task DeleteAsync(
        string key,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var path = GetPath(key);

        if (path is null)
            throw new ArgumentException(
                "Invalid photo key.", nameof(key));

        File.Delete(path);

        return Task.CompletedTask;
    }

    private string? GetPath(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return null;

        var extension = Path.GetExtension(key);

        if (extension is not (".jpg" or ".png"))
            return null;

        if (key.Length != 32 + extension.Length
            || !Guid.TryParseExact(key[..32], "N", out _))
        {
            return null;
        }

        return Path.Combine(_directory, key);
    }
}