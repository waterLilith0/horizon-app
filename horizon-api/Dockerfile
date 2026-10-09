# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# 1. Base stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# 2. Build stage
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0 AS build
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

####################################################################
# This stage is used to build the service project
#FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
#ARG BUILD_CONFIGURATION=Release
#WORKDIR /src
#COPY ["horizon-api/horizon-api.csproj", "horizon-api/"]
#RUN dotnet restore "./horizon-api/horizon-api.csproj"
#COPY . .
#WORKDIR "/src/horizon-api"
#RUN dotnet build "./horizon-api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
#FROM build AS publish
#ARG BUILD_CONFIGURATION=Release
#RUN dotnet publish "./horizon-api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
#FROM base AS final
#WORKDIR /app
#COPY --from=publish /app/publish .
#ENTRYPOINT ["dotnet", "horizon-api.dll"]