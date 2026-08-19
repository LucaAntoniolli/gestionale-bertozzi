using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Authorization;
using NemesiAPI.Model;
using NemesiLIB.Context;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace NemesiAPI.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class DashboardController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbContext;
        private readonly IConfiguration configuration;

        public DashboardController(GestionaleBertozziContext db, IConfiguration config)
        {
            dbContext = db;
            configuration = config;
        }

        // GET api/dashboard/commesse-summary
        [HttpGet("commesse-summary")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "dashboard.read")]
        public async Task<ActionResult<CommesseSummaryDto>> GetCommesseSummary()
        {
            var idChiusa = configuration.GetValue<int>("ApplicationParameters:IdStatusCommessaChiusa");

            var aperte = await dbContext.Commessa.AsNoTracking()
                .CountAsync(c => c.StatusCommessaId != idChiusa);

            var chiuse = await dbContext.Commessa.AsNoTracking()
                .CountAsync(c => c.StatusCommessaId == idChiusa);

            return Ok(new CommesseSummaryDto
            {
                TotaleAperte = aperte,
                TotaleChiuse = chiuse
            });
        }

        // GET api/dashboard/ore-summary
        [HttpGet("ore-summary")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "dashboard.read")]
        public async Task<ActionResult<OreSummaryDto>> GetOreSummary()
        {
            var idChiusa = configuration.GetValue<int>("ApplicationParameters:IdStatusCommessaChiusa");

            var totaleOreAperte = await dbContext.Commessa
                .AsNoTracking()
                .Where(c => c.StatusCommessaId != idChiusa)
                .SelectMany(c => c.OreSpese!)
                .SumAsync(o => o.Ore ?? 0);

            var totaleOreChiuse = await dbContext.Commessa
                .AsNoTracking()
                .Where(c => c.StatusCommessaId == idChiusa)
                .SelectMany(c => c.OreSpese!)
                .SumAsync(o => o.Ore ?? 0);

            // Media dei totali aggregati per commessa chiusa
            var totaliPerCommessa = await dbContext.Commessa
                .AsNoTracking()
                .Where(c => c.StatusCommessaId == idChiusa)
                .Select(c => new
                {
                    TotaleOre = c.OreSpese!.Sum(o => o.Ore ?? 0),
                    TotaleChilometri = c.OreSpese!.Sum(o => o.Chilometri ?? 0),
                    TotaleSpese = c.OreSpese!.Sum(o => o.Spese ?? 0)
                })
                .ToListAsync();

            return Ok(new OreSummaryDto
            {
                TotaleOreCommesseAperte = totaleOreAperte,
                TotaleOreCommesseChiuse = totaleOreChiuse,
                MediaOreCommesseChiuse = totaliPerCommessa.Count > 0
                    ? totaliPerCommessa.Average(x => x.TotaleOre) : 0m,
                MediaChilometriCommesseChiuse = totaliPerCommessa.Count > 0
                    ? totaliPerCommessa.Average(x => x.TotaleChilometri) : 0m,
                MediaSpeseCommesseChiuse = totaliPerCommessa.Count > 0
                    ? totaliPerCommessa.Average(x => x.TotaleSpese) : 0m
            });
        }

        // GET api/dashboard/ore-per-giorno?giorni=30&commessaId=5&utenteId=abc
        // Accessibile anche a chi ha solo 'orespesecommessa.read' (es. Utente Base),
        // che però può vedere esclusivamente le proprie ore.
        [HttpGet("ore-per-giorno")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "dashboard.read, orespesecommessa.read")]
        public async Task<ActionResult<IEnumerable<OrePerGiornoItemDto>>> GetOrePerGiorno(
            [FromQuery] int giorni = 30,
            [FromQuery] int? commessaId = null,
            [FromQuery] string? utenteId = null)
        {
            if (giorni <= 0 || giorni > 365)
                return BadRequest("Il parametro 'giorni' deve essere compreso tra 1 e 365.");

            // Chi non ha il permesso sulla dashboard può vedere solo i propri dati
            if (!HasPermission("dashboard.read"))
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                    return Forbid();

                utenteId = currentUserId;
            }

            var dataFine = DateTime.Today;
            var dataInizio = dataFine.AddDays(-(giorni - 1));

            var query = dbContext.OreSpeseCommessa
                .AsNoTracking()
                .Where(o => o.Data >= dataInizio && o.Data < dataFine.AddDays(1));

            if (commessaId.HasValue)
                query = query.Where(o => o.CommessaId == commessaId.Value);

            if (!string.IsNullOrEmpty(utenteId))
                query = query.Where(o => o.UtenteId == utenteId);

            // Proiezione lato DB, raggruppamento lato memoria per evitare
            // problemi di traduzione di DateTime.Date su alcuni provider
            var rawData = await query
                .Select(o => new { Data = o.Data.Date, Ore = o.Ore ?? 0 })
                .ToListAsync();

            var orePerGiorno = rawData
                .GroupBy(o => DateOnly.FromDateTime(o.Data))
                .ToDictionary(g => g.Key, g => g.Sum(o => o.Ore));

            // Serie completa: tutti i giorni del periodo, compresi quelli senza
            // caricamenti (sabati, domeniche e festivi inclusi)
            var result = new List<OrePerGiornoItemDto>(giorni);
            var ultimoGiorno = DateOnly.FromDateTime(dataFine);
            for (var giorno = DateOnly.FromDateTime(dataInizio); giorno <= ultimoGiorno; giorno = giorno.AddDays(1))
            {
                result.Add(new OrePerGiornoItemDto
                {
                    Data = giorno,
                    TotaleOre = orePerGiorno.TryGetValue(giorno, out var ore) ? ore : 0m
                });
            }

            return Ok(result);
        }

        // GET api/dashboard/ore-per-utente/5
        [HttpGet("ore-per-utente/{commessaId:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "dashboard.read")]
        public async Task<ActionResult<IEnumerable<OrePerUtenteItemDto>>> GetOrePerUtente(int commessaId)
        {
            if (!await dbContext.Commessa.AsNoTracking().AnyAsync(c => c.Id == commessaId))
                return NotFound("Commessa non trovata.");

            var result = await dbContext.OreSpeseCommessa
                .AsNoTracking()
                .Where(o => o.CommessaId == commessaId)
                .GroupBy(o => new { o.UtenteId, o.Utente!.Nominativo })
                .Select(g => new OrePerUtenteItemDto
                {
                    UtenteId = g.Key.UtenteId,
                    Nominativo = g.Key.Nominativo,
                    TotaleOre = g.Sum(o => o.Ore ?? 0),
                    TotaleSpese = g.Sum(o => o.Spese ?? 0),
                    TotaleChilometri = g.Sum(o => o.Chilometri ?? 0)
                })
                .OrderByDescending(x => x.TotaleOre)
                .ToListAsync();

            return Ok(result);
        }

        private bool HasPermission(string permission)
        {
            return User.Claims.Any(c =>
                string.Equals(c.Type, "permission", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(c.Value, permission, StringComparison.OrdinalIgnoreCase));
        }
    }
}