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
    [Route("api/status-commessa")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class StatusCommessaController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbBertozzi;

        public StatusCommessaController(GestionaleBertozziContext db)
        {
            dbBertozzi = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StatusCommessa>>> GetAll()
        {
            var list = await dbBertozzi.StatusCommessa.AsNoTracking().OrderBy(s => s.Ordine).ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<StatusCommessa>> Get(int id)
        {
            var item = await dbBertozzi.StatusCommessa.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<ActionResult<StatusCommessa>> Create([FromBody] StatusCommessa model)
        {
            if (model == null) return BadRequest();
            dbBertozzi.StatusCommessa.Add(model);
            await dbBertozzi.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] StatusCommessa model)
        {
            if (model == null || id != model.Id) return BadRequest();
            if (!await dbBertozzi.StatusCommessa.AnyAsync(x => x.Id == id)) return NotFound();
            dbBertozzi.Entry(model).State = EntityState.Modified;
            await dbBertozzi.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbBertozzi.StatusCommessa.FindAsync(id);
            if (item == null) return NotFound();
            dbBertozzi.StatusCommessa.Remove(item);
            await dbBertozzi.SaveChangesAsync();
            return NoContent();
        }
    }
}
