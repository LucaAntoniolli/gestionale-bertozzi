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

            if(attivita.Ordine == 0) {  
                var maxOrdine = await db.TemplateAttivita
                    .Where(a => a.PianoSviluppoId == attivita.PianoSviluppoId)
                    .MaxAsync(a => (int?)a.Ordine) ?? 0;
                attivita.Ordine = maxOrdine + 1;
            }

            db.TemplateAttivita.Add(attivita);
            await db.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = attivita.Id }, attivita);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "attivita.update")]
        public async Task<IActionResult> Update(int id, [FromBody] TemplateAttivita attivita)
        {
            if (attivita == null || id != attivita.Id)
                return BadRequest();

            var exists = await db.TemplateAttivita.AnyAsync(a => a.Id == id);
            if (!exists)
                return NotFound();

            if (attivita.Ordine == 0)
            {
                var maxOrdine = await db.TemplateAttivita
                    .Where(a => a.PianoSviluppoId == attivita.PianoSviluppoId)
                    .MaxAsync(a => (int?)a.Ordine) ?? 0;
                attivita.Ordine = maxOrdine + 1;
            }

            db.Entry(attivita).State = EntityState.Modified;

            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await db.TemplateAttivita.AnyAsync(a => a.Id == id))
                    return NotFound();
                throw;
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
