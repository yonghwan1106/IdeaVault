# Technical Specification - IdeaVault

## Architecture Overview

IdeaVault is designed as a modern, scalable web application optimized for rapid development using vibe coding techniques and minimal maintenance overhead.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (React-based)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: React Query + Zustand
- **Form Handling**: React Hook Form + Zod validation

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Edge Functions**: Supabase Edge Functions

### Payments & Commerce
- **Payment Processing**: Stripe + Toss Pay (Korean market)
- **Escrow**: Custom implementation with Supabase
- **Currency**: KRW primary, USD secondary

### Infrastructure
- **Hosting**: Vercel (Frontend + Edge Functions)
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics + PostHog
- **Monitoring**: Sentry
- **Email**: Resend

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('buyer', 'seller', 'both')),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### ideas
```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price INTEGER NOT NULL, -- in KRW cents
  package_type TEXT CHECK (package_type IN ('idea', 'mvp', 'launch_kit')),
  validation_status TEXT DEFAULT 'pending',
  market_research_file TEXT,
  tech_stack TEXT[],
  target_audience TEXT,
  revenue_model TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'sold', 'archived')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  commission INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'refunded')),
  escrow_released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### reviews
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  reviewer_id UUID REFERENCES users(id),
  reviewee_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Design

### Authentication Endpoints
```
POST /auth/signup
POST /auth/signin
POST /auth/signout
GET  /auth/user
PUT  /auth/profile
```

### Ideas Endpoints
```
GET    /api/ideas                # List ideas with filters
POST   /api/ideas                # Create new idea
GET    /api/ideas/:id             # Get idea details
PUT    /api/ideas/:id             # Update idea
DELETE /api/ideas/:id             # Delete idea
GET    /api/ideas/:id/files       # Download purchased files
```

### Transaction Endpoints
```
POST /api/transactions            # Initiate purchase
GET  /api/transactions/:id        # Get transaction status
POST /api/transactions/:id/complete # Complete transaction
POST /api/transactions/:id/refund # Request refund
```

### Payment Endpoints
```
POST /api/payments/create-intent  # Create Stripe payment intent
POST /api/payments/webhook        # Stripe webhook handler
GET  /api/payments/history        # Payment history
```

## Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Supabase handles token management
- **Row Level Security**: PostgreSQL RLS for data access
- **API Rate Limiting**: Edge function throttling
- **CORS**: Configured for production domains only

### Data Protection
- **File Encryption**: Sensitive documents encrypted in storage
- **PII Handling**: GDPR-compliant data processing
- **Payment Security**: PCI-DSS compliant via Stripe
- **Audit Logging**: All transactions logged for compliance

### Content Security
- **File Validation**: Type and size restrictions
- **Malware Scanning**: Integration with antivirus API
- **Content Moderation**: Manual review for sensitive content
- **Intellectual Property**: Automated prior art checking

## Performance Optimization

### Frontend Performance
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Next.js Image component with Vercel
- **Caching**: React Query for API responses
- **Bundle Analysis**: Regular bundle size monitoring

### Backend Performance
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Supabase handles automatically
- **Edge Functions**: Geographically distributed processing
- **CDN**: Static asset delivery via Vercel Edge

### Monitoring & Analytics
- **Performance Metrics**: Core Web Vitals tracking
- **Error Tracking**: Sentry integration
- **User Analytics**: PostHog for behavioral insights
- **Business Metrics**: Custom dashboard for KPIs

## Development Workflow

### Local Development
```bash
# Environment setup
npm install
cp .env.example .env.local
supabase start
npm run dev
```

### Deployment Pipeline
- **Staging**: Auto-deploy on `develop` branch
- **Production**: Manual deploy from `main` branch
- **Database Migrations**: Supabase CLI automation
- **Environment Variables**: Vercel dashboard management

### Testing Strategy
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Playwright for E2E
- **API Tests**: Supertest for backend endpoints
- **Visual Regression**: Chromatic for UI components

## Scalability Considerations

### Database Scaling
- **Read Replicas**: Supabase automatic scaling
- **Partitioning**: Time-based partitioning for large tables
- **Archiving**: Old data migration strategy
- **Backup**: Automated daily backups

### Application Scaling
- **Horizontal Scaling**: Vercel serverless functions
- **Caching Strategy**: Redis for session data
- **File Storage**: Supabase Storage with CDN
- **Search**: Integration with Algolia for advanced search

## Third-Party Integrations

### Payment Processors
```javascript
// Stripe integration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Toss Pay integration (Korean market)
const tossPayments = require('@tosspayments/payment-widget-sdk');
```

### File Processing
```javascript
// Document processing
const mammoth = require('mammoth'); // Word docs
const pdfParse = require('pdf-parse'); // PDF files
const sharp = require('sharp'); // Image optimization
```

### Communication
```javascript
// Email notifications
const resend = require('resend');

// In-app messaging
const supabase = require('@supabase/supabase-js');
```

## MVP Implementation Timeline

### Week 1: Setup & Core Infrastructure
- [x] Project initialization
- [ ] Supabase setup and schema creation
- [ ] Next.js application scaffold
- [ ] Authentication implementation

### Week 2: Core Features
- [ ] User registration and profiles
- [ ] Idea listing and creation
- [ ] File upload system
- [ ] Basic search and filtering

### Week 3: Commerce Features
- [ ] Stripe payment integration
- [ ] Transaction management
- [ ] Escrow system
- [ ] Review system

### Week 4: Polish & Launch
- [ ] UI/UX refinement
- [ ] Testing and bug fixes
- [ ] Performance optimization
- [ ] Production deployment

## Post-MVP Roadmap

### Phase 2 (Weeks 5-8)
- AI-powered idea matching
- Real-time chat system
- Advanced analytics dashboard
- Mobile responsive optimization

### Phase 3 (Weeks 9-12)
- API for third-party integrations
- Advanced search with Algolia
- Multi-currency support
- Automated IP checking

This technical specification provides a comprehensive foundation for rapid development using modern, vibe coding-friendly technologies while ensuring scalability and maintainability.
