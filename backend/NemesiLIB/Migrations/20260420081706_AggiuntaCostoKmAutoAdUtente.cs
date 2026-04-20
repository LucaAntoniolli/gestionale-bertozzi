using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class AggiuntaCostoKmAutoAdUtente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CostoKmAuto",
                table: "AspNetUsers",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CostoKmAuto",
                table: "AspNetUsers");
        }
    }
}
