import Link from "next/link";
import { BarChart3, Shield, Sparkles } from "lucide-react";
import type { User } from "@/lib/types";
import { LogoutButton } from "@/components/LogoutButton";

export function Header({ user }: { user: User }) {
  return (
    <header className="border-b border-[#dfe5dc] bg-white/82 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-[#17201d]">
          <span className="flex size-9 items-center justify-center rounded-[8px] bg-teal-600 text-white">
            <Sparkles size={18} />
          </span>
          AI Exam
        </Link>
        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-[#66736c]">Học viên</p>
          </div>
          <Link
            href="/admin"
            className="btn-secondary focus-ring flex size-10 items-center justify-center rounded-[8px]"
            title="Quản trị"
          >
            <Shield size={18} />
          </Link>
          <Link
            href="/dashboard"
            className="btn-secondary focus-ring flex size-10 items-center justify-center rounded-[8px]"
            title="Bang dieu khien"
          >
            <BarChart3 size={18} />
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
