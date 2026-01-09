-- CreateEnum
CREATE TYPE "DossierType" AS ENUM ('PROJET_LOI', 'PROPOSITION_LOI', 'PROJET_LOI_ORG', 'PROJET_LOI_FIN');

-- CreateEnum
CREATE TYPE "DossierStatus" AS ENUM ('EN_COURS', 'ADOPTE', 'REJETE', 'RETIRE', 'PROMULGUE');

-- CreateEnum
CREATE TYPE "StageType" AS ENUM ('DEPOT', 'COMMISSION_FOND', 'COMMISSION_AVIS', 'SEANCE_PUBLIQUE', 'CMP', 'LECTURE_DEFINITIVE', 'CONSEIL_CONSTIT', 'PROMULGATION');

-- CreateEnum
CREATE TYPE "Chamber" AS ENUM ('ASSEMBLEE_NATIONALE', 'SENAT', 'CMP');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('POUR', 'CONTRE', 'ABSTENTION', 'NON_VOTANT');

-- CreateEnum
CREATE TYPE "AmendmentStatus" AS ENUM ('DEPOSE', 'ADOPTE', 'REJETE', 'RETIRE', 'IRRECEVABLE', 'NON_SOUTENU', 'TOMBE');

-- CreateEnum
CREATE TYPE "CauseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'WON');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('EMAIL_DEPUTY', 'SOCIAL_SHARE', 'PETITION_SIGN', 'ATTEND_EVENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PREMIUM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "bio" TEXT,
    "interests" TEXT[],
    "constituencyCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Deputy" (
    "uid" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "Deputy_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Group" (
    "uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acronym" TEXT,
    "colorCode" TEXT,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Mandate" (
    "uid" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "deputyId" TEXT NOT NULL,
    "groupId" TEXT,
    "organId" TEXT,

    CONSTRAINT "Mandate_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "LegislativeDossier" (
    "uid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT,
    "type" "DossierType" NOT NULL,
    "status" "DossierStatus" NOT NULL DEFAULT 'EN_COURS',
    "theme" TEXT,
    "depositDate" TIMESTAMP(3),
    "promulgationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegislativeDossier_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "LegislativeStage" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "stageType" "StageType" NOT NULL,
    "chamber" "Chamber" NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "organId" TEXT,
    "organName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegislativeStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegislativeText" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "textRef" TEXT,
    "textUrl" TEXT,
    "articles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegislativeText_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "uid" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "voteType" TEXT,
    "result" TEXT,
    "totalPour" INTEGER NOT NULL DEFAULT 0,
    "totalContre" INTEGER NOT NULL DEFAULT 0,
    "totalAbst" INTEGER NOT NULL DEFAULT 0,
    "dossierId" TEXT,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "VoteDetail" (
    "id" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "voteId" TEXT NOT NULL,
    "deputyId" TEXT NOT NULL,

    CONSTRAINT "VoteDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amendment" (
    "uid" TEXT NOT NULL,
    "number" TEXT,
    "content" TEXT NOT NULL,
    "expose" TEXT,
    "article" TEXT,
    "aiSummary" JSONB,
    "status" "AmendmentStatus" NOT NULL DEFAULT 'DEPOSE',
    "sortDate" TIMESTAMP(3),
    "dossierId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Amendment_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "AmendmentCosigner" (
    "id" TEXT NOT NULL,
    "amendmentId" TEXT NOT NULL,
    "deputyId" TEXT NOT NULL,

    CONSTRAINT "AmendmentCosigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cause" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" "CauseStatus" NOT NULL DEFAULT 'ACTIVE',
    "creatorId" TEXT NOT NULL,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CauseMember" (
    "id" TEXT NOT NULL,
    "causeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CauseMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CauseDeputy" (
    "id" TEXT NOT NULL,
    "causeId" TEXT NOT NULL,
    "deputyId" TEXT NOT NULL,

    CONSTRAINT "CauseDeputy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CauseDossier" (
    "id" TEXT NOT NULL,
    "causeId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,

    CONSTRAINT "CauseDossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CauseAction" (
    "id" TEXT NOT NULL,
    "causeId" TEXT NOT NULL,
    "type" "ActionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CauseAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionCompletion" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newVoteByFollowed" BOOLEAN NOT NULL DEFAULT true,
    "newAmendment" BOOLEAN NOT NULL DEFAULT false,
    "causeUpdate" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "aiCallsToday" INTEGER NOT NULL DEFAULT 0,
    "aiCallsResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DeputyToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_LegislativeDossierToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Deputy_slug_key" ON "Deputy"("slug");

-- CreateIndex
CREATE INDEX "Deputy_lastName_idx" ON "Deputy"("lastName");

-- CreateIndex
CREATE INDEX "Mandate_deputyId_idx" ON "Mandate"("deputyId");

-- CreateIndex
CREATE INDEX "Mandate_groupId_idx" ON "Mandate"("groupId");

-- CreateIndex
CREATE INDEX "LegislativeDossier_type_idx" ON "LegislativeDossier"("type");

-- CreateIndex
CREATE INDEX "LegislativeDossier_status_idx" ON "LegislativeDossier"("status");

-- CreateIndex
CREATE INDEX "LegislativeDossier_theme_idx" ON "LegislativeDossier"("theme");

-- CreateIndex
CREATE INDEX "LegislativeStage_dossierId_idx" ON "LegislativeStage"("dossierId");

-- CreateIndex
CREATE INDEX "LegislativeStage_stageType_idx" ON "LegislativeStage"("stageType");

-- CreateIndex
CREATE UNIQUE INDEX "LegislativeText_stageId_key" ON "LegislativeText"("stageId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteDetail_voteId_deputyId_key" ON "VoteDetail"("voteId", "deputyId");

-- CreateIndex
CREATE INDEX "Amendment_dossierId_idx" ON "Amendment"("dossierId");

-- CreateIndex
CREATE INDEX "Amendment_groupId_idx" ON "Amendment"("groupId");

-- CreateIndex
CREATE INDEX "Amendment_status_idx" ON "Amendment"("status");

-- CreateIndex
CREATE INDEX "Amendment_authorId_idx" ON "Amendment"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "AmendmentCosigner_amendmentId_deputyId_key" ON "AmendmentCosigner"("amendmentId", "deputyId");

-- CreateIndex
CREATE UNIQUE INDEX "Cause_slug_key" ON "Cause"("slug");

-- CreateIndex
CREATE INDEX "Cause_status_idx" ON "Cause"("status");

-- CreateIndex
CREATE INDEX "Cause_creatorId_idx" ON "Cause"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "CauseMember_causeId_userId_key" ON "CauseMember"("causeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CauseDeputy_causeId_deputyId_key" ON "CauseDeputy"("causeId", "deputyId");

-- CreateIndex
CREATE UNIQUE INDEX "CauseDossier_causeId_dossierId_key" ON "CauseDossier"("causeId", "dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "ActionCompletion_actionId_userId_key" ON "ActionCompletion"("actionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AlertPreference_userId_key" ON "AlertPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_DeputyToUser_AB_unique" ON "_DeputyToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_DeputyToUser_B_index" ON "_DeputyToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_LegislativeDossierToUser_AB_unique" ON "_LegislativeDossierToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_LegislativeDossierToUser_B_index" ON "_LegislativeDossierToUser"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_deputyId_fkey" FOREIGN KEY ("deputyId") REFERENCES "Deputy"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegislativeStage" ADD CONSTRAINT "LegislativeStage_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "LegislativeDossier"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegislativeText" ADD CONSTRAINT "LegislativeText_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "LegislativeStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "LegislativeDossier"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteDetail" ADD CONSTRAINT "VoteDetail_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteDetail" ADD CONSTRAINT "VoteDetail_deputyId_fkey" FOREIGN KEY ("deputyId") REFERENCES "Deputy"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amendment" ADD CONSTRAINT "Amendment_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "LegislativeDossier"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amendment" ADD CONSTRAINT "Amendment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Deputy"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amendment" ADD CONSTRAINT "Amendment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmendmentCosigner" ADD CONSTRAINT "AmendmentCosigner_amendmentId_fkey" FOREIGN KEY ("amendmentId") REFERENCES "Amendment"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmendmentCosigner" ADD CONSTRAINT "AmendmentCosigner_deputyId_fkey" FOREIGN KEY ("deputyId") REFERENCES "Deputy"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cause" ADD CONSTRAINT "Cause_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CauseMember" ADD CONSTRAINT "CauseMember_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CauseMember" ADD CONSTRAINT "CauseMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CauseDeputy" ADD CONSTRAINT "CauseDeputy_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CauseDeputy" ADD CONSTRAINT "CauseDeputy_deputyId_fkey" FOREIGN KEY ("deputyId") REFERENCES "Deputy"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CauseDossier" ADD CONSTRAINT "CauseDossier_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CauseDossier" ADD CONSTRAINT "CauseDossier_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "LegislativeDossier"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CauseAction" ADD CONSTRAINT "CauseAction_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "Cause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionCompletion" ADD CONSTRAINT "ActionCompletion_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "CauseAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionCompletion" ADD CONSTRAINT "ActionCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertPreference" ADD CONSTRAINT "AlertPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeputyToUser" ADD CONSTRAINT "_DeputyToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Deputy"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeputyToUser" ADD CONSTRAINT "_DeputyToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LegislativeDossierToUser" ADD CONSTRAINT "_LegislativeDossierToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "LegislativeDossier"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LegislativeDossierToUser" ADD CONSTRAINT "_LegislativeDossierToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
