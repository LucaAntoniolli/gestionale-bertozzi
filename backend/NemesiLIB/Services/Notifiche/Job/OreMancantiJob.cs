using log4net;
using Microsoft.EntityFrameworkCore;
using NemesiLIB.Context;
using NemesiLIB.Model.Notifiche;
using System.Reflection;

namespace NemesiLIB.Services.Notifiche.Job
{
    /// <summary>
    /// Segnala i giorni lavorativi dei 7 precedenti per cui l'utente non ha caricato ore.
    /// <para>
    /// Il perimetro è l'insieme degli utenti attivi non esterni. Non si restringe a chi ha
    /// già caricato ore in passato: chi non ne ha mai caricate è proprio il destinatario
    /// che il promemoria deve raggiungere, e un filtro sull'attività pregressa lo
    /// escluderebbe. Chi per ruolo non rendiconta riceverà comunque la segnalazione:
    /// nel modello non esiste un'informazione che distingua chi è tenuto a farlo.
    /// </para>
    /// </summary>
    public class OreMancantiJob
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);

        private const string PrefissoChiave = "ore-mancanti";

        /// <summary>Ampiezza della finestra osservata, in giorni, a ritroso da ieri.</summary>
        private const int GiorniOsservati = 7;

        /// <summary>Oltre questo numero, l'elenco delle date viene troncato.</summary>
        private const int MaxDateElencate = 7;

        private readonly GestionaleBertozziContext dbContext;
        private readonly INotificaService notificaService;

        public OreMancantiJob(GestionaleBertozziContext dbContext, INotificaService notificaService)
        {
            this.dbContext = dbContext;
            this.notificaService = notificaService;
        }

        public async Task<int> EseguiAsync(CancellationToken ct = default)
        {
            var oggi = DateTime.Today;

            // La finestra si ferma a ieri: le ore di oggi non sono ancora attese.
            var fine = oggi.AddDays(-1);
            var inizio = oggi.AddDays(-GiorniOsservati);

            var giorniAttesi = GiorniLavorativi.Intervallo(inizio, fine).ToList();
            if (giorniAttesi.Count == 0)
            {
                log.Info("Ore mancanti: nessun giorno lavorativo nella finestra");
                return 0;
            }

            var utentiInScope = await dbContext.Users.AsNoTracking()
                .Where(u => u.IsAttivo && !u.IsEsterno)
                .Select(u => u.Id)
                .ToListAsync(ct);

            if (utentiInScope.Count == 0)
            {
                log.Info("Ore mancanti: nessun utente nel perimetro");
                return 0;
            }

            // Ore nulle o a zero non coprono la giornata: una riga di sole spese o
            // chilometri non significa che le ore siano state caricate.
            var caricamenti = await dbContext.OreSpeseCommessa.AsNoTracking()
                .Where(o => o.Data >= inizio
                         && o.Data < fine.AddDays(1)
                         && o.Ore != null && o.Ore > 0
                         && utentiInScope.Contains(o.UtenteId))
                .Select(o => new { o.UtenteId, o.Data })
                .Distinct()
                .ToListAsync(ct);

            var giorniCaricati = caricamenti
                .GroupBy(c => c.UtenteId)
                .ToDictionary(g => g.Key, g => g.Select(c => c.Data.Date).ToHashSet());

            var giorno = oggi.ToString("yyyy-MM-dd");
            var notifiche = new List<NuovaNotifica>();

            foreach (var utenteId in utentiInScope)
            {
                var caricati = giorniCaricati.TryGetValue(utenteId, out var insieme)
                    ? insieme
                    : new HashSet<DateTime>();

                var mancanti = giorniAttesi.Where(g => !caricati.Contains(g)).ToList();
                if (mancanti.Count == 0)
                    continue;

                var prefisso = $"{PrefissoChiave}:{utenteId}:";

                notifiche.Add(new NuovaNotifica
                {
                    UtenteId = utenteId,
                    Titolo = mancanti.Count == 1
                        ? "1 giorno senza ore caricate"
                        : $"{mancanti.Count} giorni senza ore caricate",
                    Descrizione = ComponiDescrizione(mancanti),
                    Link = "/gestione-commesse/ore-e-spese",
                    Tipo = TipoNotifica.Avviso,
                    Categoria = CategoriaNotifica.Commessa,
                    ChiaveDeduplica = $"{prefisso}{giorno}",
                });
            }

            if (notifiche.Count == 0)
            {
                // Tutti in regola: vanno comunque chiuse le segnalazioni pendenti, che
                // altrimenti resterebbero a indicare giorni ormai coperti.
                await notificaService.ChiudiNonPiuValideAsync($"{PrefissoChiave}:", Array.Empty<string>(), ct);
                log.Info("Ore mancanti: nessun giorno scoperto, chiuse le segnalazioni pendenti");
                return 0;
            }

            var creati = await notificaService.CreaMoltepliciAsync(notifiche, ct);

            var chiaviValide = notifiche.Select(n => n.ChiaveDeduplica!).ToList();
            await notificaService.ChiudiNonPiuValideAsync($"{PrefissoChiave}:", chiaviValide, ct);

            log.Info($"Ore mancanti: {creati} notifiche create su {notifiche.Count} destinatari");
            return creati;
        }

        private static string ComponiDescrizione(List<DateTime> mancanti)
        {
            var elencate = mancanti.Take(MaxDateElencate).Select(g => g.ToString("dd/MM"));
            var elenco = string.Join(", ", elencate);

            if (mancanti.Count > MaxDateElencate)
                elenco += ", …";

            return $"Negli ultimi {GiorniOsservati} giorni mancano le ore per: {elenco}.";
        }
    }
}
