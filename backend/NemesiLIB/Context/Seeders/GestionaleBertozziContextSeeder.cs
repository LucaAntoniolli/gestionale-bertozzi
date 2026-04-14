using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NemesiLIB.Model;
using NemesiLIB.Model.Anagrafiche;
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

        public async Task SeedTipologieCommesse()
        {
            if (!await db.TipologiaCommessa.AnyAsync())
            {
                var tipi = new List<TipologiaCommessa>
                {
                    new TipologiaCommessa { Descrizione = "Edifici logistici" },
                    new TipologiaCommessa { Descrizione = "Edifici residenziali" },
                    new TipologiaCommessa { Descrizione = "Centri commerciali" },
                    new TipologiaCommessa { Descrizione = "Consulenza" },
                };
                db.AddRange(tipi);
                await db.SaveChangesAsync();
            }
        }

        public async Task SeedStatusCommesse()
        {
            if (!await db.StatusCommessa.AnyAsync())
            {
                var status = new List<StatusCommessa>
                {
                    new StatusCommessa { Ordine = 1, Descrizione = "Pianificata" },
                    new StatusCommessa { Ordine = 2, Descrizione = "In corso" },
                    new StatusCommessa { Ordine = 3, Descrizione = "Sospesa" },
                    new StatusCommessa { Ordine = 4, Descrizione = "Completata" },
                };
                db.AddRange(status);
                await db.SaveChangesAsync();
            }
        }

        public async Task SeedRolePermissions()
        {
            // Mappa dei permessi per ruolo
            var rolePermissions = new Dictionary<string, List<string>>
            {
                { "Amministratore", new List<string> { 
                    "user.read", 
                    "user.create", 
                    "user.update", 
                    "user.delete",
                    "cliente.read",
                    "cliente.create",
                    "cliente.update",
                    "cliente.delete",
                    "fornitore.read",
                    "fornitore.create",
                    "fornitore.update",
                    "fornitore.delete",
                    "modalitapagamento.read",
                    "modalitapagamento.create",
                    "modalitapagamento.update",
                    "modalitapagamento.delete",
                    "statuscommessa.read",
                    "statuscommessa.create",
                    "statuscommessa.update",
                    "statuscommessa.delete",
                    "scopolavoro.read",
                    "scopolavoro.create",
                    "scopolavoro.update",
                    "scopolavoro.delete",
                    "tipologiacommessa.read",
                    "tipologiacommessa.create",
                    "tipologiacommessa.update",
                    "tipologiacommessa.delete",
                    "templatepianosviluppo.read",
                    "templatepianosviluppo.create",
                    "templatepianosviluppo.update",
                    "templatepianosviluppo.delete",
                    "templateattivita.read",
                    "templateattivita.create",
                    "templateattivita.update",
                    "templateattivita.delete",
                    "commessa.read",
                    "commessa.create",
                    "commessa.update",
                    "commessa.delete",
                    "pianosviluppo.read",
                    "pianosviluppo.create",
                    "pianosviluppo.update",
                    "pianosviluppo.delete",
                    "attivita.read",
                    "attivita.create",
                    "attivita.update",
                    "attivita.delete",
                    "avanzamento-attivita.update",
                    "todo.read",
                    "todo.create",
                    "todo.update",
                    "todo.delete",
                    "orespesecommessa.read",
                    "orespesecommessa.create",
                    "orespesecommessa.update",
                    "orespesecommessa.delete",
                    "dashboard.read",
                    "costotrasferta.read",
                    "costotrasferta.create",
                    "costotrasferta.update",
                    "costotrasferta.delete",
                    "collaudo.read",
                    "collaudo.create",
                    "collaudo.update",
                    "collaudo.delete",
                    "onere.read",
                    "onere.create",
                    "onere.update",
                    "onere.delete"
                } },
                { "Backoffice", new List<string> {
                    "user.read",
                    "user.create",
                    "user.update",
                    "user.delete",
                    "cliente.read",
                    "cliente.create",
                    "cliente.update",
                    "cliente.delete",
                    "fornitore.read",
                    "fornitore.create",
                    "fornitore.update",
                    "fornitore.delete",
                    "modalitapagamento.read",
                    "modalitapagamento.create",
                    "modalitapagamento.update",
                    "modalitapagamento.delete",
                    "statuscommessa.read",
                    "statuscommessa.create",
                    "statuscommessa.update",
                    "statuscommessa.delete",
                    "scopolavoro.read",
                    "scopolavoro.create",
                    "scopolavoro.update",
                    "scopolavoro.delete",
                    "tipologiacommessa.read",
                    "tipologiacommessa.create",
                    "tipologiacommessa.update",
                    "tipologiacommessa.delete",
                    "templatepianosviluppo.read",
                    "templatepianosviluppo.create",
                    "templatepianosviluppo.update",
                    "templatepianosviluppo.delete",
                    "templateattivita.read",
                    "templateattivita.create",
                    "templateattivita.update",
                    "templateattivita.delete",
                    "commessa.read",
                    "commessa.create",
                    "commessa.update",
                    "commessa.delete",
                    "pianosviluppo.read",
                    "pianosviluppo.create",
                    "pianosviluppo.update",
                    "pianosviluppo.delete",
                    "attivita.read",
                    "attivita.create",
                    "attivita.update",
                    "attivita.delete",
                    "avanzamento-attivita.update",
                    "todo.read",
                    "todo.create",
                    "todo.update",
                    "todo.delete",
                    "orespesecommessa.read",
                    "orespesecommessa.create",
                    "orespesecommessa.update",
                    "orespesecommessa.delete",
                    "dashboard.read",
                    "costotrasferta.read",
                    "costotrasferta.create",
                    "costotrasferta.update",
                    "costotrasferta.delete",
                    "collaudo.read",
                    "collaudo.create",
                    "collaudo.update",
                    "collaudo.delete",
                    "onere.read",
                    "onere.create",
                    "onere.update",
                    "onere.delete",
                } },
                { "Utente Base", new List<string> {
                    "commessa.read",
                    "pianosviluppo.read",
                    "attivita.read",
                    "avanzamento-attivita.update",
                    "todo.read",
                    "todo.create",
                    "todo.update",
                    "todo.delete",
                    "orespesecommessa.read",
                    "orespesecommessa.create",
                    "orespesecommessa.update",
                    "orespesecommessa.delete"
                } }
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
