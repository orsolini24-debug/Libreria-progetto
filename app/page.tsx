import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AuthForm from "@/app/components/AuthForm";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-stone-950">
      <div className="bg-stone-900 border border-stone-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-500 tracking-tight">LibrerIA</h1>
          <p className="text-stone-500 text-sm mt-1">La tua libreria personale</p>
        </div>
        <AuthForm />
      </div>
    </main>
  );
}
