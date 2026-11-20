-- CreateTable
CREATE TABLE "doctor_chats" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_chat_messages" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doctor_chats_doctor_id_last_message_at_idx" ON "doctor_chats"("doctor_id", "last_message_at");

-- CreateIndex
CREATE INDEX "doctor_chats_student_id_last_message_at_idx" ON "doctor_chats"("student_id", "last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_chats_doctor_id_student_id_key" ON "doctor_chats"("doctor_id", "student_id");

-- CreateIndex
CREATE INDEX "doctor_chat_messages_chat_id_created_at_idx" ON "doctor_chat_messages"("chat_id", "created_at");

-- CreateIndex
CREATE INDEX "doctor_chat_messages_chat_id_read_at_idx" ON "doctor_chat_messages"("chat_id", "read_at");

-- AddForeignKey
ALTER TABLE "doctor_chats" ADD CONSTRAINT "doctor_chats_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_chats" ADD CONSTRAINT "doctor_chats_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_chat_messages" ADD CONSTRAINT "doctor_chat_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "doctor_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_chat_messages" ADD CONSTRAINT "doctor_chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;