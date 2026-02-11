using NemesiCOMMONS.Models;
using System;
using System.Collections.Generic;

namespace NemesiLIB.Model.GestioneCommesse
{
    public class Commessa : IAuditable
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public string LuogoCommessa { get; set; }
        public int ProgressivoCommessa { get; set; }
        public string? Protocollo { get; set; }
        public string PmEdileId { get; set; }
        public int ReferenteClienteId { get; set; }
        public string PmAmministrativoId { get; set; }
        public int TipologiaCommessaId { get; set; }
        public string Descrizione { get; set; }
        public decimal CostoAtteso { get; set; }
        public int StatusCommessaId { get; set; }
        public DateTime? DataInizioPrevista { get; set; }
        public DateTime? DataConclusionePrevista { get; set; }
        public DateTime DataCreazione { get; set; }
        public DateTime? DataModifica { get; set; }
        public string? UtenteCreazione { get; set; }
        public string? UtenteModifica { get; set; }

        // Navigation properties
        public virtual Anagrafiche.Cliente? Cliente { get; set; }
        public virtual Anagrafiche.PersonaleCliente? ReferenteCliente { get; set; }
        public virtual Anagrafiche.TipologiaCommessa? TipologiaCommessa { get; set; }
        public virtual Anagrafiche.StatusCommessa? StatusCommessa { get; set; }
        public virtual List<PianoSviluppo>? PianiSviluppo { get; set; }
    }
}