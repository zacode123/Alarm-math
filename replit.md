# Advanced Web-Based Alarm Clock Application

## Project Overview
An advanced web-based alarm clock application that transforms morning routines into an engaging, interactive experience with intelligent personalization and user-centric design.

## Tech Stack
- **Frontend**: React with TypeScript, Framer Motion animations, Tailwind CSS
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL (Supabase) with Drizzle ORM
- **Authentication**: Express sessions with PostgreSQL session store
- **Real-time**: WebSocket support for live updates
- **Build Tool**: Vite for frontend bundling
- **Package Manager**: npm

## Project Architecture
- **Frontend**: Located in `client/` directory using React + TypeScript
- **Backend**: Located in `server/` directory using Express + TypeScript
- **Shared**: Common types and schemas in `shared/` directory
- **Database**: Drizzle ORM with PostgreSQL schemas

## Recent Changes
- **2025-01-23**: Migrated from NeonDB to Supabase PostgreSQL
- **2025-01-23**: Fixed database connection issues and updated to use standard PostgreSQL driver
- **2025-01-23**: Added proper TypeScript imports for pg package

## Database Schema
- **alarms**: Main alarm configuration table with time, days, settings
- **audio_files**: Custom audio files with slot-based organization (1-3 slots)

## User Preferences
- Database: Prefers Supabase over other database providers
- Focus: User wants a working application with proper database connectivity

## Development Guidelines
- Follow fullstack JavaScript patterns with minimal backend logic
- Keep data model simple and focused on core alarm functionality
- Use Drizzle ORM for all database operations
- Prioritize frontend functionality over backend complexity