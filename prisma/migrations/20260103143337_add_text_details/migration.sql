/*
  Warnings:

  - The values [CMP] on the enum `Chamber` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `article` on the `Amendment` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Amendment` table. All the data in the column will be lost.
  - You are about to drop the column `dossierId` on the `Amendment` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `Amendment` table. All the data in the column will be lost.
  - You are about to drop the column `sortDate` on the `Amendment` table. All the data in the column will be lost.
  - The `status` column on the `Amendment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `LegislativeDossier` table. All the data in the column will be lost.
  - You are about to drop the column `depositDate` on the `LegislativeDossier` table. All the data in the column will be lost.
  - You are about to drop the column `promulgationDate` on the `LegislativeDossier` table. All the data in the column will be lost.
  - You are about to drop the column `shortTitle` on the `LegislativeDossier` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `LegislativeDossier` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `LegislativeDossier` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `LegislativeStage` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `LegislativeStage` table. All the data in the column will be lost.
  - You are about to drop the column `organId` on the `LegislativeStage` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `LegislativeStage` table. All the data in the column will be lost.
  - The primary key for the `LegislativeText` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `LegislativeText` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `LegislativeText` table. All the data in the column will be lost.
  - You are about to drop the column `textRef` on the `LegislativeText` table. All the data in the column will be lost.
  - You are about to drop the column `textUrl` on the `LegislativeText` table. All the data in the column will be lost.
  - You are about to drop the column `dossierId` on the `Vote` table. All the data in the column will be lost.
  - You are about to drop the `AmendmentCosigner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CauseDossier` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `uid` to the `LegislativeText` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('DM', 'GROUP', 'CAUSE');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('MEMBER', 'ADMIN');

-- AlterEnum
BEGIN;
CREATE TYPE "Chamber_new" AS ENUM ('ASSEMBLEE_NATIONALE', 'SENAT');
ALTER TABLE "LegislativeStage" ALTER COLUMN "chamber" TYPE "Chamber_new" USING ("chamber"::text::"Chamber_new");
ALTER TYPE "Chamber" RENAME TO "Chamber_old";
ALTER TYPE "Chamber_new" RENAME TO "Chamber";
DROP TYPE "Chamber_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Amendment" DROP CONSTRAINT "Amendment_dossierId_fkey";

-- DropForeignKey
ALTER TABLE "AmendmentCosigner" DROP CONSTRAINT "AmendmentCosigner_amendmentId_fkey";

-- DropForeignKey
ALTER TABLE "AmendmentCosigner" DROP CONSTRAINT "AmendmentCosigner_deputyId_fkey";

-- DropForeignKey
ALTER TABLE "CauseDossier" DROP CONSTRAINT "CauseDossier_causeId_fkey";

-- DropForeignKey
ALTER TABLE "CauseDossier" DROP CONSTRAINT "CauseDossier_dossierId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_dossierId_fkey";

-- DropIndex
DROP INDEX "Amendment_authorId_idx";

-- DropIndex
DROP INDEX "Amendment_dossierId_idx";

-- DropIndex
DROP INDEX "Amendment_groupId_idx";

-- DropIndex
DROP INDEX "Amendment_status_idx";

-- DropIndex
DROP INDEX "LegislativeDossier_status_idx";

-- DropIndex
DROP INDEX "LegislativeDossier_theme_idx";

-- DropIndex
DROP INDEX "LegislativeDossier_type_idx";

-- DropIndex
DROP INDEX "LegislativeStage_stageType_idx";

-- DropIndex
DROP INDEX "LegislativeText_stageId_key";

-- AlterTable
ALTER TABLE "Amendment" DROP COLUMN "article",
DROP COLUMN "createdAt",
DROP COLUMN "dossierId",
DROP COLUMN "number",
DROP COLUMN "sortDate",
ADD COLUMN     "lawId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "LegislativeDossier" DROP COLUMN "createdAt",
DROP COLUMN "depositDate",
DROP COLUMN "promulgationDate",
DROP COLUMN "shortTitle",
DROP COLUMN "theme",
DROP COLUMN "updatedAt",
ADD COLUMN     "title_parsed" TEXT,
ALTER COLUMN "type" SET DEFAULT 'PROJET_LOI';

-- AlterTable
ALTER TABLE "LegislativeStage" DROP COLUMN "createdAt",
DROP COLUMN "endDate",
DROP COLUMN "organId",
DROP COLUMN "startDate",
ADD COLUMN     "date" TIMESTAMP(3),
ALTER COLUMN "chamber" DROP NOT NULL,
ALTER COLUMN "stageOrder" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "LegislativeText" DROP CONSTRAINT "LegislativeText_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "textRef",
DROP COLUMN "textUrl",
ADD COLUMN     "expose" TEXT,
ADD COLUMN     "fullContent" TEXT,
ADD COLUMN     "numTexte" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "uid" TEXT NOT NULL,
ADD CONSTRAINT "LegislativeText_pkey" PRIMARY KEY ("uid");

-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "dossierId",
ADD COLUMN     "lawId" TEXT;

-- DropTable
DROP TABLE "AmendmentCosigner";

-- DropTable
DROP TABLE "CauseDossier";

-- DropEnum
DROP TYPE "AmendmentStatus";

-- CreateTable
CREATE TABLE "CauseLaw" (
    "id" TEXT NOT NULL,
    "causeId" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,

    CONSTRAINT "CauseLaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL,
    "name" TEXT,
    "causeId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedPost" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "causeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "lawId" TEXT,
    "deputyId" TEXT,
    "causeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GroupToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CauseLaw_causeId_lawId_key" ON "CauseLaw"("causeId", "lawId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_causeId_key" ON "Conversation"("causeId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "FeedPost_causeId_idx" ON "FeedPost"("causeId");

-- CreateIndex
CREATE UNIQUE INDEX "_GroupToUser_AB_unique" ON "_GroupToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_GroupToUser_B_index" ON "_GroupToUser"("B");

-- CreateIndex
CREATE INDEX "LegislativeText_stageId_idx" ON "LegislativeText"("stageId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "LegislativeDossier"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amendment" ADD CONSTRAINT "Amendment_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "LegislativeDossier"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CauseLaw" ADD CONSTRAINT "CauseLaw_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CauseLaw" ADD CONSTRAINT "CauseLaw_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "LegislativeDossier"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "LegislativeDossier"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_deputyId_fkey" FOREIGN KEY ("deputyId") REFERENCES "Deputy"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToUser" ADD CONSTRAINT "_GroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToUser" ADD CONSTRAINT "_GroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
