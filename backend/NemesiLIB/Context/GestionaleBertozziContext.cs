using log4net;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using NemesiLIB.Model;
using System.Reflection;

namespace NemesiLIB.Context
{
    public class GestionaleBertozziContext : IdentityDbContext<Utente>
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);

        public GestionaleBertozziContext(DbContextOptions<GestionaleBertozziContext> options) : base(options)
        {
        }

        public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder model)
        {
            log.Info("Set up context Gestionale Bertozzi");

            // RefreshToken
            model.Entity<RefreshToken>(e =>
            {
                e.HasKey(rt => rt.Id);
                e.Property(rt => rt.Id).ValueGeneratedOnAdd();
                e.Property(rt => rt.Token).IsRequired();
                e.Property(rt => rt.UserId).IsRequired();
                e.Property(rt => rt.ExpiryDate).IsRequired();
                e.Property(rt => rt.CreatedDate).IsRequired();
                e.Property(rt => rt.IsRevoked).IsRequired();
                e.HasOne(rt => rt.User).WithMany().HasForeignKey(rt => rt.UserId);
                e.HasIndex(rt => rt.Token).IsUnique();
            });

            base.OnModelCreating(model);
        }

    }
}
