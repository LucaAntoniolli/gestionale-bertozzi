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
    [Route("api/modalita-pagamento")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class ModalitaPagamentoController : ControllerBase
    {
        private readonly GestionaleBertozziContext dbBertozzi;

        public ModalitaPagamentoController(GestionaleBertozziContext db)
        {
            dbBertozzi = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ModalitaPagamento>>> GetAll()
        {
            var list = await dbBertozzi.ModalitaPagamento.AsNoTracking().ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ModalitaPagamento>> Get(int id)
        {
            var item = await dbBertozzi.ModalitaPagamento.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<ActionResult<ModalitaPagamento>> Create([FromBody] ModalitaPagamento model)
        {
            if (model == null) return BadRequest();
            dbBertozzi.ModalitaPagamento.Add(model);
            await dbBertozzi.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = model.Id }, model);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] ModalitaPagamento model)
        {
            if (model == null || id != model.Id) return BadRequest();
            if (!await dbBertozzi.ModalitaPagamento.AnyAsync(x => x.Id == id)) return NotFound();
            dbBertozzi.Entry(model).State = EntityState.Modified;
            await dbBertozzi.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await dbBertozzi.ModalitaPagamento.FindAsync(id);
            if (item == null) return NotFound();
            dbBertozzi.ModalitaPagamento.Remove(item);
            await dbBertozzi.SaveChangesAsync();
            return NoContent();
        }
    }
}
