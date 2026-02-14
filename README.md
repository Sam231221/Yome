# Yome - Full Stack Communication Platform

A modern, scalable full-stack communication platform built with Next.js, microservices architecture, and real-time capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Code Review Guidelines](#code-review-guidelines)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)

---

## 🎯 Overview

Yome is a comprehensive communication platform featuring:

- **Real-time Messaging**: Individual and group chat with Socket.io
- **Video Calling**: Integrated video communication using Stream.io
- **Social Features**: Posts, comments, likes, and user interactions
- **Authentication**: Secure user authentication and authorization
- **Media Management**: File uploads and media handling
- **Notifications**: Real-time notification system

## 🏗 Architecture

### Monorepo Structure

The project uses a **Turborepo monorepo** architecture with Bun as the package manager, organized into three main sections:

```
yome/
├── apps/           # Frontend applications
├── services/       # Backend microservices
└── packages/       # Shared packages and utilities
```

### Microservices Architecture

The backend follows a **microservices pattern** with dedicated services:

1. **Gateway Service** (Port 4100)
   - API Gateway and routing
   - Request validation and authentication
   - Service orchestration

2. **Auth Service** (Port 4101)
   - User authentication and authorization
   - JWT token management
   - Password encryption with bcryptjs

3. **User Service** (Port 4102)
   - User profile management
   - User operations and data

4. **Chat Service** (Port 4103)
   - Real-time messaging with Socket.io
   - Group chat management
   - Message history and status

5. **Media Service** (Port 4104)
   - File uploads and storage
   - Image processing
   - Media retrieval

6. **Notifications Service** (Port 4105)
   - Real-time notifications
   - Notification delivery and management

### Communication Flow

```
┌─────────────────┐
│   Next.js Web   │
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │ ◄──── Authentication/Routing
│  (Port 4100)    │
└────────┬────────┘
         │
         ├──────► Auth Service (4101)
         ├──────► User Service (4102)
         ├──────► Chat Service (4103) ◄──── Socket.io
         ├──────► Media Service (4104)
         └──────► Notifications (4105)
                        │
                        ▼
                ┌──────────────┐
                │  PostgreSQL  │
                │    Redis     │
                └──────────────┘
```

## 🛠 Tech Stack

### Frontend

- **Framework**: Next.js 16 (React 19)
- **Styling**: TailwindCSS with custom animations
- **State Management**: React Context API
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io Client
- **Video**: Stream.io Video React SDK
- **UI Components**: Headless UI, Framer Motion
- **Forms**: Custom form components with validation

### Backend

- **Runtime**: Bun (Node.js alternative)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.io
- **Security**: CORS, bcryptjs

### DevOps & Infrastructure

- **Containerization**: Docker & Docker Compose
- **Monorepo**: Turborepo
- **Package Manager**: Bun
- **Type Safety**: TypeScript
- **Linting**: ESLint with custom configs
- **Code Formatting**: Prettier

## 📁 Project Structure

```
yome/
├── apps/
│   └── web/                      # Next.js frontend application
│       ├── app/                  # App router pages
│       │   ├── (authentication)/ # Auth pages
│       │   ├── (communication)/  # Chat & messaging
│       │   ├── (dashboard)/      # User dashboard
│       │   ├── (general)/        # Public pages
│       │   └── api/             # API routes
│       ├── components/          # React components
│       ├── context/             # React context providers
│       ├── hooks/               # Custom React hooks
│       ├── lib/                 # Utilities and helpers
│       └── providers/           # Third-party providers
│
├── services/
│   ├── gateway/                 # API Gateway (4100)
│   ├── auth/                    # Authentication service (4101)
│   ├── user/                    # User management (4102)
│   ├── chat/                    # Chat & messaging (4103)
│   ├── media/                   # Media handling (4104)
│   └── notifications/           # Notifications (4105)
│
├── packages/
│   ├── database/               # Prisma schema & migrations
│   │   └── prisma/
│   │       └── schema.prisma   # Database schema
│   ├── shared/                 # Shared utilities
│   │   └── src/
│   │       ├── types/          # TypeScript types
│   │       ├── config/         # Configuration
│   │       ├── middleware/     # Express middleware
│   │       └── utils/          # Helper functions
│   ├── eslint-config/          # Shared ESLint configs
│   └── typescript-config/      # Shared TS configs
│
├── tests/                      # Integration tests
├── docker-compose.yml          # Docker orchestration
├── Dockerfile.service          # Service Docker image
└── turbo.json                  # Turborepo configuration
```

## 🚀 Getting Started

### Prerequisites

- **Bun**: v1.3.5 or higher
- **Node.js**: v18 or higher
- **PostgreSQL**: v16+ (or use Docker)
- **Redis**: v7+ (or use Docker)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Yome
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://yome:yome@localhost:5432/yome"
   DIRECT_URL="postgresql://yome:yome@localhost:5432/yome"

   # Service URLs
   AUTH_SERVICE_URL=http://localhost:4101
   USER_SERVICE_URL=http://localhost:4102
   CHAT_SERVICE_URL=http://localhost:4103
   MEDIA_SERVICE_URL=http://localhost:4104
   NOTIFICATIONS_SERVICE_URL=http://localhost:4105
   GATEWAY_URL=http://localhost:4100

   # NextAuth
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000

   # Stream.io (for video calling)
   NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
   STREAM_SECRET_KEY=your_stream_secret_key

   # Internal Service Authentication
   INTERNAL_SERVICE_SECRET=your_internal_secret
   ```

4. **Set up the database**

   Using Docker (recommended):

   ```bash
   docker compose up -d postgres redis
   ```

   Or install PostgreSQL and Redis locally.

5. **Run database migrations**

   ```bash
   bun run db:migrate
   ```

6. **Start development servers**

   **Option A: Start everything**

   ```bash
   bun run dev
   ```

   **Option B: Start services separately**

   ```bash
   # Terminal 1: Backend services
   bun run dev:services

   # Terminal 2: Frontend
   bun run dev:web
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Gateway: http://localhost:4100
   - Individual services on ports 4101-4105

## 💻 Development

### Available Scripts

| Script                     | Description                     |
| -------------------------- | ------------------------------- |
| `bun run dev`              | Start all services and frontend |
| `bun run dev:web`          | Start only the web frontend     |
| `bun run dev:services`     | Start all backend services      |
| `bun run dev:gateway`      | Start only the gateway service  |
| `bun run build`            | Build all apps and services     |
| `bun run lint`             | Lint all workspaces             |
| `bun run format`           | Format code with Prettier       |
| `bun run check-types`      | TypeScript type checking        |
| `bun run test`             | Run tests                       |
| `bun run test:integration` | Run integration tests           |
| `bun run db:migrate`       | Run database migrations         |

### Working with Services

Each service is a standalone Express application with:

```typescript
services/<service-name>/
├── src/
│   ├── index.ts         # Entry point
│   ├── routes/          # API routes
│   ├── controllers/     # Request handlers
│   ├── lib/             # Service utilities
│   └── ...
├── package.json
└── tsconfig.json
```

**Creating a new endpoint:**

```typescript
// services/<service>/src/routes/example.ts
import { Router } from "express";

const router = Router();

router.get("/example", async (req, res) => {
  // Your logic here
  res.json({ message: "Hello from service" });
});

export default router;
```

### Database Changes

1. **Modify the schema**

   ```bash
   # Edit packages/database/prisma/schema.prisma
   ```

2. **Create migration**

   ```bash
   cd packages/database
   bunx prisma migrate dev --name your_migration_name
   ```

3. **Generate Prisma Client**
   ```bash
   bunx prisma generate
   ```

### Adding Shared Code

Add reusable code to `packages/shared/src/`:

```typescript
// packages/shared/src/utils/myUtil.ts
export function myUtility() {
  // Implementation
}

// packages/shared/src/index.ts
export { myUtility } from "./utils/myUtil.js";
```

Use in services:

```typescript
import { myUtility } from "@repo/shared";
```

## 📝 Code Review Guidelines

### Review Checklist

#### 🔍 Code Quality

- [ ] Code follows TypeScript best practices
- [ ] No `any` types (unless absolutely necessary)
- [ ] Proper error handling with try-catch blocks
- [ ] No console.logs in production code (use logger)
- [ ] Functions are small and single-purpose
- [ ] DRY principle followed (no duplicate code)

#### 🏗 Architecture

- [ ] Code is in the correct workspace (app/service/package)
- [ ] Shared logic is in `packages/shared`
- [ ] Database queries use Prisma ORM
- [ ] API endpoints follow RESTful conventions
- [ ] Microservices communicate correctly via gateway

#### 🔐 Security

- [ ] No secrets or API keys committed
- [ ] Input validation on all endpoints
- [ ] Authentication/authorization properly implemented
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention in frontend
- [ ] CORS properly configured

#### 🎨 Frontend

- [ ] Components are reusable and well-structured
- [ ] No prop drilling (use Context when needed)
- [ ] Proper loading and error states
- [ ] Responsive design tested
- [ ] Accessibility considerations (ARIA labels, keyboard navigation)
- [ ] Images optimized and use Next.js Image component

#### 🔧 Backend

- [ ] API responses follow consistent format
- [ ] Proper HTTP status codes used
- [ ] Database queries optimized (avoid N+1)
- [ ] Middleware used appropriately
- [ ] Error handling middleware in place
- [ ] Request validation implemented

#### 📦 Dependencies

- [ ] No unnecessary dependencies added
- [ ] Dependencies installed in correct workspace
- [ ] Lock file updated (`bun.lock`)
- [ ] Peer dependencies compatible

#### 🧪 Testing

- [ ] New features have tests
- [ ] Edge cases considered
- [ ] Tests pass locally
- [ ] Integration tests updated if needed

#### 📚 Documentation

- [ ] Complex logic is commented
- [ ] API endpoints documented
- [ ] README updated if architecture changes
- [ ] JSDoc comments for exported functions

#### 🚀 Performance

- [ ] No unnecessary re-renders (React)
- [ ] Database queries use indexes
- [ ] Large lists virtualized
- [ ] Images lazy-loaded
- [ ] Bundle size considered

### Review Process

1. **Self-Review**: Review your own changes first
2. **PR Description**: Write clear description of changes
3. **Run Tests**: Ensure all tests pass
4. **Type Check**: Run `bun run check-types`
5. **Lint**: Run `bun run lint` and fix issues
6. **Request Review**: Assign to team member
7. **Address Feedback**: Make requested changes
8. **Merge**: Squash and merge when approved

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(chat): add group message read receipts

- Implement seenBy tracking for group messages
- Update UI to show read status
- Add database migration for seenBy relation

Closes #123
```

```
fix(auth): resolve token expiration issue

Token was not being properly refreshed after expiration.
Now using refresh token rotation for better security.
```

## 🌍 Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=            # Prisma connection URL
DIRECT_URL=             # Direct database connection

# Services
AUTH_SERVICE_URL=       # Auth service endpoint
USER_SERVICE_URL=       # User service endpoint
CHAT_SERVICE_URL=       # Chat service endpoint
MEDIA_SERVICE_URL=      # Media service endpoint
NOTIFICATIONS_SERVICE_URL= # Notifications service endpoint

# Authentication
NEXTAUTH_SECRET=        # NextAuth.js secret
NEXTAUTH_URL=          # Frontend URL
INTERNAL_SERVICE_SECRET= # Inter-service communication secret

# Stream.io (Video)
NEXT_PUBLIC_STREAM_API_KEY= # Public API key
STREAM_SECRET_KEY=          # Secret key
```

### Optional Variables

```env
# Redis
REDIS_URL=             # Redis connection URL (default: localhost:6379)

# Email (for notifications)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Node Environment
NODE_ENV=              # development | production | test
```

## 🐳 Docker Deployment

### Development with Docker

Run the entire stack locally:

```bash
docker compose up -d
```

This starts:

- PostgreSQL (port 5432)
- Redis (port 6379)
- All microservices (ports 4101-4105)

### Building Individual Services

```bash
# Build a specific service
docker build -f Dockerfile.service \
  --build-arg SERVICE_DIR=services/auth \
  -t yome-auth .

# Run the service
docker run -p 4101:4101 --env-file .env yome-auth
```

### Production Deployment

1. **Build all services**

   ```bash
   docker compose build
   ```

2. **Deploy to your infrastructure**
   - Use Docker Swarm, Kubernetes, or cloud services
   - Ensure environment variables are properly configured
   - Set up persistent volumes for PostgreSQL data
   - Configure proper networking between services

### Health Checks

PostgreSQL health check is configured in docker-compose:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U yome -d yome"]
  interval: 5s
  timeout: 5s
  retries: 5
```

---

## 📞 Support & Contributing

### Getting Help

- Check existing documentation
- Review closed issues for similar problems
- Ask in team channels

### Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Follow code review guidelines
4. Submit a pull request
5. Wait for review and approval

---

## 📄 License

[Add your license information here]

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Turborepo](https://turbo.build/)
- Database with [Prisma](https://www.prisma.io/)
- Real-time with [Socket.io](https://socket.io/)
- Video calls via [Stream.io](https://getstream.io/)

---

**Last Updated**: February 2026
