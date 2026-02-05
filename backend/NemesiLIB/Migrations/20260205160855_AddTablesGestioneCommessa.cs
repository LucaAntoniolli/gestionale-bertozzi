using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class AddTablesGestioneCommessa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TemplatePianoSviluppo_TipologiaCommessa_TipologiaCommessaId",
                table: "TemplatePianoSviluppo");

            migrationBuilder.CreateTable(
                name: "Commessa",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    LuogoCommessa = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ProgressivoCommessa = table.Column<int>(type: "int", nullable: false),
                    Protocollo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    PmEdileId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReferenteClienteId = table.Column<int>(type: "int", nullable: false),
                    PmAmministrativoId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TipologiaCommessaId = table.Column<int>(type: "int", nullable: false),
                    Descrizione = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CostoAtteso = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    StatusCommessaId = table.Column<int>(type: "int", nullable: false),
                    DataInizioPorevista = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataConclusionePrevista = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataModifica = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UtenteCreazione = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtenteModifica = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Commessa", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Commessa_Cliente_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Cliente",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Commessa_PersonaleCliente_ReferenteClienteId",
                        column: x => x.ReferenteClienteId,
                        principalTable: "PersonaleCliente",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Commessa_StatusCommessa_StatusCommessaId",
                        column: x => x.StatusCommessaId,
                        principalTable: "StatusCommessa",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Commessa_TipologiaCommessa_TipologiaCommessaId",
                        column: x => x.TipologiaCommessaId,
                        principalTable: "TipologiaCommessa",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PianoSviluppo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CommessaId = table.Column<int>(type: "int", nullable: false),
                    Descrizione = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Ordine = table.Column<int>(type: "int", nullable: false),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataModifica = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UtenteCreazione = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtenteModifica = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PianoSviluppo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PianoSviluppo_Commessa_CommessaId",
                        column: x => x.CommessaId,
                        principalTable: "Commessa",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Attivita",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PianoSviluppoId = table.Column<int>(type: "int", nullable: false),
                    Descrizione = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    PercentualeAvanzamento = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    Completata = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DataRiferimento = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Ordine = table.Column<int>(type: "int", nullable: false),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataModifica = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UtenteCreazione = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtenteModifica = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attivita", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Attivita_PianoSviluppo_PianoSviluppoId",
                        column: x => x.PianoSviluppoId,
                        principalTable: "PianoSviluppo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Attivita_PianoSviluppoId",
                table: "Attivita",
                column: "PianoSviluppoId");

            migrationBuilder.CreateIndex(
                name: "IX_Commessa_ClienteId",
                table: "Commessa",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Commessa_ReferenteClienteId",
                table: "Commessa",
                column: "ReferenteClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Commessa_StatusCommessaId",
                table: "Commessa",
                column: "StatusCommessaId");

            migrationBuilder.CreateIndex(
                name: "IX_Commessa_TipologiaCommessaId",
                table: "Commessa",
                column: "TipologiaCommessaId");

            migrationBuilder.CreateIndex(
                name: "IX_PianoSviluppo_CommessaId",
                table: "PianoSviluppo",
                column: "CommessaId");

            migrationBuilder.AddForeignKey(
                name: "FK_TemplatePianoSviluppo_TipologiaCommessa_TipologiaCommessaId",
                table: "TemplatePianoSviluppo",
                column: "TipologiaCommessaId",
                principalTable: "TipologiaCommessa",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TemplatePianoSviluppo_TipologiaCommessa_TipologiaCommessaId",
                table: "TemplatePianoSviluppo");

            migrationBuilder.DropTable(
                name: "Attivita");

            migrationBuilder.DropTable(
                name: "PianoSviluppo");

            migrationBuilder.DropTable(
                name: "Commessa");

            migrationBuilder.AddForeignKey(
                name: "FK_TemplatePianoSviluppo_TipologiaCommessa_TipologiaCommessaId",
                table: "TemplatePianoSviluppo",
                column: "TipologiaCommessaId",
                principalTable: "TipologiaCommessa",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
