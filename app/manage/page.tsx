"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { verifyRaffleCode } from "@/actions/raffles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function ManagePage() {
  const router = useRouter();
  const [raffleId, setRaffleId] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const adminWhatsApp =
    process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "5730012345678";

  function handleRequestAccess() {
    const message = `Hola, necesito recuperar los datos de acceso de mi rifa.\n\nID de la rifa: ${raffleId || "(no lo tengo)"}\n\nMe podrias ayudar?`;
    const url = `https://wa.me/${adminWhatsApp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!raffleId.trim()) {
      setError("Ingresa el ID de la rifa");
      setLoading(false);
      return;
    }

    const result = await verifyRaffleCode(raffleId.trim(), code);
    setLoading(false);

    if (result.success) {
      router.push(`/manage/${raffleId.trim()}`);
    } else {
      setError(result.error || "Codigo invalido");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardContent className="py-10 px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg shadow-orange-200">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900">
              Gestionar mi rifa
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Ingresa el ID y codigo de administracion de tu rifa
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label="ID de la rifa"
              value={raffleId}
              onChange={(e) => setRaffleId(e.target.value)}
              placeholder="UUID de la rifa"
              autoFocus
            />
            <Input
              label="Codigo de administracion"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="RIFA-XXXXXX"
            />
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
              variant="orange"
            >
              Acceder
            </Button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            El ID de la rifa se encuentra en la URL que recibiste al crearla.
          </p>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link
              href="/"
              className="block w-full text-center text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors py-2 rounded-xl hover:bg-gray-100"
            >
              ← Volver al inicio
            </Link>
          </div>

          <div className="mt-2 pt-2">
            <button
              type="button"
              onClick={handleRequestAccess}
              className="w-full flex items-center justify-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium transition-colors py-2 rounded-xl hover:bg-green-50"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Solicitar datos de acceso al administrador
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
