using Microsoft.AspNetCore.Identity;

namespace NemesiLIB.Model
{
    public class Utente : IdentityUser
    {
        public string Nominativo { get; set; }

        public Utente(string email, string nominativo)
        {
            Email = email;
            UserName = email;
            Nominativo = nominativo;
        }
    }
}
