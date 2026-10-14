using System.ComponentModel.DataAnnotations;
using LostAndFound.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web.Resource;
using Microsoft.Identity.Web;

namespace LostAndFound.Api.Features.Items.Photos;

[ApiController]
[Route("api/items")]
[Authorize]
[RequiredScope("access_as_user")]
public sealed class UploadFoundItemPhotoController(
    AppDbContext db,
    IPhotoStorage photoStorage,
    ILogger<UploadFoundItemPhotoController> logger) : ControllerBase
{
    private const long MaxPhotoSize = 5 * 1024 * 1024;

    [HttpPost("{id:guid}/photo")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        Guid id,
        [FromForm] IFormFile? photo,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.GetObjectId(), out var userId))
        {
            return Unauthorized();
        }

        var item = await db.FoundItems
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new { x.UserFoundId, x.PhotoKey })
            .SingleOrDefaultAsync(cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        if (item.UserFoundId != userId)
        {
            return Forbid();
        }

        if (item.PhotoKey is not null)
        {
            return Conflict(new
            {
                message = "У объявления уже есть фотография."
            });
        }

        if (photo is null || photo.Length == 0)
        {
            return BadRequest(new
            {
                message = "Выберите фотографию."
            });
        }

        if (photo.Length > MaxPhotoSize)
        {
            return BadRequest(new
            {
                message = "Максимальный размер фотографии — 5 МБ."
            });
        }

        await using var content = new MemoryStream();

        await photo.CopyToAsync(content, cancellationToken);

        var contentType = DetectContentType(content.ToArray());

        if (contentType is null)
        {
            return BadRequest(new
            {
                message = "Поддерживаются только JPEG и PNG."
            });
        }

        content.Position = 0;

        var key = await photoStorage.SaveAsync(
            content,
            contentType,
            cancellationToken);

        int updated;

        try
        {
            updated = await db.FoundItems
                .Where(x =>
                    x.Id == id &&
                    x.UserFoundId == userId &&
                    x.PhotoKey == null)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(x => x.PhotoKey, key),
                    cancellationToken);
        }
        catch
        {
            await TryDeleteAsync(key);
            throw;
        }

        if (updated == 0)
        {
            await TryDeleteAsync(key);

            return Conflict(new
            {
                message = "Объявление изменилось. Обновите страницу."
            });
        }

        return Ok(new
        {
            photoUrl = $"/api/items/{id}/photo"
        });
    }

    private static string? DetectContentType(byte[] bytes)
    {
        // Сигнатура JPEG.
        if (bytes.Length >= 3 &&
            bytes[0] == 0xFF &&
            bytes[1] == 0xD8 &&
            bytes[2] == 0xFF)
        {
            return "image/jpeg";
        }

        // Сигнатура PNG.
        if (bytes.Length >= 8 &&
            bytes[0] == 0x89 &&
            bytes[1] == 0x50 &&
            bytes[2] == 0x4E &&
            bytes[3] == 0x47 &&
            bytes[4] == 0x0D &&
            bytes[5] == 0x0A &&
            bytes[6] == 0x1A &&
            bytes[7] == 0x0A)
        {
            return "image/png";
        }

        return null;
    }

    private async Task TryDeleteAsync(string key)
    {
        try
        {
            await photoStorage.DeleteAsync(
                key,
                CancellationToken.None);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Не удалось удалить фотографию {PhotoKey}",
                key);
        }
    }
}