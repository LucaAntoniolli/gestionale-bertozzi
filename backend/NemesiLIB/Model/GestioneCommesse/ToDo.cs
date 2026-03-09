using NemesiCOMMONS.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace NemesiLIB.Model.GestioneCommesse
{
    public class ToDo : IAuditable
    {
        public int Id { get; set; }
        public string AssegnatarioPrimarioId { get; set; }
        public string? AssegnatarioSecondarioId { get; set; }
        public int CommessaId { get; set; }
        public string DescrizioneTodo { get; set; }
        public DateTime? DataConsegna { get; set; }
        public short Priorita { get; set; } = 0;
        public string? DescrizioneAttivitaSvolta { get; set; }
        public bool Completato { get; set; } = false;
        public DateTime DataCreazione { get; set; }
        public DateTime? DataModifica { get; set; }
        public string? UtenteCreazione { get; set; }
        public string? UtenteModifica { get; set; }

        public virtual Utente? AssegnatarioPrimario { get; set; }
        public virtual Utente? AssegnatarioSecondario { get; set; }

    }
}
