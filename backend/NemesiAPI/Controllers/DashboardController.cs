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
        [HttpGet("ore-per-giorno")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "dashboard.read")]
        public async Task<ActionResult<IEnumerable<OrePerGiornoItemDto>>> GetOrePerGiorno(
            [FromQuery] int giorni = 30,
            [FromQuery] int? commessaId = null,
            [FromQuery] string? utenteId = null)
        {
            if (giorni <= 0 || giorni > 365)
                return BadRequest("Il parametro 'giorni' deve essere compreso tra 1 e 365.");

            var cutoff = DateTime.Today.AddDays(-giorni);

            var query = dbContext.OreSpeseCommessa
                .AsNoTracking()
                .Where(o => o.Data >= cutoff);

            if (commessaId.HasValue)
                query = query.Where(o => o.CommessaId == commessaId.Value);

            if (!string.IsNullOrEmpty(utenteId))
                query = query.Where(o => o.UtenteId == utenteId);

            // Proiezione lato DB, raggruppamento lato memoria per evitare
            // problemi di traduzione di DateTime.Date su alcuni provider
            var rawData = await query
                .Select(o => new { Data = o.Data.Date, Ore = o.Ore ?? 0 })
                .ToListAsync();

            var result = rawData
                .GroupBy(o => o.Data)
                .Select(g => new OrePerGiornoItemDto
                {
                    Data = DateOnly.FromDateTime(g.Key),
                    TotaleOre = g.Sum(o => o.Ore)
                })
                .OrderBy(x => x.Data)
                .ToList();

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
    }
}