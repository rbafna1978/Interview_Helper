import { prisma } from '@/lib/prisma';

type SessionFilter = {
  userId: string | null;
  guestId: string | null;
};

export async function fetchRecentSessions(filter: SessionFilter, take = 5) {
  const where = filter.userId
    ? { userId: filter.userId }
    : filter.guestId
      ? { userId: null, guestId: filter.guestId }
      : { userId: null, guestId: null };
  return prisma.session.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
  });
}

export async function fetchSessionById(id: string) {
  return prisma.session.findUnique({
    where: { id },
  });
}
