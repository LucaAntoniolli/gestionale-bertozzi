using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Authorization;
using NemesiAPI.Model;
using NemesiLIB.Context;
using NemesiLIB.Model.GestioneCommesse;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NemesiAPI.Controllers.GestioneCommesse
{
    [ApiController]
    [Route("api/ore-spese-commessa")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class OreSpeseCommessaController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbContext;

        public OreSpeseCommessaController(GestionaleBertozziContext db)
        {
            dbContext = db;
        }

        [HttpGet]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "orespesecommessa.read")]
        public async Task<ActionResult<IEnumerable<OreSpeseCommessa>>> GetAll(
            [FromQuery] int? commessaId = null,
            [FromQuery] int? pianoSviluppoId = null,
            [FromQuery] string? utenteId = null)
        {
            IQueryable<OreSpeseCommessa> q = dbContext.OreSpeseCommessa.AsNoTracking();

            if (commessaId.HasValue)
            {
                q = q.Where(o => o.CommessaId == commessaId.Value);
            }

            if (pianoSviluppoId.HasValue)
            {
                q = q.Where(o => o.PianoSviluppoId == pianoSviluppoId.Value);
            }

            if (!string.IsNullOrEmpty(utenteId))
            {
                q = q.Where(o => o.UtenteId == utenteId);
            }

            var list = await q
                .Include(o => o.PianoSviluppo)
                .Include(o => o.Utente)
                .OrderByDescending(o => o.Data)
                .ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "orespesecommessa.read")]
        public async Task<ActionResult<OreSpeseCommessa>> Get(int id, [FromQuery] string? utenteId = null)
        {
            IQueryable<OreSpeseCommessa> q = dbContext.OreSpeseCommessa.AsNoTracking();

            if (!string.IsNullOrEmpty(utenteId))
            {
                q = q.Where(o => o.UtenteId == utenteId);
            }

            var item = await q
                .Include(o => o.PianoSviluppo)
                .Include(o => o.Utente)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        [HttpPost]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "orespesecommessa.create")]
        public async Task<ActionResult<OreSpeseCommessa>> Create([FromBody] OreSpeseCommessa model)
        {
            if (model == null)
                return BadRequest();

            // Valida che la commessa esista
            if (!await dbContext.Commessa.AnyAsync(c => c.Id == model.CommessaId))
                return BadRequest("Commessa non trovata");

            // Valida che il piano di sviluppo esista
            if (!await dbContext.PianoSviluppo.AnyAsync(p => p.Id == model.PianoSviluppoId))
                return BadRequest("Piano di sviluppo non trovato");

            // Valida che l'utente esista
            if (!await dbContext.Users.AnyAsync(u => u.Id == model.UtenteId))
                return BadRequest("Utente non trovato");

            // Valida che il piano di sviluppo appartenga alla commessa
            var pianoSviluppo = await dbContext.PianoSviluppo.FirstOrDefaultAsync(p => p.Id == model.PianoSviluppoId);
            if (pianoSviluppo != null && pianoSviluppo.CommessaId != model.CommessaId)
                return BadRequest("Il piano di sviluppo non appartiene alla commessa specificata");

            // Valida che le ore totali per utente/giorno non superino 12
            if (model.Ore.HasValue && model.Ore.Value > 0)
            {
                var dataInizio = model.Data.Date;
                var dataFine = dataInizio.AddDays(1);
                var orePrecedenti = await dbContext.OreSpeseCommessa
                    .AsNoTracking()
                    .Where(o => o.UtenteId == model.UtenteId && o.Data >= dataInizio && o.Data < dataFine)
                    .SumAsync(o => o.Ore ?? 0);

                if (orePrecedenti + model.Ore.Value > 12)
                    return BadRequest($"Il totale delle ore per questa giornata supererebbe le 12 ore (già caricate: {orePrecedenti} h).");
            }

            dbContext.OreSpeseCommessa.Add(model);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "orespesecommessa.update")]
        public async Task<IActionResult> Update(int id, [FromBody] OreSpeseCommessa model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var existing = await dbContext.OreSpeseCommessa.FirstOrDefaultAsync(o => o.Id == id);
            if (existing == null)
                return NotFound();

            // Valida che la commessa esista
            if (!await dbContext.Commessa.AnyAsync(c => c.Id == model.CommessaId))
                return BadRequest("Commessa non trovata");

            // Valida che il piano di sviluppo esista
            if (!await dbContext.PianoSviluppo.AnyAsync(p => p.Id == model.PianoSviluppoId))
                return BadRequest("Piano di sviluppo non trovato");

            // Valida che l'utente esista
            if (!await dbContext.Users.AnyAsync(u => u.Id == model.UtenteId))
                return BadRequest("Utente non trovato");

            // Valida che il piano di sviluppo appartenga alla commessa
            var pianoSviluppo = await dbContext.PianoSviluppo.FirstOrDefaultAsync(p => p.Id == model.PianoSviluppoId);
            if (pianoSviluppo != null && pianoSviluppo.CommessaId != model.CommessaId)
                return BadRequest("Il piano di sviluppo non appartiene alla commessa specificata");

            // Valida che le ore totali per utente/giorno non superino 12 (escludendo la riga corrente)
            if (model.Ore.HasValue && model.Ore.Value > 0)
            {
                var dataInizio = model.Data.Date;
                var dataFine = dataInizio.AddDays(1);
                var orePrecedenti = await dbContext.OreSpeseCommessa
                    .AsNoTracking()
                    .Where(o => o.UtenteId == model.UtenteId && o.Data >= dataInizio && o.Data < dataFine && o.Id != id)
                    .SumAsync(o => o.Ore ?? 0);

                if (orePrecedenti + model.Ore.Value > 12)
                    return BadRequest($"Il totale delle ore per questa giornata supererebbe le 12 ore (già caricate: {orePrecedenti} h).");
            }

            // Aggiorna i campi
            existing.CommessaId = model.CommessaId;
            existing.PianoSviluppoId = model.PianoSviluppoId;
            existing.UtenteId = model.UtenteId;
            existing.Data = model.Data;
            existing.Ore = model.Ore;
            existing.Spese = model.Spese;
            existing.Chilometri = model.Chilometri;
            existing.Note = model.Note;

            try
            {
                await dbContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await dbContext.OreSpeseCommessa.AnyAsync(o => o.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "orespesecommessa.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbContext.OreSpeseCommessa.FindAsync(id);
            if (item == null)
                return NotFound();

            dbContext.OreSpeseCommessa.Remove(item);
            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("paged")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "orespesecommessa.read")]
        public async Task<ActionResult<OreSpesePagedResponseDto>> GetPaged(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] int? commessaId = null,
            [FromQuery] string? utenteId = null,
            [FromQuery] DateTime? dataFrom = null,
            [FromQuery] DateTime? dataTo = null)
        {
            var baseQuery = dbContext.OreSpeseCommessa
                .AsNoTracking()
                .Where(o =>
                    (!commessaId.HasValue || o.CommessaId == commessaId.Value) &&
                    (string.IsNullOrEmpty(utenteId) || o.UtenteId == utenteId) &&
                    (!dataFrom.HasValue || o.Data >= dataFrom.Value) &&
                    (!dataTo.HasValue || o.Data <= dataTo.Value));

            var totalCount = await baseQuery.CountAsync();

            var totali = await baseQuery
                .Select(o => new { o.Ore, o.Spese, o.Chilometri })
                .ToListAsync();

            var items = await baseQuery
                .Include(o => o.Utente)
                .Include(o => o.PianoSviluppo)
                .OrderByDescending(o => o.Data)
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
                return new OreSpesePagedItemDto
                {
                    Id = o.Id,
                    CommessaId = o.CommessaId,
                    CommessaDescrizione = commessa?.Descrizione,
                    CommessaCodiceInterno = commessa?.CommessaCodiceInterno,
                    PianoSviluppoId = o.PianoSviluppoId,
                    PianoSviluppoDescrizione = o.PianoSviluppo?.Descrizione,
                    UtenteId = o.UtenteId,
                    UtenteNominativo = o.Utente?.Nominativo,
                    Data = o.Data,
                    Ore = o.Ore,
                    Spese = o.Spese,
                    Chilometri = o.Chilometri,
                    Note = o.Note,
                    DataCreazione = o.DataCreazione,
                };
            }).ToList();

            return Ok(new OreSpesePagedResponseDto
            {
                TotalCount = totalCount,
                Items = dtos,
                TotaleOre = totali.Sum(o => o.Ore ?? 0),
                TotaleSpese = totali.Sum(o => o.Spese ?? 0),
                TotaleChilometri = totali.Sum(o => o.Chilometri ?? 0),
            });
        }
    }
}
