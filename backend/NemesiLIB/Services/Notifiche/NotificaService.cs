using log4net;
using Microsoft.EntityFrameworkCore;
using NemesiLIB.Context;
using NemesiLIB.Model.Notifiche;
using System.Reflection;

namespace NemesiLIB.Services.Notifiche
{
    public class NotificaService : INotificaService
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);

        private readonly GestionaleBertozziContext dbContext;

        public NotificaService(GestionaleBertozziContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<int> CreaMoltepliciAsync(IReadOnlyCollection<NuovaNotifica> notifiche, CancellationToken ct = default)
        {
            if (notifiche == null || notifiche.Count == 0)
                return 0;

            // 1. Deduplica interna al lotto: due elementi con la stessa chiave violerebbero
            //    l'indice univoco facendo fallire l'intero SaveChanges.
            var candidate = notifiche
                .Where(n => !string.IsNullOrWhiteSpace(n.UtenteId) && !string.IsNullOrWhiteSpace(n.Titolo))
                .GroupBy(n => n.ChiaveDeduplica)
                .SelectMany(g => g.Key == null ? g.AsEnumerable() : g.Take(1))
                .ToList();

            if (candidate.Count == 0)
                return 0;

            // 2. Scarta i destinatari disattivati: un job che risolve un intero ruolo
            //    pescherebbe anche gli account non più in forza.
            var destinatari = candidate.Select(n => n.UtenteId).Distinct().ToList();
            var attivi = await dbContext.Users.AsNoTracking()
                .Where(u => destinatari.Contains(u.Id) && u.IsAttivo)
                .Select(u => u.Id)
                .ToListAsync(ct);

            var attiviSet = attivi.ToHashSet();
            candidate = candidate.Where(n => attiviSet.Contains(n.UtenteId)).ToList();

            if (candidate.Count == 0)
                return 0;

            // 3. Una sola query di deduplica per tutto il lotto.
            var daInserire = await FiltraGiaEsistentiAsync(candidate, ct);
            if (daInserire.Count == 0)
                return 0;

            var creati = await SalvaAsync(daInserire, ct);

            log.Info($"Notifiche create: {creati} su {notifiche.Count} richieste");
            return creati;
        }

        public async Task<bool> CreaAsync(NuovaNotifica notifica, CancellationToken ct = default)
        {
            var creati = await CreaMoltepliciAsync(new[] { notifica }, ct);
            return creati > 0;
        }

        public async Task<IReadOnlyCollection<string>> DestinatariPerRuoloAsync(string ruolo, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(ruolo))
                return Array.Empty<string>();

            var query = from ur in dbContext.UserRoles
                        join r in dbContext.Roles on ur.RoleId equals r.Id
                        join u in dbContext.Users on ur.UserId equals u.Id
                        where r.Name == ruolo && u.IsAttivo
                        select u.Id;

            return await query.AsNoTracking().Distinct().ToListAsync(ct);
        }

        private async Task<List<NuovaNotifica>> FiltraGiaEsistentiAsync(List<NuovaNotifica> candidate, CancellationToken ct)
        {
            var chiavi = candidate
                .Select(n => n.ChiaveDeduplica)
                .Where(c => c != null)
                .Distinct()
                .ToList();

            if (chiavi.Count == 0)
                return candidate;

            var esistenti = await dbContext.Notifica.AsNoTracking()
                .Where(n => n.ChiaveDeduplica != null && chiavi.Contains(n.ChiaveDeduplica))
                .Select(n => n.ChiaveDeduplica!)
                .ToListAsync(ct);

            var esistentiSet = esistenti.ToHashSet();

            return candidate
                .Where(n => n.ChiaveDeduplica == null || !esistentiSet.Contains(n.ChiaveDeduplica))
                .ToList();
        }

        private async Task<int> SalvaAsync(List<NuovaNotifica> daInserire, CancellationToken ct)
        {
            var adesso = DateTime.UtcNow;
            dbContext.Notifica.AddRange(daInserire.Select(n => Componi(n, adesso)));

            try
            {
                return await dbContext.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex)
            {
                // L'indice univoco su ChiaveDeduplica ha respinto il lotto: è successo che
                // un'altra esecuzione (o un retry) ha inserito le stesse chiavi nel frattempo.
                // Si rilegge lo stato e si riprova una volta sola con ciò che resta davvero da creare.
                log.Warn("Conflitto sulla chiave di deduplica, nuovo tentativo con le sole notifiche mancanti", ex);

                foreach (var entry in dbContext.ChangeTracker.Entries<Notifica>().Where(e => e.State == EntityState.Added).ToList())
                    entry.State = EntityState.Detached;

                var rimaste = await FiltraGiaEsistentiAsync(daInserire, ct);
                if (rimaste.Count == 0)
                    return 0;

                dbContext.Notifica.AddRange(rimaste.Select(n => Componi(n, adesso)));
                return await dbContext.SaveChangesAsync(ct);
            }
        }

        private static Notifica Componi(NuovaNotifica n, DateTime adesso) => new Notifica
        {
            UtenteId = n.UtenteId,
            Titolo = n.Titolo,
            Descrizione = n.Descrizione,
            Link = n.Link,
            Tipo = n.Tipo,
            Categoria = n.Categoria,
            ChiaveDeduplica = n.ChiaveDeduplica,
            DataScadenza = n.DataScadenza,
            UtenteOrigine = n.UtenteOrigine,
            IsLetta = false,
            DataCreazione = adesso,
        };
    }
}
