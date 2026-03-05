import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AuthForm from "@/app/components/AuthForm";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #2a1f12 0%, #1c1917 60%)" }}
    >
      <div className="bg-stone-900/80 border border-stone-800/60 p-8 rounded-2xl shadow-2xl shadow-black/60 w-full max-w-sm backdrop-blur-sm animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-amber-500 tracking-tight">
            Librer<em className="italic">IA</em>
          </h1>
          <p className="font-reading text-stone-500 text-sm mt-2 italic">
            La tua libreria personale
          </p>
          <div className="w-12 h-px bg-amber-800/40 mx-auto mt-3" />
        </div>
        <AuthForm />
      </div>
    </main>
  );
}
