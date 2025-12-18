using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NemesiLIB.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace NemesiLIB.Context.Seeders
{
    public class GestionaleBertozziContextSeeder
    {
        private readonly RoleManager<IdentityRole> roleManager;
        private readonly UserManager<Utente> userManager;
        private readonly GestionaleBertozziContext db;

        public GestionaleBertozziContextSeeder(RoleManager<IdentityRole> roleManager, UserManager<Utente> userManager, GestionaleBertozziContext db)
        {
            this.roleManager = roleManager;
            this.userManager = userManager;
            this.db = db;
        }

        public async Task SeedRuoli()
        {
            string[] ruoli = { "Amministratore", "Backoffice", "Utente Base" };

            foreach (var ruolo in ruoli)
            {
                if (!await this.roleManager.RoleExistsAsync(ruolo))
                {
                    await this.roleManager.CreateAsync(new IdentityRole(ruolo));
                }
            }
        }

        public async Task SeedRolePermissions()
        {
            // Mappa dei permessi per ruolo: personalizza secondo le tue esigenze
            var rolePermissions = new Dictionary<string, List<string>>
            {
                { "Amministratore", new List<string> { "user.read", "user.create", "user.update", "user.delete" } },
                { "Backoffice", new List<string> {} },
                { "Utente Base", new List<string> {} }
            };

            foreach (var kvp in rolePermissions)
            {
                var roleName = kvp.Key;
                var perms = kvp.Value;

                var role = await roleManager.FindByNameAsync(roleName);
                if (role == null)
                    continue; // il ruolo non esiste: è comunque creato da SeedRuoli()

                var existingClaims = await roleManager.GetClaimsAsync(role);
                var existingPerms = existingClaims
                    .Where(c => c.Type == "permission")
                    .Select(c => c.Value)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                foreach (var p in perms)
                {
                    if (!existingPerms.Contains(p))
                    {
                        await roleManager.AddClaimAsync(role, new Claim("permission", p));
                    }
                }
            }
        }

        public async Task SeedFirstUser()
        {
            if(await db.Users.CountAsync() == 0)
            {
                var utente = new Utente("admin@admin.it", "admin default");

                await userManager.CreateAsync(utente, "Password1234!");
                await userManager.AddToRoleAsync(utente, "Amministratore");
            }
            
        }
    }
}
