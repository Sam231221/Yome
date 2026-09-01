-- AlterTable
ALTER TABLE "Group" ADD COLUMN "slug" TEXT;
ALTER TABLE "Group" ADD COLUMN "subject" TEXT NOT NULL DEFAULT 'General';
ALTER TABLE "Group" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Community';
ALTER TABLE "Group" ADD COLUMN "tone" TEXT NOT NULL DEFAULT 'blue';
ALTER TABLE "Group" ADD COLUMN "symbol" TEXT NOT NULL DEFAULT 'Y';
ALTER TABLE "Group" ADD COLUMN "privacy" TEXT NOT NULL DEFAULT 'Public group';
ALTER TABLE "Group" ADD COLUMN "location" TEXT NOT NULL DEFAULT 'Global';
ALTER TABLE "Group" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Group" ADD COLUMN "activeThisWeek" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Group" ADD COLUMN "projectCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Group" ADD COLUMN "mentorCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Group"
SET "slug" = lower(regexp_replace(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
WHERE "slug" IS NULL;

UPDATE "Group"
SET "slug" = "id"
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "Group" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN "groupId" TEXT;

-- CreateTable
CREATE TABLE "GroupTag" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'neutral',
    "groupId" TEXT NOT NULL,

    CONSTRAINT "GroupTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupInvitation" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupAnnouncement" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "authorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupEvent" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Group room',
    "tone" TEXT NOT NULL DEFAULT 'blue',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");
CREATE INDEX "Group_subject_idx" ON "Group"("subject");
CREATE INDEX "Group_featured_idx" ON "Group"("featured");
CREATE INDEX "GroupTag_groupId_idx" ON "GroupTag"("groupId");
CREATE UNIQUE INDEX "GroupTag_groupId_label_key" ON "GroupTag"("groupId", "label");
CREATE INDEX "GroupInvitation_userId_idx" ON "GroupInvitation"("userId");
CREATE INDEX "GroupInvitation_status_idx" ON "GroupInvitation"("status");
CREATE UNIQUE INDEX "GroupInvitation_groupId_userId_key" ON "GroupInvitation"("groupId", "userId");
CREATE INDEX "GroupAnnouncement_groupId_idx" ON "GroupAnnouncement"("groupId");
CREATE INDEX "GroupAnnouncement_pinned_idx" ON "GroupAnnouncement"("pinned");
CREATE INDEX "GroupEvent_groupId_idx" ON "GroupEvent"("groupId");
CREATE INDEX "GroupEvent_startsAt_idx" ON "GroupEvent"("startsAt");
CREATE INDEX "Resource_groupId_idx" ON "Resource"("groupId");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroupTag" ADD CONSTRAINT "GroupTag_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupInvitation" ADD CONSTRAINT "GroupInvitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupAnnouncement" ADD CONSTRAINT "GroupAnnouncement_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupAnnouncement" ADD CONSTRAINT "GroupAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroupEvent" ADD CONSTRAINT "GroupEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
