using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Authorization;
using NemesiAPI.Model;
using NemesiLIB.Context;
using NemesiLIB.Model.Anagrafiche;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NemesiAPI.Controllers.Anagrafiche
{
    [ApiController]
    [Route("api/scopo-lavoro")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ScopoLavoroController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbContext;

        public ScopoLavoroController(GestionaleBertozziContext db)
        {
            dbContext = db;
        }

        [HttpGet]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "scopolavoro.read")]
        public async Task<ActionResult<IEnumerable<ScopoLavoro>>> GetAll()
        {
            var list = await dbContext.ScopoLavoro.AsNoTracking()
                .OrderBy(s => s.Descrizione)
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "scopolavoro.read")]
        public async Task<ActionResult<ScopoLavoro>> Get(int id)
        {
            var item = await dbContext.ScopoLavoro.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        [HttpPost]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "scopolavoro.create")]
        public async Task<ActionResult<ScopoLavoro>> Create([FromBody] ScopoLavoro model)
        {
            if (model == null)
                return BadRequest();

            dbContext.ScopoLavoro.Add(model);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "scopolavoro.update")]
        public async Task<IActionResult> Update(int id, [FromBody] ScopoLavoro model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var exists = await dbContext.ScopoLavoro.AnyAsync(s => s.Id == id);
            if (!exists)
                return NotFound();

            dbContext.Entry(model).State = EntityState.Modified;

            try
            {
                await dbContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await dbContext.ScopoLavoro.AnyAsync(s => s.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "scopolavoro.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbContext.ScopoLavoro.FindAsync(id);
            if (item == null)
                return NotFound();

            dbContext.ScopoLavoro.Remove(item);
            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("paged")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "scopolavoro.read")]
        public async Task<ActionResult<ScopoLavoroPagedResponseDto>> GetPaged(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null)
        {
            var baseQuery = dbContext.ScopoLavoro
                .AsNoTracking()
                .Where(s => string.IsNullOrEmpty(search) || s.Descrizione.Contains(search));

            var totalCount = await baseQuery.CountAsync();

            var items = await baseQuery
                .OrderBy(s => s.Descrizione)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var dtos = items.Select(s => new ScopoLavoroPagedItemDto
            {
                Id = s.Id,
                Descrizione = s.Descrizione,
            }).ToList();

            return Ok(new ScopoLavoroPagedResponseDto
            {
                TotalCount = totalCount,
                Items = dtos,
            });
        }
    }
}
