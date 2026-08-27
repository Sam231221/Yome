# Current Issues Summary

**Updated**: August 27, 2026

## Most Important Live Issues

1. **Dashboard/account request cleanup is still incomplete**
   - Core reducer/socket `any` debt has been cleaned up, but some dashboard/account flows still use component-local Axios and response parsing.
   - Biggest files: [apps/web/app/(main)/(dashboard)/dashboard/components/facebook/PeopleYouMayKnow.tsx](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/app/(main)/(dashboard)/dashboard/components/facebook/PeopleYouMayKnow.tsx:1), [apps/web/app/(main)/(dashboard)/account/page.tsx](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/app/(main)/(dashboard)/account/page.tsx:1)

2. **S3 runtime storage migration is implemented and needs AWS smoke validation**
   - New runtime uploads now use shared S3 helpers for chat media and avatars.
   - Legacy Cloudinary URLs still remain in seed/demo data and are intentionally supported for compatibility.
   - Biggest files: [packages/shared/src/storage/s3.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/packages/shared/src/storage/s3.ts:1), [services/media/src/controllers/media.controller.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/services/media/src/controllers/media.controller.ts:1), [services/user/src/controllers/user.controller.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/services/user/src/controllers/user.controller.ts:1), [apps/web/next.config.js](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/next.config.js:1)

3. **Debug logging cleanup is still incomplete**
   - Chat bootstrap/request noise is much better, but there are still frontend and service `console.*` calls worth reviewing.
   - Representative files: [apps/web/app/(main)/(dashboard)/account/page.tsx](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/app/(main)/(dashboard)/account/page.tsx:76), [apps/web/components/common/IncomingCall.tsx](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/components/common/IncomingCall.tsx:18)

4. **Notifications implementation is intentionally limited**
   - The service currently accepts valid requests and returns `202`, but there is still no actual delivery backend.
   - Biggest files: [services/notifications/src/index.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/services/notifications/src/index.ts:9), [services/notifications/src/routes/notifications.routes.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/services/notifications/src/routes/notifications.routes.ts:13), [README.md](/Users/admin/Documents/Developer/FullStackDev/Yome/README.md:1)

## Already Fixed Or Stale From The Previous Review

- The `FormInut` folder issue is stale; only `FormInput` exists now.
- Service/package strict typing is already enabled through the shared TypeScript base config.
- Shared Express error handling already exists.
- Gateway rate limiting already exists.
- The root `.env` file does not appear in current git history for this repo.
- Route validation is now in place for auth, user, and chat services.
- The `receiver` migration has been completed.
- The root `.env.example` already exists and the README now points to it.
- Cloudinary is no longer used for new runtime uploads in the media and user services.

## What We Should Do First

1. Run real AWS smoke tests for avatar, image, and audio uploads.
2. Finish standardizing the older dashboard/account request helpers to match the cleaned chat API layer.
3. Continue debug logging cleanup in dashboard/account/call flows.
4. Decide whether notifications stay as a stub or get a first real delivery backend.
5. Revisit stricter web compiler settings after the remaining dashboard typing is tightened.

## Repo Status Snapshot

- `bun run check-types:all`: passing
- `bunx tsc -p apps/web/tsconfig.json --noEmit`: passing
- Review docs: updated to match current repo state
- Recommended next code pass: AWS upload smoke verification, then dashboard/account cleanup
