using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Authorization;
using NemesiLIB.Context;
using NemesiLIB.Model.GestioneCommesse;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NemesiAPI.Controllers.GestioneCommesse
{
    [ApiController]
    [Route("api/attivita")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AttivitaController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbContext;

        public AttivitaController(GestionaleBertozziContext db)
        {
            dbContext = db;
        }

        [HttpGet]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "attivita.read")]
        public async Task<ActionResult<IEnumerable<Attivita>>> GetAll([FromQuery] int? pianoSviluppoId = null)
        {
            IQueryable<Attivita> query = dbContext.Attivita.AsNoTracking();

            if (pianoSviluppoId.HasValue)
            {
                query = query.Where(a => a.PianoSviluppoId == pianoSviluppoId.Value);
            }

            var list = await query
                .OrderBy(a => a.Ordine)
                .ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "attivita.read")]
        public async Task<ActionResult<Attivita>> Get(int id)
        {
            var item = await dbContext.Attivita
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        [HttpGet("piano/{pianoSviluppoId:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "attivita.read")]
        public async Task<ActionResult<IEnumerable<Attivita>>> GetByPianoSviluppo(int pianoSviluppoId)
        {
            var list = await dbContext.Attivita
                .AsNoTracking()
                .Where(a => a.PianoSviluppoId == pianoSviluppoId)
                .OrderBy(a => a.Ordine)
                .ToListAsync();

            if (!list.Any())
                return NotFound();
    
            return Ok(list);
        }

        [HttpPost]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "attivita.create")]
        public async Task<ActionResult<Attivita>> Create([FromBody] Attivita model)
        {
            if (model == null)
                return BadRequest();

            // Valida che il piano di sviluppo esista
            if (!await dbContext.PianoSviluppo.AnyAsync(p => p.Id == model.PianoSviluppoId))
                return BadRequest("Piano di sviluppo non trovato");

            // Se l'ordine non è specificato, calcola il prossimo disponibile
            if (model.Ordine == 0)
            {
                var maxOrdine = await dbContext.Attivita
                    .AsNoTracking()
                    .Where(a => a.PianoSviluppoId == model.PianoSviluppoId)
                    .MaxAsync(a => (int?)a.Ordine) ?? 0;

                model.Ordine = maxOrdine + 1;
            }
            else
            {
                // Se l'ordine è specificato, riordina le attività successive
                await RiordinaAttivitaSuccessive(model.PianoSviluppoId, model.Ordine);
            }

            dbContext.Attivita.Add(model);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "attivita.update")]
        public async Task<IActionResult> Update(int id, [FromBody] Attivita model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var attivitaEsistente = await dbContext.Attivita.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (attivitaEsistente == null)
                return NotFound();

            // Se l'ordine è cambiato, riordina le attività
            if (attivitaEsistente.Ordine != model.Ordine)
            {
                await RiordinaAttivitaDopoCambioOrdine(attivitaEsistente.PianoSviluppoId, attivitaEsistente.Ordine, model.Ordine);
            }

            dbContext.Entry(model).State = EntityState.Modified;
            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "attivita.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbContext.Attivita.FirstOrDefaultAsync(a => a.Id == id);
            if (item == null)
                return NotFound();

            var pianoSviluppoId = item.PianoSviluppoId;
            var ordineEliminato = item.Ordine;

            dbContext.Attivita.Remove(item);
            await dbContext.SaveChangesAsync();

            // Riordina le attività successive
            await RiordinaAttivitaDopoEliminazione(pianoSviluppoId, ordineEliminato);

            return NoContent();
        }

        private async Task RiordinaAttivitaSuccessive(int pianoSviluppoId, int ordineInserimento)
        {
            var attivitaSuccessive = await dbContext.Attivita
                .Where(a => a.PianoSviluppoId == pianoSviluppoId && a.Ordine >= ordineInserimento)
                .OrderBy(a => a.Ordine)
                .ToListAsync();

            int nuovoOrdine = ordineInserimento + 1;
            foreach (var attivita in attivitaSuccessive)
            {
                attivita.Ordine = nuovoOrdine;
                nuovoOrdine++;
                dbContext.Entry(attivita).State = EntityState.Modified;
            }

            await dbContext.SaveChangesAsync();
        }

        private async Task RiordinaAttivitaDopoCambioOrdine(int pianoSviluppoId, int ordineVecchio, int ordineNuovo)
        {
            var attivitaDaAggiornare = await dbContext.Attivita
                .Where(a => a.PianoSviluppoId == pianoSviluppoId && 
                       ((ordineVecchio < ordineNuovo && a.Ordine > ordineVecchio && a.Ordine <= ordineNuovo) ||
                        (ordineVecchio > ordineNuovo && a.Ordine >= ordineNuovo && a.Ordine < ordineVecchio)))
                .ToListAsync();

            if (ordineVecchio < ordineNuovo)
            {
                // Sposta giù (decrementa gli ordini intermedi)
                foreach (var attivita in attivitaDaAggiornare.OrderBy(a => a.Ordine))
                {
                    attivita.Ordine--;
                    dbContext.Entry(attivita).State = EntityState.Modified;
                }
            }
            else if (ordineVecchio > ordineNuovo)
            {
                // Sposta su (incrementa gli ordini intermedi)
                foreach (var attivita in attivitaDaAggiornare.OrderByDescending(a => a.Ordine))
                {
                    attivita.Ordine++;
                    dbContext.Entry(attivita).State = EntityState.Modified;
                }
            }

            await dbContext.SaveChangesAsync();
        }

        private async Task RiordinaAttivitaDopoEliminazione(int pianoSviluppoId, int ordineEliminato)
        {
            var attivitaSuccessive = await dbContext.Attivita
                .Where(a => a.PianoSviluppoId == pianoSviluppoId && a.Ordine > ordineEliminato)
                .OrderBy(a => a.Ordine)
                .ToListAsync();

            foreach (var attivita in attivitaSuccessive)
            {
                attivita.Ordine--;
                dbContext.Entry(attivita).State = EntityState.Modified;
            }

            await dbContext.SaveChangesAsync();
        }
    }
}