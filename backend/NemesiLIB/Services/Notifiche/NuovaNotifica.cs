using NemesiLIB.Model.Notifiche;

namespace NemesiLIB.Services.Notifiche
{
    /// <summary>
    /// Descrive una notifica da creare. È il solo input accettato da <see cref="INotificaService"/>:
    /// i chiamanti non costruiscono mai direttamente l'entità <see cref="Notifica"/>.
    /// </summary>
    public sealed record NuovaNotifica
    {
        public required string UtenteId { get; init; }
        public required string Titolo { get; init; }
        public string? Descrizione { get; init; }
        public string? Link { get; init; }

        public TipoNotifica Tipo { get; init; } = TipoNotifica.Info;
        public CategoriaNotifica Categoria { get; init; } = CategoriaNotifica.Sistema;

        /// <summary>
        /// Chiave di deduplica; se valorizzata, la notifica non viene creata quando ne esiste
        /// già una con la stessa chiave (letta o meno). Includere sempre il periodo.
        /// </summary>
        public string? ChiaveDeduplica { get; init; }

        public DateTime? DataScadenza { get; init; }
        public string? UtenteOrigine { get; init; }
    }
}
