# 📋 Code Review Fix Checklist

Track your progress fixing the issues identified in the code review.

## 🔴 Critical Priority (Do This Week!)

- [ ] **Security: Check .env git history**

  ```bash
  git log --all --full-history -- .env
  ```

  - [ ] If found, rotate ALL credentials immediately
  - [ ] Change database password in Supabase
  - [ ] Regenerate Stream.io secret key
  - [ ] Update all services with new credentials

- [ ] **Security: Fix weak default token**
  - [ ] Generate strong token: `openssl rand -base64 32`
  - [ ] Update `.env` with strong GATEWAY_SHARED_TOKEN
  - [ ] Add validation in gateway service to reject "change-me"

- [ ] **Create .env.example**
  - [ ] Copy structure from current .env
  - [ ] Replace all values with placeholders
  - [ ] Add comments explaining each variable
  - [ ] Document which vars are required vs optional

- [ ] **Delete empty typo folder**

  ```bash
  rm -rf apps/web/components/FormInut
  ```

- [ ] **Remove debug console.log statements**
  - [ ] `apps/web/providers/StreamClientProvider.tsx:73` - Remove debug log
  - [ ] `apps/web/components/common/IncomingVideoCall.tsx:29` - Remove console.warn
  - [ ] `apps/web/components/common/IncomingCall.tsx:18` - Remove debug log
  - [ ] `apps/web/app/(communication)/chat/components/Call/Container.tsx:30` - Remove
  - [ ] Search and remove remaining: `grep -r "console\.log" apps/web`

## 🟠 High Priority (Next 2 Weeks)

### Database Schema Fixes

- [ ] **Fix "recieve" spelling**
  - [ ] Create Prisma migration file
  - [ ] Rename `recievedMessages` → `receivedMessages`
  - [ ] Rename `reciever` → `receiver`
  - [ ] Rename `recieverId` → `receiverId`
  - [ ] Run migration: `cd packages/database && bunx prisma migrate dev --name fix-spelling`
  - [ ] Generate new client: `bunx prisma generate`

- [ ] **Find and replace in code**
  ```bash
  # Use your IDE's find/replace across project
  recievedMessages → receivedMessages
  recieverId → receiverId
  reciever → receiver
  recieve → receive
  ```

  - [ ] `services/chat/src/controllers/message.controller.ts`
  - [ ] `services/chat/src/socket/handlers.ts`
  - [ ] `apps/web/context/StateReducers.ts`
  - [ ] Run search to verify all fixed: `grep -r "recieve" .`

### TypeScript Type Safety

- [ ] **Create proper type definitions**
  - [ ] Create `apps/web/types/index.ts`
  - [ ] Define User interface
  - [ ] Define Message interface
  - [ ] Define Group interface
  - [ ] Define Call interfaces
  - [ ] Export all types

- [ ] **Fix StateReducers.ts**
  - [ ] Import proper types
  - [ ] Replace `userInfo: any` with `User | undefined`
  - [ ] Replace `currentChatUser: any` with `User | undefined`
  - [ ] Replace `currentChatGroup: any` with `Group | undefined`
  - [ ] Replace `messages: any[]` with `Message[]`
  - [ ] Replace `socket: any` with proper Socket type
  - [ ] Fix Action interface to use discriminated unions
  - [ ] Test that everything still works

- [ ] **Fix other any types**
  - [ ] `apps/web/hooks/useChatSocket.ts` - Define SocketPayload
  - [ ] `apps/web/app/(main)/(dashboard)/dashboard/components/**`
  - [ ] Search: `grep -r ": any" apps/web | wc -l` should be close to 0

### API Validation

- [ ] **Add Zod to dependencies**

  ```bash
  cd services/auth && bun add zod
  cd ../user && bun add zod
  cd ../chat && bun add zod
  ```

- [ ] **Add validation to auth routes**
  - [ ] Login endpoint validation
  - [ ] Registration endpoint validation
  - [ ] Password reset validation

- [ ] **Add validation to chat routes**
  - [ ] Send message validation
  - [ ] Create group validation
  - [ ] Update message validation

- [ ] **Add validation to user routes**
  - [ ] Update profile validation
  - [ ] Follow user validation

### Other High Priority

- [ ] **Implement notifications or remove service**
  - [ ] Decision: Keep or remove?
  - [ ] If keep: Implement email notifications
  - [ ] If keep: Implement push notifications
  - [ ] If remove: Delete service folder and update docs

- [ ] **Standardize error handling**
  - [ ] Create error handler utility in shared package
  - [ ] Update all services to use shared error handler
  - [ ] Replace console.error with proper logging
  - [ ] Add error tracking (optional: Sentry integration)

## 🟡 Medium Priority (This Month)

### Database Improvements

- [ ] **Add indexes**

  ```prisma
  model Messages {
    @@index([senderId])
    @@index([recieverId])
    @@index([groupId])
    @@index([createdAt])
  }
  ```

  - [ ] Run migration
  - [ ] Test query performance improvement

