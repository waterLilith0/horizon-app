# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# 1. Base stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER root
RUN mkdir -p /app/keys /app/logs && chown -R $APP_UID:$APP_UID /app/keys /app/logs
USER $APP_UID
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# 2. Build stage
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG TARGETARCH
WORKDIR /src

# Copy and restore using the explicit subfolder path
COPY horizon-api/*.csproj ./horizon-api/
RUN dotnet restore horizon-api/*.csproj -a $TARGETARCH

# Copy everything and build from the folder target
COPY horizon-api/ ./horizon-api/
WORKDIR /src/horizon-api
RUN dotnet publish -c Release -a $TARGETARCH -o /app --no-restore

# 3. Final runtime stage
FROM base AS final
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "horizon-api.dll"]
