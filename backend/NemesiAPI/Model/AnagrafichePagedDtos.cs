using System;
using System.Collections.Generic;

namespace NemesiAPI.Model
{
    // ─── Fornitore ───────────────────────────────────────────────────────────────

    public class FornitorePagedItemDto
    {
        public int Id { get; set; }
        public string RagioneSociale { get; set; } = string.Empty;
        public string? PartitaIva { get; set; }
        public string? Tipo { get; set; }
        public string? Sigla { get; set; }
        public string? Comune { get; set; }
        public string? Provincia { get; set; }
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public int? ModalitaPagamentoId { get; set; }
        public string? ModalitaPagamentoDescrizione { get; set; }
        public DateTime DataCreazione { get; set; }
    }

    public class FornitorePagedResponseDto
    {
        public int TotalCount { get; set; }
        public List<FornitorePagedItemDto> Items { get; set; } = new();
    }

    // ─── ScopoLavoro ─────────────────────────────────────────────────────────────

    public class ScopoLavoroPagedItemDto
    {
        public int Id { get; set; }
        public string Descrizione { get; set; } = string.Empty;
    }

    public class ScopoLavoroPagedResponseDto
    {
        public int TotalCount { get; set; }
        public List<ScopoLavoroPagedItemDto> Items { get; set; } = new();
    }
}
