-- AddColumn: isPublicShelf on User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPublicShelf" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: Notification
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Notification
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- AddForeignKey: Notification
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ChatMessage
CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: ChatMessage
CREATE INDEX IF NOT EXISTS "ChatMessage_userId_createdAt_idx" ON "ChatMessage"("userId", "createdAt");

-- AddForeignKey: ChatMessage
ALTER TABLE "ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_userId_fkey";
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: additional Book indexes
CREATE INDEX IF NOT EXISTS "Book_userId_status_idx" ON "Book"("userId", "status");
CREATE INDEX IF NOT EXISTS "Book_series_idx" ON "Book"("series");

-- CreateIndex: additional Quote index
CREATE INDEX IF NOT EXISTS "Quote_bookId_createdAt_idx" ON "Quote"("bookId", "createdAt");

-- CreateIndex: additional ReadingSession index
CREATE INDEX IF NOT EXISTS "ReadingSession_bookId_date_idx" ON "ReadingSession"("bookId", "date");
