using log4net;
using Microsoft.EntityFrameworkCore;
using NemesiLIB.Context;
using NemesiLIB.Model.GestioneCommesse;
using NemesiLIB.Model.Notifiche;
using System.Reflection;

namespace NemesiLIB.Services.Notifiche.Eventi
{
    public class NotificheToDoService : INotificheToDoService
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);

        private const int LunghezzaMassimaDescrizione = 1000;

        private readonly GestionaleBertozziContext dbContext;
        private readonly INotificaService notificaService;

        public NotificheToDoService(GestionaleBertozziContext dbContext, INotificaService notificaService)
        {
            this.dbContext = dbContext;
            this.notificaService = notificaService;
        }

        public Task NotificaCreazioneAsync(ToDo todo, string? utenteOrigineId, CancellationToken ct = default)
        {
            var destinatari = new[] { todo.AssegnatarioPrimarioId, todo.AssegnatarioSecondarioId };
            return NotificaAssegnazioneAsync(todo, destinatari, utenteOrigineId, ct);
        }

        public Task NotificaAggiornamentoAsync(ToDo todo, IReadOnlyCollection<string> assegnatariPrecedenti,
                                               string? utenteOrigineId, CancellationToken ct = default)
        {
            // Si notifica solo chi non era già assegnato: una modifica alla descrizione o
            // alla data non deve rinotificare chi il ToDo ce l'aveva già.
            var nuovi = new[] { todo.AssegnatarioPrimarioId, todo.AssegnatarioSecondarioId }
                .Where(x => !string.IsNullOrEmpty(x) && !assegnatariPrecedenti.Contains(x!))
                .ToArray();

            return NotificaAssegnazioneAsync(todo, nuovi, utenteOrigineId, ct);
        }

        private async Task NotificaAssegnazioneAsync(ToDo todo, IEnumerable<string?> destinatari,
                                                     string? utenteOrigineId, CancellationToken ct)
        {
            // Chi compie l'azione non riceve notifica, nemmeno assegnando a se stesso.
            var idDestinatari = destinatari
                .Where(x => !string.IsNullOrEmpty(x))
                .Select(x => x!)
                .Distinct()
                .Where(x => x != utenteOrigineId)
                .ToList();

            if (idDestinatari.Count == 0)
                return;

            try
            {
                var codiceCommessa = await dbContext.Commessa.AsNoTracking()
                    .Where(c => c.Id == todo.CommessaId)
                    .Select(c => c.CommessaCodiceInterno)
                    .FirstOrDefaultAsync(ct);

                var nominativoOrigine = utenteOrigineId == null ? null : await dbContext.Users.AsNoTracking()
                    .Where(u => u.Id == utenteOrigineId)
                    .Select(u => u.Nominativo)
                    .FirstOrDefaultAsync(ct);

                var link = todo.TipoPlanning == TipoPlanning.Amministrativo
                    ? "/gestione-commesse/planning-amministrativo"
                    : "/gestione-commesse/planning";

                var descrizione = ComponiDescrizione(todo, codiceCommessa);

                var notifiche = idDestinatari.Select(destinatarioId => new NuovaNotifica
                {
                    UtenteId = destinatarioId,
                    Titolo = "Nuova ToDo assegnata",
                    Descrizione = descrizione,
                    Link = link,
                    Tipo = TipoNotifica.Info,
                    Categoria = CategoriaNotifica.ToDo,
                    UtenteOrigine = nominativoOrigine,
                    // Nessuna ChiaveDeduplica: l'assegnazione è un evento discreto, non una
                    // condizione ricorrente. Con la chiave, un ToDo tolto e poi riassegnato
                    // alla stessa persona non genererebbe la seconda notifica.
                }).ToList();

                await notificaService.CreaMoltepliciAsync(notifiche, ct);
            }
            catch (Exception ex)
            {
                // Quando si arriva qui il ToDo è già stato salvato dal chiamante: un problema
                // sulle notifiche non deve trasformare un'operazione riuscita in un errore.
                log.Error($"Notifica di assegnazione non inviata per il ToDo {todo.Id}", ex);
            }
        }

        private static string ComponiDescrizione(ToDo todo, string? codiceCommessa)
        {
            var parti = new List<string>();

            if (!string.IsNullOrWhiteSpace(codiceCommessa))
                parti.Add($"Commessa {codiceCommessa}");

            if (!string.IsNullOrWhiteSpace(todo.DescrizioneTodo))
                parti.Add(todo.DescrizioneTodo);

            if (todo.DataConsegna.HasValue)
                parti.Add($"Consegna prevista: {todo.DataConsegna.Value:dd/MM/yyyy}");

            var descrizione = string.Join(" · ", parti);

            // La colonna è nvarchar(1000): una descrizione lunga farebbe fallire il salvataggio.
            return descrizione.Length > LunghezzaMassimaDescrizione
                ? descrizione.Substring(0, LunghezzaMassimaDescrizione - 1) + "…"
                : descrizione;
        }
    }
}
