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

        /// <summary>
        /// Marca come lette tutte le notifiche non lette della famiglia indicata che non
        /// figurano fra le chiavi ancora valide.
        /// <para>
        /// È il modo in cui un controllo ricorrente tiene il pannello aderente alla realtà:
        /// chiude sia la rilevazione di ieri, superata da quella di oggi, sia quella di un
        /// utente per cui la condizione non sussiste più - che altrimenti resterebbe in
        /// pannello a segnalare qualcosa che non esiste, perché non generando una notifica
        /// nuova non ci sarebbe nulla a rimpiazzarla.
        /// </para>
        /// </summary>
        /// <param name="famiglia">Prefisso comune delle chiavi, es. "todo-scadute:".</param>
        /// <param name="chiaviAncoraValide">Chiavi appena generate, da preservare.</param>
        /// <returns>Quante notifiche sono state chiuse.</returns>
        Task<int> ChiudiNonPiuValideAsync(string famiglia, IReadOnlyCollection<string> chiaviAncoraValide,
                                          CancellationToken ct = default);
    }
}