- [ ] **Add unique constraint**

  ```prisma
  model Like {
    @@unique([userId, postId])
  }
  ```

  - [ ] Run migration
  - [ ] Add duplicate check in code

- [ ] **Standardize naming**
  - [ ] Use `@@map()` for snake_case DB columns
  - [ ] Ensure all TS code uses camelCase
  - [ ] Update existing code to match

### Frontend Improvements

- [ ] **Add Error Boundaries**
  - [ ] Create ErrorBoundary component
  - [ ] Wrap main app in ErrorBoundary
  - [ ] Wrap individual pages in ErrorBoundary
  - [ ] Add error logging to boundaries

- [ ] **Add Loading States**
  - [ ] Audit all async operations
  - [ ] Add loading states to forms
  - [ ] Add loading states to data fetching
  - [ ] Add skeleton loaders for better UX

- [ ] **Implement React Query or SWR**
  - [ ] Choose library (recommend React Query)
  - [ ] Install and configure
  - [ ] Replace axios calls with queries
  - [ ] Add automatic caching and revalidation

### Configuration

- [ ] **Standardize env vars**
  - [ ] Audit all environment variables
  - [ ] Standardize naming (NEXT*PUBLIC* prefix, \_URL suffix)
  - [ ] Update all .env.example files
  - [ ] Update documentation

- [ ] **Fix dotenv loading**
  - [ ] Update path in all services to load from root
  - [ ] Remove duplicate config() calls
  - [ ] Verify all services load vars correctly

### Security

- [ ] **Add auth rate limiting**
  - [ ] Install express-rate-limit in auth service
  - [ ] Configure stricter limits for login (5 per 15 min)
  - [ ] Configure limits for registration (3 per hour)
  - [ ] Add rate limit headers to responses

- [ ] **Enable TypeScript strict mode**
  - [ ] Update tsconfig.json in all packages
  - [ ] Enable `strict: true`
  - [ ] Enable `noUnusedLocals: true`
  - [ ] Fix all type errors that appear
  - [ ] Test thoroughly

## 🔵 Low Priority (Nice to Have)

- [ ] **Add git hooks**
  - [ ] Install Husky: `bunx husky-init && bun install`
  - [ ] Install lint-staged: `bun add -D lint-staged`
  - [ ] Configure pre-commit hook for linting
  - [ ] Configure pre-commit hook for formatting
  - [ ] Configure pre-commit hook for type checking

- [ ] **Improve imports**
  - [ ] Install eslint-plugin-import
  - [ ] Configure import ordering rules
  - [ ] Run auto-fix on all files
  - [ ] Ensure consistency

- [ ] **Add JSDoc comments**
  - [ ] Document all exported functions
  - [ ] Document component props
  - [ ] Document complex algorithms
  - [ ] Generate docs with TypeDoc (optional)

- [ ] **Extract magic numbers**
  - [ ] Find all magic numbers: `grep -rE "[0-9]{3,}" services`
  - [ ] Extract to named constants
  - [ ] Document purpose of each constant

- [ ] **Remove commented code**
  - [ ] Search: `grep -r "^[[:space:]]*\/\/" . | grep -v node_modules`
  - [ ] Review each commented line
  - [ ] Delete or document why kept

- [ ] **Monitoring setup**
  - [ ] Choose monitoring service (Sentry, LogRocket, etc.)
  - [ ] Create account and get API keys
  - [ ] Install SDK in frontend
  - [ ] Install SDK in backend services
  - [ ] Configure error tracking
  - [ ] Configure performance monitoring
  - [ ] Test error reporting

## 📊 Progress Tracking

### Summary

- Critical: \_\_ / 5 completed
- High: \_\_ / 11 completed
- Medium: \_\_ / 13 completed
- Low: \_\_ / 6 completed

**Total: \_\_ / 35 completed**

### Estimated Time

- Critical: ~8 hours
- High: ~40 hours (1 week)
- Medium: ~80 hours (2 weeks)
- Low: ~40 hours (1 week)

**Total: ~168 hours (4-5 weeks with 1 developer)**

---

## 🎯 Milestones

### Week 1: Security & Critical Fixes

- [ ] All critical issues resolved
- [ ] Credentials secured
- [ ] Console.logs removed
- [ ] .env.example created

### Week 2-3: Type Safety & Validation

- [ ] All spelling errors fixed
- [ ] TypeScript any types replaced
- [ ] API validation added
- [ ] Error handling standardized

### Week 4: Database & Performance

- [ ] Database indexes added
- [ ] Unique constraints added
- [ ] Query performance improved
- [ ] Loading states added

### Week 5: Polish & Tools

- [ ] Git hooks configured
- [ ] Documentation updated
- [ ] Monitoring setup (optional)
- [ ] Code review complete!

---

**Last Updated**: February 14, 2026  
**Completion**: 0% → Track your progress!
