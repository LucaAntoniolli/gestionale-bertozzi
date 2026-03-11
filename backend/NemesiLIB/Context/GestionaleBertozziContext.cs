using log4net;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using NemesiLIB.Model;
using NemesiLIB.Model.Anagrafiche;
using NemesiLIB.Model.PianiSviluppo;
using NemesiLIB.Model.GestioneCommesse;
using System.Reflection;
using NemesiCOMMONS.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace NemesiLIB.Context
{
    public class GestionaleBertozziContext : IdentityDbContext<Utente>
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);

        //TOKEN
        public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

        //ANAGRAFICHE
        public virtual DbSet<Cliente> Cliente{ get; set; }
        public virtual DbSet<ModalitaPagamento> ModalitaPagamento { get; set; }
        public virtual DbSet<PersonaleCliente> PersonaleCliente { get; set; }
        public virtual DbSet<StatusCommessa> StatusCommessa { get; set; }
        public virtual DbSet<TipologiaCommessa> TipologiaCommessa { get; set; }
        
        //PIANI DI SVILUPPO
        public virtual DbSet<TemplatePianoSviluppo> TemplatePianoSviluppo { get; set; }
        public virtual DbSet<TemplateAttivita> TemplateAttivita { get; set; }

        //GESTIONE COMMESSE
        public virtual DbSet<Commessa> Commessa { get; set; }
        public virtual DbSet<PianoSviluppo> PianoSviluppo { get; set; }
        public virtual DbSet<Attivita> Attivita { get; set; }
        public virtual DbSet<ToDo> ToDo { get; set; }
        public virtual DbSet<OreSpeseCommessa> OreSpeseCommessa { get; set; }

        private readonly IHttpContextAccessor httpContextAccessor;

        public GestionaleBertozziContext(DbContextOptions<GestionaleBertozziContext> options, IHttpContextAccessor httpContextAccessor) : base(options)
        {
            this.httpContextAccessor = httpContextAccessor;
        }

        protected override void OnModelCreating(ModelBuilder model)
        {
            log.Info("Set up context Gestionale Bertozzi");

            model.Entity<Utente>(e =>
            {
                e.Property(u => u.Nominativo).IsRequired().HasMaxLength(200);
                e.Property(u => u.Societa).HasMaxLength(200);
                e.Property(u => u.IsEsterno).IsRequired().HasDefaultValue(false);
                e.Property(u => u.CostoOrario).HasColumnType("decimal(18,2)").IsRequired();
                e.Property(u => u.RuoloAziendale).HasMaxLength(100);
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
                e.Property(c => c.Sigla).HasMaxLength(20);
                e.HasOne(c => c.ModalitaPagamento).WithMany().HasForeignKey(c => c.ModalitaPagamentoId).IsRequired(false);
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
                e.HasOne(pc => pc.Cliente).WithMany(c => c.Personale).HasForeignKey(pc => pc.ClienteId).OnDelete(DeleteBehavior.Cascade);
            });

            //PIANI DI SVILUPPO
            //Piano Sviluppo template
            model.Entity<TemplatePianoSviluppo>(e =>
            {
                e.HasKey(ps => ps.Id);
                e.Property(ps => ps.Id).ValueGeneratedOnAdd();
                e.Property(ps => ps.TipologiaCommessaId).IsRequired();
                e.Property(ps => ps.Descrizione).IsRequired().HasMaxLength(500);
                e.HasOne<TipologiaCommessa>().WithMany().HasForeignKey(ps => ps.TipologiaCommessaId).OnDelete(DeleteBehavior.NoAction);
                e.HasMany(ps => ps.Attivita).WithOne(a => a.PianoSviluppo).HasForeignKey(a => a.PianoSviluppoId).OnDelete(DeleteBehavior.Cascade);
            });

            //Attivita Template
            model.Entity<TemplateAttivita>(e =>
            {
                e.HasKey(a => a.Id);
                e.Property(a => a.Id).ValueGeneratedOnAdd();
                e.Property(a => a.PianoSviluppoId).IsRequired();
                e.Property(a => a.Descrizione).IsRequired().HasMaxLength(1000);
                e.Property(a => a.TipoInfoDaRegistrare).HasMaxLength(100);
                e.HasOne(a => a.PianoSviluppo).WithMany(p => p.Attivita).HasForeignKey(a => a.PianoSviluppoId).OnDelete(DeleteBehavior.Cascade);
            });

            //GESTIONE COMMESSE
            //Commessa
            model.Entity<Commessa>(e =>
            {
                e.HasKey(c => c.Id);
                e.Property(c => c.Id).ValueGeneratedOnAdd();
                e.Property(c => c.ClienteId).IsRequired();
                e.Property(c => c.LuogoCommessa).IsRequired().HasMaxLength(500);
                e.Property(c => c.ProgressivoCommessa).IsRequired();
                e.Property(c => c.Protocollo).HasMaxLength(20);
                e.Property(c => c.PmEdileId).IsRequired();
                e.Property(c => c.ReferentiCliente).IsRequired().HasMaxLength(255);
                e.Property(c => c.PmAmministrativoId).IsRequired();
                e.Property(c => c.TipologiaCommessaId).IsRequired();
                e.Property(c => c.Descrizione).HasMaxLength(2000);
                e.Property(c => c.CommessaCodiceInterno).IsRequired().HasMaxLength(50);
                e.Property(c => c.CostoAtteso).HasColumnType("decimal(18,2)").IsRequired();
                e.Property(c => c.StatusCommessaId).IsRequired();
                e.Property(c => c.DataInizioPrevista).IsRequired(false);
                e.Property(c => c.DataConclusionePrevista).IsRequired(false);
                e.HasOne(c => c.PmAmministrativo).WithMany().HasForeignKey(c => c.PmAmministrativoId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(c => c.PmEdile).WithMany().HasForeignKey(c => c.PmEdileId).OnDelete(DeleteBehavior.NoAction);  
                e.HasOne(c => c.Cliente).WithMany().HasForeignKey(c => c.ClienteId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(c => c.TipologiaCommessa).WithMany().HasForeignKey(c => c.TipologiaCommessaId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(c => c.StatusCommessa).WithMany().HasForeignKey(c => c.StatusCommessaId).OnDelete(DeleteBehavior.NoAction);
                e.HasMany(c => c.PianiSviluppo).WithOne().HasForeignKey(p => p.CommessaId).OnDelete(DeleteBehavior.Cascade);
            });

            //Piano Sviluppo
            model.Entity<PianoSviluppo>(e =>
            {
                e.HasKey(p => p.Id);
                e.Property(p => p.Id).ValueGeneratedOnAdd();
                e.Property(p => p.CommessaId).IsRequired();
                e.Property(p => p.Descrizione).IsRequired().HasMaxLength(500);
                e.Property(p => p.Ordine).IsRequired();
                e.HasMany(p => p.Attivita).WithOne().HasForeignKey(a => a.PianoSviluppoId).OnDelete(DeleteBehavior.Cascade);
                e.HasMany(p => p.OreSpese).WithOne().HasForeignKey(o => o.PianoSviluppoId).OnDelete(DeleteBehavior.Cascade);
            });

            //Attivita
            model.Entity<Attivita>(e =>
            {
                e.HasKey(a => a.Id);
                e.Property(a => a.Id).ValueGeneratedOnAdd();
                e.Property(a => a.PianoSviluppoId).IsRequired();
                e.Property(a => a.Descrizione).IsRequired().HasMaxLength(1000);
                e.Property(a => a.PercentualeAvanzamento).IsRequired(true).HasDefaultValue(0);
                e.Property(a => a.Completata).IsRequired(true).HasDefaultValue(false);
                e.Property(a => a.DataRiferimento).IsRequired(false);
                e.Property(a => a.Ordine).IsRequired();
            });

            //ToDo
            model.Entity<ToDo>(e =>
            {
                e.HasKey(t => t.Id);
                e.Property(t => t.Id).ValueGeneratedOnAdd();
                e.Property(t => t.AssegnatarioPrimarioId).IsRequired();
                e.Property(t => t.AssegnatarioSecondarioId).IsRequired(false);
                e.Property(t => t.CommessaId).IsRequired();
                e.Property(t => t.DescrizioneTodo).IsRequired().HasColumnType("nvarchar(max)");
                e.Property(t => t.DataConsegna).IsRequired(false);
                e.Property(t => t.DescrizioneAttivitaSvolta).IsRequired(false).HasColumnType("nvarchar(max)");
                e.Property(t => t.Completato).IsRequired().HasDefaultValue(false);
                e.HasOne(t => t.AssegnatarioPrimario).WithMany().HasForeignKey(t => t.AssegnatarioPrimarioId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(t => t.AssegnatarioSecondario).WithMany().HasForeignKey(t => t.AssegnatarioSecondarioId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne<Commessa>().WithMany().HasForeignKey(t => t.CommessaId).OnDelete(DeleteBehavior.NoAction);
            });

            //OreSpeseCommessa
            model.Entity<OreSpeseCommessa>(e =>
            {
                e.HasKey(o => o.Id);
                e.Property(o => o.Id).ValueGeneratedOnAdd();
                e.Property(o => o.CommessaId).IsRequired();
                e.Property(o => o.PianoSviluppoId).IsRequired();
                e.Property(o => o.UtenteId).IsRequired();
                e.Property(o => o.Data).IsRequired();
                e.Property(o => o.Ore).HasColumnType("decimal(18,2)").IsRequired(false);
                e.Property(o => o.Spese).HasColumnType("decimal(18,2)").IsRequired(false);
                e.Property(o => o.Chilometri).HasColumnType("decimal(18,2)").IsRequired(false);
                e.Property(o => o.Note).HasMaxLength(2000).IsRequired(false);
                e.HasOne(o => o.Utente).WithMany().HasForeignKey(o => o.UtenteId).OnDelete(DeleteBehavior.NoAction);
                e.HasOne(o => o.PianoSviluppo).WithMany(p => p.OreSpese).HasForeignKey(o => o.PianoSviluppoId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne<Commessa>().WithMany(c => c.OreSpese).HasForeignKey(o => o.CommessaId).OnDelete(DeleteBehavior.NoAction);
            });

            base.OnModelCreating(model);
        }

        public override int SaveChanges()
        {
            ApplyAuditInformation();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyAuditInformation();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void ApplyAuditInformation()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is IAuditable && (e.State == EntityState.Added || e.State == EntityState.Modified));

            var username = httpContextAccessor?.HttpContext?.User?.Identity?.Name
                ?? httpContextAccessor?.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? "-";

            foreach (var entry in entries)
            {
                var auditable = (IAuditable)entry.Entity;
                if (entry.State == EntityState.Added)
                {
                    auditable.DataCreazione = DateTime.UtcNow;
                    auditable.UtenteCreazione = username;
                    auditable.DataModifica = null;
                    auditable.UtenteModifica = null;
                }
                else if (entry.State == EntityState.Modified)
                {
                    auditable.DataModifica = DateTime.UtcNow;
                    auditable.UtenteModifica = username;
                }
            }
        }

    }
}
