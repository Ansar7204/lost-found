using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace LostAndFound.Api.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Sprint 1 (US-02): short item number (Nº 0413), finder name, "where is it now",
    /// title limit 150 as agreed with the frontend.
    /// </summary>
    public partial class Sprint1ItemFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "found_items",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(128)",
                oldMaxLength: 128);

            // Identity column: existing rows get numbers 1, 2, 3... automatically.
            migrationBuilder.AddColumn<int>(
                name: "Number",
                table: "found_items",
                type: "integer",
                nullable: false)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddColumn<string>(
                name: "FinderName",
                table: "found_items",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HeldAt",
                table: "found_items",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "With finder");

            migrationBuilder.CreateIndex(
                name: "IX_found_items_Number",
                table: "found_items",
                column: "Number",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_found_items_Number",
                table: "found_items");

            migrationBuilder.DropColumn(name: "Number", table: "found_items");
            migrationBuilder.DropColumn(name: "FinderName", table: "found_items");
            migrationBuilder.DropColumn(name: "HeldAt", table: "found_items");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "found_items",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150);
        }
    }
}
