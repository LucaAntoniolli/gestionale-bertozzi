using NemesiCOMMONS.Models;
using System;
using System.Collections.Generic;

namespace NemesiLIB.Model.GestioneCommesse
{
    public class PianoSviluppo : IAuditable
    {
        public int Id { get; set; }
        public int CommessaId { get; set; }
        public string Descrizione { get; set; }
        public int Ordine { get; set; }
        public DateTime DataCreazione { get; set; }
        public DateTime? DataModifica { get; set; }
        public string? UtenteCreazione { get; set; }
        public string? UtenteModifica { get; set; }

        // Navigation properties
        public virtual List<Attivita>? Attivita { get; set; }
        public virtual List<OreSpeseCommessa>? OreSpese { get; set; }
    }
}