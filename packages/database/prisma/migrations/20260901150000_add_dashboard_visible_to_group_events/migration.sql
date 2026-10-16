-- AlterTable
ALTER TABLE "GroupEvent" ADD COLUMN "dashboardVisible" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "GroupEvent_dashboardVisible_idx" ON "GroupEvent"("dashboardVisible");
