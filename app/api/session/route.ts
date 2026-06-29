import { NextResponse } from "next/server";
import { destroySession, setFirebaseSession, verifyFirebaseToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { idToken?: string } | null;
  if (!body?.idToken) {
    return NextResponse.json({ message: "Thieu Firebase ID token." }, { status: 400 });
  }

  const user = await verifyFirebaseToken(body.idToken);
  if (!user) {
    return NextResponse.json({ message: "Phien dang nhap Firebase khong hop le." }, { status: 401 });
  }

  await setFirebaseSession(body.idToken);
  return NextResponse.json({ user });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
