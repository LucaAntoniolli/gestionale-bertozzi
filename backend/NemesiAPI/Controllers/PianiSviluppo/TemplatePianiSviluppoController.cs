using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Authorization;
using NemesiCOMMONS.Services.Audit;
using NemesiLIB.Context;
using NemesiLIB.Model.PianiSviluppo;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace NemesiAPI.Controllers.PianiSviluppo
{
    [ApiController]
    [Route("api/template-piani-sviluppo")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class TemplatePianiSviluppoController : ControllerBase
    {
        private readonly GestionaleBertozziContext db;

        public TemplatePianiSviluppoController(GestionaleBertozziContext context)
        {
            db = context;
        }

        [HttpGet]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.read")]
        public async Task<ActionResult<List<TemplatePianoSviluppo>>> GetAll([FromQuery] bool includeAttivita = false)
        {
            IQueryable<TemplatePianoSviluppo> q = db.TemplatePianoSviluppo.AsNoTracking();
            if (includeAttivita)
                q = q.Include(p => p.Attivita);

            var list = await q.OrderBy(p => p.Ordine).ToListAsync();

            if (list == null)
                return NotFound();

            if (includeAttivita)
            {
                foreach (var piano in list)
                {
                    if (piano.Attivita != null)
                        piano.Attivita = piano.Attivita.OrderBy(a => a.Ordine).ToList();
                }
            }

            return Ok(list);
        }

        [HttpGet("tipologia/{TipologiaCommessaId:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.read")]
        public async Task<ActionResult<List<TemplatePianoSviluppo>>> getByTipologiaCommessa(int TipologiaCommessaId, [FromQuery] bool includeAttivita = false)
        {
            IQueryable<TemplatePianoSviluppo> q = db.TemplatePianoSviluppo.AsNoTracking();
            if (includeAttivita)
                q = q.Include(p => p.Attivita);


            var list = await q.Where(p => p.TipologiaCommessaId == TipologiaCommessaId).OrderBy(p => p.Ordine).ToListAsync();

            if (list == null)
                return NotFound();

            if (includeAttivita)
            {
                foreach (var piano in list)
                {
                    if (piano.Attivita != null)
                        piano.Attivita = piano.Attivita.OrderBy(a => a.Ordine).ToList();
                }
            }

            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.read")]
        public async Task<ActionResult<TemplatePianoSviluppo>> Get(int id, [FromQuery] bool includeAttivita = false)
        {
            IQueryable<TemplatePianoSviluppo> q = db.TemplatePianoSviluppo.AsNoTracking();
            if (includeAttivita)
                q = q.Include(p => p.Attivita);

            var entity = await q.FirstOrDefaultAsync(p => p.Id == id);
            if (entity == null)
                return NotFound();

            return Ok(entity);
        }

        [HttpPost]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.create")]
        public async Task<ActionResult<TemplatePianoSviluppo>> Create([FromBody] TemplatePianoSviluppo piano)
        {
            if (piano == null)
                return BadRequest();

            // Se ordine non fornito -> append in coda per la tipologia
            if (piano.Ordine == 0)
            {
                var maxOrdine = await db.TemplatePianoSviluppo
                    .Where(p => p.TipologiaCommessaId == piano.TipologiaCommessaId)
                    .MaxAsync(p => (int?)p.Ordine) ?? 0;
                piano.Ordine = maxOrdine + 1;
            }

            // Se ordine fornito e già presente per la stessa TipologiaCommessa, sposto le successive
            await using (var transaction = await db.Database.BeginTransactionAsync())
            {
                var toShift = await db.TemplatePianoSviluppo
                    .Where(p => p.TipologiaCommessaId == piano.TipologiaCommessaId && p.Ordine >= piano.Ordine)
                    .ToListAsync();

                if (toShift.Any())
                {
                    foreach (var item in toShift)
                    {
                        item.Ordine += 1;
                        db.Entry(item).State = EntityState.Modified;
                    }

                    await db.SaveChangesAsync();
                }

                db.TemplatePianoSviluppo.Add(piano);
                await db.SaveChangesAsync();

                await transaction.CommitAsync();
            }

            return CreatedAtAction(nameof(Get), new { id = piano.Id }, piano);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.update")]
        public async Task<IActionResult> Update(int id, [FromBody] TemplatePianoSviluppo piano)
        {
            if (piano == null || id != piano.Id)
                return BadRequest();

            var existing = await db.TemplatePianoSviluppo.FirstOrDefaultAsync(p => p.Id == id);
            if (existing == null)
                return NotFound();

            // Se ordine non fornito -> append in coda della tipologia target
            if (piano.Ordine == 0)
            {
                var maxOrdine = await db.TemplatePianoSviluppo
                    .Where(p => p.TipologiaCommessaId == piano.TipologiaCommessaId)
                    .MaxAsync(p => (int?)p.Ordine) ?? 0;
                piano.Ordine = maxOrdine + 1;
            }

            await using (var transaction = await db.Database.BeginTransactionAsync())
            {
                // Se l'ordine cambia, riordino solo all'interno della stessa tipologia
                if (piano.Ordine != existing.Ordine)
                {
                    if (piano.Ordine < existing.Ordine)
                    {
                        // Sposto in su: incremento ordine per [new, old)
                        var toIncrement = await db.TemplatePianoSviluppo
                            .Where(p => p.TipologiaCommessaId == existing.TipologiaCommessaId
                                        && p.Id != id
                                        && p.Ordine >= piano.Ordine
                                        && p.Ordine < existing.Ordine)
                            .ToListAsync();

                        foreach (var it in toIncrement)
                        {
                            it.Ordine += 1;
                            db.Entry(it).State = EntityState.Modified;
                        }
                    }
                    else
                    {
                        // Sposto in giù: decremento ordine per (old, new]
                        var toDecrement = await db.TemplatePianoSviluppo
                            .Where(p => p.TipologiaCommessaId == existing.TipologiaCommessaId
                                        && p.Id != id
                                        && p.Ordine <= piano.Ordine
                                        && p.Ordine > existing.Ordine)
                            .ToListAsync();

                        foreach (var it in toDecrement)
                        {
                            it.Ordine -= 1;
                            db.Entry(it).State = EntityState.Modified;
                        }
                    }

                    await db.SaveChangesAsync();
                }

                // Applico le modifiche all'entità esistente
                existing.Descrizione = piano.Descrizione;
                existing.Ordine = piano.Ordine;

                db.Entry(existing).State = EntityState.Modified;

                try
                {
                    await db.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!await db.TemplatePianoSviluppo.AnyAsync(p => p.Id == id))
                        return NotFound();
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await db.TemplatePianoSviluppo.FindAsync(id);
            if (entity == null)
                return NotFound();

            db.TemplatePianoSviluppo.Remove(entity);
            await db.SaveChangesAsync();

            return NoContent();
        }
    }
}
