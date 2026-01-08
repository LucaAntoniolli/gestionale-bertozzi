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
    [Route("api/tipologia-commessa")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

    public class TipologiaCommessaController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbBertozzi;

        public TipologiaCommessaController(GestionaleBertozziContext db)
        {
            dbBertozzi = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TipologiaCommessa>>> GetAll()
        {
            var list = await dbBertozzi.TipologiaCommessa.AsNoTracking().ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TipologiaCommessa>> Get(int id)
        {
            var item = await dbBertozzi.TipologiaCommessa.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<ActionResult<TipologiaCommessa>> Create([FromBody] TipologiaCommessa model)
        {
            if (model == null) return BadRequest();
            dbBertozzi.TipologiaCommessa.Add(model);
            await dbBertozzi.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] TipologiaCommessa model)
        {
            if (model == null || id != model.Id) return BadRequest();
            if (!await dbBertozzi.TipologiaCommessa.AnyAsync(x => x.Id == id)) return NotFound();
            dbBertozzi.Entry(model).State = EntityState.Modified;
            await dbBertozzi.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbBertozzi.TipologiaCommessa.FindAsync(id);
            if (item == null) return NotFound();
            dbBertozzi.TipologiaCommessa.Remove(item);
            await dbBertozzi.SaveChangesAsync();
            return NoContent();
        }
    }
}
