import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getGuestId } from '@/lib/guest';

export async function getViewer() {
  const session = await auth();
  if (session?.user?.id) {
    const guestId = await getGuestId();
    return {
      userId: session.user.id,
      guestId,
      isGuest: false,
      email: session.user.email ?? null,
    };
  }
  const guestId = await getGuestId();
  return {
    userId: null,
    guestId,
    isGuest: true,
    email: null,
  };
}
