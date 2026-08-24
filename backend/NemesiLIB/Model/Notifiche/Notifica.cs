using NemesiLIB.Model;

namespace NemesiLIB.Model.Notifiche
{
    public enum TipoNotifica : short
    {
        Info = 0,
        Successo = 1,
        Avviso = 2,
        Errore = 3
    }

    public enum CategoriaNotifica : short
    {
        Sistema = 0,
        Commessa = 1,
        Attivita = 2,
        ToDo = 3,
        Collaudo = 4
    }

    /// <summary>
    /// Notifica personale destinata a un singolo utente.
    /// La lettura equivale all'eliminazione dal pannello: le notifiche lette non
    /// vengono più restituite, ma la riga resta a database per storico e deduplica.
    /// </summary>
    public class Notifica
    {
        public int Id { get; set; }

        /// <summary>Destinatario della notifica.</summary>
        public string UtenteId { get; set; } = string.Empty;

        public string Titolo { get; set; } = string.Empty;
        public string? Descrizione { get; set; }

        /// <summary>Rotta interna dell'applicativo, es. "/gestione-commesse/dettaglio-commessa/42".</summary>
        public string? Link { get; set; }

        public TipoNotifica Tipo { get; set; } = TipoNotifica.Info;
        public CategoriaNotifica Categoria { get; set; } = CategoriaNotifica.Sistema;

        public bool IsLetta { get; set; } = false;
        public DateTime DataCreazione { get; set; }
        public DateTime? DataLettura { get; set; }

        /// <summary>
        /// Chiave logica che identifica la condizione notificata, comprensiva del periodo
        /// (es. "attivita-scadenza:1234:2026-08"). Impedisce che un job schedulato rieseguito
        /// - o riprovato automaticamente dopo un errore - duplichi la stessa notifica.
        /// </summary>
        public string? ChiaveDeduplica { get; set; }

        /// <summary>Oltre questa data la notifica non viene più mostrata.</summary>
        public DateTime? DataScadenza { get; set; }

        /// <summary>Chi ha generato la notifica; null quando è generata dal sistema.</summary>
        public string? UtenteOrigine { get; set; }

        public virtual Utente? Utente { get; set; }
    }
}
