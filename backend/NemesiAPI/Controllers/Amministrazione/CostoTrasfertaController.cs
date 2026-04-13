using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Authorization;
using NemesiAPI.Model;
using NemesiLIB.Context;
using NemesiLIB.Model.Amministrazione;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NemesiAPI.Controllers.Amministrazione
{
    [ApiController]
    [Route("api/costo-trasferta")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class CostoTrasfertaController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbContext;

        public CostoTrasfertaController(GestionaleBertozziContext db)
        {
            dbContext = db;
        }

        [HttpGet]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "costotrasferta.read")]
        public async Task<ActionResult<IEnumerable<CostoTrasferta>>> GetAll(
            [FromQuery] int? clienteId = null,
            [FromQuery] int? commessaId = null,
            [FromQuery] string? utenteId = null)
        {
            IQueryable<CostoTrasferta> q = dbContext.CostoTrasferta.AsNoTracking()
                .Include(ct => ct.Utente)
                .Include(ct => ct.Commessa)
                .Include(ct => ct.Cliente);

            if (clienteId.HasValue)
                q = q.Where(ct => ct.ClienteId == clienteId.Value);
            if (commessaId.HasValue)
                q = q.Where(ct => ct.CommessaId == commessaId.Value);
            if (!string.IsNullOrEmpty(utenteId))
                q = q.Where(ct => ct.UtenteId == utenteId);

            var list = await q.OrderByDescending(ct => ct.DataCreazione).ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "costotrasferta.read")]
        public async Task<ActionResult<CostoTrasferta>> Get(int id)
        {
            var item = await dbContext.CostoTrasferta.AsNoTracking()
                .Include(ct => ct.Utente)
                .Include(ct => ct.Commessa)
                .Include(ct => ct.Cliente)
                .FirstOrDefaultAsync(ct => ct.Id == id);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        [HttpPost]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "costotrasferta.create")]
        public async Task<ActionResult<CostoTrasferta>> Create([FromBody] CostoTrasferta model)
        {
            if (model == null)
                return BadRequest();

            if (!await dbContext.Cliente.AnyAsync(c => c.Id == model.ClienteId))
                return BadRequest("Cliente non trovato");

            if (!await dbContext.Commessa.AnyAsync(c => c.Id == model.CommessaId))
                return BadRequest("Commessa non trovata");

            if (!await dbContext.Users.AnyAsync(u => u.Id == model.UtenteId))
                return BadRequest("Utente non trovato");

            dbContext.CostoTrasferta.Add(model);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "costotrasferta.update")]
        public async Task<IActionResult> Update(int id, [FromBody] CostoTrasferta model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var existing = await dbContext.CostoTrasferta.FirstOrDefaultAsync(ct => ct.Id == id);
            if (existing == null)
                return NotFound();

            if (!await dbContext.Cliente.AnyAsync(c => c.Id == model.ClienteId))
                return BadRequest("Cliente non trovato");

            if (!await dbContext.Commessa.AnyAsync(c => c.Id == model.CommessaId))
                return BadRequest("Commessa non trovata");

            if (!await dbContext.Users.AnyAsync(u => u.Id == model.UtenteId))
                return BadRequest("Utente non trovato");

            existing.ClienteId = model.ClienteId;
            existing.CommessaId = model.CommessaId;
            existing.UtenteId = model.UtenteId;
            existing.LocalitaPartenza = model.LocalitaPartenza;
            existing.LocalitaArrivo = model.LocalitaArrivo;
            existing.Chilometri = model.Chilometri;
            existing.CostoChilometri = model.CostoChilometri;
            existing.CostoTelepass = model.CostoTelepass;
            existing.CostoHotel = model.CostoHotel;
            existing.CostoTreno = model.CostoTreno;
            existing.DataDa = model.DataDa;
            existing.DataA = model.DataA;

            try
            {
                await dbContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await dbContext.CostoTrasferta.AnyAsync(ct => ct.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "costotrasferta.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbContext.CostoTrasferta.FindAsync(id);
            if (item == null)
                return NotFound();

            dbContext.CostoTrasferta.Remove(item);
            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("paged")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "costotrasferta.read")]
        public async Task<ActionResult<CostoTrasfertaPagedResponseDto>> GetPaged(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] int? clienteId = null,
            [FromQuery] int? commessaId = null,
            [FromQuery] string? utenteId = null,
            [FromQuery] DateTime? dataDaFrom = null,
            [FromQuery] DateTime? dataDaTo = null)
        {
            var baseQuery = dbContext.CostoTrasferta
                .AsNoTracking()
                .Where(ct =>
                    (!clienteId.HasValue || ct.ClienteId == clienteId.Value) &&
                    (!commessaId.HasValue || ct.CommessaId == commessaId.Value) &&
                    (string.IsNullOrEmpty(utenteId) || ct.UtenteId == utenteId) &&
                    (!dataDaFrom.HasValue || ct.DataDa >= dataDaFrom.Value) &&
                    (!dataDaTo.HasValue || ct.DataDa <= dataDaTo.Value));

            var totalCount = await baseQuery.CountAsync();

            var costiRaw = await baseQuery
                .Select(ct => new { ct.CostoChilometri, ct.Chilometri, ct.CostoTelepass, ct.CostoHotel, ct.CostoTreno })
                .ToListAsync();

            var totaleCostoTotale = costiRaw.Sum(ct =>
                (ct.CostoChilometri ?? 0) * (ct.Chilometri ?? 0) +
                (ct.CostoTelepass ?? 0) +
                (ct.CostoHotel ?? 0) +
                (ct.CostoTreno ?? 0));

            var items = await baseQuery
                .Include(ct => ct.Utente)
                .Include(ct => ct.Cliente)
                .OrderByDescending(ct => ct.DataCreazione)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var commessaIds = items.Select(ct => ct.CommessaId).Distinct().ToList();
            var commesseDict = await dbContext.Commessa
                .AsNoTracking()
                .Where(c => commessaIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => new { c.Descrizione, c.CommessaCodiceInterno });

            var dtos = items.Select(ct =>
            {
                commesseDict.TryGetValue(ct.CommessaId, out var commessa);
                return new CostoTrasfertaPagedItemDto
                {
                    Id = ct.Id,
                    ClienteId = ct.ClienteId,
                    ClienteRagioneSociale = ct.Cliente?.RagioneSociale,
                    CommessaId = ct.CommessaId,
                    CommessaDescrizione = commessa?.Descrizione,
                    CommessaCodiceInterno = commessa?.CommessaCodiceInterno,
                    UtenteId = ct.UtenteId,
                    UtenteNominativo = ct.Utente?.Nominativo,
                    LocalitaPartenza = ct.LocalitaPartenza,
                    LocalitaArrivo = ct.LocalitaArrivo,
                    Chilometri = ct.Chilometri,
                    CostoChilometri = ct.CostoChilometri,
                    CostoTelepass = ct.CostoTelepass,
                    CostoHotel = ct.CostoHotel,
                    CostoTreno = ct.CostoTreno,
                    DataDa = ct.DataDa,
                    DataA = ct.DataA,
                    DataCreazione = ct.DataCreazione,
                };
            }).ToList();

            return Ok(new CostoTrasfertaPagedResponseDto
            {
                TotalCount = totalCount,
                Items = dtos,
                TotaleCostoTotale = totaleCostoTotale,
            });
        }
    }
}
