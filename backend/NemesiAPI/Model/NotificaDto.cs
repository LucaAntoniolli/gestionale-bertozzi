using NemesiLIB.Model.Notifiche;

namespace NemesiAPI.Model
{
    public class NotificaDto
    {
        public int Id { get; set; }
        public string Titolo { get; set; } = string.Empty;
        public string? Descrizione { get; set; }
        public string? Link { get; set; }
        public TipoNotifica Tipo { get; set; }
        public CategoriaNotifica Categoria { get; set; }
        public DateTime DataCreazione { get; set; }
        public string? UtenteOrigine { get; set; }

        public static NotificaDto Map(Notifica n) => new NotificaDto
        {
            Id = n.Id,
            Titolo = n.Titolo,
            Descrizione = n.Descrizione,
            Link = n.Link,
            Tipo = n.Tipo,
            Categoria = n.Categoria,
            // SQL Server restituisce DateTime con Kind = Unspecified: senza SpecifyKind il JSON
            // esce privo della "Z" e il browser lo interpreta come ora locale, sfasando le date relative.
            DataCreazione = DateTime.SpecifyKind(n.DataCreazione, DateTimeKind.Utc),
            UtenteOrigine = n.UtenteOrigine,
        };
    }

    public class ConteggioNotificheDto
    {
        public int NonLette { get; set; }
    }
}
