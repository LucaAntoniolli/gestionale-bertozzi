using Ganss.Xss;
using Xunit;

namespace NemesiAPI.Tests
{
    /// <summary>
    /// Documenta il comportamento del sanitizer usato da MailService per i
    /// TemplateHtmlValues, da cui dipende il modo in cui RiepilogoOreMancantiJob
    /// costruisce la tabella della mail.
    /// </summary>
    public class SanitizerTabellaTests
    {
        [Fact]
        public void RigheFuoriDaUnaTabella_PerdonoITag()
        {
            // È il motivo per cui il job compone la tabella intera e non le sole righe:
            // il parser HTML scarta tr e td fuori contesto, lasciando il testo attaccato.
            var risultato = new HtmlSanitizer()
                .Sanitize("<tr><td>Mario Rossi</td><td>5</td></tr>");

            Assert.DoesNotContain("<tr", risultato);
            Assert.DoesNotContain("<td", risultato);
        }

        [Fact]
        public void TabellaCompleta_MantieneStrutturaEStiliInline()
        {
            var tabella = "<table style=\"width:100%\"><tbody>"
                        + "<tr><td style=\"text-align:center\">5</td></tr>"
                        + "</tbody></table>";

            var risultato = new HtmlSanitizer().Sanitize(tabella);

            Assert.Contains("<table", risultato);
            Assert.Contains("<td", risultato);
            Assert.Contains("text-align", risultato);
        }

        [Fact]
        public void AttributoClass_VieneRimosso()
        {
            // Per questo la tabella della mail usa stili inline e non classi.
            var risultato = new HtmlSanitizer()
                .Sanitize("<table><tbody><tr><td class=\"giorni\">5</td></tr></tbody></table>");

            Assert.DoesNotContain("class", risultato);
        }
    }
}
