-- AlterTable
ALTER TABLE "doctor_chat_messages" ADD COLUMN "delivered_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "doctor_chat_messages_chat_id_delivered_at_idx" ON "doctor_chat_messages"("chat_id", "delivered_at");