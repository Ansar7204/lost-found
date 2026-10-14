using LostAndFound.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web.Resource;

namespace LostAndFound.Api.Features.Items.GetById;

[ApiController]
[Route("api/items")]
[Authorize]
[RequiredScope("access_as_user")]
public sealed class GetFoundItemController(AppDbContext db) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var item = await db.FoundItems.AsNoTracking().Where(x => x.Id == id).Select(x => new GetFoundItemResponse(
            x.Id, 
            x.UserFoundId,
            x.Name, 
            x.Description,
            x.Cabinet,
            x.Category,
            x.Status,
            x.CreatedAt,
            x.PhotoKey == null ? null : "/api/items/" + x.Id + "/photo"
        )).SingleOrDefaultAsync(cancellationToken);

        if(item is null)
        {
            return NotFound();
        }

        return Ok(item);
    }
}

public sealed record GetFoundItemResponse(
    Guid Id,
    Guid UserFoundId,
    string Name,
    string Description,
    string Cabinet,
    ItemCategory Category,
    FoundItemStatus Status,
    DateTimeOffset CreatedAt,
    string? PhotoUrl
);