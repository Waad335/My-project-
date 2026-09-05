-- CreateEnum
CREATE TYPE "InstagramImportStatus" AS ENUM ('NEEDS_REVIEW', 'READY', 'PUBLISHED', 'REJECTED');

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "whatsappGroupUrl" TEXT DEFAULT 'https://chat.whatsapp.com/C1S3FiRHR655kXmq3gvjwn',
ALTER COLUMN "instagramUrl" SET DEFAULT 'https://www.instagram.com/dodana.girls/';

-- CreateTable
CREATE TABLE "instagram_connection" (
    "id" TEXT NOT NULL DEFAULT 'instagram',
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "igUserId" TEXT,
    "username" TEXT,
    "accessToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_imports" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "permalink" TEXT NOT NULL,
    "caption" TEXT,
    "mediaTimestamp" TIMESTAMP(3),
    "originalMediaUrl" TEXT,
    "storedImageUrl" TEXT,
    "detectedNameEn" TEXT,
    "detectedPriceEGP" DECIMAL(10,2),
    "priceNeedsReview" BOOLEAN NOT NULL DEFAULT true,
    "detectedCategorySlug" TEXT,
    "categoryNeedsReview" BOOLEAN NOT NULL DEFAULT true,
    "status" "InstagramImportStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "publishedProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instagram_imports_mediaId_key" ON "instagram_imports"("mediaId");

-- CreateIndex
CREATE INDEX "instagram_imports_status_idx" ON "instagram_imports"("status");

-- AddForeignKey
ALTER TABLE "instagram_imports" ADD CONSTRAINT "instagram_imports_publishedProductId_fkey" FOREIGN KEY ("publishedProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
