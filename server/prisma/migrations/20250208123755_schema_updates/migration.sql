-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'AGENT', 'STAFF', 'ADMIN', 'MENTOR', 'TEACHER', 'STUDENT');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profilePicture" TEXT NOT NULL DEFAULT '',
    "identifier" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "userProfileId" TEXT,
    "eiId" TEXT,
    "forgotPasswordToken" TEXT,
    "forgotPasswordTokenExpiry" TIMESTAMP(3),
    "verifyToken" TEXT,
    "verifyTokenExpiry" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Messages" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "recieverId" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'text',
    "message" TEXT NOT NULL,
    "msgType" TEXT NOT NULL DEFAULT '',
    "messageStatus" TEXT NOT NULL DEFAULT 'sent',
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "about" TEXT NOT NULL DEFAULT '',
    "identifier" TEXT NOT NULL DEFAULT 'group',
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" SERIAL NOT NULL,
    "thumbnail" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationalInstitution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "accreditation" INTEGER,
    "graduationRate" INTEGER,
    "accreditation_status" TEXT NOT NULL DEFAULT '',
    "principal_name" TEXT NOT NULL DEFAULT '',
    "principal_email" TEXT NOT NULL DEFAULT '',
    "principal_phone_number" TEXT NOT NULL DEFAULT '',
    "files" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "EducationalInstitution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Infrastructure" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "classrooms" INTEGER NOT NULL,
    "library" INTEGER NOT NULL,
    "laboratories" INTEGER NOT NULL,
    "sportsFacilities" INTEGER NOT NULL,

    CONSTRAINT "Infrastructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtracurricularActivity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ExtracurricularActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cost" (
    "id" SERIAL NOT NULL,
    "tuition" INTEGER NOT NULL,
    "fees" INTEGER NOT NULL,
    "livingExpenses" INTEGER NOT NULL,

    CONSTRAINT "Cost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniSuccess" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "AlumniSuccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Followers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_MessageSeenBy" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_AdminOfGroup" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_MembersOfGroup" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_AlbumToEducationalInstitution" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_EducationalInstitutionToInfrastructure" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_EducationalInstitutionToProgram" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_EducationalInstitutionToFaculty" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_EducationalInstitutionToExtracurricularActivity" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_CostToEducationalInstitution" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AlumniSuccessToEducationalInstitution" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_userProfileId_key" ON "User"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "User_eiId_key" ON "User"("eiId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EducationalInstitution_name_key" ON "EducationalInstitution"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_Followers_AB_unique" ON "_Followers"("A", "B");

-- CreateIndex
CREATE INDEX "_Followers_B_index" ON "_Followers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MessageSeenBy_AB_unique" ON "_MessageSeenBy"("A", "B");

-- CreateIndex
CREATE INDEX "_MessageSeenBy_B_index" ON "_MessageSeenBy"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AdminOfGroup_AB_unique" ON "_AdminOfGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_AdminOfGroup_B_index" ON "_AdminOfGroup"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MembersOfGroup_AB_unique" ON "_MembersOfGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_MembersOfGroup_B_index" ON "_MembersOfGroup"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlbumToEducationalInstitution_AB_unique" ON "_AlbumToEducationalInstitution"("A", "B");

-- CreateIndex
CREATE INDEX "_AlbumToEducationalInstitution_B_index" ON "_AlbumToEducationalInstitution"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EducationalInstitutionToInfrastructure_AB_unique" ON "_EducationalInstitutionToInfrastructure"("A", "B");

-- CreateIndex
CREATE INDEX "_EducationalInstitutionToInfrastructure_B_index" ON "_EducationalInstitutionToInfrastructure"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EducationalInstitutionToProgram_AB_unique" ON "_EducationalInstitutionToProgram"("A", "B");

-- CreateIndex
CREATE INDEX "_EducationalInstitutionToProgram_B_index" ON "_EducationalInstitutionToProgram"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EducationalInstitutionToFaculty_AB_unique" ON "_EducationalInstitutionToFaculty"("A", "B");

-- CreateIndex
CREATE INDEX "_EducationalInstitutionToFaculty_B_index" ON "_EducationalInstitutionToFaculty"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EducationalInstitutionToExtracurricularActivity_AB_unique" ON "_EducationalInstitutionToExtracurricularActivity"("A", "B");

-- CreateIndex
CREATE INDEX "_EducationalInstitutionToExtracurricularActivity_B_index" ON "_EducationalInstitutionToExtracurricularActivity"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CostToEducationalInstitution_AB_unique" ON "_CostToEducationalInstitution"("A", "B");

-- CreateIndex
CREATE INDEX "_CostToEducationalInstitution_B_index" ON "_CostToEducationalInstitution"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlumniSuccessToEducationalInstitution_AB_unique" ON "_AlumniSuccessToEducationalInstitution"("A", "B");

-- CreateIndex
CREATE INDEX "_AlumniSuccessToEducationalInstitution_B_index" ON "_AlumniSuccessToEducationalInstitution"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_eiId_fkey" FOREIGN KEY ("eiId") REFERENCES "EducationalInstitution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_recieverId_fkey" FOREIGN KEY ("recieverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Followers" ADD CONSTRAINT "_Followers_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Followers" ADD CONSTRAINT "_Followers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MessageSeenBy" ADD CONSTRAINT "_MessageSeenBy_A_fkey" FOREIGN KEY ("A") REFERENCES "Messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MessageSeenBy" ADD CONSTRAINT "_MessageSeenBy_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminOfGroup" ADD CONSTRAINT "_AdminOfGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdminOfGroup" ADD CONSTRAINT "_AdminOfGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MembersOfGroup" ADD CONSTRAINT "_MembersOfGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MembersOfGroup" ADD CONSTRAINT "_MembersOfGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToEducationalInstitution" ADD CONSTRAINT "_AlbumToEducationalInstitution_A_fkey" FOREIGN KEY ("A") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToEducationalInstitution" ADD CONSTRAINT "_AlbumToEducationalInstitution_B_fkey" FOREIGN KEY ("B") REFERENCES "EducationalInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EducationalInstitutionToInfrastructure" ADD CONSTRAINT "_EducationalInstitutionToInfrastructure_A_fkey" FOREIGN KEY ("A") REFERENCES "EducationalInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EducationalInstitutionToInfrastructure" ADD CONSTRAINT "_EducationalInstitutionToInfrastructure_B_fkey" FOREIGN KEY ("B") REFERENCES "Infrastructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EducationalInstitutionToProgram" ADD CONSTRAINT "_EducationalInstitutionToProgram_A_fkey" FOREIGN KEY ("A") REFERENCES "EducationalInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EducationalInstitutionToProgram" ADD CONSTRAINT "_EducationalInstitutionToProgram_B_fkey" FOREIGN KEY ("B") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EducationalInstitutionToFaculty" ADD CONSTRAINT "_EducationalInstitutionToFaculty_A_fkey" FOREIGN KEY ("A") REFERENCES "EducationalInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EducationalInstitutionToFaculty" ADD CONSTRAINT "_EducationalInstitutionToFaculty_B_fkey" FOREIGN KEY ("B") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EducationalInstitutionToExtracurricularActivity" ADD CONSTRAINT "_EducationalInstitutionToExtracurricularActivity_A_fkey" FOREIGN KEY ("A") REFERENCES "EducationalInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EducationalInstitutionToExtracurricularActivity" ADD CONSTRAINT "_EducationalInstitutionToExtracurricularActivity_B_fkey" FOREIGN KEY ("B") REFERENCES "ExtracurricularActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CostToEducationalInstitution" ADD CONSTRAINT "_CostToEducationalInstitution_A_fkey" FOREIGN KEY ("A") REFERENCES "Cost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CostToEducationalInstitution" ADD CONSTRAINT "_CostToEducationalInstitution_B_fkey" FOREIGN KEY ("B") REFERENCES "EducationalInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlumniSuccessToEducationalInstitution" ADD CONSTRAINT "_AlumniSuccessToEducationalInstitution_A_fkey" FOREIGN KEY ("A") REFERENCES "AlumniSuccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlumniSuccessToEducationalInstitution" ADD CONSTRAINT "_AlumniSuccessToEducationalInstitution_B_fkey" FOREIGN KEY ("B") REFERENCES "EducationalInstitution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
