using Microsoft.AspNetCore.Identity;

namespace NemesiLIB.Model
{
    public class Utente : IdentityUser
    {
        public string Nominativo { get; set; }
        public string? Societa { get; set; }
        public bool IsEsterno { get; set; }
        public decimal CostoOrario { get; set; }

        public Utente(string email, string nominativo, bool isEsterno = false, string societa = null, decimal costoOrario = 0m)
        {
            Email = email;
            UserName = email;
            Nominativo = nominativo;
            IsEsterno = isEsterno;
            Societa = societa;
            CostoOrario = costoOrario;
        }
    }
}
