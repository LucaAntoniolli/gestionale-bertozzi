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
    [Route("api/template-attivita")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class TemplateAttivitaController : ControllerBase
    {
        private readonly GestionaleBertozziContext db;

        public TemplateAttivitaController(GestionaleBertozziContext context)
        {
            db = context;
        }

        [HttpGet]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "attivita.read")]
        public async Task<ActionResult<List<TemplateAttivita>>> GetAll([FromQuery] int? pianoSviluppoId = null)
        {
            IQueryable<TemplateAttivita> q = db.TemplateAttivita.AsNoTracking();
            if (pianoSviluppoId.HasValue)
                q = q.Where(a => a.PianoSviluppoId == pianoSviluppoId.Value);

            var list = await q.OrderBy(a => a.Ordine).ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "attivita.read")]
        public async Task<ActionResult<TemplateAttivita>> Get(int id)
        {
            var entity = await db.TemplateAttivita.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
            if (entity == null)
                return NotFound();

            return Ok(entity);
        }

        [HttpPost]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "attivita.create")]
        public async Task<ActionResult<TemplateAttivita>> Create([FromBody] TemplateAttivita attivita)
        {
            if (attivita == null)
                return BadRequest();

            // If ordine == 0, aggiungo alla fine
            if (attivita.Ordine == 0) {  
                var maxOrdine = await db.TemplateAttivita
                    .Where(a => a.PianoSviluppoId == attivita.PianoSviluppoId)
                    .MaxAsync(a => (int?)a.Ordine) ?? 0;
                attivita.Ordine = maxOrdine + 1;
            }

            // Se ordine è fornito è esiste già un'attività con quell'ordine, sposto le successive
            await using (var transaction = await db.Database.BeginTransactionAsync())
            {
                var toShift = await db.TemplateAttivita
                    .Where(a => a.PianoSviluppoId == attivita.PianoSviluppoId && a.Ordine >= attivita.Ordine)
                    .ToListAsync();

                if (toShift.Any())
                {
                    // Incremento ordine delle attività esistenti
                    foreach (var item in toShift)
                    {
                        item.Ordine += 1;
                        db.Entry(item).State = EntityState.Modified;
                    }

                    await db.SaveChangesAsync();
                }

                db.TemplateAttivita.Add(attivita);
                await db.SaveChangesAsync();

                await transaction.CommitAsync();
            }

            return CreatedAtAction(nameof(Get), new { id = attivita.Id }, attivita);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "attivita.update")]
        public async Task<IActionResult> Update(int id, [FromBody] TemplateAttivita attivita)
        {
            if (attivita == null || id != attivita.Id)
                return BadRequest();

            var existing = await db.TemplateAttivita.FirstOrDefaultAsync(a => a.Id == id);
            if (existing == null)
                return NotFound();

            // If ordine == 0, aggiungo alla fine
            if (attivita.Ordine == 0)
            {
                var maxOrdine = await db.TemplateAttivita
                    .Where(a => a.PianoSviluppoId == attivita.PianoSviluppoId)
                    .MaxAsync(a => (int?)a.Ordine) ?? 0;
                attivita.Ordine = maxOrdine + 1;
            }

            await using (var transaction = await db.Database.BeginTransactionAsync())
            {
                // Se l'ordine cambia, riordino solo all'interno dello stesso piano
                if (attivita.Ordine != existing.Ordine)
                {
                    if (attivita.Ordine < existing.Ordine)
                    {
                        // Sposto in su: incremento ordine per [new, old)
                        var toIncrement = await db.TemplateAttivita
                            .Where(a => a.PianoSviluppoId == existing.PianoSviluppoId
                                        && a.Id != id
                                        && a.Ordine >= attivita.Ordine
                                        && a.Ordine < existing.Ordine)
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
                        var toDecrement = await db.TemplateAttivita
                            .Where(a => a.PianoSviluppoId == existing.PianoSviluppoId
                                        && a.Id != id
                                        && a.Ordine <= attivita.Ordine
                                        && a.Ordine > existing.Ordine)
                            .ToListAsync();

                        foreach (var it in toDecrement)
                        {
                            it.Ordine -= 1;
                            db.Entry(it).State = EntityState.Modified;
                        }
                    }

                    await db.SaveChangesAsync();
                }

                // Applico le modifiche al record esistente (senza cambiare PianoSviluppoId)
                existing.Descrizione = attivita.Descrizione;
                existing.TipoInfoDaRegistrare = attivita.TipoInfoDaRegistrare;
                existing.Ordine = attivita.Ordine;

                db.Entry(existing).State = EntityState.Modified;

                try
                {
                    await db.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!await db.TemplateAttivita.AnyAsync(a => a.Id == id))
                        return NotFound();
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "attivita.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await db.TemplateAttivita.FindAsync(id);
            if (entity == null)
                return NotFound();

            db.TemplateAttivita.Remove(entity);
            await db.SaveChangesAsync();

            return NoContent();
        }
    }
}
