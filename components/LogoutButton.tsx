"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase-client";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await signOut(getFirebaseAuth()).catch(() => undefined);
    await fetch("/api/session", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="btn-secondary focus-ring flex size-10 items-center justify-center rounded-[8px]"
      title="Đăng xuất"
    >
      <LogOut size={18} />
    </button>
  );
}
