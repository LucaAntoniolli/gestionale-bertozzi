using log4net;
using NemesiLIB.Model.Notifiche;
using System.Reflection;

namespace NemesiLIB.Services.Notifiche.Job
{
    /// <summary>
    /// Promemoria in-app al singolo utente sui giorni lavorativi per cui non ha caricato ore.
    /// La rilevazione è di <see cref="RilevatoreOreMancanti"/>; qui si decide solo cosa dire.
    /// </summary>
    public class OreMancantiJob
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);

        private const string PrefissoChiave = "ore-mancanti";

        /// <summary>Oltre questo numero, l'elenco delle date viene troncato.</summary>
        private const int MaxDateElencate = 7;

        private readonly RilevatoreOreMancanti rilevatore;
        private readonly INotificaService notificaService;

        public OreMancantiJob(RilevatoreOreMancanti rilevatore, INotificaService notificaService)
        {
            this.rilevatore = rilevatore;
            this.notificaService = notificaService;
        }

        public async Task<int> EseguiAsync(CancellationToken ct = default)
        {
            var rilevazione = await rilevatore.RilevaAsync(ct);

            if (rilevazione.GiorniAttesi.Count == 0)
            {
                log.Info("Ore mancanti: nessun giorno lavorativo nella finestra");
                return 0;
            }

            var giorno = DateTime.Today.ToString("yyyy-MM-dd");

            var notifiche = rilevazione.Utenti.Select(utente => new NuovaNotifica
            {
                UtenteId = utente.UtenteId,
                Titolo = utente.GiorniMancanti.Count == 1
                    ? "1 giorno senza ore caricate"
                    : $"{utente.GiorniMancanti.Count} giorni senza ore caricate",
                Descrizione = ComponiDescrizione(utente.GiorniMancanti),
                Link = "/gestione-commesse/ore-e-spese",
                Tipo = TipoNotifica.Avviso,
                Categoria = CategoriaNotifica.Commessa,
                ChiaveDeduplica = $"{PrefissoChiave}:{utente.UtenteId}:{giorno}",
            }).ToList();

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

        private static string ComponiDescrizione(IReadOnlyList<DateTime> mancanti)
        {
            var elencate = mancanti.Take(MaxDateElencate).Select(g => g.ToString("dd/MM"));
            var elenco = string.Join(", ", elencate);

            if (mancanti.Count > MaxDateElencate)
                elenco += ", …";

            return $"Negli ultimi {RilevatoreOreMancanti.GiorniOsservati} giorni mancano le ore per: {elenco}.";
        }
    }
}
