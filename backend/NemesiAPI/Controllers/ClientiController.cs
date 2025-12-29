using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiLIB.Context;
using NemesiLIB.Model.Anagrafiche;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace NemesiAPI.Controllers
{
    [ApiController]
    [Route("api/clienti")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ClientiController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbBertozzi;

        public ClientiController(GestionaleBertozziContext db)
        {
            dbBertozzi = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cliente>>> GetAll([FromQuery] bool includePersonale = false)
        {
            IQueryable<Cliente> q = dbBertozzi.Cliente.AsNoTracking();
            if (includePersonale)
                q = q.Include(c => c.Personale);

            var list = await q.ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Cliente>> Get(int id, [FromQuery] bool includePersonale = false)
        {
            IQueryable<Cliente> q = dbBertozzi.Cliente.AsNoTracking();
            if (includePersonale)
                q = q.Include(c => c.Personale);

            var cliente = await q.FirstOrDefaultAsync(c => c.Id == id);
            if (cliente == null)
                return NotFound();

            return Ok(cliente);
        }

        [HttpPost]
        public async Task<ActionResult<Cliente>> Create([FromBody] Cliente cliente)
        {
            if (cliente == null)
                return BadRequest();

            dbBertozzi.Cliente.Add(cliente);
            await dbBertozzi.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = cliente.Id }, cliente);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Cliente cliente)
        {
            if (cliente == null || id != cliente.Id)
                return BadRequest();

            var exists = await dbBertozzi.Cliente.AnyAsync(c => c.Id == id);
            if (!exists)
                return NotFound();

            dbBertozzi.Entry(cliente).State = EntityState.Modified;

            try
            {
                await dbBertozzi.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await dbBertozzi.Cliente.AnyAsync(c => c.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var cliente = await dbBertozzi.Cliente.FindAsync(id);
            if (cliente == null)
                return NotFound();

            dbBertozzi.Cliente.Remove(cliente);
            await dbBertozzi.SaveChangesAsync();

            return NoContent();
        }
    }
}
