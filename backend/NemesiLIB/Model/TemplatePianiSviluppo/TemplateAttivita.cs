using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NemesiCOMMONS.Models;

namespace NemesiLIB.Model.PianiSviluppo
{
    public class TemplateAttivita : IAuditable
    {
        public int Id { get; set; }
        public int PianoSviluppoId { get; set; }
        public string Descrizione { get; set; }

        public string TipoInfoDaRegistrare { get; set; }
        public int Ordine { get; set; }

        // Navigation property to avoid shadow FK creation
        public virtual TemplatePianoSviluppo? PianoSviluppo { get; set; }

        public DateTime DataCreazione { get; set; }
        public DateTime? DataModifica { get; set; }
        public string? UtenteCreazione { get; set; }
        public string? UtenteModifica { get; set; }
    }
}
