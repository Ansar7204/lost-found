using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web.Resource;

namespace LostAndFound.Api.Features.Identity;

/// <summary>US-01: who am I? The frontend calls this right after sign-in.</summary>
[ApiController]
[Route("api/me")]
[Authorize]
[RequiredScope("access_as_user")]
public sealed class MeController : ControllerBase
{
    [HttpGet]
    public ActionResult<MeResponse> Get()
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        return Ok(new MeResponse(userId.Value, User.GetDisplayName(), User.GetEmail()));
    }
}

public sealed record MeResponse(Guid UserId, string Name, string Email);
