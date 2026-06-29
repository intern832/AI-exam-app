import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl items-center gap-8 md:grid-cols-[1fr_420px]">
        <section>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Học tập bằng AI</p>
          <h2 className="max-w-2xl text-4xl font-black leading-tight text-[#17201d] md:text-6xl">
            Tạo đề thi, làm bài và xem giải thích trong một nơi.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#52625a]">
            Phù hợp cho ôn tập cá nhân, lớp học nhỏ và thử nghiệm nội bộ. Đề thi được lưu lại để bạn xem lịch sử
            và cải thiện kết quả qua từng lần làm bài.
          </p>
        </section>
        <AuthForm />
      </div>
    </main>
  );
}
