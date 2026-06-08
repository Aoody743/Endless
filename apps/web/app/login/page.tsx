import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getStudioSession, isStudioAuthEnabled, studioOwnerEmail } from "@/lib/studio-auth";

export default async function LoginPage() {
  const session = await getStudioSession();
  if (session) {
    redirect("/studio");
  }

  if (!isStudioAuthEnabled()) {
    redirect("/studio");
  }

  return (
    <main className="shell min-h-screen pb-16 pt-28">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_1fr]">
        <section className="rounded-md border hairline bg-surface p-8">
          <p className="meta mb-3 uppercase">Studio access</p>
          <h1 className="serif-title text-4xl">登录写作台</h1>
          <p className="mt-4 leading-8 text-muted">
            Phase 3 开始，Studio 可以加一层轻量保护。它不做复杂成员系统，只先保证个人站的创作入口不会裸露在公网。
          </p>
        </section>
        <section className="max-w-xl rounded-md border hairline bg-surface p-8">
          <div className="mb-6">
            <p className="meta mb-2 uppercase">Owner session</p>
            <h2 className="serif-title text-3xl">Enter</h2>
          </div>
          <LoginForm defaultEmail={studioOwnerEmail()} />
        </section>
      </div>
    </main>
  );
}
