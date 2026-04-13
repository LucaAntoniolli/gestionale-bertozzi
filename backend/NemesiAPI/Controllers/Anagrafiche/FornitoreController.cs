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
    [Route("api/fornitori")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class FornitoreController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbContext;

        public FornitoreController(GestionaleBertozziContext db)
        {
            dbContext = db;
        }

        [HttpGet]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "fornitore.read")]
        public async Task<ActionResult<IEnumerable<Fornitore>>> GetAll(
            [FromQuery] int? modalitaPagamentoId = null,
            [FromQuery] string? tipo = null)
        {
            IQueryable<Fornitore> q = dbContext.Fornitore.AsNoTracking()
                .Include(f => f.ModalitaPagamento);

            if (modalitaPagamentoId.HasValue)
                q = q.Where(f => f.ModalitaPagamentoId == modalitaPagamentoId.Value);

            if (!string.IsNullOrEmpty(tipo))
                q = q.Where(f => f.Tipo == tipo);

            var list = await q.OrderBy(f => f.RagioneSociale).ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "fornitore.read")]
        public async Task<ActionResult<Fornitore>> Get(int id)
        {
            var item = await dbContext.Fornitore.AsNoTracking()
                .Include(f => f.ModalitaPagamento)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        [HttpPost]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "fornitore.create")]
        public async Task<ActionResult<Fornitore>> Create([FromBody] Fornitore model)
        {
            if (model == null)
                return BadRequest();

            if (model.ModalitaPagamentoId.HasValue &&
                !await dbContext.ModalitaPagamento.AnyAsync(m => m.Id == model.ModalitaPagamentoId.Value))
                return BadRequest("Modalità di pagamento non trovata");

            dbContext.Fornitore.Add(model);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "fornitore.update")]
        public async Task<IActionResult> Update(int id, [FromBody] Fornitore model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var existing = await dbContext.Fornitore.FirstOrDefaultAsync(f => f.Id == id);
            if (existing == null)
                return NotFound();

            if (model.ModalitaPagamentoId.HasValue &&
                !await dbContext.ModalitaPagamento.AnyAsync(m => m.Id == model.ModalitaPagamentoId.Value))
                return BadRequest("Modalità di pagamento non trovata");

            existing.RagioneSociale = model.RagioneSociale;
            existing.PartitaIva = model.PartitaIva;
            existing.CodiceFiscale = model.CodiceFiscale;
            existing.Indirizzo = model.Indirizzo;
            existing.Comune = model.Comune;
            existing.CAP = model.CAP;
            existing.Provincia = model.Provincia;
            existing.Nazione = model.Nazione;
            existing.Telefono = model.Telefono;
            existing.Email = model.Email;
            existing.ModalitaPagamentoId = model.ModalitaPagamentoId;
            existing.Sdi = model.Sdi;
            existing.Tipo = model.Tipo;
            existing.Sigla = model.Sigla;

            try
            {
                await dbContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await dbContext.Fornitore.AnyAsync(f => f.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "fornitore.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbContext.Fornitore.FindAsync(id);
            if (item == null)
                return NotFound();

            dbContext.Fornitore.Remove(item);
            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("paged")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "fornitore.read")]
        public async Task<ActionResult<FornitorePagedResponseDto>> GetPaged(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] int? modalitaPagamentoId = null,
            [FromQuery] string? tipo = null)
        {
            var baseQuery = dbContext.Fornitore
                .AsNoTracking()
                .Where(f =>
                    (string.IsNullOrEmpty(search) || f.RagioneSociale.Contains(search)) &&
                    (!modalitaPagamentoId.HasValue || f.ModalitaPagamentoId == modalitaPagamentoId.Value) &&
                    (string.IsNullOrEmpty(tipo) || f.Tipo == tipo));

            var totalCount = await baseQuery.CountAsync();

            var items = await baseQuery
                .Include(f => f.ModalitaPagamento)
                .OrderBy(f => f.RagioneSociale)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var dtos = items.Select(f => new FornitorePagedItemDto
            {
                Id = f.Id,
                RagioneSociale = f.RagioneSociale,
                PartitaIva = f.PartitaIva,
                Tipo = f.Tipo,
                Sigla = f.Sigla,
                Comune = f.Comune,
                Provincia = f.Provincia,
                Telefono = f.Telefono,
                Email = f.Email,
                ModalitaPagamentoId = f.ModalitaPagamentoId,
                ModalitaPagamentoDescrizione = f.ModalitaPagamento?.Descrizione,
                DataCreazione = f.DataCreazione,
            }).ToList();

            return Ok(new FornitorePagedResponseDto
            {
                TotalCount = totalCount,
                Items = dtos,
            });
        }
    }
}
