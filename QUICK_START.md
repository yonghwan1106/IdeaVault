# IdeaVault - Quick Start Guide

## 🚀 Getting Started

This guide will help you set up the IdeaVault project for development in just a few minutes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase CLI** - [Installation guide](https://supabase.com/docs/guides/cli)

## 🛠 Project Setup

### 1. Clone and Navigate
```bash
cd C:\MYCLAUDE_PROJECT\IdeaVault
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your actual values
# You'll need to create accounts for:
# - Supabase (database)
# - Stripe (payments)
# - Resend (emails)
```

### 4. Database Setup
```bash
# Initialize Supabase
supabase init

# Start local Supabase
supabase start

# Generate TypeScript types
npm run db:generate
```

### 5. Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 🔧 Development Commands

### Core Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Testing
```bash
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests
npm run test:coverage # Test coverage report
```

### Database Operations
```bash
npm run db:reset     # Reset database to initial state
npm run db:migrate   # Run pending migrations
npm run db:generate  # Generate TypeScript types
```

### Code Quality
```bash
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run lint:fix     # Fix ESLint issues
```

## 📁 Project Structure

```
IdeaVault/
├── docs/                     # Project documentation
│   ├── project_overview.md   # Project specifications
│   ├── market_analysis.md    # Market research
│   ├── technical_spec.md     # Technical details
│   ├── business_plan.md      # Business model
│   └── development_roadmap.md # Development plan
├── src/                      # Source code (Next.js app)
│   ├── app/                  # Next.js 13+ app directory
│   ├── components/           # React components
│   ├── lib/                  # Utility libraries
│   ├── types/                # TypeScript definitions
│   └── styles/               # CSS and styling
├── assets/                   # Static assets
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
└── README.md                 # Main project documentation
```

## 🔑 Required Services Setup (완료)

### 1. Supabase (Database & Auth) *
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key to `.env.local`
4. Set up database schema using provided SQL files

### 2. Stripe (Payments) * 
1. Create account at [Stripe](https://stripe.com)
2. Get your publishable and secret keys
3. Set up webhook endpoints for payment events
4. Add keys to `.env.local`

### 3. Resend (Email) * 
1. Sign up at [Resend](https://resend.com)
2. Get your API key
3. Add to `.env.local`

## 🎯 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

### 2. Code Quality Checks
```bash
# Before committing, run:
npm run lint:fix
npm run format
npm run type-check
npm run test
```

### 3. Database Changes
```bash
# Create new migration
supabase migration new your_migration_name

# Apply migrations
npm run db:migrate

# Generate new types
npm run db:generate
```

## 📚 Key Technologies

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Modern React component library

### Backend
- **Supabase**: PostgreSQL database with real-time features
- **Supabase Auth**: User authentication and authorization
- **Stripe**: Payment processing
- **Resend**: Email delivery service

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Unit testing
- **Playwright**: End-to-end testing
- **Husky**: Git hooks for quality checks

## 🐛 Troubleshooting

### Common Issues

#### Supabase Connection Error
```bash
# Check if Supabase is running
supabase status

# Restart if needed
supabase stop
supabase start
```

#### Environment Variables Not Loading
```bash
# Ensure .env.local exists and has correct format
cp .env.example .env.local
# Edit .env.local with your values
```

#### TypeScript Errors
```bash
# Regenerate types
npm run db:generate

# Check for type errors
npm run type-check
```

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🎉 Next Steps

1. **Review Documentation**: Read through all files in the `/docs` folder
2. **Set Up Services**: Configure Supabase, Stripe, and Resend accounts
3. **Run First Build**: Ensure everything compiles successfully
4. **Create First Feature**: Start with user authentication
5. **Join Community**: Connect with other developers working on similar projects

## 📞 Support

- **Documentation**: Check `/docs` folder for detailed guides
- **Issues**: Create GitHub issues for bugs or feature requests
- **Email**: Contact sanoramyun8@gmail.com for urgent matters

## 🎯 Success Metrics

Track your development progress:
- [ ] Environment setup complete
- [ ] Local development server running
- [ ] Database connected and migrated
- [ ] Authentication working
- [ ] First feature implemented
- [ ] Tests passing
- [ ] Ready for deployment

Happy coding! 🚀
