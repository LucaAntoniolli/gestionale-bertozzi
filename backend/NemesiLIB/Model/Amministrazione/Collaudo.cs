using NemesiCOMMONS.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace NemesiLIB.Model.Amministrazione
{
    public class Collaudo : IAuditable
    {
        public int Id { get; set; }
        public int FornitoreId { get; set; }
        public int ScopoLavoroId { get; set; }
        public int CommessaId { get; set; }
        public string? Contratto { get; set; }
        public decimal Importo { get; set; }
        public bool Pagato { get; set; }
        public DateTime DataCreazione { get; set; }
        public DateTime? DataModifica { get; set; }
        public string? UtenteCreazione { get; set; }
        public string? UtenteModifica { get; set; }

        public virtual Anagrafiche.Fornitore? Fornitore { get; set; }
        public virtual Anagrafiche.ScopoLavoro? ScopoLavoro { get; set; }
        public virtual GestioneCommesse.Commessa? Commessa { get; set; }
    }
}
