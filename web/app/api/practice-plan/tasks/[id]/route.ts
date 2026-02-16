import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = (await request.json()) as { isDone?: boolean };
  const task = await prisma.practiceTask.findUnique({
    where: { id: params.id },
    include: { plan: true },
  });
  if (!task || task.plan.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.practiceTask.update({
    where: { id: params.id },
    data: { isDone: Boolean(payload.isDone) },
  });

  return NextResponse.json({ task: updated });
}
