import { Prisma } from '@prisma/client';

type Transaction = Prisma.TransactionClient;

export async function updateSessionAssignments(
  tx: Transaction,
  sessions: Array<{
    id: string;
    subjectId: string;
    order: number;
    currentSubjectId: string;
    currentOrder: number;
  }>
): Promise<void> {
  const rowsToUpdate = sessions.filter(
    ({ subjectId, order, currentSubjectId, currentOrder }) =>
      subjectId !== currentSubjectId || order !== currentOrder
  );
  if (!rowsToUpdate.length) return;

  const rows = Prisma.join(
    rowsToUpdate.map(
      ({ id, subjectId, order }) => Prisma.sql`(${id}::uuid, ${subjectId}::uuid, ${order}::int)`
    )
  );
  await tx.$executeRaw(Prisma.sql`
    UPDATE "study_sessions" AS session
    SET "subject_id" = assignments.subject_id,
        "order" = assignments.new_order
    FROM (VALUES ${rows}) AS assignments(id, subject_id, new_order)
    WHERE session.id = assignments.id
      AND (
        session."subject_id" IS DISTINCT FROM assignments.subject_id
        OR session."order" IS DISTINCT FROM assignments.new_order
      )
  `);
}

export async function reorderDay(
  tx: Transaction,
  dayId: string,
  sessionId: string,
  order: number
): Promise<number> {
  const sessions = await tx.studySession.findMany({
    where: { dayId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, order: true },
  });
  const reordered = sessions.filter((session) => session.id !== sessionId);
  const normalizedOrder = Math.min(Math.max(order, 0), reordered.length);
  reordered.splice(normalizedOrder, 0, { id: sessionId, order: -1 });
  await updateSessionOrders(tx, reordered);
  return normalizedOrder;
}

export async function reindexDay(tx: Transaction, dayId: string): Promise<void> {
  const sessions = await tx.studySession.findMany({
    where: { dayId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, order: true },
  });
  await updateSessionOrders(tx, sessions);
}

async function updateSessionOrders(
  tx: Transaction,
  sessions: Array<{ id: string; order: number }>
): Promise<void> {
  const changedSessions = sessions
    .map((session, order) => ({ ...session, nextOrder: order }))
    .filter(({ order, nextOrder }) => order !== nextOrder);
  if (!changedSessions.length) return;

  const rows = Prisma.join(
    changedSessions.map(({ id, nextOrder }) => Prisma.sql`(${id}::uuid, ${nextOrder}::int)`)
  );
  await tx.$executeRaw(Prisma.sql`
    UPDATE "study_sessions" AS session
    SET "order" = positions.new_order
    FROM (VALUES ${rows}) AS positions(id, new_order)
    WHERE session.id = positions.id
      AND session."order" IS DISTINCT FROM positions.new_order
  `);
}
