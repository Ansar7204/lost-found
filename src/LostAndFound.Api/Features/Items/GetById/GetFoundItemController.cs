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
    [ProducesResponseType<FoundItemDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var item = await db.FoundItems.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(FoundItemDto.Projection)
            .SingleOrDefaultAsync(cancellationToken);

        return item is null ? NotFound() : Ok(item);
    }

    /// <summary>The UI links items by their short number: /item/0413.</summary>
    [HttpGet("{number:int}")]
    [ProducesResponseType<FoundItemDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByNumber(int number, CancellationToken cancellationToken)
    {
        var item = await db.FoundItems.AsNoTracking()
            .Where(x => x.Number == number)
            .Select(FoundItemDto.Projection)
            .SingleOrDefaultAsync(cancellationToken);

        return item is null ? NotFound() : Ok(item);
    }
}
