using System.Reflection;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NemesiAPI.Controllers.GestioneCommesse;
using NemesiAPI.Model;
using NemesiLIB.Context;
using NemesiLIB.Model;
using NemesiLIB.Model.GestioneCommesse;

namespace NemesiAPI.Tests;

public class PlanningAmministrativoControllerTests
{
    [Fact]
    public void Controller_RichiedeRuoloAmministratoreOBackoffice()
    {
        var authorize = typeof(PlanningAmministrativoController)
            .GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(authorize);
        Assert.Equal("Amministratore,Backoffice", authorize.Roles);
    }

    [Fact]
    public async Task GetAll_RestituisceSoloAttivitaAmministrative()
    {
        await using var fixture = await TestFixture.CreateAsync("admin@example.test");
        await fixture.AddTodoAsync(TipoPlanning.Edile, "Edile");
        var amministrativo = await fixture.AddTodoAsync(TipoPlanning.Amministrativo, "Amministrativo");

        var result = await fixture.Controller.GetAll(completato: true);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<ToDo>>(ok.Value).ToList();
        var item = Assert.Single(items);
        Assert.Equal(amministrativo.Id, item.Id);
    }

    [Fact]
    public async Task Create_ForzaTipoAmministrativoESenzaSecondario()
    {
        await using var fixture = await TestFixture.CreateAsync("admin@example.test");
        var dto = fixture.ValidDto();

        var result = await fixture.Controller.Create(dto);

        Assert.IsType<CreatedAtActionResult>(result.Result);
        var item = await fixture.Db.ToDo.SingleAsync();
        Assert.Equal(TipoPlanning.Amministrativo, item.TipoPlanning);
        Assert.Null(item.AssegnatarioSecondarioId);
        Assert.Equal("admin@example.test", item.UtenteCreazione);
        Assert.Equal(dto.DataConsegna, item.DataConsegna);
    }

    [Fact]
    public async Task Update_ConsenteLaModificaAUnUtenteAutorizzatoDiversoDalCreatore()
    {
        await using var fixture = await TestFixture.CreateAsync("creator@example.test");
        var item = await fixture.AddTodoAsync(TipoPlanning.Amministrativo, "Originale");
        fixture.SetCurrentUser("backoffice@example.test");
        var dto = fixture.ValidDto();
        dto.DescrizioneTodo = "Modificata";

        var result = await fixture.Controller.Update(item.Id, dto);

        Assert.IsType<NoContentResult>(result);
        await fixture.Db.Entry(item).ReloadAsync();
        Assert.Equal("Modificata", item.DescrizioneTodo);
        Assert.Equal("creator@example.test", item.UtenteCreazione);
        Assert.Equal("backoffice@example.test", item.UtenteModifica);
    }

    [Fact]
    public async Task Delete_RifiutaUtenteDiversoDalCreatore()
    {
        await using var fixture = await TestFixture.CreateAsync("creator@example.test");
        var item = await fixture.AddTodoAsync(TipoPlanning.Amministrativo, "Da conservare");
        fixture.SetCurrentUser("other@example.test");

        var result = await fixture.Controller.Delete(item.Id);

        Assert.IsType<ForbidResult>(result);
        Assert.True(await fixture.Db.ToDo.AnyAsync(t => t.Id == item.Id));
    }

    [Fact]
    public async Task Delete_ConsenteLaCancellazioneAlCreatore()
    {
        await using var fixture = await TestFixture.CreateAsync("creator@example.test");
        var item = await fixture.AddTodoAsync(TipoPlanning.Amministrativo, "Da eliminare");

        var result = await fixture.Controller.Delete(item.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.False(await fixture.Db.ToDo.AnyAsync(t => t.Id == item.Id));
    }

    [Fact]
    public async Task CompleteEReopen_AggiornanoLoStato()
    {
        await using var fixture = await TestFixture.CreateAsync("admin@example.test");
        var item = await fixture.AddTodoAsync(TipoPlanning.Amministrativo, "Attività");

        Assert.IsType<NoContentResult>(await fixture.Controller.MarkAsComplete(item.Id));
        await fixture.Db.Entry(item).ReloadAsync();
        Assert.True(item.Completato);

        Assert.IsType<NoContentResult>(await fixture.Controller.MarkAsIncomplete(item.Id));
        await fixture.Db.Entry(item).ReloadAsync();
        Assert.False(item.Completato);
    }

    private sealed class TestFixture : IAsyncDisposable
    {
        private readonly DefaultHttpContext httpContext;

        public GestionaleBertozziContext Db { get; }
        public PlanningAmministrativoController Controller { get; }

        private TestFixture(
            GestionaleBertozziContext db,
            DefaultHttpContext httpContext,
            PlanningAmministrativoController controller)
        {
            Db = db;
            this.httpContext = httpContext;
            Controller = controller;
        }

        public static async Task<TestFixture> CreateAsync(string currentUserEmail)
        {
            var httpContext = new DefaultHttpContext();
            var accessor = new FixedHttpContextAccessor { HttpContext = httpContext };
            var options = new DbContextOptionsBuilder<GestionaleBertozziContext>()
                .UseInMemoryDatabase($"planning-tests-{Guid.NewGuid()}")
                .Options;
            var db = new GestionaleBertozziContext(options, accessor);
            var controller = new PlanningAmministrativoController(db)
            {
                ControllerContext = new ControllerContext { HttpContext = httpContext }
            };
            var fixture = new TestFixture(db, httpContext, controller);
            fixture.SetCurrentUser(currentUserEmail);

            var user = new Utente("assignee@example.test", "Assegnatario")
            {
                Id = "assignee-id"
            };
            var commessa = new Commessa
            {
                Id = 100,
                ClienteId = 1,
                LuogoCommessa = "Test",
                ProgressivoCommessa = 1,
                PmEdileId = user.Id,
                PmAmministrativoId = user.Id,
                ReferentiCliente = "Test",
                TipologiaCommessaId = 1,
                Descrizione = "Commessa test",
                CommessaCodiceInterno = "TEST-001",
                StatusCommessaId = 1,
            };

            db.Users.Add(user);
            db.Commessa.Add(commessa);
            await db.SaveChangesAsync();
            return fixture;
        }

        public void SetCurrentUser(string email)
        {
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim(ClaimTypes.Name, email),
                    new Claim(ClaimTypes.NameIdentifier, email),
                    new Claim(ClaimTypes.Role, "Amministratore"),
                ],
                "TestAuthentication"));
        }

        public PlanningAmministrativoSaveDto ValidDto()
        {
            return new PlanningAmministrativoSaveDto
            {
                CommessaId = 100,
                DescrizioneTodo = "Attività amministrativa",
                AssegnatarioPrimarioId = "assignee-id",
                Priorita = 3,
                DataConsegna = new DateTime(2026, 7, 1),
                DescrizioneAttivitaSvolta = "Note",
                Completato = false,
            };
        }

        public async Task<ToDo> AddTodoAsync(TipoPlanning tipo, string descrizione)
        {
            var item = new ToDo
            {
                CommessaId = 100,
                DescrizioneTodo = descrizione,
                AssegnatarioPrimarioId = "assignee-id",
                Priorita = 2,
                DataConsegna = new DateTime(2026, 7, 1),
                TipoPlanning = tipo,
            };
            Db.ToDo.Add(item);
            await Db.SaveChangesAsync();
            return item;
        }

        public ValueTask DisposeAsync()
        {
            return Db.DisposeAsync();
        }

        private sealed class FixedHttpContextAccessor : IHttpContextAccessor
        {
            public HttpContext? HttpContext { get; set; }
        }
    }
}
