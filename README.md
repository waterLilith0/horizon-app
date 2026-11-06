# Horizon

[![.NET](https://github.com/waterLilith0/horizon-app/actions/workflows/dotnet.yml/badge.svg)](https://github.com/waterLilith0/horizon-app/actions/workflows/dotnet.yml)

Horizon is a web app for creating, organizing, and sharing prompts. Its
dashboard supports collections, search, local library storage, and optional
account-backed synchronization.

## Project structure

| Directory | Contents |
| --- | --- |
| [`horizon-ui`](./horizon-ui) | React, TypeScript, Vite, and Tailwind CSS frontend |
| [`horizon-api`](./horizon-api) | ASP.NET Core API with MySQL storage |
| [`horizon-api-integration-tests`](./horizon-api-integration-tests) | API and MySQL integration tests |
| [`.github/workflows`](./.github/workflows) | CI checks and image publishing |

## Getting started

### Prerequisites

- Node.js 24 and npm (the version used by CI and the frontend Docker build).
- .NET 10 SDK for the API.
- MySQL for a local API; Docker is required for the integration tests.

### Run the frontend

From the repository root:

```sh
cd horizon-ui
npm ci
npm run dev
```

Open the URL printed by Vite (normally <http://localhost:5173>). By default,
the development server proxies `/api` requests to
`https://dev.waterlilith.space`, **not** to a locally running API. To work
against a local API, change the proxy target in
[`vite.config.ts`](./horizon-ui/vite.config.ts); the API's HTTPS profile uses
`https://localhost:7008`. Trust the local .NET development certificate if
needed. Authentication cookies are configured as secure, so HTTPS matters.

For frontend work with mock authentication, start Vite with
`VITE_ENABLE_MOCKS=true` in the environment. Mocks are only enabled in
development mode; requests without a mock handler still reach the API.

### Run the API

Configure a MySQL database and supply development settings via .NET user
secrets or environment variables rather than committing credentials. The
checked-in [`appsettings.Development.json`](./horizon-api/appsettings.Development.json)
leaves the connection string, password peppers, and email credentials empty.
Set at least:

- `ConnectionStrings:DefaultConnection` to the MySQL connection string.
- `Security:Peppers:1` and `Security:Peppers:2` to separate secret values of at
  least 32 characters. `Security:CurrentPepperVersion` defaults to `2`.
- `Email:ApiKey` and `Email:ApiSecret` to Mailjet credentials; email settings
  are validated at startup.

For example, `dotnet user-secrets set "ConnectionStrings:DefaultConnection"
"<connection-string>" --project horizon-api` sets the connection string from
the repository root. Set the other values in the same way. Environment variable
names use double underscores in place of colons, such as
`ConnectionStrings__DefaultConnection`.

Then run:

```sh
dotnet run --project horizon-api --launch-profile https
```

The HTTPS profile listens on `https://localhost:7008` and
`http://localhost:5079`. The integration tests use their own
[test schema](./horizon-api-integration-tests/Schema/schema.mysql).

## Checks and builds

Frontend commands run from `horizon-ui`:

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
```

From the repository root, build and test the .NET solution:

```sh
dotnet build
dotnet test
```

The integration tests start a MySQL container, so Docker must be running.

## Deployment

Pushes to `staging` build and publish the frontend and backend Docker images
with the `staging` tag, using the `staging` GitHub environment. Pushes to
`master` publish images tagged `prod` using the `production` environment.
Pushes to `dev` do not publish deployment images.

The deployment host must pull the appropriate image tags; this workflow only
builds and publishes images. The frontend build sends telemetry to a fixed Faro
collector. To upload sourcemaps, configure `FARO_UPLOAD_ENDPOINT`,
`FARO_APP_ID` and `FARO_STACK_ID` as variables and `FARO_API_KEY` as a secret in
the corresponding GitHub environment. Without the key the upload is skipped.

## License

See [LICENSE.txt](./LICENSE.txt).
