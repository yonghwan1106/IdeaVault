# Development Sprint Guide
# Based on PRD Requirements

**For Development Team**  
**Sprint Duration**: 2 weeks each  
**Total Timeline**: 8 weeks (MVP)

---

## Sprint 1: Foundation & Authentication (Week 1-2)

### Week 1 Sprint Goals
**Target**: Complete user management and basic infrastructure

#### Daily Tasks Breakdown

**Day 1-2: Database Setup**
```sql
-- Execute these SQL commands in Supabase Dashboard

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  user_type TEXT CHECK (user_type IN ('buyer', 'seller', 'both')) DEFAULT 'buyer',
  verified BOOLEAN DEFAULT false,
  bio TEXT,
  expertise_tags TEXT[],
  location VARCHAR(100),
  website_url TEXT,
  social_links JSONB,
  notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

**Day 3-4: Authentication Pages**
```typescript
// Create these files:
src/app/(auth)/login/page.tsx
src/app/(auth)/register/page.tsx
src/app/(auth)/verify/page.tsx
src/app/(auth)/reset-password/page.tsx

// Implementation checklist:
- [ ] Login form with email/password
- [ ] Registration form with validation
- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Social login (Google) integration
- [ ] Form validation using Zod
- [ ] Error handling and user feedback
- [ ] Redirect after successful auth
```

**Day 5: Profile Management**
```typescript
// Create these files:
src/app/profile/page.tsx
src/app/profile/edit/page.tsx
src/components/ProfileForm.tsx

// Implementation checklist:
- [ ] Profile view page
- [ ] Profile edit form
- [ ] Avatar upload functionality
- [ ] Bio and expertise tags
- [ ] User type selection
- [ ] Notification preferences
- [ ] Profile completion indicator
```

### Week 2 Sprint Goals
**Target**: Idea management foundation

**Day 6-7: Ideas Database Schema**
```sql
-- Ideas table
CREATE TABLE ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(250) UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  package_type TEXT CHECK (package_type IN ('idea', 'mvp', 'launch_kit')) NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 50000 AND price <= 1000000),
  currency VARCHAR(3) DEFAULT 'KRW',
  target_audience TEXT,
  revenue_model VARCHAR(100),
  implementation_difficulty INTEGER CHECK (implementation_difficulty BETWEEN 1 AND 5),
  estimated_dev_time VARCHAR(50),
  tech_stack TEXT[],
  market_size VARCHAR(100),
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'rejected')),
  validation_notes TEXT,
  preview_content TEXT,
  full_content TEXT,
  files JSONB DEFAULT '[]',
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'sold', 'archived')),
  featured BOOLEAN DEFAULT false,
  seo_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  sold_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active ideas" ON ideas
  FOR SELECT USING (status = 'active' AND validation_status = 'approved');

CREATE POLICY "Sellers can manage own ideas" ON ideas
  FOR ALL USING (auth.uid() = seller_id);

-- Trigger for updated_at
CREATE TRIGGER update_ideas_updated_at 
  BEFORE UPDATE ON ideas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_ideas_seller_id ON ideas(seller_id);
CREATE INDEX idx_ideas_category ON ideas(category);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_price ON ideas(price);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);
```

**Day 8-9: Idea Creation Form**
```typescript
// Create these files:
src/app/sell/page.tsx
src/app/sell/create/page.tsx
src/components/IdeaForm.tsx
src/lib/validations/idea.ts

// Form validation schema:
import { z } from 'zod'

export const ideaSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(500).max(3000),
  category: z.string().min(1),
  package_type: z.enum(['idea', 'mvp', 'launch_kit']),
  price: z.number().min(50000).max(1000000),
  target_audience: z.string().min(100).max(500),
  revenue_model: z.string().min(1),
  implementation_difficulty: z.number().min(1).max(5),
  tech_stack: z.array(z.string()).max(10),
  // ... other fields
})

// Implementation checklist:
- [ ] Multi-step form with progress indicator
- [ ] Real-time validation feedback
- [ ] Draft save functionality
- [ ] File upload for supporting documents
- [ ] Preview before publishing
- [ ] Rich text editor for descriptions
- [ ] Tech stack tag selector
- [ ] Price calculator with suggestions
```

**Day 10: Idea Listing & Search**
```typescript
// Create these files:
src/app/ideas/page.tsx
src/app/ideas/[slug]/page.tsx
src/components/IdeaCard.tsx
src/components/SearchFilters.tsx

// Implementation checklist:
- [ ] Grid layout for idea cards
- [ ] Search bar with real-time results
- [ ] Category filters
- [ ] Price range slider
- [ ] Sort options (price, date, popularity)
- [ ] Pagination or infinite scroll
- [ ] Loading states and skeletons
- [ ] Empty state handling
- [ ] URL state management for filters
```

### Sprint 1 Acceptance Criteria
- [ ] User can register and verify email
- [ ] User can login and logout
- [ ] User can edit profile information
- [ ] Seller can create idea drafts
- [ ] Ideas display in searchable listing
- [ ] Basic filtering and sorting works
- [ ] All forms have proper validation
- [ ] Mobile responsive design
- [ ] No critical accessibility issues

---

## Sprint 2: Commerce & Payments (Week 3-4)

### Week 3 Sprint Goals
**Target**: Payment integration and transaction management

**Day 11-12: Transaction Database & Stripe Setup**
```sql
-- Transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES ideas(id) ON DELETE RESTRICT,
  buyer_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  seller_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL, -- in KRW cents
  platform_commission INTEGER NOT NULL,
  seller_amount INTEGER NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  toss_payment_id VARCHAR(255),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'toss')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'completed', 'cancelled', 'refunded')),
  escrow_released_at TIMESTAMP WITH TIME ZONE,
  refund_requested_at TIMESTAMP WITH TIME ZONE,
  refund_reason TEXT,
  buyer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Indexes
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX idx_transactions_idea_id ON transactions(idea_id);
CREATE INDEX idx_transactions_status ON transactions(status);
```

```typescript
// src/lib/stripe-server.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function createPaymentIntent(
  amount: number,
  ideaId: string,
  buyerId: string
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount, // amount in KRW
    currency: 'krw',
    metadata: {
      idea_id: ideaId,
      buyer_id: buyerId,
    },
  })
  
  return paymentIntent
}
```

**Day 13-14: Purchase Flow Implementation**
```typescript
// Create these files:
src/app/ideas/[slug]/purchase/page.tsx
src/app/api/payments/create-intent/route.ts
src/app/api/webhooks/stripe/route.ts
src/components/PaymentForm.tsx

