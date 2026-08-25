using log4net;
using Microsoft.EntityFrameworkCore;
using NemesiLIB.Context;
using NemesiLIB.Model.GestioneCommesse;
using NemesiLIB.Model.Notifiche;
using System.Reflection;

namespace NemesiLIB.Services.Notifiche.Job
{
    /// <summary>
    /// Segnala a ciascun utente quante ToDo assegnate risultano scadute e non completate.
    /// Genera una notifica per tipo di planning, perché il link di destinazione differisce.
    /// </summary>
    public class ToDoScaduteJob
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);

        private const string PrefissoChiave = "todo-scadute";

        private readonly GestionaleBertozziContext dbContext;
        private readonly INotificaService notificaService;

        public ToDoScaduteJob(GestionaleBertozziContext dbContext, INotificaService notificaService)
        {
            this.dbContext = dbContext;
            this.notificaService = notificaService;
        }

        public async Task<int> EseguiAsync(CancellationToken ct = default)
        {
            var oggi = DateTime.Today;

            // Una ToDo senza data di consegna non può essere scaduta: manca il termine.
            var scadute = await dbContext.ToDo.AsNoTracking()
                .Where(t => !t.Completato
                         && t.DataConsegna != null
                         && t.DataConsegna < oggi)
                .Select(t => new
                {
                    t.AssegnatarioPrimarioId,
                    t.AssegnatarioSecondarioId,
                    t.TipoPlanning,
                })
                .ToListAsync(ct);

            // Un ToDo con due assegnatari conta per entrambi.
            var conteggi = new Dictionary<(string UtenteId, TipoPlanning Planning), int>();

            foreach (var todo in scadute)
            {
                foreach (var utenteId in new[] { todo.AssegnatarioPrimarioId, todo.AssegnatarioSecondarioId })
                {
                    if (string.IsNullOrEmpty(utenteId))
                        continue;

                    var chiave = (utenteId, todo.TipoPlanning);
                    conteggi[chiave] = conteggi.TryGetValue(chiave, out var attuale) ? attuale + 1 : 1;
                }
            }

            var giorno = oggi.ToString("yyyy-MM-dd");

            if (conteggi.Count == 0)
            {
                // Nessuno ha più scadenze: vanno comunque chiuse le segnalazioni pendenti,
                // che altrimenti resterebbero in pannello a indicare qualcosa di risolto.
                await notificaService.ChiudiNonPiuValideAsync($"{PrefissoChiave}:", Array.Empty<string>(), ct);
                log.Info("ToDo scadute: nessuna, chiuse le eventuali segnalazioni pendenti");
                return 0;
            }

            var notifiche = conteggi.Select(voce =>
            {
                var (utenteId, planning) = voce.Key;
                var quante = voce.Value;

                var amministrativo = planning == TipoPlanning.Amministrativo;

                // I due punti finali fanno parte del prefisso: la sostituzione confronta
                // con StartsWith, e senza separatore un prefisso potrebbe contenerne un altro.
                var prefisso = $"{PrefissoChiave}:{utenteId}:{planning}:";

                return new NuovaNotifica
                {
                    UtenteId = utenteId,
                    Titolo = quante == 1 ? "1 attività scaduta" : $"{quante} attività scadute",
                    Descrizione = amministrativo
                        ? "Planning amministrativo: sono presenti attività oltre la data di consegna e non completate."
                        : "Planning edile: sono presenti attività oltre la data di consegna e non completate.",
                    Link = amministrativo
                        ? "/gestione-commesse/planning-amministrativo"
                        : "/gestione-commesse/planning",
                    Tipo = TipoNotifica.Avviso,
                    Categoria = CategoriaNotifica.ToDo,
                    ChiaveDeduplica = $"{prefisso}{giorno}",
                };
            }).ToList();

            var creati = await notificaService.CreaMoltepliciAsync(notifiche, ct);

            // Chiude quanto rilevato in passato e oggi non più valido: sia la segnalazione
            // di ieri, superata da questa, sia quella di chi nel frattempo ha completato.
            var chiaviValide = notifiche.Select(n => n.ChiaveDeduplica!).ToList();
            await notificaService.ChiudiNonPiuValideAsync($"{PrefissoChiave}:", chiaviValide, ct);

            log.Info($"ToDo scadute: {creati} notifiche create su {notifiche.Count} destinatari");
            return creati;
        }
    }
}
