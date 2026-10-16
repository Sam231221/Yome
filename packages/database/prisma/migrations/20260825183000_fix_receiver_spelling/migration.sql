ALTER TABLE "Messages" DROP CONSTRAINT IF EXISTS "Messages_recieverId_fkey";
ALTER TABLE "Messages" RENAME COLUMN "recieverId" TO "receiverId";
ALTER TABLE "Messages"
  ADD CONSTRAINT "Messages_receiverId_fkey"
  FOREIGN KEY ("receiverId") REFERENCES "User"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
