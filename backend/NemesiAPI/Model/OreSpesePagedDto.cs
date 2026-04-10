using System;
using System.Collections.Generic;

namespace NemesiAPI.Model
{
    public class OreSpesePagedItemDto
    {
        public int Id { get; set; }
        public int CommessaId { get; set; }
        public string? CommessaDescrizione { get; set; }
        public string? CommessaCodiceInterno { get; set; }
        public string UtenteId { get; set; } = string.Empty;
        public string? UtenteNominativo { get; set; }
        public DateTime Data { get; set; }
        public decimal? Ore { get; set; }
        public decimal? Spese { get; set; }
        public decimal? Chilometri { get; set; }
        public string? Note { get; set; }
        public DateTime DataCreazione { get; set; }
    }

    public class OreSpesePagedResponseDto
    {
        public int TotalCount { get; set; }
        public List<OreSpesePagedItemDto> Items { get; set; } = new();
        public decimal TotaleOre { get; set; }
        public decimal TotaleSpese { get; set; }
        public decimal TotaleChilometri { get; set; }
    }
}
