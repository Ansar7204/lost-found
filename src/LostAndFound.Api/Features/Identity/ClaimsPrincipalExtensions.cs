using System.Security.Claims;
using Microsoft.Identity.Web;

namespace LostAndFound.Api.Features.Identity;

/// <summary>Reads the current user from the token (Entra ID) or from the dev scheme.</summary>
public static class ClaimsPrincipalExtensions
{
    public static Guid? GetUserId(this ClaimsPrincipal user) =>
        Guid.TryParse(user.GetObjectId(), out var id) && id != Guid.Empty ? id : null;

    /// <summary>preferred_username is the UPN in Entra ID v2 tokens, e.g. a_seitkali@kbtu.kz.</summary>
    public static string GetEmail(this ClaimsPrincipal user) =>
        (user.FindFirstValue("preferred_username")
         ?? user.FindFirstValue(ClaimTypes.Email)
         ?? user.FindFirstValue("email")
         ?? user.FindFirstValue(ClaimTypes.Upn)
         ?? user.FindFirstValue("upn")
         ?? string.Empty).Trim().ToLowerInvariant();

    public static string GetDisplayName(this ClaimsPrincipal user)
    {
        var name = user.FindFirstValue("name") ?? user.FindFirstValue(ClaimTypes.Name);
        if (!string.IsNullOrWhiteSpace(name)) return name.Trim();

        var email = user.GetEmail();
        return NameFromEmail(email);
    }

    /// <summary>"a_seitkali@kbtu.kz" -> "Seitkali A." (same rule as the frontend).</summary>
    public static string NameFromEmail(string email)
    {
        var local = email.Split('@')[0];
        var parts = local.Split(new[] { '.', '_', '-' }, StringSplitOptions.RemoveEmptyEntries);
        static string Cap(string s) => s.Length == 0 ? s : char.ToUpperInvariant(s[0]) + s[1..];

        if (parts.Length > 1) return $"{Cap(parts[1])} {char.ToUpperInvariant(parts[0][0])}.";
        return string.IsNullOrEmpty(local) ? "Student" : Cap(local);
    }

    public static bool HasAllowedDomain(this ClaimsPrincipal user, string? allowedDomain)
    {
        if (string.IsNullOrWhiteSpace(allowedDomain)) return true;
        var domain = "@" + allowedDomain.Trim().TrimStart('@').ToLowerInvariant();
        return user.GetEmail().EndsWith(domain, StringComparison.Ordinal);
    }
}
