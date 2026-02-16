import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = (await request.json()) as { isDone?: boolean };
  const task = await prisma.practiceTask.findUnique({
    where: { id },
    include: { plan: true },
  });
  if (!task || task.plan.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.practiceTask.update({
    where: { id },
    data: { isDone: Boolean(payload.isDone) },
  });

  return NextResponse.json({ task: updated });
}
