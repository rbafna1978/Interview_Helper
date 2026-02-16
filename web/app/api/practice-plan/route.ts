import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ plan: null }, { status: 200 });
  }

  const plan = await prisma.practicePlan.findFirst({
    where: { userId },
    orderBy: { startDate: 'desc' },
    include: { tasks: true },
  });

  return NextResponse.json({ plan });
}
