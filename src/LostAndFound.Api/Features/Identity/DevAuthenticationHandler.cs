using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace LostAndFound.Api.Features.Identity;

/// <summary>
/// Development-only sign-in, so the team can run the full app without an Entra ID tenant.
/// The frontend (environment.auth.mode = 'dev') sends "X-Dev-User: a_seitkali@kbtu.kz".
/// The user id is a stable GUID derived from the email, so the same student keeps their posts.
/// Enabled only when Auth:Mode = "Dev" AND the environment is Development (see Program.cs).
/// </summary>
public sealed class DevAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "Dev";
    public const string HeaderName = "X-Dev-User";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var email = Request.Headers[HeaderName].ToString().Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(email))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        if (!email.Contains('@') || email.Length > 100)
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid X-Dev-User header."));
        }

        var claims = new[]
        {
            new Claim("oid", StableGuid(email).ToString()),
            new Claim("preferred_username", email),
            new Claim("name", ClaimsPrincipalExtensions.NameFromEmail(email)),
            new Claim("scp", "access_as_user"),
        };

        var identity = new ClaimsIdentity(claims, SchemeName, "name", ClaimTypes.Role);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }

    public static Guid StableGuid(string email) =>
        new(MD5.HashData(Encoding.UTF8.GetBytes(email)));
}
