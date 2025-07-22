# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IdeaVault is the world's first B2B marketplace specifically for validated micro SaaS ideas, enabling rapid implementation through vibe coding techniques. The platform trades **ideas + validation data + implementation guides** rather than completed products.

### Key Differentiators
- Focus on pre-implementation stage (ideas, not products)
- Vibe coding optimization with AI-friendly prompts
- Korean market expertise with global scalability (KRW pricing)
- Comprehensive validation methodology with research data

### Target Users
- **Sellers**: Contest winners, market researchers, experienced entrepreneurs with validated concepts
- **Buyers**: Solo developers, vibe coding enthusiasts, side project seekers looking for proven ideas
- **Secondary**: Mentors/consultants and platform administrators

### Package Types
- **Idea Package**: Core concept with validation data
- **MVP Package**: Idea + basic technical specifications
- **Launch Kit**: Complete implementation guide with market research

## Common Commands

### Development
```bash
npm run dev                # Start development server
npm run build             # Build for production  
npm start                 # Start production server
```

### Code Quality
```bash
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues automatically
npm run type-check        # TypeScript type checking
npm run format            # Format code with Prettier
npm run format:check      # Check code formatting
```

### Testing
```bash
npm test                  # Run Jest unit tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
npm run test:e2e          # Run Playwright E2E tests
npm run test:e2e:ui       # Run E2E tests with UI mode
```

### Database (Supabase)
```bash
npm run db:generate       # Generate TypeScript types from database
npm run db:reset          # Reset local database
npm run db:migrate        # Run pending migrations
npm run db:seed           # Seed database with sample data
```

### Additional Commands
```bash
npm run analyze           # Analyze bundle size
npm run security-audit    # Run security audit on dependencies
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: Radix UI primitives with Shadcn/ui component library
- **Database**: Supabase (PostgreSQL) with Row Level Security and automated backups
- **Authentication**: Supabase Auth with JWT tokens and social login support
- **Payments**: Dual gateway - Stripe (international) + Toss Pay (Korean market)
- **File Storage**: Supabase Storage with CDN and signed URLs
- **State Management**: React Query + React Hook Form + Zod validation
- **Email**: Resend for transactional emails with HTML templates
- **Analytics**: Built-in dashboard with business metrics and user behavior tracking
- **Security**: TLS 1.3, AES-256 encryption, PCI compliance via payment providers
- **Deployment**: Vercel with Asia-Pacific optimization

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/ui/` - Reusable UI components (Radix UI based)
- `src/lib/` - Utility functions and service configurations
- `src/types/` - TypeScript type definitions including Supabase types
- `docs/` - Project documentation and specifications

### Database Schema
Core entities with comprehensive relationships and RLS policies:
- **users**: Authentication, profiles, verification badges, notification preferences
- **ideas**: Listings with validation status, package types, pricing, content management
- **transactions**: Payment processing, escrow system, commission handling, refund management
- **reviews**: Multi-dimensional ratings (implementation success, revenue potential)
- **messages**: Built-in communication system between buyers and sellers
- **files**: Secure storage with access control and download limits

### Path Aliases
- `@/*` -> `./src/*`
- `@/components/*` -> `./src/components/*`
- `@/lib/*` -> `./src/lib/*`
- `@/types/*` -> `./src/types/*`
- `@/app/*` -> `./src/app/*`

## Development Patterns

### API Routes
API routes follow RESTful conventions in `src/app/api/` with proper error handling and type safety.

### Authentication Flow
Uses Supabase Auth with JWT tokens. Server-side authentication via `createServerSupabaseClient()` for protected routes.

### Payment Integration
Dual payment gateway system:
- **Stripe**: International cards with KRW currency support, webhooks, commission splits
- **Toss Pay**: Korean market integration with virtual accounts and real-time status updates
- **Escrow System**: 48-hour hold with automatic release after buyer confirmation
- **Commission**: 12-15% platform fee with automated splits
- **Utilities**: Price formatting and conversion functions in `src/lib/stripe.ts` and `src/lib/toss.ts`

### File Handling
Document processing supports multiple formats (PDF, Word, images) with validation and type restrictions.

## Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
```

## Development Status & Phases

### Current Status: Rebuilding Phase
The platform is currently in a rebuilding phase after a major refactor. Many files have been removed and are being recreated with improved architecture.

#### Recent Changes
- Major file cleanup and architecture refactor
- Simplified codebase structure for better maintainability
- Focus on core functionality over feature completeness

#### Development Priority
1. **Core Infrastructure** - Rebuild essential components
2. **Authentication System** - Implement user management
3. **Idea Marketplace** - Core buying/selling functionality
4. **Payment Integration** - Stripe and Toss Pay setup
5. **Testing & Quality** - Comprehensive test coverage

## Important Notes

- Always run `npm run type-check` and `npm run lint` before committing
- Use the pre-commit hooks (husky + lint-staged) for code quality
- Database schema changes require updating `src/types/supabase.ts` via `npm run db:generate`
- Korean localization considerations - UI supports Korean language (lang="ko" in layout)
- Currency handling uses KRW as primary with proper formatting utilities
- Security: PCI compliance maintained through payment providers, never store card data
- File limits: 50MB per file, 500MB per idea listing, with virus scanning

## Key Requirements & Features

### Functional Requirements
- **User Management**: Email/password + social login, profile verification, role-based access
- **Idea Management**: Multi-step submission, rich content editor, category selection, validation workflow
- **Transaction System**: Dual payment gateways, escrow system, automatic commission splits
- **Search & Discovery**: Full-text search, advanced filtering, recommendation engine
- **Communication**: Built-in messaging, email notifications, file sharing
- **Reviews**: Multi-dimensional ratings (implementation success, revenue potential)
- **Admin Tools**: Content moderation, analytics dashboard, dispute resolution

### Non-Functional Requirements
- **Performance**: <2s page load, <1s search results, 99.9% uptime SLA
- **Scalability**: Support 1,000 concurrent users, 10,000 ideas, 500 transactions/day
- **Security**: TLS 1.3, AES-256 encryption, JWT tokens, rate limiting (100 req/min)
- **Usability**: Mobile-responsive, WCAG 2.1 AA compliance, multi-language (Korean/English)
- **Browser Support**: Latest 2 versions of Chrome, Safari, Edge, Firefox

### Success Metrics
- **Revenue**: Target ₩1,500,000 MRR by Month 12
- **Users**: 1,000 MAU, <₩50,000 CAC, >₩300,000 CLV
- **Quality**: >4.5/5.0 buyer satisfaction, >70% implementation success rate
- **Performance**: <2s load time, <0.1% error rate