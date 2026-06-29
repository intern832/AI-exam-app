import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/lib/types";

const cookieName = "firebase_id_token";
const maxAgeSeconds = 60 * 60;

type FirebaseJwt = {
  user_id: string;
  email?: string;
  name?: string;
};

function getProjectId() {
  return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "";
}

function getJwks() {
  return createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
}

export async function setFirebaseSession(idToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, idToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: maxAgeSeconds,
    path: "/"
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(cookieName)?.value ?? null;
}

export async function verifyFirebaseToken(idToken: string) {
  const projectId = getProjectId();
  if (!projectId) return null;

  try {
    const { payload } = await jwtVerify(idToken, getJwks(), {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId
    });
    const firebasePayload = payload as FirebaseJwt;
    if (!firebasePayload.user_id) return null;
    return {
      id: firebasePayload.user_id,
      email: firebasePayload.email ?? "",
      name: firebasePayload.name ?? firebasePayload.email ?? "Nguoi dung"
    } satisfies User;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const token = await getSessionToken();
  if (!token) return null;
  return verifyFirebaseToken(token);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAuthToken() {
  const token = await getSessionToken();
  if (!token) redirect("/login");
  const user = await verifyFirebaseToken(token);
  if (!user) redirect("/login");
  return { token, user };
}

export async function requireAdmin() {
  return requireUser();
}
