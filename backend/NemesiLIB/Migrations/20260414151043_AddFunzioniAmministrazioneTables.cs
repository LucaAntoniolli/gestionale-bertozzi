using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class AddFunzioniAmministrazioneTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CostoTrasferta",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    CommessaId = table.Column<int>(type: "int", nullable: false),
                    UtenteId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LocalitaPartenza = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    LocalitaArrivo = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Chilometri = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CostoChilometri = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CostoTelepass = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CostoHotel = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CostoTreno = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    DataDa = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataA = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataModifica = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UtenteCreazione = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtenteModifica = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CostoTrasferta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CostoTrasferta_AspNetUsers_UtenteId",
                        column: x => x.UtenteId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CostoTrasferta_Cliente_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Cliente",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CostoTrasferta_Commessa_CommessaId",
                        column: x => x.CommessaId,
                        principalTable: "Commessa",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Fornitore",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RagioneSociale = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PartitaIva = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CodiceFiscale = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Indirizzo = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Comune = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CAP = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Provincia = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Nazione = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ModalitaPagamentoId = table.Column<int>(type: "int", nullable: true),
                    Sdi = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    Tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Sigla = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataModifica = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UtenteCreazione = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtenteModifica = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fornitore", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Fornitore_ModalitaPagamento_ModalitaPagamentoId",
                        column: x => x.ModalitaPagamentoId,
                        principalTable: "ModalitaPagamento",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Onere",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CommessaId = table.Column<int>(type: "int", nullable: false),
                    Pratica = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ImportoOneri = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataModifica = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UtenteCreazione = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtenteModifica = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Onere", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Onere_Commessa_CommessaId",
                        column: x => x.CommessaId,
                        principalTable: "Commessa",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ScopoLavoro",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Descrizione = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScopoLavoro", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Collaudo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FornitoreId = table.Column<int>(type: "int", nullable: false),
                    ScopoLavoroId = table.Column<int>(type: "int", nullable: false),
                    CommessaId = table.Column<int>(type: "int", nullable: false),
                    Contratto = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Importo = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Pagato = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataModifica = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UtenteCreazione = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtenteModifica = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Collaudo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Collaudo_Commessa_CommessaId",
                        column: x => x.CommessaId,
                        principalTable: "Commessa",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Collaudo_Fornitore_FornitoreId",
                        column: x => x.FornitoreId,
                        principalTable: "Fornitore",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Collaudo_ScopoLavoro_ScopoLavoroId",
                        column: x => x.ScopoLavoroId,
                        principalTable: "ScopoLavoro",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Collaudo_CommessaId",
                table: "Collaudo",
                column: "CommessaId");

            migrationBuilder.CreateIndex(
                name: "IX_Collaudo_FornitoreId",
                table: "Collaudo",
                column: "FornitoreId");

            migrationBuilder.CreateIndex(
                name: "IX_Collaudo_ScopoLavoroId",
                table: "Collaudo",
                column: "ScopoLavoroId");

            migrationBuilder.CreateIndex(
                name: "IX_CostoTrasferta_ClienteId",
                table: "CostoTrasferta",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_CostoTrasferta_CommessaId",
                table: "CostoTrasferta",
                column: "CommessaId");

            migrationBuilder.CreateIndex(
                name: "IX_CostoTrasferta_UtenteId",
                table: "CostoTrasferta",
                column: "UtenteId");

            migrationBuilder.CreateIndex(
                name: "IX_Fornitore_ModalitaPagamentoId",
                table: "Fornitore",
                column: "ModalitaPagamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Onere_CommessaId",
                table: "Onere",
                column: "CommessaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Collaudo");

            migrationBuilder.DropTable(
                name: "CostoTrasferta");

            migrationBuilder.DropTable(
                name: "Onere");

            migrationBuilder.DropTable(
                name: "Fornitore");

            migrationBuilder.DropTable(
                name: "ScopoLavoro");
        }
    }
}
