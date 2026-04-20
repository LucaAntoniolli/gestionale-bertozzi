using Microsoft.AspNetCore.Identity;

namespace NemesiLIB.Model
{
    public class Utente : IdentityUser
    {
        public string Nominativo { get; set; }
        public string? Societa { get; set; }
        public bool IsEsterno { get; set; }
        public decimal CostoOrario { get; set; }
        public decimal CostoKmAuto { get; set; }

        public string? RuoloAziendale { get; set; }

        public Utente(string email, string nominativo, bool isEsterno = false, string societa = null, decimal costoOrario = 0m, decimal costoKmAuto = 0m, string ruoloAziendale = null)
        {
            Email = email;
            UserName = email;
            Nominativo = nominativo;
            IsEsterno = isEsterno;
            Societa = societa;
            CostoOrario = costoOrario;
            CostoKmAuto = costoKmAuto;
            RuoloAziendale = ruoloAziendale;
        }
    }
}
