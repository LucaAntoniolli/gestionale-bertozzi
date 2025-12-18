using Microsoft.AspNetCore.Authorization;

namespace NemesiAPI.Authorization
{
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public IReadOnlyList<string> Permissions { get; }

        public PermissionRequirement(IEnumerable<string> permissions)
        {
            Permissions = permissions?
                .Select(p => p?.Trim())
                .Where(p => !string.IsNullOrEmpty(p))
                .ToList()
                .AsReadOnly()
                ?? new List<string>().AsReadOnly();
        }
    }
}