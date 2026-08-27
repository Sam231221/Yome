CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "participantAId" INTEGER NOT NULL,
    "participantBId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Messages"
    ADD COLUMN "conversationId" TEXT;

INSERT INTO "Conversation" ("id", "participantAId", "participantBId", "createdAt", "updatedAt")
SELECT
    CONCAT('direct-', LEAST("senderId", "receiverId"), '-', GREATEST("senderId", "receiverId")) AS "id",
    LEAST("senderId", "receiverId") AS "participantAId",
    GREATEST("senderId", "receiverId") AS "participantBId",
    MIN("createdAt") AS "createdAt",
    CURRENT_TIMESTAMP AS "updatedAt"
FROM "Messages"
WHERE "receiverId" IS NOT NULL
GROUP BY LEAST("senderId", "receiverId"), GREATEST("senderId", "receiverId");

UPDATE "Messages" AS "m"
SET "conversationId" = CONCAT(
    'direct-',
    LEAST("m"."senderId", "m"."receiverId"),
    '-',
    GREATEST("m"."senderId", "m"."receiverId")
)
WHERE "m"."receiverId" IS NOT NULL;

CREATE UNIQUE INDEX "Conversation_participantAId_participantBId_key"
ON "Conversation"("participantAId", "participantBId");

CREATE INDEX "Conversation_participantAId_idx"
ON "Conversation"("participantAId");

CREATE INDEX "Conversation_participantBId_idx"
ON "Conversation"("participantBId");

CREATE INDEX "Messages_conversationId_idx"
ON "Messages"("conversationId");

ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_participantAId_fkey"
    FOREIGN KEY ("participantAId") REFERENCES "User"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_participantBId_fkey"
    FOREIGN KEY ("participantBId") REFERENCES "User"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE "Messages"
    ADD CONSTRAINT "Messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
