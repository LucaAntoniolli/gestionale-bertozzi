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
    [Route("api/collaudo")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class CollaudoController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbContext;

        public CollaudoController(GestionaleBertozziContext db)
        {
            dbContext = db;
        }

        [HttpGet]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "collaudo.read")]
        public async Task<ActionResult<IEnumerable<Collaudo>>> GetAll(
            [FromQuery] int? fornitoreId = null,
            [FromQuery] int? scopoLavoroId = null,
            [FromQuery] int? commessaId = null,
            [FromQuery] bool? pagato = null)
        {
            IQueryable<Collaudo> q = dbContext.Collaudo.AsNoTracking()
                .Include(c => c.Fornitore)
                .Include(c => c.ScopoLavoro)
                .Include(c => c.Commessa);

            if (fornitoreId.HasValue)
                q = q.Where(c => c.FornitoreId == fornitoreId.Value);
            if (scopoLavoroId.HasValue)
                q = q.Where(c => c.ScopoLavoroId == scopoLavoroId.Value);
            if (commessaId.HasValue)
                q = q.Where(c => c.CommessaId == commessaId.Value);
            if (pagato.HasValue)
                q = q.Where(c => c.Pagato == pagato.Value);

            var list = await q.OrderByDescending(c => c.DataCreazione).ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "collaudo.read")]
        public async Task<ActionResult<Collaudo>> Get(int id)
        {
            var item = await dbContext.Collaudo.AsNoTracking()
                .Include(c => c.Fornitore)
                .Include(c => c.ScopoLavoro)
                .Include(c => c.Commessa)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        [HttpPost]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "collaudo.create")]
        public async Task<ActionResult<Collaudo>> Create([FromBody] Collaudo model)
        {
            if (model == null)
                return BadRequest();

            if (!await dbContext.Fornitore.AnyAsync(f => f.Id == model.FornitoreId))
                return BadRequest("Fornitore non trovato");

            if (!await dbContext.ScopoLavoro.AnyAsync(s => s.Id == model.ScopoLavoroId))
                return BadRequest("Scopo lavoro non trovato");

            if (!await dbContext.Commessa.AnyAsync(c => c.Id == model.CommessaId))
                return BadRequest("Commessa non trovata");

            dbContext.Collaudo.Add(model);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "collaudo.update")]
        public async Task<IActionResult> Update(int id, [FromBody] Collaudo model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var existing = await dbContext.Collaudo.FirstOrDefaultAsync(c => c.Id == id);
            if (existing == null)
                return NotFound();

            if (!await dbContext.Fornitore.AnyAsync(f => f.Id == model.FornitoreId))
                return BadRequest("Fornitore non trovato");

            if (!await dbContext.ScopoLavoro.AnyAsync(s => s.Id == model.ScopoLavoroId))
                return BadRequest("Scopo lavoro non trovato");

            if (!await dbContext.Commessa.AnyAsync(c => c.Id == model.CommessaId))
                return BadRequest("Commessa non trovata");

            existing.FornitoreId = model.FornitoreId;
            existing.ScopoLavoroId = model.ScopoLavoroId;
            existing.CommessaId = model.CommessaId;
            existing.Contratto = model.Contratto;
            existing.Importo = model.Importo;
            existing.Pagato = model.Pagato;

            try
            {
                await dbContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await dbContext.Collaudo.AnyAsync(c => c.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "collaudo.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbContext.Collaudo.FindAsync(id);
            if (item == null)
                return NotFound();

            dbContext.Collaudo.Remove(item);
            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("paged")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "collaudo.read")]
        public async Task<ActionResult<CollaudoPagedResponseDto>> GetPaged(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] int? fornitoreId = null,
            [FromQuery] int? scopoLavoroId = null,
            [FromQuery] int? commessaId = null,
            [FromQuery] bool? pagato = null)
        {
            var baseQuery = dbContext.Collaudo
                .AsNoTracking()
                .Where(c =>
                    (!fornitoreId.HasValue || c.FornitoreId == fornitoreId.Value) &&
                    (!scopoLavoroId.HasValue || c.ScopoLavoroId == scopoLavoroId.Value) &&
                    (!commessaId.HasValue || c.CommessaId == commessaId.Value) &&
                    (!pagato.HasValue || c.Pagato == pagato.Value));

            var totalCount = await baseQuery.CountAsync();
            var totaleImporto = await baseQuery.SumAsync(c => c.Importo);

            var items = await baseQuery
                .Include(c => c.Fornitore)
                .Include(c => c.ScopoLavoro)
                .OrderByDescending(c => c.DataCreazione)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var commessaIds = items.Select(c => c.CommessaId).Distinct().ToList();
            var commesseDict = await dbContext.Commessa
                .AsNoTracking()
                .Where(c => commessaIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => new { c.Descrizione, c.CommessaCodiceInterno });

            var dtos = items.Select(c =>
            {
                commesseDict.TryGetValue(c.CommessaId, out var commessa);
                return new CollaudoPagedItemDto
                {
                    Id = c.Id,
                    FornitoreId = c.FornitoreId,
                    FornitoreRagioneSociale = c.Fornitore?.RagioneSociale,
                    ScopoLavoroId = c.ScopoLavoroId,
                    ScopoLavoroDescrizione = c.ScopoLavoro?.Descrizione,
                    CommessaId = c.CommessaId,
                    CommessaDescrizione = commessa?.Descrizione,
                    CommessaCodiceInterno = commessa?.CommessaCodiceInterno,
                    Contratto = c.Contratto,
                    Importo = c.Importo,
                    Pagato = c.Pagato,
                    DataCreazione = c.DataCreazione,
                };
            }).ToList();

            return Ok(new CollaudoPagedResponseDto
            {
                TotalCount = totalCount,
                Items = dtos,
                TotaleImporto = totaleImporto,
            });
        }
    }
}
