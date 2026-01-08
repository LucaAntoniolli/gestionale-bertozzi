using System.Threading.Tasks;
using NemesiCOMMONS.Models;

namespace NemesiCOMMONS.Services.Audit
{
    public interface IAuditService
    {
        Task SetCreationAuditAsync<T>(T entity, string? username) where T : class, IAuditable;
        Task SetModificationAuditAsync<T>(T entity, string? username) where T : class, IAuditable;
    }
}
