-- AlterTable
ALTER TABLE "User"
ADD COLUMN "learningStreakDays" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN "notificationCount" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "Post"
ADD COLUMN "slug" TEXT,
ADD COLUMN "title" TEXT NOT NULL DEFAULT '',
ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'Post',
ADD COLUMN "tone" TEXT NOT NULL DEFAULT 'blue',
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "helpfulCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "answerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "commentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "shareCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "inspiredCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "topAnswerAuthor" TEXT,
ADD COLUMN "topAnswerBody" TEXT,
ADD COLUMN "projectTeam" TEXT,
ADD COLUMN "projectProgress" TEXT,
ADD COLUMN "projectStack" TEXT,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "groupId" TEXT,
ADD COLUMN "resourceId" TEXT;

-- CreateTable
CREATE TABLE "StudyRoom" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meta" TEXT NOT NULL DEFAULT '',
    "tone" TEXT NOT NULL DEFAULT 'blue',
    "symbol" TEXT NOT NULL DEFAULT 'Y',
    "activeParticipantCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'live',
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyRoomParticipant" (
    "id" TEXT NOT NULL,
    "studyRoomId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyRoomParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'blue',
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "discussionLabel" TEXT NOT NULL DEFAULT 'posts',
    "trendScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_groupId_idx" ON "Post"("groupId");
CREATE INDEX "Post_resourceId_idx" ON "Post"("resourceId");
CREATE INDEX "Post_kind_idx" ON "Post"("kind");
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

CREATE UNIQUE INDEX "StudyRoom_slug_key" ON "StudyRoom"("slug");
CREATE INDEX "StudyRoom_status_idx" ON "StudyRoom"("status");
CREATE INDEX "StudyRoom_groupId_idx" ON "StudyRoom"("groupId");
CREATE INDEX "StudyRoom_activeParticipantCount_idx" ON "StudyRoom"("activeParticipantCount");

CREATE UNIQUE INDEX "StudyRoomParticipant_studyRoomId_userId_key" ON "StudyRoomParticipant"("studyRoomId", "userId");
CREATE INDEX "StudyRoomParticipant_userId_idx" ON "StudyRoomParticipant"("userId");

CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");
CREATE UNIQUE INDEX "Topic_title_key" ON "Topic"("title");
CREATE INDEX "Topic_trendScore_idx" ON "Topic"("trendScore");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudyRoom" ADD CONSTRAINT "StudyRoom_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudyRoomParticipant" ADD CONSTRAINT "StudyRoomParticipant_studyRoomId_fkey" FOREIGN KEY ("studyRoomId") REFERENCES "StudyRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyRoomParticipant" ADD CONSTRAINT "StudyRoomParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
