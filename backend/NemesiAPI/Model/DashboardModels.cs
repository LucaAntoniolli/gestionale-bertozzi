namespace NemesiAPI.Model
{
    public class CommesseSummaryDto
    {
        public int TotaleAperte { get; set; }
        public int TotaleChiuse { get; set; }
    }

    public class OreSummaryDto
    {
        public decimal TotaleOreCommesseAperte { get; set; }
        public decimal TotaleOreCommesseChiuse { get; set; }
        public decimal MediaOreCommesseChiuse { get; set; }
        public decimal MediaChilometriCommesseChiuse { get; set; }
        public decimal MediaSpeseCommesseChiuse { get; set; }
    }

    public class OrePerGiornoItemDto
    {
        public DateOnly Data { get; set; }
        public decimal TotaleOre { get; set; }
    }

    public class OrePerUtenteItemDto
    {
        public string UtenteId { get; set; } = string.Empty;
        public string Nominativo { get; set; } = string.Empty;
        public decimal TotaleOre { get; set; }
        public decimal TotaleSpese { get; set; }
        public decimal TotaleChilometri { get; set; }
    }
}