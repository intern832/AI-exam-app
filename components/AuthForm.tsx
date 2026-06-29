"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";
import { getFirebaseAuth, getFirebaseConfigError, getFirebaseDb } from "@/lib/firebase-client";

function firebaseErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code.includes("auth/email-already-in-use")) return "Email này đã được đăng ký.";
  if (code.includes("auth/invalid-email")) return "Email không hợp lệ.";
  if (code.includes("auth/weak-password")) return "Mật khẩu cần mạnh hơn.";
  if (code.includes("auth/invalid-credential")) return "Email hoặc mật khẩu không đúng.";
  if (code.includes("auth/network-request-failed")) return "Không thể kết nối Firebase. Vui lòng thử lại.";
  return "Không thể xử lý đăng nhập. Vui lòng thử lại.";
}

export function AuthForm({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [message, setMessage] = useState<string | null>(getFirebaseConfigError());
  const [pending, setPending] = useState(false);

  async function syncSession() {
    const auth = getFirebaseAuth();
    const idToken = await auth.currentUser?.getIdToken(true);
    if (!idToken) throw new Error("Không lấy được phiên đăng nhập Firebase.");
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(data?.message ?? "Không thể đồng bộ phiên đăng nhập.");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const auth = getFirebaseAuth();
      const firestore = getFirebaseDb();

      if (mode === "register") {
        if (name.length < 2) throw new Error("Vui lòng nhập họ tên.");
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        await setDoc(doc(firestore, "users", credential.user.uid), {
          userId: credential.user.uid,
          name,
          email,
          createdAt: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      await syncSession();
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error && !("code" in error) ? error.message : firebaseErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="panel w-full max-w-md rounded-[8px] p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-[8px] bg-teal-600 text-white">
          <GraduationCap size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#17201d]">AI Exam</h1>
          <p className="text-sm text-[#66736c]">Tạo đề thi trắc nghiệm tiếng Việt</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-[8px] bg-[#edf3ef] p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`focus-ring rounded-[7px] px-3 py-2 text-sm font-semibold ${
            mode === "login" ? "bg-white shadow-sm" : "text-[#66736c]"
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`focus-ring rounded-[7px] px-3 py-2 text-sm font-semibold ${
            mode === "register" ? "bg-white shadow-sm" : "text-[#66736c]"
          }`}
        >
          Đăng ký
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "register" ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Họ tên</span>
            <input
              name="name"
              className="focus-ring w-full rounded-[8px] border border-[#dfe5dc] bg-white px-3 py-2.5"
              placeholder="Nguyễn Văn A"
              required
            />
          </label>
        ) : null}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            className="focus-ring w-full rounded-[8px] border border-[#dfe5dc] bg-white px-3 py-2.5"
            placeholder="ban@example.com"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Mật khẩu</span>
          <input
            name="password"
            type="password"
            minLength={6}
            className="focus-ring w-full rounded-[8px] border border-[#dfe5dc] bg-white px-3 py-2.5"
            placeholder="Tối thiểu 6 ký tự"
            required
          />
        </label>

        {message ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary focus-ring flex w-full items-center justify-center gap-2 rounded-[8px] px-4 py-3 font-semibold disabled:cursor-wait disabled:opacity-70"
        >
          {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
          {pending ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </button>
      </form>
    </div>
  );
}
