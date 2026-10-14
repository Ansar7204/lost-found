using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;
using Microsoft.EntityFrameworkCore;
using LostAndFound.Api.Features.Items.Photos;
using LostAndFound.Api.Infrastructure.Persistence;
using LostAndFound.Api.Infrastructure.Storage;
using MongoDB.Driver;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddHealthChecks();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));
builder.Services.AddAuthorization();

var connectionString = builder.Configuration.GetConnectionString("Postgres") ?? throw new InvalidOperationException("Connection string 'Postgres' is missing.");

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddSingleton<IPhotoStorage, LocalPhotoStorage>();

var mongoConnectionString =
    builder.Configuration["MongoDb:ConnectionString"];

var mongoDatabaseName =
    builder.Configuration["MongoDb:DatabaseName"];

if (string.IsNullOrWhiteSpace(mongoConnectionString))
{
    throw new InvalidOperationException(
        "MongoDb:ConnectionString is missing.");
}

if (string.IsNullOrWhiteSpace(mongoDatabaseName))
{
    throw new InvalidOperationException(
        "MongoDb:DatabaseName is missing.");
}

builder.Services.AddSingleton<IMongoClient>(_ =>
    new MongoClient(mongoConnectionString));

builder.Services.AddSingleton<IMongoDatabase>(services =>
    services.GetRequiredService<IMongoClient>()
        .GetDatabase(mongoDatabaseName));

builder.Services.AddSingleton<ChatDbContext>();

var app = builder.Build();

await ChatIndexes.EnsureCreatedAsync(
    app.Services.GetRequiredService<ChatDbContext>());

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");
app.Run();
