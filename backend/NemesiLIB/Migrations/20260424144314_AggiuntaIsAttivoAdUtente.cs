using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class AggiuntaIsAttivoAdUtente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAttivo",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAttivo",
                table: "AspNetUsers");
        }
    }
}
