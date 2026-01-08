using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiLIB.Context;
using NemesiLIB.Model.Anagrafiche;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NemesiAPI.Controllers.Anagrafiche
{
    [ApiController]
    [Route("api/personale-cliente")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class PersonaleClienteController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbBertozzi;

        public PersonaleClienteController(GestionaleBertozziContext db)
        {
            dbBertozzi = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PersonaleCliente>>> GetAll([FromQuery] int? clienteId = null)
        {
            IQueryable<PersonaleCliente> q = dbBertozzi.PersonaleCliente.AsNoTracking();
            if (clienteId.HasValue)
                q = q.Where(p => p.ClienteId == clienteId.Value);
            var list = await q.ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<PersonaleCliente>> Get(int id)
        {
            var item = await dbBertozzi.PersonaleCliente.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<ActionResult<PersonaleCliente>> Create([FromBody] PersonaleCliente model)
        {
            if (model == null) return BadRequest();
            // ensure cliente exists
            if (!await dbBertozzi.Cliente.AnyAsync(c => c.Id == model.ClienteId)) return BadRequest("Cliente non trovato");
            dbBertozzi.PersonaleCliente.Add(model);
            await dbBertozzi.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] PersonaleCliente model)
        {
            if (model == null || id != model.Id) return BadRequest();
            if (!await dbBertozzi.PersonaleCliente.AnyAsync(x => x.Id == id)) return NotFound();
            dbBertozzi.Entry(model).State = EntityState.Modified;
            await dbBertozzi.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbBertozzi.PersonaleCliente.FindAsync(id);
            if (item == null) return NotFound();
            dbBertozzi.PersonaleCliente.Remove(item);
            await dbBertozzi.SaveChangesAsync();
            return NoContent();
        }
    }
}
