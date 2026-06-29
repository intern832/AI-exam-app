"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FileJson, Upload } from "lucide-react";

export function ImportJsonPanel({ examId }: { examId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    try {
      const parsed = JSON.parse(jsonText);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      const response = await fetch(`/api/exams/${examId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, replaceExisting })
      });
      const data = (await response.json().catch(() => null)) as { imported?: number; message?: string } | null;
      if (!response.ok) throw new Error(data?.message ?? "Khong the import JSON.");
      setMessage(`Da import ${data?.imported ?? 0} cau hoi vao de thi.`);
      setJsonText("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "JSON khong hop le.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel mb-5 rounded-[8px] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[8px] bg-[#e8f5f2] text-teal-700">
            <FileJson size={20} />
          </span>
          <div>
            <h2 className="font-bold">Import JSON</h2>
            <p className="text-sm text-[#66736c]">Paste mang cau hoi JSON va luu vao Firestore.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="btn-secondary focus-ring rounded-[8px] px-4 py-2 font-semibold"
        >
          {open ? "Dong" : "Import JSON"}
        </button>
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <textarea
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            className="focus-ring min-h-[260px] w-full rounded-[8px] border border-[#dfe5dc] bg-white px-3 py-2.5 font-mono text-sm"
            placeholder='[{"question":"...","options":["A","B","C","D"],"correct Answer":"A","explanation":"..."}]'
            required
          />
          <label className="flex items-center gap-2 text-sm text-[#52625a]">
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(event) => setReplaceExisting(event.target.checked)}
              className="size-4 accent-teal-600"
            />
            Thay the cau hoi hien tai trong de thi nay
          </label>
          {message ? (
            <div className="rounded-[8px] border border-[#dfe5dc] bg-[#f3f6f2] px-3 py-2 text-sm text-[#17201d]">
              {message}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="btn-primary focus-ring flex items-center gap-2 rounded-[8px] px-4 py-3 font-semibold disabled:cursor-wait disabled:opacity-70"
          >
            <Upload size={18} />
            {pending ? "Dang import..." : "Luu vao Firestore"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
