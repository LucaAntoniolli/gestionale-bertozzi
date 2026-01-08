using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NemesiCOMMONS.Models;

namespace NemesiLIB.Model.PianiSviluppo
{
    public class TemplatePianoSviluppo : IAuditable
    {
        public int Id { get; set; }
        public int TipologiaCommessaId { get; set; }
        public string Descrizione { get; set; }
        public int Ordine { get; set; }
        public virtual List<TemplateAttivita>? Attivita { get; set; }
        public DateTime DataCreazione { get; set; }
        public DateTime? DataModifica { get; set; }
        public string? UtenteCreazione { get; set; }
        public string? UtenteModifica { get; set; }
    }
}
