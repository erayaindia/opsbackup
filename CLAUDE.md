# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with Vite
- `npm run build` - Production build 
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint on all files
- `npm run preview` - Preview production build

### Installation
- `npm i` - Install dependencies

## Architecture

This is the Eraya Ops Hub - a comprehensive operations management platform built with React, TypeScript, Vite, and Supabase.

### Core Structure
- **Framework**: Vite + React + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Database/Auth**: Supabase for backend services and authentication
- **Routing**: React Router DOM for client-side routing
- **State Management**: React hooks and context (no external state library)

### Key Directories
- `src/components/` - Reusable React components organized by feature
  - `ui/` - shadcn/ui components (accordion, button, dialog, etc.)
  - `fulfillment/` - Fulfillment-specific components
  - `orders/` - Order management components  
  - `support/` - Support ticket components
  - `team-chat/` - Team communication components
- `src/pages/` - Main application pages/routes
  - `fulfillment/` - Fulfillment workflow pages
  - `content/` - Content management pages
- `src/hooks/` - Custom React hooks for data fetching and state
- `src/lib/` - Utility functions and business logic
  - `fulfillment/` - Fulfillment-specific utilities
- `src/integrations/supabase/` - Supabase client and database types

### Main Features
The application is organized around these core workflows:
1. **Dashboard** - KPI overview and analytics
2. **Orders** - Order management and processing
3. **Fulfillment** - Multi-step fulfillment process (packing, quality check, disputes, etc.)
4. **Support** - Customer support ticket management
5. **Team Chat** - Internal team communication
6. **Content Management** - Content planning and library

### Authentication
- Uses Supabase Auth with local storage persistence
- `AuthWrapper` component protects authenticated routes
- Auth page handles login/signup flows

### Styling
- Tailwind CSS with extensive custom theme configuration
- CSS custom properties for colors, gradients, and shadows
- Dark mode support via `next-themes`
- Custom animations and transitions

### Error Logging
Use `console.error('Message:', error)` for error logging throughout the codebase.

### Environment Variables
The app expects these Vite environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`