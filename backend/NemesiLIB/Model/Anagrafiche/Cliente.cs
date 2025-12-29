using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NemesiLIB.Model.Anagrafiche
{
    public class Cliente
    {
        public int Id { get; set; }
        public string RagioneSociale { get; set; }
        public string CodiceInterno { get; set; }
        public string PartitaIva { get; set; }
        public string CodiceFiscale { get; set; }
        public string Indirizzo { get; set; }
        public string Comune { get; set; }
        public string CAP { get; set; }
        public string Provincia { get; set; }
        public string Nazione { get; set; }
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public int ModalitaPagamentoId { get; set; }
        public string? Sdi { get; set; }
        public string Tipo { get; set; }

        public virtual List<PersonaleCliente>? Personale { get; set; }
    }
}
