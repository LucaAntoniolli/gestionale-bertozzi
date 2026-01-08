using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class TemplatePianiSviluppoAttivitaeAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataCreazione",
                table: "PersonaleCliente",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DataModifica",
                table: "PersonaleCliente",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UtenteCreazione",
                table: "PersonaleCliente",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UtenteModifica",
                table: "PersonaleCliente",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataCreazione",
                table: "Cliente",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DataModifica",
                table: "Cliente",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UtenteCreazione",
                table: "Cliente",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UtenteModifica",
                table: "Cliente",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TemplatePianoSviluppo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TipologiaCommessaId = table.Column<int>(type: "int", nullable: false),
                    Descrizione = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Ordine = table.Column<int>(type: "int", nullable: false),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataModifica = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UtenteCreazione = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtenteModifica = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplatePianoSviluppo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TemplatePianoSviluppo_TipologiaCommessa_TipologiaCommessaId",
                        column: x => x.TipologiaCommessaId,
                        principalTable: "TipologiaCommessa",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TemplateAttivita",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PianoSviluppoId = table.Column<int>(type: "int", nullable: false),
                    Descrizione = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    TipoInfoDaRegistrare = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Ordine = table.Column<int>(type: "int", nullable: false),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataModifica = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UtenteCreazione = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtenteModifica = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateAttivita", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TemplateAttivita_TemplatePianoSviluppo_PianoSviluppoId",
                        column: x => x.PianoSviluppoId,
                        principalTable: "TemplatePianoSviluppo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TemplateAttivita_PianoSviluppoId",
                table: "TemplateAttivita",
                column: "PianoSviluppoId");

            migrationBuilder.CreateIndex(
                name: "IX_TemplatePianoSviluppo_TipologiaCommessaId",
                table: "TemplatePianoSviluppo",
                column: "TipologiaCommessaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TemplateAttivita");

            migrationBuilder.DropTable(
                name: "TemplatePianoSviluppo");

            migrationBuilder.DropColumn(
                name: "DataCreazione",
                table: "PersonaleCliente");

            migrationBuilder.DropColumn(
                name: "DataModifica",
                table: "PersonaleCliente");

            migrationBuilder.DropColumn(
                name: "UtenteCreazione",
                table: "PersonaleCliente");

            migrationBuilder.DropColumn(
                name: "UtenteModifica",
                table: "PersonaleCliente");

            migrationBuilder.DropColumn(
                name: "DataCreazione",
                table: "Cliente");

            migrationBuilder.DropColumn(
                name: "DataModifica",
                table: "Cliente");

            migrationBuilder.DropColumn(
                name: "UtenteCreazione",
                table: "Cliente");

            migrationBuilder.DropColumn(
                name: "UtenteModifica",
                table: "Cliente");
        }
    }
}
