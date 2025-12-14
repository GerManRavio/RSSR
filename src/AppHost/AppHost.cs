var builder = DistributedApplication.CreateBuilder(args);

#pragma warning disable ASPIREPROXYENDPOINTS001
var postgres = builder
    .AddPostgres("postgres", port: 5432)
    .WithDataVolume()
    .WithEndpointProxySupport(false)
    .WithLifetime(ContainerLifetime.Persistent);
#pragma warning restore ASPIREPROXYENDPOINTS001

var db = postgres
    .AddDatabase("Database");

var api = builder.AddProject<Projects.Service_Api>("service-api")
    .WaitFor(db)
    .WithReference(db);

var frontend = builder.AddViteApp("frontend", "../Frontend")
    .WithPnpm()
    .WithBuildScript("dev")
    .WithExternalHttpEndpoints()
    .WithReference(api).WaitFor(api);

builder.Build().Run();
