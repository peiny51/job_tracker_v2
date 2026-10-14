
# Stage 1: Build the React web application.
FROM node:22-bookworm-slim AS frontend-build

WORKDIR /src

# Install workspace dependencies from the repository root.
COPY package*.json ./
COPY frontend/package.json ./frontend/
COPY mobile/package.json ./mobile/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies without reusing platform-specific lockfile entries.
RUN rm -f package-lock.json \
    && npm install --include=optional

# Shared types and API clients are required by the web app.
COPY frontend/ ./frontend/
COPY packages/shared/ ./packages/shared/

# Use same-origin API requests in production.
ENV VITE_API_URL=""

RUN npm run build --workspace=frontend


# Stage 2: Publish the ASP.NET Core backend.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build

WORKDIR /src

COPY backend/backend.csproj ./backend/
RUN dotnet restore ./backend/backend.csproj

COPY backend/ ./backend/

RUN dotnet publish ./backend/backend.csproj \
    -c Release \
    -o /app/publish \
    --no-restore


# Stage 3: Run ASP.NET Core and serve the React build.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

COPY --from=backend-build /app/publish ./

# ASP.NET Core serves these files using UseStaticFiles().
COPY --from=frontend-build /src/frontend/dist ./wwwroot

# Listen on the container's HTTP port.
ENV ASPNETCORE_URLS=http://0.0.0.0:10000

EXPOSE 10000

ENTRYPOINT ["dotnet", "backend.dll"]
