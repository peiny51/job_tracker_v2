# Job Tracker

A full-stack web application for managing job applications and tracking progress throughout the hiring process.

## Features

- Create, update, and track job applications
- Manage application status and history
- Store job descriptions and required skills
- Manage user skills and compare them with job requirements
- AI-assisted job description and skill analysis using Gemini
- User authentication with JWT

## Tech Stack

**Frontend:** React, TypeScript  
**Backend:** C#, ASP.NET Core, Entity Framework Core  
**Database:** PostgreSQL  
**AI:** Google Gemini API  
**Testing & CI:** xUnit, GitHub Actions

## Architecture

```text
React + TypeScript
        ↓
   REST API
        ↓
 ASP.NET Core
    ↙       ↘
PostgreSQL  Gemini API
```

## Running Locally

```bash
# Backend
dotnet restore
dotnet run

# Frontend
npm install
npm run dev
```

## Author

Daniel Pei
