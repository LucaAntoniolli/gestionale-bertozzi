using Microsoft.EntityFrameworkCore;
using NemesiLIB.Context;

namespace NemesiLIB.Services.Notifiche.Job
{
    /// <summary>Giorni lavorativi scoperti di un singolo utente nella finestra osservata.</summary>
    public sealed record OreMancantiUtente(string UtenteId, string Nominativo, string? Email, IReadOnlyList<DateTime> GiorniMancanti);

    /// <summary>Esito della rilevazione, con la finestra a cui si riferisce.</summary>
    public sealed record RilevazioneOreMancanti(
        DateTime Inizio,
        DateTime Fine,
        IReadOnlyList<DateTime> GiorniAttesi,
        IReadOnlyList<OreMancantiUtente> Utenti);

    /// <summary>
    /// Individua chi non ha caricato ore nei giorni lavorativi della finestra osservata.
    /// <para>
    /// La rilevazione è condivisa fra il promemoria in-app al singolo utente e il riepilogo
    /// via mail al Backoffice: due destinatari e due cadenze, ma un solo criterio, così le
    /// due comunicazioni non possono divergere.
    /// </para>
    /// </summary>
    public class RilevatoreOreMancanti
    {
        /// <summary>Ampiezza della finestra osservata, in giorni, a ritroso da ieri.</summary>
        public const int GiorniOsservati = 7;

        private readonly GestionaleBertozziContext dbContext;

        public RilevatoreOreMancanti(GestionaleBertozziContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<RilevazioneOreMancanti> RilevaAsync(CancellationToken ct = default)
        {
            var oggi = DateTime.Today;

            // La finestra si ferma a ieri: le ore di oggi non sono ancora attese.
            var fine = oggi.AddDays(-1);
            var inizio = oggi.AddDays(-GiorniOsservati);

            var giorniAttesi = GiorniLavorativi.Intervallo(inizio, fine).ToList();
            if (giorniAttesi.Count == 0)
                return new RilevazioneOreMancanti(inizio, fine, giorniAttesi, Array.Empty<OreMancantiUtente>());

            // Perimetro: attivi non esterni. Non si restringe a chi ha già caricato ore in
            // passato, perché chi non ne ha mai caricate è proprio il destinatario da
            // raggiungere e un filtro sull'attività pregressa lo escluderebbe.
            var utenti = await dbContext.Users.AsNoTracking()
                .Where(u => u.IsAttivo && !u.IsEsterno)
                .Select(u => new { u.Id, u.Nominativo, u.Email })
                .ToListAsync(ct);

            if (utenti.Count == 0)
                return new RilevazioneOreMancanti(inizio, fine, giorniAttesi, Array.Empty<OreMancantiUtente>());

            var idUtenti = utenti.Select(u => u.Id).ToList();

            // Ore nulle o a zero non coprono la giornata: una riga di sole spese o
            // chilometri non significa che le ore siano state caricate.
            var caricamenti = await dbContext.OreSpeseCommessa.AsNoTracking()
                .Where(o => o.Data >= inizio
                         && o.Data < fine.AddDays(1)
                         && o.Ore != null && o.Ore > 0
                         && idUtenti.Contains(o.UtenteId))
                .Select(o => new { o.UtenteId, o.Data })
                .Distinct()
                .ToListAsync(ct);

            var giorniCaricati = caricamenti
                .GroupBy(c => c.UtenteId)
                .ToDictionary(g => g.Key, g => g.Select(c => c.Data.Date).ToHashSet());

            var scoperti = new List<OreMancantiUtente>();

            foreach (var utente in utenti.OrderBy(u => u.Nominativo))
            {
                var caricati = giorniCaricati.TryGetValue(utente.Id, out var insieme)
                    ? insieme
                    : new HashSet<DateTime>();

                var mancanti = giorniAttesi.Where(g => !caricati.Contains(g)).ToList();
                if (mancanti.Count == 0)
                    continue;

                scoperti.Add(new OreMancantiUtente(utente.Id, utente.Nominativo, utente.Email, mancanti));
            }

            return new RilevazioneOreMancanti(inizio, fine, giorniAttesi, scoperti);
        }
    }
}
