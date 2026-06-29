# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# 1. Build stage (Natively runs on the GitHub Action host platform)
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG TARGETARCH
WORKDIR /src

# Copy and restore dependencies
COPY *.csproj ./
RUN dotnet restore -a $TARGETARCH

# Copy remaining files and publish for the specific Pi architecture
COPY . ./
RUN dotnet publish -c Release -a $TARGETARCH -o /app --no-restore

# 2. Runtime stage (Matches the target environment architecture)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "horizon-app.dll"]

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

####################################################################
# This stage is used to build the service project
#FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
#ARG BUILD_CONFIGURATION=Release
#WORKDIR /src
#COPY ["horizon-app/horizon-app.csproj", "horizon-app/"]
#RUN dotnet restore "./horizon-app/horizon-app.csproj"
#COPY . .
#WORKDIR "/src/horizon-app"
#RUN dotnet build "./horizon-app.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
#FROM build AS publish
#ARG BUILD_CONFIGURATION=Release
#RUN dotnet publish "./horizon-app.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
#FROM base AS final
#WORKDIR /app
#COPY --from=publish /app/publish .
#ENTRYPOINT ["dotnet", "horizon-app.dll"]