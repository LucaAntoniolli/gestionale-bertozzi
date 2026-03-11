using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class AddOreSpeseCommessa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OreSpeseCommessa",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CommessaId = table.Column<int>(type: "int", nullable: false),
                    PianoSviluppoId = table.Column<int>(type: "int", nullable: false),
                    UtenteId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Data = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Ore = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Spese = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Chilometri = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataModifica = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UtenteCreazione = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtenteModifica = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OreSpeseCommessa", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OreSpeseCommessa_AspNetUsers_UtenteId",
                        column: x => x.UtenteId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OreSpeseCommessa_Commessa_CommessaId",
                        column: x => x.CommessaId,
                        principalTable: "Commessa",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_OreSpeseCommessa_PianoSviluppo_PianoSviluppoId",
                        column: x => x.PianoSviluppoId,
                        principalTable: "PianoSviluppo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OreSpeseCommessa_CommessaId",
                table: "OreSpeseCommessa",
                column: "CommessaId");

            migrationBuilder.CreateIndex(
                name: "IX_OreSpeseCommessa_PianoSviluppoId",
                table: "OreSpeseCommessa",
                column: "PianoSviluppoId");

            migrationBuilder.CreateIndex(
                name: "IX_OreSpeseCommessa_UtenteId",
                table: "OreSpeseCommessa",
                column: "UtenteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OreSpeseCommessa");
        }
    }
}
