-- AlterTable
ALTER TABLE "doctor_chat_messages" ADD COLUMN "reply_to_id" TEXT;

-- CreateTable
CREATE TABLE "doctor_chat_reactions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_chat_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doctor_chat_reactions_message_id_idx" ON "doctor_chat_reactions"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_chat_reactions_message_id_user_id_key" ON "doctor_chat_reactions"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "doctor_chat_messages_reply_to_id_idx" ON "doctor_chat_messages"("reply_to_id");

-- AddForeignKey
ALTER TABLE "doctor_chat_messages" ADD CONSTRAINT "doctor_chat_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "doctor_chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_chat_reactions" ADD CONSTRAINT "doctor_chat_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "doctor_chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_chat_reactions" ADD CONSTRAINT "doctor_chat_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;