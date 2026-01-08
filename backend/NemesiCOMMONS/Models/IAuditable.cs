using System;

namespace NemesiCOMMONS.Models
{
    public interface IAuditable
    {
        DateTime DataCreazione { get; set; }
        DateTime? DataModifica { get; set; }
        string? UtenteCreazione { get; set; }
        string? UtenteModifica { get; set; }
    }
}
