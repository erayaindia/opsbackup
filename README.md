# Eraya Operations Hub

A comprehensive operations management platform built with React, TypeScript, and Supabase. Streamline your business processes with powerful tools for order management, fulfillment tracking, team coordination, and more.

## Features

### 🎯 Dashboard & Analytics
- Real-time KPI monitoring
- Live order tracking
- Inventory alerts
- Employee attendance overview

### 📦 Order Management
- Order processing workflow
- Status tracking
- Customer communication
- Dispute resolution

### 🏭 Fulfillment Operations
- Multi-step fulfillment process
- Quality control checks
- Packing and shipping
- Return handling

### 👥 Team Management
- Employee check-in/out system
- Role-based access control
- Team communication
- Performance tracking

### 📊 Inventory Management
- Stock level monitoring
- Low stock alerts
- Product variant tracking
- Warehouse management

### 🎯 Task Management
- Daily and one-off tasks
- Evidence-based completion
- Review workflows
- Auto-approval settings

### 💬 Support System
- Customer feedback management
- Ticket resolution
- Priority handling
- Knowledge base

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, shadcn/ui, Tailwind CSS
- **Backend**: Supabase (Authentication, Database, Storage)
- **State Management**: React Query, React Hook Form
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

## Installation

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd eraya-ops-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   ```

4. **Database Setup**

   Run the Supabase migrations:
   ```bash
   npx supabase db push
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   ├── dashboard/     # Dashboard-specific components
│   ├── orders/        # Order management components
│   └── ...
├── pages/             # Route pages
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── integrations/      # External service integrations
├── types/             # TypeScript type definitions
└── styles/            # Global styles
```

### Key Directories

- **`src/components/`** - Organized by feature (fulfillment, orders, support, etc.)
- **`src/pages/`** - Main application routes
- **`src/hooks/`** - Data fetching and state management hooks
- **`src/lib/`** - Business logic and utilities
- **`src/integrations/supabase/`** - Database client and type definitions

## Authentication

The application uses Supabase Auth with:
- Email/password authentication
- Role-based access control (admin, super_admin, user)
- Protected routes via AuthWrapper
- Module-based permissions

## Deployment

### Production Build

```bash
npm run build
```

### Environment Variables

Ensure these are set in your production environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Code Style

- Follow TypeScript best practices
- Use ESLint configuration provided
- Follow component naming conventions
- Use Tailwind CSS for styling
- Implement proper error handling

## Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Follow security best practices for authentication
- Implement proper input validation

## Support

For support and questions, please:
1. Check the existing documentation
2. Search through existing issues
3. Create a new issue with detailed information

## License

This project is proprietary software developed for Eraya Operations.
