"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { WandSparkles } from "lucide-react";

export function CreateExamForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      topic: String(formData.get("topic") ?? ""),
      count: Number(formData.get("count") ?? 10),
      difficulty: String(formData.get("difficulty") ?? "Trung bình")
    };

    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json().catch(() => null)) as { examId?: string; message?: string } | null;
      if (!response.ok || !data?.examId) throw new Error(data?.message ?? "Không thể tạo đề thi.");
      router.push(`/exam/${data.examId}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tạo đề thi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel rounded-[8px] p-5">
      <div className="mb-5">
        <h2 className="text-xl font-bold">Tạo đề mới</h2>
        <p className="mt-1 text-sm text-[#66736c]">Chọn chủ đề, số câu và độ khó để AI tạo đề trắc nghiệm.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-[1.5fr_0.8fr_0.8fr]">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Chủ đề kiến thức</span>
          <input
            name="topic"
            className="focus-ring w-full rounded-[8px] border border-[#dfe5dc] bg-white px-3 py-2.5"
            placeholder="Ví dụ: Machine Learning cơ bản"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Số câu</span>
          <input
            name="count"
            type="number"
            min={5}
            max={30}
            defaultValue={10}
            className="focus-ring w-full rounded-[8px] border border-[#dfe5dc] bg-white px-3 py-2.5"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Mức độ</span>
          <select
            name="difficulty"
            className="focus-ring w-full rounded-[8px] border border-[#dfe5dc] bg-white px-3 py-2.5"
            defaultValue="Trung bình"
          >
            <option>Dễ</option>
            <option>Trung bình</option>
            <option>Khó</option>
          </select>
        </label>
      </div>

      {message ? (
        <div className="mt-4 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary focus-ring mt-5 flex items-center gap-2 rounded-[8px] px-4 py-3 font-semibold disabled:cursor-wait disabled:opacity-70"
      >
        <WandSparkles size={18} />
        {pending ? "AI đang tạo đề..." : "Tạo đề bằng AI"}
      </button>
    </form>
  );
}
