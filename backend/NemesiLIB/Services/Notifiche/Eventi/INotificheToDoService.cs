using NemesiLIB.Model.GestioneCommesse;

namespace NemesiLIB.Services.Notifiche.Eventi
{
    /// <summary>
    /// Traduce i fatti di dominio relativi ai ToDo nel contenuto delle notifiche.
    /// Il chiamante dichiara solo che cosa è successo: testo, destinatari effettivi e
    /// politiche di invio sono decisi qui.
    /// </summary>
    public interface INotificheToDoService
    {
        /// <summary>Il ToDo è appena stato creato: tutti i suoi assegnatari sono nuovi.</summary>
        Task NotificaCreazioneAsync(ToDo todo, string? utenteOrigineId, CancellationToken ct = default);

        /// <summary>
        /// Il ToDo è stato modificato. Vengono notificati solo gli assegnatari che non
        /// figuravano già fra <paramref name="assegnatariPrecedenti"/>.
        /// </summary>
        Task NotificaAggiornamentoAsync(ToDo todo, IReadOnlyCollection<string> assegnatariPrecedenti,
                                        string? utenteOrigineId, CancellationToken ct = default);
    }
}
