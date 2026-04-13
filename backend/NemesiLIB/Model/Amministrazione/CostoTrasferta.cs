using NemesiCOMMONS.Models;
using Org.BouncyCastle.Asn1.Crmf;
using System;
using System.Collections.Generic;
using System.Text;

namespace NemesiLIB.Model.Amministrazione
{
    public class CostoTrasferta : IAuditable
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public int CommessaId { get; set; }
        public required string UtenteId { get; set; }
        public string? LocalitaPartenza { get; set; }
        public string? LocalitaArrivo { get; set; }
        public decimal? Chilometri { get; set; }
        public decimal? CostoChilometri { get; set; }
        public decimal? CostoTelepass { get; set; }
        public decimal? CostoHotel { get; set; }
        public decimal? CostoTreno { get; set; }
        public DateTime? DataDa { get; set; }
        public DateTime? DataA { get; set; }
        public DateTime DataCreazione { get; set; }
        public DateTime? DataModifica { get; set; }
        public string? UtenteCreazione { get; set; }
        public string? UtenteModifica { get; set; }
        public virtual Utente? Utente { get; set; }

        public virtual GestioneCommesse.Commessa? Commessa { get; set; }
        public virtual Anagrafiche.Cliente? Cliente { get; set; }
    }
}
