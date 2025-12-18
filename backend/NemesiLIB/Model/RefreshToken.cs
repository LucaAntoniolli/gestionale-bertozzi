using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NemesiLIB.Model
{
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public DateTime ExpiryDate { get; set; }

        [Required]
        public DateTime CreatedDate { get; set; }

        public bool IsRevoked { get; set; } = false;

        public bool IsExpired => DateTime.UtcNow >= ExpiryDate;

        public bool IsActive => !IsRevoked && !IsExpired;

        // Navigazione
        [ForeignKey(nameof(UserId))]
        public virtual Utente User { get; set; } = null!;
    }
}
