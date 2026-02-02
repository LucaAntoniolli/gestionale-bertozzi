using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Authorization;
using NemesiLIB.Context;
using NemesiLIB.Model.GestioneCommesse;

namespace NemesiAPI.Controllers.GestioneCommesse
{
    [ApiController]
    [Route("api/piani-sviluppo")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class PianoSviluppoController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbContext;

        public PianoSviluppoController(GestionaleBertozziContext db)
        {
            dbContext = db;
        }

        [HttpGet]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.read")]
        public async Task<ActionResult<IEnumerable<PianoSviluppo>>> GetAll([FromQuery] int? commessaId = null, [FromQuery] bool includeAttivita = false)
        {
            IQueryable<PianoSviluppo> q = dbContext.PianoSviluppo.AsNoTracking();

            if (commessaId.HasValue)
            {
                q = q.Where(p => p.CommessaId == commessaId.Value);
            }

            if (includeAttivita)
            {
                q = q.Include(p => p.Attivita);
            }

            var list = await q
                .OrderBy(p => p.Ordine)
                .ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.read")]
        public async Task<ActionResult<PianoSviluppo>> Get(int id, [FromQuery] bool includeAttivita = false)
        {
            IQueryable<PianoSviluppo> q = dbContext.PianoSviluppo.AsNoTracking();

            if (includeAttivita)
            {
                q = q.Include(p => p.Attivita);
            }

            var item = await q.FirstOrDefaultAsync(x => x.Id == id);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        [HttpGet("commessa/{commessaId:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.read")]
        public async Task<ActionResult<IEnumerable<PianoSviluppo>>> GetByCommessa(int commessaId, [FromQuery] bool includeAttivita = false)
        {
            IQueryable<PianoSviluppo> q = dbContext.PianoSviluppo
                .AsNoTracking()
                .Where(p => p.CommessaId == commessaId);

            if (includeAttivita)
            {
                q = q.Include(p => p.Attivita);
            }

            var list = await q
                .OrderBy(p => p.Ordine)
                .ToListAsync();

            if (!list.Any())
                return NotFound();

            return Ok(list);
        }

        [HttpPost]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.create")]
        public async Task<ActionResult<PianoSviluppo>> Create([FromBody] PianoSviluppo model)
        {
            if (model == null)
                return BadRequest();

            // Valida che la commessa esista
            if (!await dbContext.Commessa.AnyAsync(c => c.Id == model.CommessaId))
                return BadRequest("Commessa non trovata");

            // Se l'ordine non è specificato, calcola il prossimo disponibile
            if (model.Ordine == 0)
            {
                var maxOrdine = await dbContext.PianoSviluppo
                    .AsNoTracking()
                    .Where(p => p.CommessaId == model.CommessaId)
                    .MaxAsync(p => (int?)p.Ordine) ?? 0;

                model.Ordine = maxOrdine + 1;
            }
            else
            {
                // Se l'ordine è specificato, riordina i piani successivi
                await RiordinaPianiSuccessivi(model.CommessaId, model.Ordine);
            }

            dbContext.PianoSviluppo.Add(model);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.update")]
        public async Task<IActionResult> Update(int id, [FromBody] PianoSviluppo model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var pianoEsistente = await dbContext.PianoSviluppo.FirstOrDefaultAsync(x => x.Id == id);
            if (pianoEsistente == null)
                return NotFound();

            // Se l'ordine è cambiato, riordina i piani
            if (pianoEsistente.Ordine != model.Ordine)
            {
                await RiordinaPianiDopoCambioOrdine(pianoEsistente.CommessaId, pianoEsistente.Ordine, model.Ordine);
            }

            dbContext.Entry(model).State = EntityState.Modified;
            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbContext.PianoSviluppo.FirstOrDefaultAsync(p => p.Id == id);
            if (item == null)
                return NotFound();

            var commessaId = item.CommessaId;
            var ordineEliminato = item.Ordine;

            // Elimina in cascata le attività
            var attivita = await dbContext.Attivita
                .Where(a => a.PianoSviluppoId == id)
                .ToListAsync();
            dbContext.Attivita.RemoveRange(attivita);

            dbContext.PianoSviluppo.Remove(item);
            await dbContext.SaveChangesAsync();

            // Riordina i piani successivi
            await RiordinaPianiDopoEliminazione(commessaId, ordineEliminato);

            return NoContent();
        }

        private async Task RiordinaPianiSuccessivi(int commessaId, int ordineInserimento)
        {
            var pianiSuccessivi = await dbContext.PianoSviluppo
                .Where(p => p.CommessaId == commessaId && p.Ordine >= ordineInserimento)
                .OrderBy(p => p.Ordine)
                .ToListAsync();

            int nuovoOrdine = ordineInserimento + 1;
            foreach (var piano in pianiSuccessivi)
            {
                piano.Ordine = nuovoOrdine;
                nuovoOrdine++;
                dbContext.Entry(piano).State = EntityState.Modified;
            }

            await dbContext.SaveChangesAsync();
        }

        private async Task RiordinaPianiDopoCambioOrdine(int commessaId, int ordineVecchio, int ordineNuovo)
        {
            var pianiDaAggiornare = await dbContext.PianoSviluppo
                .Where(p => p.CommessaId == commessaId && 
                       ((ordineVecchio < ordineNuovo && p.Ordine > ordineVecchio && p.Ordine <= ordineNuovo) ||
                        (ordineVecchio > ordineNuovo && p.Ordine >= ordineNuovo && p.Ordine < ordineVecchio)))
                .ToListAsync();

            if (ordineVecchio < ordineNuovo)
            {
                // Sposta giù (decrementa gli ordini intermedi)
                foreach (var piano in pianiDaAggiornare.OrderBy(p => p.Ordine))
                {
                    piano.Ordine--;
                    dbContext.Entry(piano).State = EntityState.Modified;
                }
            }
            else if (ordineVecchio > ordineNuovo)
            {
                // Sposta su (incrementa gli ordini intermedi)
                foreach (var piano in pianiDaAggiornare.OrderByDescending(p => p.Ordine))
                {
                    piano.Ordine++;
                    dbContext.Entry(piano).State = EntityState.Modified;
                }
            }

            await dbContext.SaveChangesAsync();
        }

        private async Task RiordinaPianiDopoEliminazione(int commessaId, int ordineEliminato)
        {
            var pianiSuccessivi = await dbContext.PianoSviluppo
                .Where(p => p.CommessaId == commessaId && p.Ordine > ordineEliminato)
                .OrderBy(p => p.Ordine)
                .ToListAsync();

            foreach (var piano in pianiSuccessivi)
            {
                piano.Ordine--;
                dbContext.Entry(piano).State = EntityState.Modified;
            }

            await dbContext.SaveChangesAsync();
        }
    }
}