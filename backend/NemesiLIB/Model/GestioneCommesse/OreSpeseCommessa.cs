using NemesiCOMMONS.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace NemesiLIB.Model.GestioneCommesse
{
    public class OreSpeseCommessa : IAuditable
    {
        public int Id { get; set; }
        public int CommessaId { get; set; }
        public int PianoSviluppoId { get; set; }
        public string UtenteId { get; set; }
        public DateTime Data { get; set; }
        public decimal? Ore { get; set; }
        public decimal? Spese { get; set; }
        public decimal? Chilometri { get; set; }
        public string? Note { get; set; }
        public DateTime DataCreazione { get; set; }
        public DateTime? DataModifica { get; set; }
        public string? UtenteCreazione { get; set; }
        public string? UtenteModifica { get; set; }

        public virtual Utente? Utente { get; set; }
        public virtual PianoSviluppo? PianoSviluppo { get; set; }
    }
}
