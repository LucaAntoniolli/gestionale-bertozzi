using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class AddTipoPlanningToDo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<short>(
                name: "TipoPlanning",
                table: "ToDo",
                type: "smallint",
                nullable: false,
                defaultValue: (short)0);

            migrationBuilder.CreateIndex(
                name: "IX_ToDo_TipoPlanning",
                table: "ToDo",
                column: "TipoPlanning");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ToDo_TipoPlanning",
                table: "ToDo");

            migrationBuilder.DropColumn(
                name: "TipoPlanning",
                table: "ToDo");
        }
    }
}
