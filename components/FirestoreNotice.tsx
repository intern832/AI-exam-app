import Link from "next/link";

export function FirestoreNotice({ message }: { message: string }) {
  return (
    <section className="panel rounded-[8px] p-5">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-700">Firebase</p>
      <h2 className="mt-2 text-xl font-bold">Không thể tải dữ liệu Firestore</h2>
      <p className="mt-2 text-[#66736c]">{message}</p>
      <p className="mt-3 text-sm text-[#66736c]">
        Vui lòng kiểm tra Firestore Rules, đăng nhập lại, hoặc xác nhận các biến môi trường Firebase trong `.env.local`.
      </p>
      <Link href="/login" className="btn-primary focus-ring mt-5 inline-flex rounded-[8px] px-4 py-3 font-semibold">
        Về trang đăng nhập
      </Link>
    </section>
  );
}
