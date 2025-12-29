using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NemesiLIB.Model.Anagrafiche
{
    public class PersonaleCliente
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public string Nome { get; set; }
        public string Cognome { get; set; }
        public string? Mansione { get; set; }
        public string? Email { get; set; }
        public string? Telefono { get; set; }

        public virtual Cliente? Cliente { get; set; }
    }
}
