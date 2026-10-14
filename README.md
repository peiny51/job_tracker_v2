# AI Job Tracker

A cross-platform job application tracker for managing applications, analyzing job postings with Gemini, comparing job requirements with user skills, and identifying recurring skill gaps.

The project includes a React web app, a React Native / Expo mobile app, a shared TypeScript package, and an ASP.NET Core backend backed by PostgreSQL.

## Features

### Job Applications
- Create and delete job applications
- Search saved applications
- Paginated application list
- Track application status: Watched, Applied, Interview, Offer, and Rejected
- Filter applications by status
- View application counts for each status

### AI Job Analysis
- Paste a job description and analyze it with the Gemini API
- Extract structured job information such as company, title, URL, and technical skills
- Use extracted data to prefill a new application

### Skill Matching
- Compare a job's required skills with the user's saved skills
- Calculate a match percentage
- Show matched and missing skills for each application

### Skill Gap Analysis
- Manage the user's current skills
- Aggregate missing skills across saved applications
- Rank skill gaps by the number of applications requiring each skill
- Expand a skill gap to view all related job applications

### Cross-Platform Architecture
- React web frontend
- React Native / Expo mobile frontend
- Shared TypeScript API clients and data types
- ASP.NET Core Minimal API backend
- PostgreSQL with Entity Framework Core
- TanStack Query for mobile server-state management

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS

**Mobile**
- React Native
- Expo
- Expo Router
- TanStack Query
- TypeScript

**Backend**
- C#
- ASP.NET Core Minimal API
- Entity Framework Core
- PostgreSQL
- Gemini API

**Shared**
- npm workspaces
- Shared TypeScript API clients
- Shared TypeScript interfaces

## Project Structure

```text
job_tracker_v2/
├── backend/              # ASP.NET Core API and EF Core data layer
├── frontend/             # React + Vite web application
├── mobile/               # React Native + Expo mobile application
├── packages/
│   └── shared/           # Shared API clients and TypeScript types
├── package.json          # npm workspace configuration
└── README.md
```

## Prerequisites

Install the following before running the project:

- .NET 10 SDK
- PostgreSQL
- Node.js and npm
- Expo Go or an Android/iOS emulator for the mobile app
- Gemini API key

## Setup

### 1. Clone the repository

```bash
git clone 
cd job_tracker_v2
```

### 2. Install JavaScript dependencies

The repository uses npm workspaces, so install dependencies from the project root:

```bash
npm install
```

### 3. Configure PostgreSQL

Create a PostgreSQL database named:

```text
job_tracker
```

Update the connection string in:

```text
backend/appsettings.json
```

Example:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=job_tracker;Username=your_postgres_user"
  }
}
```

Add a password if your PostgreSQL setup requires one.

### 4. Apply Entity Framework migrations

From the backend directory:

```bash
cd backend
dotnet ef database update
```

If `dotnet ef` is not installed:

```bash
dotnet tool install --global dotnet-ef
```

Then return to the project root:

```bash
cd ..
```

### 5. Configure the Gemini API key

The backend reads the API key from the `GEMINI_API_KEY` environment variable.

macOS / Linux:

```bash
export GEMINI_API_KEY="your_api_key"
```

Windows PowerShell:

```powershell
$env:GEMINI_API_KEY="your_api_key"
```

Do not commit your API key to Git.

## Running the Backend

From the backend directory:

```bash
cd backend
dotnet run
```

The development API is expected at:

```text
http://localhost:5270
```

Keep this terminal running.

## Running the Web App

Open another terminal:

```bash
cd frontend
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

The web app uses `VITE_API_URL` and falls back to:

```text
http://localhost:5270
```

If needed, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5270
```

## Running the Mobile App

Create:

```text
mobile/.env
```

For an Android emulator:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5270
```

`10.0.2.2` is the Android emulator address for the host computer.

Then run:

```bash
cd mobile
npm start
```

or:

```bash
npm run android
```

If Expo cannot connect to Metro on Android, ADB reverse can be used:

```bash
adb reverse tcp:8081 tcp:8081
npx expo start --localhost -c
```

For iOS simulator development on the same machine, the backend can normally be reached through `localhost`.

## Main API Endpoints

```text
GET    /api/applications
GET    /api/applications/{id}
POST   /api/applications
PUT    /api/applications/{id}
PATCH  /api/applications/{id}/status
DELETE /api/applications/{id}

GET    /api/applications/{id}/match?userId=1

GET    /api/users/1/skills
POST   /api/users/1/skills/{skillId}
DELETE /api/users/1/skills/{skillId}

GET    /api/statistics/skill-gaps?userId=1
GET    /api/statistics/skill-gaps/{skillId}/applications?userId=1

POST   /api/job-extraction/analyze
```

The application-list endpoint supports search, status filtering, pagination, and status counts.

Example:

```text
GET /api/applications?keyword=python&status=Applied&page=1&pageSize=10
```

## Shared Package

Web and mobile both use:

```text
@job-tracker/shared
```

The shared package contains:

- API request functions
- Job types
- Skill types
- Skill-gap types

This keeps the web and mobile clients aligned with the same backend contracts.

## Notes

- The current demo uses `userId=1` instead of authentication.
- The project is intended as a focused portfolio application rather than a production SaaS system.
- Secrets such as `GEMINI_API_KEY` should stay outside source control.
