using NemesiCOMMONS.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace NemesiLIB.Model.Amministrazione
{
    public class Onere : IAuditable
    {
        public int Id { get; set; }
        public int CommessaId { get; set; }
        public required string Pratica { get; set; }
        public decimal ImportoOneri { get; set; }        
        public DateTime DataCreazione { get; set; }
        public DateTime? DataModifica { get; set; }
        public string? UtenteCreazione { get; set; }
        public string? UtenteModifica { get; set; }

        public virtual GestioneCommesse.Commessa? Commessa { get; set; }
    }
}
