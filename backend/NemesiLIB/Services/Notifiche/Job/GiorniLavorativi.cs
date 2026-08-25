namespace NemesiLIB.Services.Notifiche.Job
{
    /// <summary>
    /// Determina quali giorni ci si aspetta che siano lavorati. Esclude sabato e domenica
    /// più le festività nazionali italiane.
    /// <para>
    /// Non sono note assenze, ferie o permessi: quell'informazione non esiste nel modello,
    /// quindi un giorno di ferie risulta comunque come giornata attesa.
    /// </para>
    /// </summary>
    public static class GiorniLavorativi
    {
        public static bool IsLavorativo(DateTime giorno)
        {
            if (giorno.DayOfWeek == DayOfWeek.Saturday || giorno.DayOfWeek == DayOfWeek.Sunday)
                return false;

            return !IsFestivo(giorno);
        }

        /// <summary>Giorni lavorativi compresi fra le due date, estremi inclusi.</summary>
        public static IEnumerable<DateTime> Intervallo(DateTime da, DateTime a)
        {
            for (var giorno = da.Date; giorno <= a.Date; giorno = giorno.AddDays(1))
            {
                if (IsLavorativo(giorno))
                    yield return giorno;
            }
        }

        private static bool IsFestivo(DateTime giorno)
        {
            var g = giorno.Date;

            // Festività a data fissa. Il patrono è locale e varia per comune: non incluso.
            var fisse = new[]
            {
                (1, 1),    // Capodanno
                (1, 6),    // Epifania
                (4, 25),   // Liberazione
                (5, 1),    // Festa dei lavoratori
                (6, 2),    // Festa della Repubblica
                (8, 15),   // Ferragosto
                (11, 1),   // Ognissanti
                (12, 8),   // Immacolata
                (12, 25),  // Natale
                (12, 26),  // Santo Stefano
            };

            if (fisse.Any(f => f.Item1 == g.Month && f.Item2 == g.Day))
                return true;

            // Pasqua cade di domenica ed è già esclusa; serve il lunedì dell'Angelo.
            return g == Pasqua(g.Year).AddDays(1);
        }

        /// <summary>Domenica di Pasqua secondo il calendario gregoriano (algoritmo di Meeus).</summary>
        private static DateTime Pasqua(int anno)
        {
            var a = anno % 19;
            var b = anno / 100;
            var c = anno % 100;
            var d = b / 4;
            var e = b % 4;
            var f = (b + 8) / 25;
            var g = (b - f + 1) / 3;
            var h = (19 * a + b - d - g + 15) % 30;
            var i = c / 4;
            var k = c % 4;
            var l = (32 + 2 * e + 2 * i - h - k) % 7;
            var m = (a + 11 * h + 22 * l) / 451;
            var mese = (h + l - 7 * m + 114) / 31;
            var giorno = ((h + l - 7 * m + 114) % 31) + 1;

            return new DateTime(anno, mese, giorno);
        }
    }
}
