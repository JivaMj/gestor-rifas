"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [signupCode, setSignupCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signupUser(email, password, name, businessType, location, signupCode);
    setLoading(false);

    if (result.success) {
      router.push("/login");
    } else {
      setError(result.error || "Error al registrar");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <h1 className="text-lg font-extrabold text-gray-900">Crear cuenta</h1>
          <p className="text-sm text-gray-500 mt-1">Necesitas un codigo de acceso para registrarte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Codigo de acceso</label>
            <Input type="password" value={signupCode} onChange={(e) => setSignupCode(e.target.value)} placeholder="Codigo proporcionado por el administrador" autoFocus required />
            <p className="text-xs text-gray-400 mt-1">Solicitalo al administrador de la plataforma</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre completo</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Correo electronico</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required />
            <p className="text-xs text-gray-400 mt-1">Se usara para iniciar sesion y recuperar contrasenas</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Contrasena</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 6 caracteres" required />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Tipo de negocio (opcional)</label>
            <Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Ej: Restaurante, Tienda, Salón" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Localizacion (opcional)</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Cienaga, Magdalena" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} variant="orange" size="lg" className="w-full">
            Crear cuenta
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Ya tienes cuenta?{" "}
            <Link href="/login" className="text-amber-600 hover:text-amber-700 font-bold">
              Inicia sesion
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
