using NemesiCOMMONS.Models;
using System;
using System.Threading.Tasks;

namespace NemesiCOMMONS.Services.Audit
{
    public class AuditService : IAuditService
    {
        public Task SetCreationAuditAsync<T>(T entity, string? username) where T : class, IAuditable
        {
            entity.DataCreazione = DateTime.UtcNow;
            entity.UtenteCreazione = username;
            entity.DataModifica = null;
            entity.UtenteModifica = null;
            return Task.CompletedTask;
        }

        public Task SetModificationAuditAsync<T>(T entity, string? username) where T : class, IAuditable
        {
            entity.DataModifica = DateTime.UtcNow;
            entity.UtenteModifica = username;
            return Task.CompletedTask;
        }
    }
}
