-- CreateTable
CREATE TABLE "TempAddress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "localPart" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "providerId" TEXT,
    "providerPassword" TEXT,
    "providerToken" TEXT,
    "providerTokenAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extendedCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "addressId" TEXT NOT NULL,
    "providerMsgId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preview" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" DATETIME NOT NULL,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Message_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "TempAddress" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "TempAddress_email_key" ON "TempAddress"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TempAddress_token_key" ON "TempAddress"("token");

-- CreateIndex
CREATE INDEX "TempAddress_expiresAt_idx" ON "TempAddress"("expiresAt");

-- CreateIndex
CREATE INDEX "TempAddress_email_idx" ON "TempAddress"("email");

-- CreateIndex
CREATE INDEX "Message_addressId_idx" ON "Message"("addressId");

-- CreateIndex
CREATE INDEX "Message_receivedAt_idx" ON "Message"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Message_addressId_providerMsgId_key" ON "Message"("addressId", "providerMsgId");

