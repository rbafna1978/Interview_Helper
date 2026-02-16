import { NextResponse } from 'next/server';
import { auth } from '../[...nextauth]/route';
import { getGuestId } from '@/lib/guest';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const guestId = await getGuestId();
  if (!guestId) {
    return NextResponse.json({ ok: true });
  }

  await prisma.session.updateMany({
    where: { guestId, userId: null },
    data: { userId: session.user.id, guestId: null },
  });

  return NextResponse.json({ ok: true });
}
