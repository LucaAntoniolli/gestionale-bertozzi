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
            [FromQuery] bool? completato = null)
        {
            IQueryable<ToDo> q = dbContext.ToDo.AsNoTracking();

            // Ottengo l'utente corrente e applica il filtro per "Utente Base"
            var currentUserEmail = User?.Identity?.Name;
            var currentUser = await userManager.FindByEmailAsync(currentUserEmail);

            if (currentUser != null)
            {
                var roles = await userManager.GetRolesAsync(currentUser);

                // Se l'utente ha il ruolo "Utente Base", mostra solo i ToDo assegnati a lui o creati da lui
                if (roles.Contains("Utente Base"))
                {
                    q = q.Where(t => 
                        t.AssegnatarioPrimarioId == currentUser.Id || 
                        t.AssegnatarioSecondarioId == currentUser.Id ||
                        t.UtenteCreazione == currentUserEmail);
                }
            }

            if (commessaId.HasValue)
            {
                q = q.Where(t => t.CommessaId == commessaId.Value);
            }

            if (!string.IsNullOrEmpty(assegnatarioPrimarioId))
            {
                q = q.Where(t => t.AssegnatarioPrimarioId == assegnatarioPrimarioId);
            }

            if (!string.IsNullOrEmpty(assegnatarioSecondarioId))
            {
                q = q.Where(t => t.AssegnatarioSecondarioId == assegnatarioSecondarioId);
            }

            if (completato.HasValue)
            {
                q = q.Where(t => t.Completato == completato.Value);
            }

            var list = await q
                .Include(t => t.AssegnatarioPrimario)
                .Include(t => t.AssegnatarioSecondario)
                .OrderBy(t => t.DataCreazione)
                .ToListAsync();

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
            existing.Completato = model.Completato;
            existing.Priorita = model.Priorita;

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
            var item = await dbContext.ToDo.FindAsync(id);
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
            var item = await dbContext.ToDo.FindAsync(id);
            if (item == null)
                return NotFound();

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
            var item = await dbContext.ToDo.FindAsync(id);
            if (item == null)
                return NotFound();

            item.Completato = false;

            await dbContext.SaveChangesAsync();

            return NoContent();
        }
    }
}
