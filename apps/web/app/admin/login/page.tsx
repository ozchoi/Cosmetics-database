import { redirect } from "next/navigation";
import { login, getSession } from "../../../lib/auth";
import { buttonClass, SectionHeader } from "../../../components/ui";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await login(email, password);
  } catch {
    redirect("/admin/login?error=1");
  }
  redirect("/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ error?: string }> }>) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  if (session) redirect("/admin");

  return (
    <div className="container-shell py-10">
      <SectionHeader
        eyebrow="管理員登入"
        title="審核及資料維護"
        body="管理功能需要角色授權，所有審核操作會保留審計紀錄。"
      />
      <form
        action={loginAction}
        className="mt-8 grid max-w-md gap-4 rounded-lg border border-[var(--line)] bg-white p-6"
      >
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-800">電郵</span>
          <input
            name="email"
            type="email"
            className="min-h-11 rounded-md border border-[var(--line)] px-3"
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-800">密碼</span>
          <input
            name="password"
            type="password"
            className="min-h-11 rounded-md border border-[var(--line)] px-3"
            required
          />
        </label>
        {params.error ? <p className="text-sm text-[var(--rose)]">登入資料不正確。</p> : null}
        <button className={buttonClass} type="submit">
          登入
        </button>
      </form>
    </div>
  );
}