// Implementation checklist:
- [ ] Purchase button on idea detail page
- [ ] Checkout page with order summary
- [ ] Stripe payment form integration
- [ ] Payment success/failure pages
- [ ] Webhook handling for payment events
- [ ] Commission calculation logic
- [ ] Email notifications for transactions
- [ ] Transaction status tracking
```

**Day 15: File Access Control**
```typescript
// Create these files:
src/app/api/files/[ideaId]/route.ts
src/lib/file-access.ts

// Implementation checklist:
- [ ] Secure file download endpoints
- [ ] Purchase verification before download
- [ ] Signed URL generation with expiration
- [ ] Download tracking and limits
- [ ] Watermarked preview files
- [ ] File access revocation for refunds
```

### Week 4 Sprint Goals
**Target**: User dashboards and review system

**Day 16-17: User Dashboards**
```typescript
// Create these files:
src/app/dashboard/page.tsx
src/app/dashboard/purchases/page.tsx
src/app/dashboard/sales/page.tsx
src/app/dashboard/ideas/page.tsx

// Implementation checklist:
- [ ] Overview dashboard with key metrics
- [ ] Purchase history for buyers
- [ ] Sales analytics for sellers
- [ ] Idea management interface
- [ ] Transaction status tracking
- [ ] Quick actions and shortcuts
- [ ] Data visualization charts
- [ ] Export functionality
```

**Day 18-19: Review System**
```sql
-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5) NOT NULL,
  implementation_success INTEGER CHECK (implementation_success BETWEEN 1 AND 5),
  revenue_potential INTEGER CHECK (revenue_potential BETWEEN 1 AND 5),
  documentation_quality INTEGER CHECK (documentation_quality BETWEEN 1 AND 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Buyers can create reviews" ON reviews FOR INSERT USING (auth.uid() = reviewer_id);
CREATE POLICY "Reviewers can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = reviewer_id);
```

```typescript
// Create these files:
src/app/dashboard/reviews/page.tsx
src/components/ReviewForm.tsx
src/components/ReviewDisplay.tsx

// Implementation checklist:
- [ ] Review form with multiple rating criteria
- [ ] Review display on idea pages
- [ ] Review moderation interface
- [ ] Helpful/unhelpful voting
- [ ] Review response system for sellers
- [ ] Average rating calculations
- [ ] Review-based search ranking
```

**Day 20: Testing & Polish**
```typescript
// Testing checklist:
- [ ] Unit tests for critical functions
- [ ] Integration tests for payment flow
- [ ] End-to-end tests for user journeys
- [ ] Performance testing for concurrent users
- [ ] Security testing for vulnerabilities
- [ ] Accessibility testing with screen readers
- [ ] Cross-browser compatibility testing
- [ ] Mobile device testing
```

### Sprint 2 Acceptance Criteria
- [ ] Complete purchase flow works end-to-end
- [ ] Stripe payments process successfully
- [ ] File access is properly controlled
- [ ] User dashboards show relevant data
- [ ] Review system functions correctly
- [ ] Email notifications are sent
- [ ] All security requirements met
- [ ] Performance targets achieved

---

## Sprint 3: Enhancement (Week 5-6)

### Features for Sprint 3
- [ ] Advanced search with Algolia
- [ ] Recommendation engine
- [ ] Toss Pay integration
- [ ] Enhanced admin panel
- [ ] SEO optimization
- [ ] Analytics implementation

---

## Sprint 4: Polish & Launch (Week 7-8)

### Features for Sprint 4
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Security audit
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Launch preparation

---

## Daily Standup Template

**What did you complete yesterday?**
- Specific features/tasks completed
- Any blockers resolved

**What will you work on today?**
- Planned features/tasks
- Dependencies needed

**Any blockers or concerns?**
- Technical challenges
- Resource needs
- Questions for product owner

---

## Definition of Done Checklist

For each feature to be considered "Done":

**Code Quality**
- [ ] Code written and commented
- [ ] Code reviewed by team member
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] No critical security vulnerabilities

**User Experience**
- [ ] Feature works on desktop and mobile
- [ ] Accessible design implemented
- [ ] Error states handled gracefully
- [ ] Loading states implemented
- [ ] User feedback provided for actions

**Technical Requirements**
- [ ] Performance requirements met
- [ ] Security requirements implemented
- [ ] Data validation in place
- [ ] Error logging implemented
- [ ] Documentation updated

**Business Requirements**
- [ ] Feature meets PRD specifications
- [ ] Acceptance criteria satisfied
- [ ] Product owner approval obtained
- [ ] Analytics tracking implemented
- [ ] Ready for production deployment

---

This sprint guide provides concrete, actionable tasks for the development team to build IdeaVault according to the PRD specifications.
