// src/modules/books/book-notifications.ts
import { prisma } from '../../config/prisma';

interface BookRef {
  id: string;
  title: string;
}

// A notification must never break the upload, so errors are only logged.
// dedupeKey is unique, so a retried job cannot create the same notification twice.
async function notifyBookReady(userId: string, book: BookRef) {
  await prisma.notification.upsert({
    where: { dedupeKey: `book-ready:${book.id}` },
    create: {
      userId,
      type: 'BOOK_READY',
      title: 'تم رفع الكتاب بنجاح',
      body: `كتاب «${book.title}» أصبح جاهزًا، ويمكنك الآن البدء بطرح الأسئلة عنه.`,
      data: { bookId: book.id, link: `/dashboard/ai-chat/${book.id}` },
      dedupeKey: `book-ready:${book.id}`,
    },
    update: {},
  });
}

async function notifyBookFailed(userId: string, book: BookRef) {
  await prisma.notification.upsert({
    where: { dedupeKey: `book-failed:${book.id}` },
    create: {
      userId,
      type: 'BOOK_FAILED',
      title: 'تعذر تجهيز الكتاب',
      body: `حدثت مشكلة أثناء تجهيز كتاب «${book.title}»، يرجى رفعه مرة أخرى.`,
      data: { bookId: book.id, link: '/dashboard/ai-chat' },
      dedupeKey: `book-failed:${book.id}`,
    },
    update: {},
  });
}

// Looks at the final state of the book and sends the matching notification
export async function notifyBookOutcome(bookId: string) {
  try {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true, ownerId: true, status: true },
    });
    if (!book) return; // deleted in the meantime

    if (book.status === 'READY') await notifyBookReady(book.ownerId, book);
    else if (book.status === 'FAILED') await notifyBookFailed(book.ownerId, book);
  } catch (err) {
    console.error(`[books] could not send notification for ${bookId}:`, err);
  }
}