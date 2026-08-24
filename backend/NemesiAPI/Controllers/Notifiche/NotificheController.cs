using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Model;
using NemesiLIB.Context;
using System.Security.Claims;

namespace NemesiAPI.Controllers.Notifiche
{
    /// <summary>
    /// Le notifiche sono personali: non esiste un permesso di ruolo che ne conceda la lettura.
    /// Ogni query è filtrata sull'utente ricavato dal token, mai su un id ricevuto dal client.
    /// </summary>
    [ApiController]
    [Route("api/notifiche")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class NotificheController : ControllerBase
    {
        private const int MaxNotificheRestituite = 50;

        private readonly GestionaleBertozziContext dbContext;

        public NotificheController(GestionaleBertozziContext db)
        {
            dbContext = db;
        }

        private string? UtenteCorrenteId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        /// <summary>Notifiche non lette e non scadute dell'utente corrente.</summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificaDto>>> GetNonLette()
        {
            var utenteId = UtenteCorrenteId;
            if (string.IsNullOrEmpty(utenteId))
                return Forbid();

            var adesso = DateTime.UtcNow;

            var items = await dbContext.Notifica.AsNoTracking()
                .Where(n => n.UtenteId == utenteId
                         && !n.IsLetta
                         && (n.DataScadenza == null || n.DataScadenza > adesso))
                .OrderByDescending(n => n.DataCreazione)
                .Take(MaxNotificheRestituite)
                .ToListAsync();

            return Ok(items.Select(NotificaDto.Map).ToList());
        }

        /// <summary>Solo il numero di non lette: è l'endpoint interrogato dal polling.</summary>
        [HttpGet("conteggio")]
        public async Task<ActionResult<ConteggioNotificheDto>> GetConteggio()
        {
            var utenteId = UtenteCorrenteId;
            if (string.IsNullOrEmpty(utenteId))
                return Forbid();

            var adesso = DateTime.UtcNow;

            var nonLette = await dbContext.Notifica.AsNoTracking()
                .CountAsync(n => n.UtenteId == utenteId
                              && !n.IsLetta
                              && (n.DataScadenza == null || n.DataScadenza > adesso));

            return Ok(new ConteggioNotificheDto { NonLette = nonLette });
        }

        /// <summary>
        /// Marca una notifica come letta. Per l'utente equivale a eliminarla dal pannello.
        /// </summary>
        [HttpPut("{id:int}/letta")]
        public async Task<IActionResult> SegnaLetta(int id)
        {
            var utenteId = UtenteCorrenteId;
            if (string.IsNullOrEmpty(utenteId))
                return Forbid();

            // Il filtro sull'utente è parte della ricerca, non un controllo successivo:
            // con il solo id si potrebbero chiudere le notifiche altrui.
            var notifica = await dbContext.Notifica
                .FirstOrDefaultAsync(n => n.Id == id && n.UtenteId == utenteId);

            if (notifica == null)
                return NotFound();

            if (!notifica.IsLetta)
            {
                notifica.IsLetta = true;
                notifica.DataLettura = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpPut("leggi-tutte")]
        public async Task<ActionResult<ConteggioNotificheDto>> SegnaTutteLette()
        {
            var utenteId = UtenteCorrenteId;
            if (string.IsNullOrEmpty(utenteId))
                return Forbid();

            var adesso = DateTime.UtcNow;

            await dbContext.Notifica
                .Where(n => n.UtenteId == utenteId && !n.IsLetta)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(n => n.IsLetta, true)
                    .SetProperty(n => n.DataLettura, adesso));

            return Ok(new ConteggioNotificheDto { NonLette = 0 });
        }
    }
}
