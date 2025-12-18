using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using System.Threading.Tasks;

namespace NemesiAPI.Authorization
{
    public class PermissionPolicyProvider : DefaultAuthorizationPolicyProvider
    {
        public const string POLICY_PREFIX = "Permission:";
        public PermissionPolicyProvider(IOptions<AuthorizationOptions> options) : base(options) { }

        public override Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
        {
            if (!string.IsNullOrEmpty(policyName) && policyName.StartsWith(POLICY_PREFIX, StringComparison.OrdinalIgnoreCase))
            {
                // Rimuovo eventuali ripetizioni del prefisso e splitto su ',' o '|'
                var cleaned = policyName.Replace(POLICY_PREFIX, "", StringComparison.OrdinalIgnoreCase);
                var perms = cleaned
                    .Split(new[] { ',', '|' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(p => p.Trim())
                    .Where(p => !string.IsNullOrEmpty(p))
                    .ToArray();

                var requirement = new PermissionRequirement(perms);
                var policy = new AuthorizationPolicyBuilder()
                    .AddRequirements(requirement)
                    .Build();

                return Task.FromResult<AuthorizationPolicy?>(policy);
            }

            return base.GetPolicyAsync(policyName);
        }
    }
}