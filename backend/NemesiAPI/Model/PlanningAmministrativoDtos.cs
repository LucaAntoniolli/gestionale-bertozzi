using System.ComponentModel.DataAnnotations;

namespace NemesiAPI.Model
{
    public class PlanningAmministrativoSaveDto
    {
        [Range(1, int.MaxValue)]
        public int CommessaId { get; set; }

        [Required]
        public string DescrizioneTodo { get; set; } = string.Empty;

        [Required]
        public string AssegnatarioPrimarioId { get; set; } = string.Empty;

        [Range(1, 5)]
        public short Priorita { get; set; }

        [Required]
        public DateTime? DataConsegna { get; set; }

        public string? DescrizioneAttivitaSvolta { get; set; }

        public bool Completato { get; set; }
    }
}
