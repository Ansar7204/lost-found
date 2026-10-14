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
public sealed class GetFoundItemPhotoController(
    AppDbContext db,
    IPhotoStorage photoStorage) : ControllerBase
{
    [HttpGet("{id:guid}/photo")]
    public async Task<IActionResult> Get(
        Guid id,
        CancellationToken cancellationToken)
    {
        var photoKey = await db.FoundItems
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => x.PhotoKey)
            .SingleOrDefaultAsync(cancellationToken);

        if (photoKey is null)
        {
            return NotFound();
        }

        var photo = await photoStorage.OpenAsync(
            photoKey,
            cancellationToken);

        if (photo is null)
        {
            return NotFound();
        }

        Response.Headers["Cache-Control"] = "private, no-store";
        Response.Headers["X-Content-Type-Options"] = "nosniff";

        return File(photo.Content, photo.ContentType);
    }
}