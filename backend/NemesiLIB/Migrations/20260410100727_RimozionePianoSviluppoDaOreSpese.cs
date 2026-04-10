using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class RimozionePianoSviluppoDaOreSpese : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OreSpeseCommessa_PianoSviluppo_PianoSviluppoId",
                table: "OreSpeseCommessa");

            migrationBuilder.DropIndex(
                name: "IX_OreSpeseCommessa_PianoSviluppoId",
                table: "OreSpeseCommessa");

            migrationBuilder.DropColumn(
                name: "PianoSviluppoId",
                table: "OreSpeseCommessa");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PianoSviluppoId",
                table: "OreSpeseCommessa",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_OreSpeseCommessa_PianoSviluppoId",
                table: "OreSpeseCommessa",
                column: "PianoSviluppoId");

            migrationBuilder.AddForeignKey(
                name: "FK_OreSpeseCommessa_PianoSviluppo_PianoSviluppoId",
                table: "OreSpeseCommessa",
                column: "PianoSviluppoId",
                principalTable: "PianoSviluppo",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
