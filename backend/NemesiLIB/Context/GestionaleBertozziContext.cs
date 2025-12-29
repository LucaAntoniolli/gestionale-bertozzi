using log4net;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using NemesiLIB.Model;
using NemesiLIB.Model.Anagrafiche;
using System.Diagnostics;
using System.Reflection;

namespace NemesiLIB.Context
{
    public class GestionaleBertozziContext : IdentityDbContext<Utente>
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);

        public virtual DbSet<Cliente> Cliente{ get; set; }
        public virtual DbSet<TipologiaCommessa> TipologiaCommessa { get; set; }
        public virtual DbSet<StatusCommessa> StatusCommessa { get; set; }
        public virtual DbSet<ModalitaPagamento> ModalitaPagamento { get; set; }
        public virtual DbSet<PersonaleCliente> PersonaleCliente { get; set; }

        public GestionaleBertozziContext(DbContextOptions<GestionaleBertozziContext> options) : base(options)
        {
        }

        public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder model)
        {
            log.Info("Set up context Gestionale Bertozzi");

            model.Entity<Utente>(e =>
            {
                e.Property(u => u.Nominativo).IsRequired().HasMaxLength(200);
                e.Property(u => u.Societa).HasMaxLength(200);
                e.Property(u => u.IsEsterno).IsRequired().HasDefaultValue(false);
                e.Property(u => u.CostoOrario).HasColumnType("decimal(18,2)").IsRequired();
            });

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

            //ANAGRAFICHE

            // Tipologia Commessa
            model.Entity<TipologiaCommessa>(e =>
            {
                e.HasKey(tc => tc.Id);
                e.Property(tc => tc.Id).ValueGeneratedOnAdd();
                e.Property(tc => tc.Descrizione).IsRequired().HasMaxLength(255);
            });

            // Status Commessa
            model.Entity<StatusCommessa>(e =>
            {
                e.HasKey(sc => sc.Id);
                e.Property(sc => sc.Id).ValueGeneratedOnAdd();
                e.Property(sc => sc.Ordine).IsRequired();
                e.Property(sc => sc.Descrizione).IsRequired().HasMaxLength(255);
            });

            //Modalita Pagamento
            model.Entity<ModalitaPagamento>(e =>
            {
                e.HasKey(mp => mp.Id);
                e.Property(mp => mp.Id).ValueGeneratedOnAdd();
                e.Property(mp => mp.Descrizione).IsRequired().HasMaxLength(255);
            });

            //Cliente
            model.Entity<Cliente>(e =>
            {
                e.HasKey(c => c.Id);
                e.Property(c => c.Id).ValueGeneratedOnAdd();
                e.Property(c => c.CodiceInterno).HasMaxLength(50);
                e.Property(c => c.RagioneSociale).IsRequired().HasMaxLength(255);
                e.Property(c => c.PartitaIva).HasMaxLength(20);
                e.Property(c => c.CodiceFiscale).HasMaxLength(20);
                e.Property(c => c.Indirizzo).HasMaxLength(255);
                e.Property(c => c.Comune).HasMaxLength(100);
                e.Property(c => c.CAP).HasMaxLength(10);
                e.Property(c => c.Provincia).HasMaxLength(10);
                e.Property(c => c.Telefono).HasMaxLength(20);
                e.Property(c => c.Email).HasMaxLength(100);
                e.Property(c => c.Sdi).HasMaxLength(7);
                e.Property(c => c.Tipo).IsRequired().HasMaxLength(50);
                e.HasOne<ModalitaPagamento>().WithMany().HasForeignKey(c => c.ModalitaPagamentoId);
            });

            //Personale Cliente
            model.Entity<PersonaleCliente>(e =>
            {
                e.HasKey(pc => pc.Id);
                e.Property(pc => pc.Id).ValueGeneratedOnAdd();
                e.Property(pc => pc.ClienteId).IsRequired();
                e.Property(pc => pc.Nome).IsRequired().HasMaxLength(100);
                e.Property(pc => pc.Cognome).IsRequired().HasMaxLength(100);
                e.Property(pc => pc.Mansione).HasMaxLength(100);
                e.Property(pc => pc.Email).HasMaxLength(100);
                e.Property(pc => pc.Telefono).HasMaxLength(20);
                e.HasOne(pc => pc.Cliente).WithMany(c => c.Personale).HasForeignKey(pc => pc.ClienteId);
            });

            base.OnModelCreating(model);
        }

    }
}
