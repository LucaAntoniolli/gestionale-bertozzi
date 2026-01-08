using NemesiCOMMONS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NemesiLIB.Model.Anagrafiche
{
    public class PersonaleCliente : IAuditable
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public string Nome { get; set; }
        public string Cognome { get; set; }
        public string? Mansione { get; set; }
        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public DateTime DataCreazione { get; set; }
        public DateTime? DataModifica { get; set; }
        public string? UtenteCreazione { get; set; }
        public string? UtenteModifica { get; set; }

        public virtual Cliente? Cliente { get; set; }
    }
}
