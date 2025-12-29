using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class MigrazioniPerAnagrafiche : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Nominativo",
                table: "AspNetUsers",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<decimal>(
                name: "CostoOrario",
                table: "AspNetUsers",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsEsterno",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Societa",
                table: "AspNetUsers",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ModalitaPagamento",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Descrizione = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModalitaPagamento", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StatusCommessa",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Ordine = table.Column<int>(type: "int", nullable: false),
                    Descrizione = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatusCommessa", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TipologiaCommessa",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Descrizione = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TipologiaCommessa", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Cliente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RagioneSociale = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    CodiceInterno = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PartitaIva = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CodiceFiscale = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Indirizzo = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Comune = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CAP = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Provincia = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Nazione = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ModalitaPagamentoId = table.Column<int>(type: "int", nullable: false),
                    Sdi = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    Tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cliente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cliente_ModalitaPagamento_ModalitaPagamentoId",
                        column: x => x.ModalitaPagamentoId,
                        principalTable: "ModalitaPagamento",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PersonaleCliente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Cognome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Mansione = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonaleCliente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PersonaleCliente_Cliente_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Cliente",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cliente_ModalitaPagamentoId",
                table: "Cliente",
                column: "ModalitaPagamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_PersonaleCliente_ClienteId",
                table: "PersonaleCliente",
                column: "ClienteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PersonaleCliente");

            migrationBuilder.DropTable(
                name: "StatusCommessa");

            migrationBuilder.DropTable(
                name: "TipologiaCommessa");

            migrationBuilder.DropTable(
                name: "Cliente");

            migrationBuilder.DropTable(
                name: "ModalitaPagamento");

            migrationBuilder.DropColumn(
                name: "CostoOrario",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsEsterno",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Societa",
                table: "AspNetUsers");

            migrationBuilder.AlterColumn<string>(
                name: "Nominativo",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);
        }
    }
}
