using Microsoft.AspNetCore.Authorization;
using System.Linq;
using System.Threading.Tasks;

namespace NemesiAPI.Authorization
{
    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            if (context.User?.Identity?.IsAuthenticated != true)
                return Task.CompletedTask;

            var userPermissions = context.User.Claims
                .Where(c => string.Equals(c.Type, "permission", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Value)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            // Se almeno uno dei permessi richiesti è presente nel token, autorizzo
            if (requirement.Permissions.Any(req => userPermissions.Contains(req)))
                context.Succeed(requirement);

            return Task.CompletedTask;
        }
    }
}