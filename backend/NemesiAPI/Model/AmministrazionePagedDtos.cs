using System;
using System.Collections.Generic;

namespace NemesiAPI.Model
{
    // ─── Collaudo ────────────────────────────────────────────────────────────────

    public class CollaudoPagedItemDto
    {
        public int Id { get; set; }
        public int FornitoreId { get; set; }
        public string? FornitoreRagioneSociale { get; set; }
        public int ScopoLavoroId { get; set; }
        public string? ScopoLavoroDescrizione { get; set; }
        public int CommessaId { get; set; }
        public string? CommessaDescrizione { get; set; }
        public string? CommessaCodiceInterno { get; set; }
        public string? Contratto { get; set; }
        public decimal Importo { get; set; }
        public bool Pagato { get; set; }
        public DateTime DataCreazione { get; set; }
    }

    public class CollaudoPagedResponseDto
    {
        public int TotalCount { get; set; }
        public List<CollaudoPagedItemDto> Items { get; set; } = new();
        public decimal TotaleImporto { get; set; }
    }

    // ─── CostoTrasferta ──────────────────────────────────────────────────────────

    public class CostoTrasfertaPagedItemDto
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public string? ClienteRagioneSociale { get; set; }
        public int CommessaId { get; set; }
        public string? CommessaDescrizione { get; set; }
        public string? CommessaCodiceInterno { get; set; }
        public string UtenteId { get; set; } = string.Empty;
        public string? UtenteNominativo { get; set; }
        public string? LocalitaPartenza { get; set; }
        public string? LocalitaArrivo { get; set; }
        public decimal? Chilometri { get; set; }
        public decimal? CostoChilometri { get; set; }
        public decimal? CostoTelepass { get; set; }
        public decimal? CostoHotel { get; set; }
        public decimal? CostoTreno { get; set; }
        public DateTime? DataDa { get; set; }
        public DateTime? DataA { get; set; }
        public DateTime DataCreazione { get; set; }
    }

    public class CostoTrasfertaPagedResponseDto
    {
        public int TotalCount { get; set; }
        public List<CostoTrasfertaPagedItemDto> Items { get; set; } = new();
        public decimal TotaleCostoTotale { get; set; }
    }

    // ─── Onere ───────────────────────────────────────────────────────────────────

    public class OnerePagedItemDto
    {
        public int Id { get; set; }
        public int CommessaId { get; set; }
        public string? CommessaDescrizione { get; set; }
        public string? CommessaCodiceInterno { get; set; }
        public DateTime Data { get; set; }
        public string Pratica { get; set; } = string.Empty;
        public decimal ImportoOneri { get; set; }
        public DateTime DataCreazione { get; set; }
    }

    public class OnerePagedResponseDto
    {
        public int TotalCount { get; set; }
        public List<OnerePagedItemDto> Items { get; set; } = new();
        public decimal TotaleImportoOneri { get; set; }
    }
}
