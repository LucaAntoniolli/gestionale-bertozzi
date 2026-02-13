using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Authorization;
using NemesiLIB.Context;
using NemesiLIB.Model.GestioneCommesse;
using NemesiLIB.Model.PianiSviluppo;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace NemesiAPI.Controllers.GestioneCommesse
{
    [ApiController]
    [Route("api/commesse")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class CommessaController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbContext;
        private readonly IConfiguration configuration;

        public CommessaController(GestionaleBertozziContext db, IConfiguration config)
        {
            dbContext = db;
            configuration = config; 
        }

        [HttpGet]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "commessa.read")]
        public async Task<ActionResult<IEnumerable<Commessa>>> GetAll([FromQuery] int? clienteId = null, [FromQuery] bool soloChiuse = false)
        {
            IQueryable<Commessa> q = dbContext.Commessa.AsNoTracking();

            if (clienteId.HasValue)
            {
                q = q.Where(c => c.ClienteId == clienteId.Value);
            }

            if (soloChiuse)
                q = q.Where(c => c.StatusCommessaId == configuration.GetValue<int>("ApplicationParameters:IdStatusCommessaChiusa"));
            else
                q = q.Where(c => c.StatusCommessaId != configuration.GetValue<int>("ApplicationParameters:IdStatusCommessaChiusa"));

            var list = await q
                .Include(c => c.Cliente)
                .Include(c => c.TipologiaCommessa)
                .Include(c => c.StatusCommessa)
                .OrderByDescending(c => c.DataCreazione)
                .ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "commessa.read")]
        public async Task<ActionResult<Commessa>> Get(int id)
        {
            var item = await dbContext.Commessa
                .AsNoTracking()
                .Include(c => c.Cliente)
                .Include(c => c.ReferenteCliente)
                .Include(c => c.TipologiaCommessa)
                .Include(c => c.StatusCommessa)
                .Include(c => c.PianiSviluppo).ThenInclude(p => p.Attivita)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        [HttpPost]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "commessa.create")]
        public async Task<ActionResult<Commessa>> Create([FromBody] Commessa model)
        {
            if (model == null)
                return BadRequest();

            // Calcola il progressivo per il cliente
            var maxProgressivo = await dbContext.Commessa
                .AsNoTracking()
                .Where(c => c.ClienteId == model.ClienteId)
                .MaxAsync(c => (int?)c.ProgressivoCommessa) ?? 0;

            model.ProgressivoCommessa = maxProgressivo + 1;

            // Valida che il cliente esista
            if (!await dbContext.Cliente.AnyAsync(c => c.Id == model.ClienteId))
                return BadRequest("Cliente non trovato");

            // Valida che la tipologia esista
            if (!await dbContext.TipologiaCommessa.AnyAsync(t => t.Id == model.TipologiaCommessaId))
                return BadRequest("Tipologia commessa non trovata");

            // Valida che lo status esista
            if (!await dbContext.StatusCommessa.AnyAsync(s => s.Id == model.StatusCommessaId))
                return BadRequest("Status commessa non trovato");

            // Valida che il referente cliente esista
            if (!await dbContext.PersonaleCliente.AnyAsync(p => p.Id == model.ReferenteClienteId))
                return BadRequest("Referente cliente non trovato");

            dbContext.Commessa.Add(model);
            await dbContext.SaveChangesAsync();

            // Crea i piani di sviluppo e le attività dal template
            await CreatePianiAndAttivitaFromTemplate(model.Id, model.TipologiaCommessaId);

            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "commessa.update")]
        public async Task<IActionResult> Update(int id, [FromBody] Commessa model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var existing = await dbContext.Commessa.FirstOrDefaultAsync(c => c.Id == id);
            if (existing == null)
                return NotFound();

            // Aggiorna solo i campi modificabili, preservando l'audit trail
            existing.ClienteId = model.ClienteId;
            existing.LuogoCommessa = model.LuogoCommessa;
            existing.Protocollo = model.Protocollo;
            existing.PmEdileId = model.PmEdileId;
            existing.ReferenteClienteId = model.ReferenteClienteId;
            existing.PmAmministrativoId = model.PmAmministrativoId;
            existing.TipologiaCommessaId = model.TipologiaCommessaId;
            existing.Descrizione = model.Descrizione;
            existing.CostoAtteso = model.CostoAtteso;
            existing.StatusCommessaId = model.StatusCommessaId;
            existing.DataInizioPrevista = model.DataInizioPrevista;
            existing.DataConclusionePrevista = model.DataConclusionePrevista;

            try
            {
                await dbContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await dbContext.Commessa.AnyAsync(c => c.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "commessa.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbContext.Commessa.FindAsync(id);
            if (item == null)
                return NotFound();

            // Elimina in cascata i piani e le attività
            var pianiSviluppo = await dbContext.PianoSviluppo
                .Where(p => p.CommessaId == id)
                .ToListAsync();

            foreach (var piano in pianiSviluppo)
            {
                var attivita = await dbContext.Attivita
                    .Where(a => a.PianoSviluppoId == piano.Id)
                    .ToListAsync();
                dbContext.Attivita.RemoveRange(attivita);
            }

            dbContext.PianoSviluppo.RemoveRange(pianiSviluppo);
            dbContext.Commessa.Remove(item);
            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        private async Task CreatePianiAndAttivitaFromTemplate(int commessaId, int tipologiaCommessaId)
        {
            // Recupera i template piani di sviluppo per la tipologia
            var templatePiani = await dbContext.TemplatePianoSviluppo
                .AsNoTracking()
                .Include(p => p.Attivita)
                .Where(p => p.TipologiaCommessaId == tipologiaCommessaId)
                .OrderBy(p => p.Ordine)
                .ToListAsync();

            foreach (var templatePiano in templatePiani)
            {
                var nuovoPiano = new PianoSviluppo
                {
                    CommessaId = commessaId,
                    Descrizione = templatePiano.Descrizione,
                    Ordine = templatePiano.Ordine
                };

                dbContext.PianoSviluppo.Add(nuovoPiano);
                await dbContext.SaveChangesAsync();

                // Crea le attività dal template
                if (templatePiano.Attivita != null && templatePiano.Attivita.Any())
                {
                    foreach (var templateAttivita in templatePiano.Attivita.OrderBy(a => a.Ordine))
                    {
                        var nuovaAttivita = new Attivita
                        {
                            PianoSviluppoId = nuovoPiano.Id,
                            Descrizione = templateAttivita.Descrizione,
                            TipoInfoDaRegistrare = templateAttivita.TipoInfoDaRegistrare,
                            PercentualeAvanzamento = 0,
                            Completata = false,
                            Ordine = templateAttivita.Ordine
                        };

                        dbContext.Attivita.Add(nuovaAttivita);
                    }

                    await dbContext.SaveChangesAsync();
                }
            }
        }
    }
}