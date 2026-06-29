import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl items-center gap-8 md:grid-cols-[1fr_420px]">
        <section>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Bắt đầu học tập</p>
          <h2 className="max-w-2xl text-4xl font-black leading-tight text-[#17201d] md:text-6xl">
            Tạo tài khoản để lưu đề thi và lịch sử làm bài.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#52625a]">
            Tài khoản được tạo bằng Firebase Authentication. Firestore chỉ lưu tên và email, không lưu mật khẩu.
          </p>
        </section>
        <AuthForm initialMode="register" />
      </div>
    </main>
  );
}
