"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/gallery/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) router.replace("/admin");
      })
      .catch(() => {});
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");
      router.replace("/admin");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="mb-4 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Volver a la galería
          </Button>

          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-6 shadow-xl shadow-black/30">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-pink-500 flex items-center justify-center text-amber-950 font-bold mb-3 shadow-lg shadow-amber-500/30">
                <Lock className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-semibold">Panel de administración</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Acceso solo para el administrador del archivo
              </p>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="pl-9 bg-background/60 border-border/60"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pl-9 bg-background/60 border-border/60"
                />
              </div>

              {error && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 text-amber-950 hover:bg-amber-400 border-0 h-10"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Lock className="h-4 w-4 mr-1.5" />
                )}
                Entrar
              </Button>
            </form>

            <div className="mt-4 text-[11px] text-muted-foreground/70 text-center">
              Credenciales por defecto: <code className="text-amber-200">admin</code> /{" "}
              <code className="text-amber-200">douhal2026</code>
              <br />
              (cámbialas en producción editando la base de datos)
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
