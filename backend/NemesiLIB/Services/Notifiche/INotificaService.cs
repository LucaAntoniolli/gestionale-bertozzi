namespace NemesiLIB.Services.Notifiche
{
    public interface INotificaService
    {
        /// <summary>
        /// Crea più notifiche in un solo giro di database. È il metodo pensato per i job
        /// schedulati: risolve la deduplica con una query sola, indipendentemente da
        /// quante notifiche contiene il lotto.
        /// </summary>
        /// <returns>Quante notifiche sono state effettivamente create, al netto dei duplicati scartati.</returns>
        Task<int> CreaMoltepliciAsync(IReadOnlyCollection<NuovaNotifica> notifiche, CancellationToken ct = default);

        /// <summary>Crea una singola notifica. Wrapper su <see cref="CreaMoltepliciAsync"/>.</summary>
        /// <returns>true se creata, false se scartata come duplicato o destinatario non attivo.</returns>
        Task<bool> CreaAsync(NuovaNotifica notifica, CancellationToken ct = default);

        /// <summary>Id degli utenti attivi appartenenti al ruolo indicato.</summary>
        Task<IReadOnlyCollection<string>> DestinatariPerRuoloAsync(string ruolo, CancellationToken ct = default);
    }
}
