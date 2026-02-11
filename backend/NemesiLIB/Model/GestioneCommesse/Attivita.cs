using NemesiCOMMONS.Models;
using System;

namespace NemesiLIB.Model.GestioneCommesse
{
    public class Attivita : IAuditable
    {
        public int Id { get; set; }
        public int PianoSviluppoId { get; set; }
        public string Descrizione { get; set; }
        public string TipoInfoDaRegistrare { get; set; }
        public int PercentualeAvanzamento { get; set; }
        public bool Completata { get; set; }
        public DateTime? DataRiferimento { get; set; }
        public string? Lettera { get; set; }
        public int Ordine { get; set; }
        public DateTime DataCreazione { get; set; }
        public DateTime? DataModifica { get; set; }
        public string? UtenteCreazione { get; set; }
        public string? UtenteModifica { get; set; }
    }
}