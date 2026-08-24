using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class AggiuntaNotifiche : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Notifica",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UtenteId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Titolo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descrizione = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Link = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Tipo = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
                    Categoria = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
                    IsLetta = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataLettura = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ChiaveDeduplica = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DataScadenza = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UtenteOrigine = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifica", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifica_AspNetUsers_UtenteId",
                        column: x => x.UtenteId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notifica_ChiaveDeduplica",
                table: "Notifica",
                column: "ChiaveDeduplica",
                unique: true,
                filter: "[ChiaveDeduplica] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Notifica_UtenteId_DataCreazione",
                table: "Notifica",
                columns: new[] { "UtenteId", "DataCreazione" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifica_UtenteId_IsLetta",
                table: "Notifica",
                columns: new[] { "UtenteId", "IsLetta" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Notifica");
        }
    }
}
