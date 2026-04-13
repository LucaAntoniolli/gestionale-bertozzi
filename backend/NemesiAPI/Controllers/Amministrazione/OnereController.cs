using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Authorization;
using NemesiAPI.Model;
using NemesiLIB.Context;
using NemesiLIB.Model.Amministrazione;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NemesiAPI.Controllers.Amministrazione
{
    [ApiController]
    [Route("api/onere")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class OnereController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbContext;

        public OnereController(GestionaleBertozziContext db)
        {
            dbContext = db;
        }

        [HttpGet]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "onere.read")]
        public async Task<ActionResult<IEnumerable<Onere>>> GetAll(
            [FromQuery] int? commessaId = null)
        {
            IQueryable<Onere> q = dbContext.Onere.AsNoTracking()
                .Include(o => o.Commessa);

            if (commessaId.HasValue)
                q = q.Where(o => o.CommessaId == commessaId.Value);

            var list = await q.OrderByDescending(o => o.DataCreazione).ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "onere.read")]
        public async Task<ActionResult<Onere>> Get(int id)
        {
            var item = await dbContext.Onere.AsNoTracking()
                .Include(o => o.Commessa)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        [HttpPost]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "onere.create")]
        public async Task<ActionResult<Onere>> Create([FromBody] Onere model)
        {
            if (model == null)
                return BadRequest();

            if (!await dbContext.Commessa.AnyAsync(c => c.Id == model.CommessaId))
                return BadRequest("Commessa non trovata");

            dbContext.Onere.Add(model);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "onere.update")]
        public async Task<IActionResult> Update(int id, [FromBody] Onere model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var existing = await dbContext.Onere.FirstOrDefaultAsync(o => o.Id == id);
            if (existing == null)
                return NotFound();

            if (!await dbContext.Commessa.AnyAsync(c => c.Id == model.CommessaId))
                return BadRequest("Commessa non trovata");

            existing.CommessaId = model.CommessaId;
            existing.Pratica = model.Pratica;
            existing.ImportoOneri = model.ImportoOneri;

            try
            {
                await dbContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await dbContext.Onere.AnyAsync(o => o.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "onere.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbContext.Onere.FindAsync(id);
            if (item == null)
                return NotFound();

            dbContext.Onere.Remove(item);
            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("paged")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "onere.read")]
        public async Task<ActionResult<OnerePagedResponseDto>> GetPaged(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] int? commessaId = null)
        {
            var baseQuery = dbContext.Onere
                .AsNoTracking()
                .Where(o => !commessaId.HasValue || o.CommessaId == commessaId.Value);

            var totalCount = await baseQuery.CountAsync();
            var totaleImportoOneri = await baseQuery.SumAsync(o => o.ImportoOneri);

            var items = await baseQuery
                .OrderByDescending(o => o.DataCreazione)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var commessaIds = items.Select(o => o.CommessaId).Distinct().ToList();
            var commesseDict = await dbContext.Commessa
                .AsNoTracking()
                .Where(c => commessaIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => new { c.Descrizione, c.CommessaCodiceInterno });

            var dtos = items.Select(o =>
            {
                commesseDict.TryGetValue(o.CommessaId, out var commessa);
                return new OnerePagedItemDto
                {
                    Id = o.Id,
                    CommessaId = o.CommessaId,
                    CommessaDescrizione = commessa?.Descrizione,
                    CommessaCodiceInterno = commessa?.CommessaCodiceInterno,
                    Pratica = o.Pratica,
                    ImportoOneri = o.ImportoOneri,
                    DataCreazione = o.DataCreazione,
                };
            }).ToList();

            return Ok(new OnerePagedResponseDto
            {
                TotalCount = totalCount,
                Items = dtos,
                TotaleImportoOneri = totaleImportoOneri,
            });
        }
    }
}
