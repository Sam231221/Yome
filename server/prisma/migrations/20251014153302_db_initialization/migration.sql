/*
  Warnings:

  - You are about to drop the `Album` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AlumniSuccess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EducationalInstitution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExtracurricularActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Faculty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Infrastructure` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Program` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AlbumToEducationalInstitution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AlumniSuccessToEducationalInstitution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CostToEducationalInstitution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EducationalInstitutionToExtracurricularActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EducationalInstitutionToFaculty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EducationalInstitutionToInfrastructure` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EducationalInstitutionToProgram` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_eiId_fkey";

-- DropForeignKey
ALTER TABLE "_AlbumToEducationalInstitution" DROP CONSTRAINT "_AlbumToEducationalInstitution_A_fkey";

-- DropForeignKey
ALTER TABLE "_AlbumToEducationalInstitution" DROP CONSTRAINT "_AlbumToEducationalInstitution_B_fkey";

-- DropForeignKey
ALTER TABLE "_AlumniSuccessToEducationalInstitution" DROP CONSTRAINT "_AlumniSuccessToEducationalInstitution_A_fkey";

-- DropForeignKey
ALTER TABLE "_AlumniSuccessToEducationalInstitution" DROP CONSTRAINT "_AlumniSuccessToEducationalInstitution_B_fkey";

-- DropForeignKey
ALTER TABLE "_CostToEducationalInstitution" DROP CONSTRAINT "_CostToEducationalInstitution_A_fkey";

-- DropForeignKey
ALTER TABLE "_CostToEducationalInstitution" DROP CONSTRAINT "_CostToEducationalInstitution_B_fkey";

-- DropForeignKey
ALTER TABLE "_EducationalInstitutionToExtracurricularActivity" DROP CONSTRAINT "_EducationalInstitutionToExtracurricularActivity_A_fkey";

-- DropForeignKey
ALTER TABLE "_EducationalInstitutionToExtracurricularActivity" DROP CONSTRAINT "_EducationalInstitutionToExtracurricularActivity_B_fkey";

-- DropForeignKey
ALTER TABLE "_EducationalInstitutionToFaculty" DROP CONSTRAINT "_EducationalInstitutionToFaculty_A_fkey";

-- DropForeignKey
ALTER TABLE "_EducationalInstitutionToFaculty" DROP CONSTRAINT "_EducationalInstitutionToFaculty_B_fkey";

-- DropForeignKey
ALTER TABLE "_EducationalInstitutionToInfrastructure" DROP CONSTRAINT "_EducationalInstitutionToInfrastructure_A_fkey";

-- DropForeignKey
ALTER TABLE "_EducationalInstitutionToInfrastructure" DROP CONSTRAINT "_EducationalInstitutionToInfrastructure_B_fkey";

-- DropForeignKey
ALTER TABLE "_EducationalInstitutionToProgram" DROP CONSTRAINT "_EducationalInstitutionToProgram_A_fkey";

-- DropForeignKey
ALTER TABLE "_EducationalInstitutionToProgram" DROP CONSTRAINT "_EducationalInstitutionToProgram_B_fkey";

-- DropTable
DROP TABLE "Album";

-- DropTable
DROP TABLE "AlumniSuccess";

-- DropTable
DROP TABLE "Cost";

-- DropTable
DROP TABLE "EducationalInstitution";

-- DropTable
DROP TABLE "ExtracurricularActivity";

-- DropTable
DROP TABLE "Faculty";

-- DropTable
DROP TABLE "Infrastructure";

-- DropTable
DROP TABLE "Program";

-- DropTable
DROP TABLE "_AlbumToEducationalInstitution";

-- DropTable
DROP TABLE "_AlumniSuccessToEducationalInstitution";

-- DropTable
DROP TABLE "_CostToEducationalInstitution";

-- DropTable
DROP TABLE "_EducationalInstitutionToExtracurricularActivity";

-- DropTable
DROP TABLE "_EducationalInstitutionToFaculty";

-- DropTable
DROP TABLE "_EducationalInstitutionToInfrastructure";

-- DropTable
DROP TABLE "_EducationalInstitutionToProgram";
