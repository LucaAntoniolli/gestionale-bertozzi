using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NemesiAPI.Controllers.GestioneCommesse;
using NemesiLIB.Context;
using NemesiLIB.Model;
using NemesiLIB.Model.GestioneCommesse;

namespace NemesiAPI.Tests;

public class ToDoControllerTests
{
    // ── GetAll: filtro per TipoPlanning ──────────────────────────────────────

    [Fact]
    public async Task GetAll_DefaultRestituisceSoloTodoEdili()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");
        await f.AddTodoAsync(TipoPlanning.Edile, "Edile");
        await f.AddTodoAsync(TipoPlanning.Amministrativo, "Amministrativo");

        var result = await f.Controller.GetAll(completato: true);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<ToDo>>(ok.Value).ToList();
        var item = Assert.Single(items);
        Assert.Equal(TipoPlanning.Edile, item.TipoPlanning);
    }

    [Fact]
    public async Task GetAll_FiltraCorrettamentePerTipoPlanningAmministrativo()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");
        await f.AddTodoAsync(TipoPlanning.Edile, "Edile");
        var amm = await f.AddTodoAsync(TipoPlanning.Amministrativo, "Amministrativo");

        var result = await f.Controller.GetAll(completato: true, tipoPlanning: TipoPlanning.Amministrativo);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<ToDo>>(ok.Value).ToList();
        var item = Assert.Single(items);
        Assert.Equal(amm.Id, item.Id);
    }

    // ── GetAll: filtro "Utente Base" ─────────────────────────────────────────

    [Fact]
    public async Task GetAll_UtenteBase_VedeSoloTodoPropri()
    {
        // Fixture avviata con admin: i todo aggiunti avranno UtenteCreazione = "admin@test.com"
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");

        var baseUser = new Utente("base@test.com", "Utente Base") { Id = "base-user-id" };
        f.Db.Users.Add(baseUser);
        await f.Db.SaveChangesAsync();

        var ownTodo = await f.AddTodoAsync(TipoPlanning.Edile, "Assegnato a me", "base-user-id");
        await f.AddTodoAsync(TipoPlanning.Edile, "Assegnato ad altri", "assignee-id");

        // Cambio utente corrente: Utente Base
        f.UserManager.AddUser(baseUser, "Utente Base");
        f.SetCurrentUser("base@test.com", "base-user-id");

        var result = await f.Controller.GetAll(completato: true);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<ToDo>>(ok.Value).ToList();
        var item = Assert.Single(items);
        Assert.Equal(ownTodo.Id, item.Id);
    }

    [Fact]
    public async Task GetAll_UtenteBase_VedeTodoInCuiESecondario()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");

        var baseUser = new Utente("base@test.com", "Utente Base") { Id = "base-user-id" };
        f.Db.Users.Add(baseUser);
        await f.Db.SaveChangesAsync();

        var todoConSecondario = await f.AddTodoAsync(TipoPlanning.Edile, "Secondo", assegnatarioSecondarioId: "base-user-id");
        await f.AddTodoAsync(TipoPlanning.Edile, "Non mio");

        f.UserManager.AddUser(baseUser, "Utente Base");
        f.SetCurrentUser("base@test.com", "base-user-id");

        var result = await f.Controller.GetAll(completato: true);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<ToDo>>(ok.Value).ToList();
        var item = Assert.Single(items);
        Assert.Equal(todoConSecondario.Id, item.Id);
    }

    [Fact]
    public async Task GetAll_Amministratore_VedeTuttiITodo()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");
        await f.AddTodoAsync(TipoPlanning.Edile, "Todo 1");
        await f.AddTodoAsync(TipoPlanning.Edile, "Todo 2");

        var result = await f.Controller.GetAll(completato: true);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<ToDo>>(ok.Value).ToList();
        Assert.Equal(2, items.Count);
    }

    // ── GetAll: filtro completati ────────────────────────────────────────────

    [Fact]
    public async Task GetAll_SenzaFiltroCompletato_EscludeTodoCompletatiVecchi()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");
        var recente = await f.AddTodoAsync(TipoPlanning.Edile, "Recente");
        var vecchioCompletato = await f.AddTodoAsync(TipoPlanning.Edile, "Vecchio completato");

        // Simula un todo completato con DataCreazione nel passato oltre i 7 giorni
        vecchioCompletato.Completato = true;
        vecchioCompletato.DataCreazione = DateTime.UtcNow.AddDays(-10);
        await f.Db.SaveChangesAsync();

        var result = await f.Controller.GetAll(completato: false);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var items = Assert.IsAssignableFrom<IEnumerable<ToDo>>(ok.Value).ToList();
        var item = Assert.Single(items);
        Assert.Equal(recente.Id, item.Id);
    }

    // ── Get by Id ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Get_RestituisceIlTodoIndipendentementeDalTipo()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");
        var edile = await f.AddTodoAsync(TipoPlanning.Edile, "Edile");
        var amm = await f.AddTodoAsync(TipoPlanning.Amministrativo, "Amministrativo");

        var resEdile = await f.Controller.Get(edile.Id);
        var resAmm = await f.Controller.Get(amm.Id);

        var okEdile = Assert.IsType<OkObjectResult>(resEdile.Result);
        Assert.Equal(edile.Id, ((ToDo)okEdile.Value!).Id);

        var okAmm = Assert.IsType<OkObjectResult>(resAmm.Result);
        Assert.Equal(amm.Id, ((ToDo)okAmm.Value!).Id);
    }

    [Fact]
    public async Task Get_RestituisceNotFoundPerIdInesistente()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");

        var result = await f.Controller.Get(9999);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ── Create ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_SalvaIlTipoPlanningDalBody_Edile()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");

        var result = await f.Controller.Create(f.BuildTodo(TipoPlanning.Edile));

        Assert.IsType<CreatedAtActionResult>(result.Result);
        var saved = await f.Db.ToDo.SingleAsync();
        Assert.Equal(TipoPlanning.Edile, saved.TipoPlanning);
    }

    [Fact]
    public async Task Create_SalvaIlTipoPlanningDalBody_Amministrativo()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");

        var result = await f.Controller.Create(f.BuildTodo(TipoPlanning.Amministrativo));

        Assert.IsType<CreatedAtActionResult>(result.Result);
        var saved = await f.Db.ToDo.SingleAsync();
        Assert.Equal(TipoPlanning.Amministrativo, saved.TipoPlanning);
    }

    [Fact]
    public async Task Create_RestituisceBadRequestSeCommessaNonEsiste()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");
        var model = f.BuildTodo(TipoPlanning.Edile);
        model.CommessaId = 9999;

        var result = await f.Controller.Create(model);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    // ── MarkAsComplete / MarkAsIncomplete ────────────────────────────────────

    [Fact]
    public async Task MarkAsComplete_ImpostaCompletatoConDescrizioneAttivita()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");
        var item = await f.AddTodoAsync(TipoPlanning.Edile, "Da completare");

        var result = await f.Controller.MarkAsComplete(item.Id, "Lavoro eseguito");

        Assert.IsType<NoContentResult>(result);
        await f.Db.Entry(item).ReloadAsync();
        Assert.True(item.Completato);
        Assert.Equal("Lavoro eseguito", item.DescrizioneAttivitaSvolta);
    }

    [Fact]
    public async Task MarkAsComplete_FunzionaSenzaDescrizione()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");
        var item = await f.AddTodoAsync(TipoPlanning.Edile, "Da completare");

        var result = await f.Controller.MarkAsComplete(item.Id);

        Assert.IsType<NoContentResult>(result);
        await f.Db.Entry(item).ReloadAsync();
        Assert.True(item.Completato);
    }

    [Fact]
    public async Task MarkAsIncomplete_RiapriIlTodo()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");
        var item = await f.AddTodoAsync(TipoPlanning.Edile, "Già completato");
        item.Completato = true;
        await f.Db.SaveChangesAsync();

        var result = await f.Controller.MarkAsIncomplete(item.Id);

        Assert.IsType<NoContentResult>(result);
        await f.Db.Entry(item).ReloadAsync();
        Assert.False(item.Completato);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_EliminaIlTodoEsistente()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");
        var item = await f.AddTodoAsync(TipoPlanning.Edile, "Da eliminare");

        var result = await f.Controller.Delete(item.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.False(await f.Db.ToDo.AnyAsync(t => t.Id == item.Id));
    }

    [Fact]
    public async Task Delete_RestituisceNotFoundPerIdInesistente()
    {
        await using var f = await TestFixture.CreateAsync("admin@test.com", "Amministratore");

        var result = await f.Controller.Delete(9999);

        Assert.IsType<NotFoundResult>(result);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Fixture
    // ═════════════════════════════════════════════════════════════════════════

    private sealed class TestFixture : IAsyncDisposable
    {
        private readonly DefaultHttpContext httpContext;

        public GestionaleBertozziContext Db { get; }
        public ToDoController Controller { get; }
        public FakeUserManager UserManager { get; }

        private TestFixture(
            GestionaleBertozziContext db,
            DefaultHttpContext httpContext,
            FakeUserManager userManager,
            ToDoController controller)
        {
            Db = db;
            this.httpContext = httpContext;
            UserManager = userManager;
            Controller = controller;
        }

        public static async Task<TestFixture> CreateAsync(string currentUserEmail, string role)
        {
            var httpContext = new DefaultHttpContext();
            var accessor = new FixedHttpContextAccessor { HttpContext = httpContext };

            var options = new DbContextOptionsBuilder<GestionaleBertozziContext>()
                .UseInMemoryDatabase($"todo-tests-{Guid.NewGuid()}")
                .Options;
            var db = new GestionaleBertozziContext(options, accessor);
            var userManager = new FakeUserManager();

            var controller = new ToDoController(db, userManager)
            {
                ControllerContext = new ControllerContext { HttpContext = httpContext }
            };

            var currentUser = new Utente(currentUserEmail, "Utente Corrente")
            {
                Id = $"current-user-{Guid.NewGuid():N}"
            };
            var assignee = new Utente("assignee@test.com", "Assegnatario")
            {
                Id = "assignee-id"
            };
            db.Users.Add(currentUser);
            db.Users.Add(assignee);
            db.Commessa.Add(new Commessa
            {
                Id = 100,
                ClienteId = 1,
                LuogoCommessa = "Test",
                ProgressivoCommessa = 1,
                PmEdileId = currentUser.Id,
                PmAmministrativoId = currentUser.Id,
                ReferentiCliente = "Test",
                TipologiaCommessaId = 1,
                Descrizione = "Commessa test",
                CommessaCodiceInterno = "TEST-001",
                StatusCommessaId = 1,
            });
            await db.SaveChangesAsync();

            var fixture = new TestFixture(db, httpContext, userManager, controller);
            userManager.AddUser(currentUser, role);
            fixture.SetCurrentUser(currentUserEmail, currentUser.Id);
            return fixture;
        }

        public void SetCurrentUser(string email, string userId)
        {
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim(ClaimTypes.Name, email),
                    new Claim(ClaimTypes.NameIdentifier, userId),
                ],
                "TestAuthentication"));
        }

        public async Task<ToDo> AddTodoAsync(
            TipoPlanning tipo,
            string descrizione,
            string? assegnatarioPrimarioId = null,
            string? assegnatarioSecondarioId = null)
        {
            var item = new ToDo
            {
                CommessaId = 100,
                DescrizioneTodo = descrizione,
                AssegnatarioPrimarioId = assegnatarioPrimarioId ?? "assignee-id",
                AssegnatarioSecondarioId = assegnatarioSecondarioId,
                Priorita = 2,
                DataConsegna = new DateTime(2026, 7, 1),
                TipoPlanning = tipo,
            };
            Db.ToDo.Add(item);
            await Db.SaveChangesAsync();
            return item;
        }

        public ToDo BuildTodo(TipoPlanning tipo) => new()
        {
            CommessaId = 100,
            DescrizioneTodo = "Attività test",
            AssegnatarioPrimarioId = "assignee-id",
            Priorita = 3,
            DataConsegna = new DateTime(2026, 7, 1),
            TipoPlanning = tipo,
        };

        public ValueTask DisposeAsync() => Db.DisposeAsync();

        private sealed class FixedHttpContextAccessor : IHttpContextAccessor
        {
            public HttpContext? HttpContext { get; set; }
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // FakeUserManager: implementazione minimale senza librerie di mocking
    // ═════════════════════════════════════════════════════════════════════════

    internal sealed class FakeUserManager : UserManager<Utente>
    {
        private readonly Dictionary<string, (Utente User, List<string> Roles)> store =
            new(StringComparer.OrdinalIgnoreCase);

        public FakeUserManager() : base(
            new NoopUserStore(),
            Microsoft.Extensions.Options.Options.Create(new IdentityOptions()),
            new PasswordHasher<Utente>(),
            [],
            [],
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            null!,
            NullLogger<UserManager<Utente>>.Instance)
        { }

        public void AddUser(Utente user, params string[] roles) =>
            store[user.Email!] = (user, [.. roles]);

        public override Task<Utente?> FindByEmailAsync(string email) =>
            Task.FromResult(store.TryGetValue(email, out var e) ? e.User : null);

        public override Task<IList<string>> GetRolesAsync(Utente user) =>
            Task.FromResult<IList<string>>(
                store.TryGetValue(user.Email!, out var e) ? e.Roles : []);
    }

    private sealed class NoopUserStore : IUserStore<Utente>
    {
        public void Dispose() { }
        public Task<string> GetUserIdAsync(Utente user, CancellationToken ct) => Task.FromResult(user.Id);
        public Task<string?> GetUserNameAsync(Utente user, CancellationToken ct) => Task.FromResult(user.UserName);
        public Task SetUserNameAsync(Utente user, string? name, CancellationToken ct) => Task.CompletedTask;
        public Task<string?> GetNormalizedUserNameAsync(Utente user, CancellationToken ct) => Task.FromResult(user.NormalizedUserName);
        public Task SetNormalizedUserNameAsync(Utente user, string? name, CancellationToken ct) => Task.CompletedTask;
        public Task<IdentityResult> CreateAsync(Utente user, CancellationToken ct) => Task.FromResult(IdentityResult.Success);
        public Task<IdentityResult> UpdateAsync(Utente user, CancellationToken ct) => Task.FromResult(IdentityResult.Success);
        public Task<IdentityResult> DeleteAsync(Utente user, CancellationToken ct) => Task.FromResult(IdentityResult.Success);
        public Task<Utente?> FindByIdAsync(string userId, CancellationToken ct) => Task.FromResult<Utente?>(null);
        public Task<Utente?> FindByNameAsync(string name, CancellationToken ct) => Task.FromResult<Utente?>(null);
    }
}
