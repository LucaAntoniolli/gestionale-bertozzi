using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Authorization;
using NemesiLIB.Context;
using NemesiLIB.Model;
using NemesiLIB.Model.GestioneCommesse;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NemesiAPI.Controllers.GestioneCommesse
{
    [ApiController]
    [Route("api/todos")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ToDoController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbContext;
        private readonly UserManager<Utente> userManager;

        public ToDoController(GestionaleBertozziContext db, UserManager<Utente> userManager)
        {
            dbContext = db;
            this.userManager = userManager;
        }

        [HttpGet]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "todo.read")]
        public async Task<ActionResult<IEnumerable<ToDo>>> GetAll(
            [FromQuery] int? commessaId = null,
            [FromQuery] string? assegnatarioPrimarioId = null,
            [FromQuery] string? assegnatarioSecondarioId = null,
            [FromQuery] bool? completato = null,
            [FromQuery] bool soloCompletati = false,
            [FromQuery] bool soloScadute = false,
            [FromQuery] TipoPlanning tipoPlanning = TipoPlanning.Edile)
        {
            IQueryable<ToDo> q = dbContext.ToDo
                .AsNoTracking()
                .Where(t => t.TipoPlanning == tipoPlanning);

            var currentUserEmail = User?.Identity?.Name;
            var currentUser = await userManager.FindByEmailAsync(currentUserEmail);

            if (currentUser != null)
            {
                var roles = await userManager.GetRolesAsync(currentUser);

                if (roles.Contains("Utente Base"))
                {
                    q = q.Where(t =>
                        t.AssegnatarioPrimarioId == currentUser.Id ||
                        t.AssegnatarioSecondarioId == currentUser.Id ||
                        t.UtenteCreazione == currentUserEmail);
                }
            }

            if (commessaId.HasValue)
                q = q.Where(t => t.CommessaId == commessaId.Value);

            if (!string.IsNullOrEmpty(assegnatarioPrimarioId))
                q = q.Where(t => t.AssegnatarioPrimarioId == assegnatarioPrimarioId);

            if (!string.IsNullOrEmpty(assegnatarioSecondarioId))
                q = q.Where(t => t.AssegnatarioSecondarioId == assegnatarioSecondarioId);

            // Se soloScadute è true: restituisce esclusivamente i ToDo non completati la cui
            // data di consegna è già passata.
            // Se soloCompletati è true: restituisce esclusivamente i ToDo completati.
            // Altrimenti, se completato è null o false: restituisce i non completati + i completati
            // creati negli ultimi 7 giorni.
            // Se completato è true: restituisce tutto senza filtri aggiuntivi.
            if (soloScadute)
            {
                var oggi = DateTime.Today;
                q = q.Where(t => !t.Completato && t.DataConsegna != null && t.DataConsegna < oggi);
            }
            else if (soloCompletati)
            {
                q = q.Where(t => t.Completato);
            }
            else if (!completato.HasValue || !completato.Value)
            {
                var cutoff = DateTime.Today.AddDays(-7);
                q = q.Where(t => !t.Completato || t.DataCreazione >= cutoff);
            }

            q = q
                .Include(t => t.AssegnatarioPrimario)
                .Include(t => t.AssegnatarioSecondario);

            // Nella vista delle scadute le attività più in ritardo vengono mostrate per prime
            var list = soloScadute
                ? await q.OrderBy(t => t.DataConsegna).ToListAsync()
                : await q.OrderBy(t => t.DataCreazione).ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "todo.read")]
        public async Task<ActionResult<ToDo>> Get(int id)
        {
            var item = await dbContext.ToDo
                .AsNoTracking()
                .Include(t => t.AssegnatarioPrimario)
                .Include(t => t.AssegnatarioSecondario)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (item == null)
                return NotFound();

            return Ok(item);
        }

        [HttpPost]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "todo.create")]
        public async Task<ActionResult<ToDo>> Create([FromBody] ToDo model)
        {
            if (model == null)
                return BadRequest();

            // Valida che la commessa esista
            if (!await dbContext.Commessa.AnyAsync(c => c.Id == model.CommessaId))
                return BadRequest("Commessa non trovata");

            // Valida che l'assegnatario primario esista
            if (!await dbContext.Users.AnyAsync(u => u.Id == model.AssegnatarioPrimarioId))
                return BadRequest("Assegnatario primario non trovato");

            // Valida l'assegnatario secondario se specificato
            if (!string.IsNullOrEmpty(model.AssegnatarioSecondarioId))
            {
                if (!await dbContext.Users.AnyAsync(u => u.Id == model.AssegnatarioSecondarioId))
                    return BadRequest("Assegnatario secondario non trovato");
            }

            // La data di completamento è gestita dal server: valorizzata solo se il ToDo nasce già completato
            model.DataCompletamento = model.Completato ? DateTime.Today : null;

            dbContext.ToDo.Add(model);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "todo.update")]
        public async Task<IActionResult> Update(int id, [FromBody] ToDo model)
        {
            if (model == null || id != model.Id)
                return BadRequest();

            var existing = await dbContext.ToDo.FirstOrDefaultAsync(t => t.Id == id);
            if (existing == null)
                return NotFound();

            // Valida che la commessa esista
            if (!await dbContext.Commessa.AnyAsync(c => c.Id == model.CommessaId))
                return BadRequest("Commessa non trovata");

            // Valida che l'assegnatario primario esista
            if (!await dbContext.Users.AnyAsync(u => u.Id == model.AssegnatarioPrimarioId))
                return BadRequest("Assegnatario primario non trovato");

            // Valida l'assegnatario secondario se specificato
            if (!string.IsNullOrEmpty(model.AssegnatarioSecondarioId))
            {
                if (!await dbContext.Users.AnyAsync(u => u.Id == model.AssegnatarioSecondarioId))
                    return BadRequest("Assegnatario secondario non trovato");
            }

            // Aggiorna i campi
            existing.AssegnatarioPrimarioId = model.AssegnatarioPrimarioId;
            existing.AssegnatarioSecondarioId = model.AssegnatarioSecondarioId;
            existing.CommessaId = model.CommessaId;
            existing.DescrizioneTodo = model.DescrizioneTodo;
            existing.DataConsegna = model.DataConsegna;
            existing.DescrizioneAttivitaSvolta = model.DescrizioneAttivitaSvolta;
            existing.Priorita = model.Priorita;

            // Valorizza la data di completamento nel momento in cui il ToDo viene completato
            // e la azzera se il ToDo viene riaperto
            if (model.Completato && !existing.Completato)
                existing.DataCompletamento = DateTime.Today;
            else if (!model.Completato)
                existing.DataCompletamento = null;

            existing.Completato = model.Completato;

            try
            {
                await dbContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await dbContext.ToDo.AnyAsync(t => t.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "todo.delete")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbContext.ToDo.FirstOrDefaultAsync(t => t.Id == id);
            if (item == null)
                return NotFound();

            dbContext.ToDo.Remove(item);
            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpPatch("{id:int}/complete")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "todo.update")]
        public async Task<IActionResult> MarkAsComplete(int id, [FromBody] string? descrizioneAttivitaSvolta = null)
        {
            var item = await dbContext.ToDo.FirstOrDefaultAsync(t => t.Id == id);
            if (item == null)
                return NotFound();

            if (!item.Completato)
                item.DataCompletamento = DateTime.Today;

            item.Completato = true;
            if (!string.IsNullOrEmpty(descrizioneAttivitaSvolta))
            {
                item.DescrizioneAttivitaSvolta = descrizioneAttivitaSvolta;
            }

            await dbContext.SaveChangesAsync();

            return NoContent();
        }

        [HttpPatch("{id:int}/reopen")]
        [Authorize(Policy = PermissionPolicyProvider.POLICY_PREFIX + "todo.update")]
        public async Task<IActionResult> MarkAsIncomplete(int id)
        {
            var item = await dbContext.ToDo.FirstOrDefaultAsync(t => t.Id == id);
            if (item == null)
                return NotFound();

            item.Completato = false;
            item.DataCompletamento = null;

            await dbContext.SaveChangesAsync();

            return NoContent();
        }
    }
}
