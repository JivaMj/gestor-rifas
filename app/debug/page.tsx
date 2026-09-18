"use client";

import { useState } from "react";
import { testConnection } from "@/actions/test";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type TestResult = Awaited<ReturnType<typeof testConnection>>;

export default function DebugPage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTest() {
    setLoading(true);
    setError("");
    try {
      const data = await testConnection();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al ejecutar prueba");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Diagnóstico de conexión
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Verifica que Supabase esté configurado correctamente.
        </p>

        <Button onClick={handleTest} loading={loading} size="lg" className="mb-6">
          Probar conexión
        </Button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Env vars */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Variables de entorno</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm font-mono">
                  <Row
                    label="SUPABASE_URL"
                    value={result.envVars.url}
                    ok={result.envVars.url !== "VACÍA"}
                  />
                  <Row
                    label="ANON_KEY"
                    value={result.envVars.anonKey}
                    ok={result.envVars.anonKey !== "VACÍA"}
                  />
                  <Row
                    label="SERVICE_KEY"
                    value={result.envVars.serviceKey}
                    ok={result.envVars.serviceKey !== "VACÍA"}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Clients */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Clientes Supabase</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <Row
                    label="Cliente anónimo"
                    value={result.anonClient.ok ? "Conectado" : result.anonClient.error || "Error"}
                    ok={result.anonClient.ok}
                  />
                  <Row
                    label="Cliente admin (service role)"
                    value={result.adminClient.ok ? "Conectado" : result.adminClient.error || "Error"}
                    ok={result.adminClient.ok}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Storage */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Storage</h2>
              </CardHeader>
              <CardContent>
                <Row
                  label="Bucket raffle-images"
                  value={result.storageBucket.ok ? "Existe y es accesible" : result.storageBucket.error || "Error"}
                  ok={result.storageBucket.ok}
                />
              </CardContent>
            </Card>

            {/* Tables */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Tablas</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <Row
                    label="raffles"
                    value={result.tableRaffles.ok ? `${result.tableRaffles.count} registros` : result.tableRaffles.error || "Error"}
                    ok={result.tableRaffles.ok}
                  />
                  <Row
                    label="tickets"
                    value={result.tableTickets.ok ? `${result.tableTickets.count} registros` : result.tableTickets.error || "Error"}
                    ok={result.tableTickets.ok}
                  />
                  <Row
                    label="creation_codes"
                    value={result.tableCreationCodes.ok ? `${result.tableCreationCodes.count} registros` : result.tableCreationCodes.error || "Error"}
                    ok={result.tableCreationCodes.ok}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <div className={`rounded-xl p-4 text-sm font-medium ${
              result.envVars.url !== "VACÍA" &&
              result.adminClient.ok &&
              result.storageBucket.ok &&
              result.tableRaffles.ok &&
              result.tableTickets.ok &&
              result.tableCreationCodes.ok
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              {result.envVars.url !== "VACÍA" &&
              result.adminClient.ok &&
              result.storageBucket.ok &&
              result.tableRaffles.ok &&
              result.tableTickets.ok &&
              result.tableCreationCodes.ok
                ? "Todo conecta correctamente. Puedes usar la aplicación."
                : "Hay errores de conexión. Revisa los puntos marcados en rojo."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-600 shrink-0">{label}</span>
      <span className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${ok ? "bg-green-500" : "bg-red-500"}`} />
        <span className={`truncate ${ok ? "text-gray-900" : "text-red-600"}`}>
          {value}
        </span>
      </span>
    </div>
  );
}
