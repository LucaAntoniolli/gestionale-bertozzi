using log4net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Authorization;
using NemesiLIB.Context;
using NemesiLIB.Model;
using NemesiLIB.Model.GestioneCommesse;
using NemesiLIB.Model.Notifiche;
using NemesiLIB.Services.Notifiche;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Security.Claims;
using System.Threading.Tasks;

namespace NemesiAPI.Controllers.GestioneCommesse
{
    [ApiController]
    [Route("api/todos")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ToDoController : ControllerBase
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod()?.DeclaringType);

        private readonly GestionaleBertozziContext dbContext;
        private readonly UserManager<Utente> userManager;
        private readonly INotificaService notificaService;

        public ToDoController(GestionaleBertozziContext db, UserManager<Utente> userManager, INotificaService notificaService)
        {
            dbContext = db;
            this.userManager = userManager;
            this.notificaService = notificaService;
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

            // Valida che la commessa esista, recuperandone il codice per il testo della notifica
            var codiceCommessa = await dbContext.Commessa.AsNoTracking()
                .Where(c => c.Id == model.CommessaId)
                .Select(c => c.CommessaCodiceInterno)
                .FirstOrDefaultAsync();

            if (codiceCommessa == null)
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

            // Alla creazione entrambi gli assegnatari sono nuovi.
            await NotificaAssegnazioneAsync(
                model,
                new[] { model.AssegnatarioPrimarioId, model.AssegnatarioSecondarioId },
                codiceCommessa);

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

            // Va letto prima di sovrascrivere i campi: serve a capire quali assegnatari
            // sono nuovi e quindi vanno notificati.
            var assegnatariPrecedenti = new[] { existing.AssegnatarioPrimarioId, existing.AssegnatarioSecondarioId }
                .Where(x => !string.IsNullOrEmpty(x))
                .Select(x => x!)
                .ToHashSet();

            // Valida che la commessa esista, recuperandone il codice per il testo della notifica
            var codiceCommessa = await dbContext.Commessa.AsNoTracking()
                .Where(c => c.Id == model.CommessaId)
                .Select(c => c.CommessaCodiceInterno)
                .FirstOrDefaultAsync();

            if (codiceCommessa == null)
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

            // Si notifica solo chi non era già assegnato: una modifica alla descrizione o
            // alla data non deve rinotificare chi il ToDo ce l'aveva già.
            var nuoviAssegnatari = new[] { existing.AssegnatarioPrimarioId, existing.AssegnatarioSecondarioId }
                .Where(x => !string.IsNullOrEmpty(x) && !assegnatariPrecedenti.Contains(x!))
                .ToArray();

            await NotificaAssegnazioneAsync(existing, nuoviAssegnatari, codiceCommessa);

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

        /// <summary>
        /// Notifica agli assegnatari indicati che il ToDo è stato loro assegnato.
        /// Chi compie l'azione non riceve notifica, anche quando assegna a se stesso.
        /// </summary>
        private async Task NotificaAssegnazioneAsync(ToDo todo, IEnumerable<string?> destinatari, string? codiceCommessa)
        {
            var utenteCorrenteId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var idDestinatari = destinatari
                .Where(x => !string.IsNullOrEmpty(x))
                .Select(x => x!)
                .Distinct()
                .Where(x => x != utenteCorrenteId)
                .ToList();

            if (idDestinatari.Count == 0)
                return;

            var nominativoOrigine = await dbContext.Users.AsNoTracking()
                .Where(u => u.Id == utenteCorrenteId)
                .Select(u => u.Nominativo)
                .FirstOrDefaultAsync();

            var link = todo.TipoPlanning == TipoPlanning.Amministrativo
                ? "/gestione-commesse/planning-amministrativo"
                : "/gestione-commesse/planning";

            var descrizione = ComponiDescrizione(todo, codiceCommessa);

            var notifiche = idDestinatari.Select(destinatarioId => new NuovaNotifica
            {
                UtenteId = destinatarioId,
                Titolo = "Nuova ToDo assegnata",
                Descrizione = descrizione,
                Link = link,
                Tipo = TipoNotifica.Info,
                Categoria = CategoriaNotifica.ToDo,
                UtenteOrigine = nominativoOrigine,
                // Nessuna ChiaveDeduplica: l'assegnazione è un evento discreto, non una
                // condizione ricorrente. Con la chiave, un ToDo tolto e poi riassegnato
                // alla stessa persona non genererebbe la seconda notifica.
            }).ToList();

            try
            {
                await notificaService.CreaMoltepliciAsync(notifiche);
            }
            catch (Exception ex)
            {
                // Il ToDo è già stato salvato: un problema sulle notifiche non deve
                // trasformare un'operazione riuscita in un errore per il chiamante.
                log.Error($"Notifica di assegnazione non inviata per il ToDo {todo.Id}", ex);
            }
        }

        private static string ComponiDescrizione(ToDo todo, string? codiceCommessa)
        {
            const int LunghezzaMassima = 1000;

            var parti = new List<string>();

            if (!string.IsNullOrWhiteSpace(codiceCommessa))
                parti.Add($"Commessa {codiceCommessa}");

            if (!string.IsNullOrWhiteSpace(todo.DescrizioneTodo))
                parti.Add(todo.DescrizioneTodo);

            if (todo.DataConsegna.HasValue)
                parti.Add($"Consegna prevista: {todo.DataConsegna.Value:dd/MM/yyyy}");

            var descrizione = string.Join(" · ", parti);

            // La colonna è nvarchar(1000): una descrizione lunga farebbe fallire il salvataggio.
            return descrizione.Length > LunghezzaMassima
                ? descrizione.Substring(0, LunghezzaMassima - 1) + "…"
                : descrizione;
        }
    }
}
