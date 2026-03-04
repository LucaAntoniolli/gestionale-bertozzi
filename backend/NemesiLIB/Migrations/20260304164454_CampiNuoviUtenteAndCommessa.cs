using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NemesiLIB.Migrations
{
    /// <inheritdoc />
    public partial class CampiNuoviUtenteAndCommessa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Commessa_PersonaleCliente_ReferenteClienteId",
                table: "Commessa");

            migrationBuilder.DropIndex(
                name: "IX_Commessa_ReferenteClienteId",
                table: "Commessa");

            migrationBuilder.DropColumn(
                name: "ReferenteClienteId",
                table: "Commessa");

            migrationBuilder.AlterColumn<string>(
                name: "PmEdileId",
                table: "Commessa",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "PmAmministrativoId",
                table: "Commessa",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "CommessaCodiceInterno",
                table: "Commessa",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReferentiCliente",
                table: "Commessa",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RuoloAziendale",
                table: "AspNetUsers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Commessa_PmAmministrativoId",
                table: "Commessa",
                column: "PmAmministrativoId");

            migrationBuilder.CreateIndex(
                name: "IX_Commessa_PmEdileId",
                table: "Commessa",
                column: "PmEdileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Commessa_AspNetUsers_PmAmministrativoId",
                table: "Commessa",
                column: "PmAmministrativoId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Commessa_AspNetUsers_PmEdileId",
                table: "Commessa",
                column: "PmEdileId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Commessa_AspNetUsers_PmAmministrativoId",
                table: "Commessa");

            migrationBuilder.DropForeignKey(
                name: "FK_Commessa_AspNetUsers_PmEdileId",
                table: "Commessa");

            migrationBuilder.DropIndex(
                name: "IX_Commessa_PmAmministrativoId",
                table: "Commessa");

            migrationBuilder.DropIndex(
                name: "IX_Commessa_PmEdileId",
                table: "Commessa");

            migrationBuilder.DropColumn(
                name: "CommessaCodiceInterno",
                table: "Commessa");

            migrationBuilder.DropColumn(
                name: "ReferentiCliente",
                table: "Commessa");

            migrationBuilder.DropColumn(
                name: "RuoloAziendale",
                table: "AspNetUsers");

            migrationBuilder.AlterColumn<string>(
                name: "PmEdileId",
                table: "Commessa",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "PmAmministrativoId",
                table: "Commessa",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddColumn<int>(
                name: "ReferenteClienteId",
                table: "Commessa",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Commessa_ReferenteClienteId",
                table: "Commessa",
                column: "ReferenteClienteId");

            migrationBuilder.AddForeignKey(
                name: "FK_Commessa_PersonaleCliente_ReferenteClienteId",
                table: "Commessa",
                column: "ReferenteClienteId",
                principalTable: "PersonaleCliente",
                principalColumn: "Id");
        }
    }
}
