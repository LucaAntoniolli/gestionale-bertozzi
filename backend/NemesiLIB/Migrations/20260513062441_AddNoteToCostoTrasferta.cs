using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class AddNoteToCostoTrasferta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "CostoTrasferta",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Note",
                table: "CostoTrasferta");
        }
    }
}
