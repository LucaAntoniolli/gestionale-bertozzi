using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class AddToDoTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ToDo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssegnatarioPrimarioId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AssegnatarioSecondarioId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    CommessaId = table.Column<int>(type: "int", nullable: false),
                    DescrizioneTodo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataConsegna = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DescrizioneAttivitaSvolta = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Completato = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataModifica = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UtenteCreazione = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UtenteModifica = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ToDo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ToDo_AspNetUsers_AssegnatarioPrimarioId",
                        column: x => x.AssegnatarioPrimarioId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ToDo_AspNetUsers_AssegnatarioSecondarioId",
                        column: x => x.AssegnatarioSecondarioId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ToDo_Commessa_CommessaId",
                        column: x => x.CommessaId,
                        principalTable: "Commessa",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ToDo_AssegnatarioPrimarioId",
                table: "ToDo",
                column: "AssegnatarioPrimarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ToDo_AssegnatarioSecondarioId",
                table: "ToDo",
                column: "AssegnatarioSecondarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ToDo_CommessaId",
                table: "ToDo",
                column: "CommessaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ToDo");
        }
    }
}
