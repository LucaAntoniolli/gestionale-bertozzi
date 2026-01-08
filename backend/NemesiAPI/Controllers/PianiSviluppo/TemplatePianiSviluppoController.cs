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
            return Ok(list);
        }

        [HttpGet("tipologia/{TipologiaCommessaId:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.read")]
        public async Task<ActionResult<List<TemplatePianoSviluppo>>> getByTipologiaCommessa(int TipologiaCommessaId, [FromQuery] bool includeAttivita = false)
        {
            IQueryable<TemplatePianoSviluppo> q = db.TemplatePianoSviluppo.AsNoTracking();
            if (includeAttivita)
                q = q.Include(p => p.Attivita);
            var entity = await q.Where(p => p.TipologiaCommessaId == TipologiaCommessaId).OrderBy(p => p.Ordine).ToListAsync();
            if (entity == null)
                return NotFound();
            return Ok(entity);
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

            if(piano.Ordine == 0)
            {
                var maxOrdine = await db.TemplatePianoSviluppo
                    .Where(p => p.TipologiaCommessaId == piano.TipologiaCommessaId)
                    .MaxAsync(p => (int?)p.Ordine) ?? 0;
                piano.Ordine = maxOrdine + 1;
            }

            db.TemplatePianoSviluppo.Add(piano);
            await db.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = piano.Id }, piano);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "pianosviluppo.update")]
        public async Task<IActionResult> Update(int id, [FromBody] TemplatePianoSviluppo piano)
        {
            if (piano == null || id != piano.Id)
                return BadRequest();

            if (piano.Ordine == 0)
            {
                var maxOrdine = await db.TemplatePianoSviluppo
                    .Where(p => p.TipologiaCommessaId == piano.TipologiaCommessaId)
                    .MaxAsync(p => (int?)p.Ordine) ?? 0;
                piano.Ordine = maxOrdine + 1;
            }

            var exists = await db.TemplatePianoSviluppo.AnyAsync(p => p.Id == id);
            if (!exists)
                return NotFound();

            db.Entry(piano).State = EntityState.Modified;

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await db.TemplatePianoSviluppo.AnyAsync(p => p.Id == id))
                    return NotFound();
                throw;
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
