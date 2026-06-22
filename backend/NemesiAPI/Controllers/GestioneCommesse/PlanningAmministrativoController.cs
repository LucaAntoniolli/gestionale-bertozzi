using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Model;
using NemesiLIB.Context;
using NemesiLIB.Model.GestioneCommesse;

namespace NemesiAPI.Controllers.GestioneCommesse
{
    [ApiController]
    [Route("api/planning-amministrativo")]
    [Authorize(
        AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme,
        Roles = "Amministratore,Backoffice")]
    public class PlanningAmministrativoController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbContext;

        public PlanningAmministrativoController(GestionaleBertozziContext dbContext)
        {
            this.dbContext = dbContext;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ToDo>>> GetAll(
            [FromQuery] int? commessaId = null,
            [FromQuery] bool? completato = null)
        {
            IQueryable<ToDo> query = dbContext.ToDo
                .AsNoTracking()
                .Where(t => t.TipoPlanning == TipoPlanning.Amministrativo);

            if (commessaId.HasValue)
                query = query.Where(t => t.CommessaId == commessaId.Value);

            if (!completato.HasValue || !completato.Value)
            {
                var cutoff = DateTime.Today.AddDays(-7);
                query = query.Where(t => !t.Completato || t.DataCreazione >= cutoff);
            }

            var items = await query
                .Include(t => t.AssegnatarioPrimario)
                .OrderByDescending(t => t.DataCreazione)
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ToDo>> Get(int id)
        {
            var item = await dbContext.ToDo
                .AsNoTracking()
                .Include(t => t.AssegnatarioPrimario)
                .FirstOrDefaultAsync(t =>
                    t.Id == id && t.TipoPlanning == TipoPlanning.Amministrativo);

            return item == null ? NotFound() : Ok(item);
        }

        [HttpPost]
        public async Task<ActionResult<ToDo>> Create([FromBody] PlanningAmministrativoSaveDto model)
        {
            var validationResult = await ValidateReferences(model);
            if (validationResult != null)
                return validationResult;

            var item = new ToDo
            {
                CommessaId = model.CommessaId,
                DescrizioneTodo = model.DescrizioneTodo.Trim(),
                AssegnatarioPrimarioId = model.AssegnatarioPrimarioId,
                AssegnatarioSecondarioId = null,
                Priorita = model.Priorita,
                DataConsegna = model.DataConsegna,
                DescrizioneAttivitaSvolta = NormalizeOptionalText(model.DescrizioneAttivitaSvolta),
                Completato = model.Completato,
                TipoPlanning = TipoPlanning.Amministrativo
            };

            dbContext.ToDo.Add(item);
            await dbContext.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = item.Id }, item);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] PlanningAmministrativoSaveDto model)
        {
            var item = await dbContext.ToDo.FirstOrDefaultAsync(t =>
                t.Id == id && t.TipoPlanning == TipoPlanning.Amministrativo);

            if (item == null)
                return NotFound();

            var validationResult = await ValidateReferences(model);
            if (validationResult != null)
                return validationResult;

            item.CommessaId = model.CommessaId;
            item.DescrizioneTodo = model.DescrizioneTodo.Trim();
            item.AssegnatarioPrimarioId = model.AssegnatarioPrimarioId;
            item.AssegnatarioSecondarioId = null;
            item.Priorita = model.Priorita;
            item.DataConsegna = model.DataConsegna;
            item.DescrizioneAttivitaSvolta = NormalizeOptionalText(model.DescrizioneAttivitaSvolta);
            item.Completato = model.Completato;

            await dbContext.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("{id:int}/complete")]
        public async Task<IActionResult> MarkAsComplete(int id)
        {
            var item = await FindAdministrativeTodo(id);
            if (item == null)
                return NotFound();

            item.Completato = true;
            await dbContext.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("{id:int}/reopen")]
        public async Task<IActionResult> MarkAsIncomplete(int id)
        {
            var item = await FindAdministrativeTodo(id);
            if (item == null)
                return NotFound();

            item.Completato = false;
            await dbContext.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await FindAdministrativeTodo(id);
            if (item == null)
                return NotFound();

            var currentUserEmail = User.Identity?.Name;
            if (string.IsNullOrWhiteSpace(currentUserEmail) ||
                !string.Equals(item.UtenteCreazione, currentUserEmail, StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            dbContext.ToDo.Remove(item);
            await dbContext.SaveChangesAsync();
            return NoContent();
        }

        private async Task<ActionResult?> ValidateReferences(PlanningAmministrativoSaveDto model)
        {
            if (string.IsNullOrWhiteSpace(model.DescrizioneTodo))
                return BadRequest("La descrizione è obbligatoria");

            if (!await dbContext.Commessa.AnyAsync(c => c.Id == model.CommessaId))
                return BadRequest("Commessa non trovata");

            if (!await dbContext.Users.AnyAsync(u => u.Id == model.AssegnatarioPrimarioId))
                return BadRequest("Assegnatario non trovato");

            return null;
        }

        private static string? NormalizeOptionalText(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private Task<ToDo?> FindAdministrativeTodo(int id)
        {
            return dbContext.ToDo.FirstOrDefaultAsync(t =>
                t.Id == id && t.TipoPlanning == TipoPlanning.Amministrativo);
        }
    }
}
