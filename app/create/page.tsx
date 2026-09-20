"use client";

import { useState, useRef } from "react";
import { createRaffle } from "@/actions/raffles";
import { validateImageFile, formatFileSize } from "@/lib/validation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type Step = "form" | "success";

export default function CreatePage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("form");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [success, setSuccess] = useState<{
    raffle: { slug: string; id: string };
  } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileError("");
    setSelectedFile(null);

    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setFileError(validation.error || "Archivo inválido");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFileError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const input = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      raffle_date: formData.get("raffle_date") as string,
      terms: formData.get("terms") as string,
      number_from: Number(formData.get("number_from")),
      number_to: Number(formData.get("number_to")),
      ticket_price: Number(formData.get("ticket_price")),
      whatsapp: formData.get("whatsapp") as string,
      winner_method: formData.get("winner_method") as "random" | "manual",
    };

    const file = fileInputRef.current?.files?.[0] || undefined;
    const result = await createRaffle(input, file);
    setLoading(false);

    if (result.success && result.raffle) {
      if (result.warning) {
        toast("warning", result.warning);
      } else {
        toast("success", "Rifa creada correctamente");
      }
      setSuccess({
        raffle: { slug: result.raffle.slug, id: result.raffle.id },
      });
      setStep("success");
    } else {
      setError(result.error || "Error al crear la rifa");
      toast("error", result.error || "Error al crear la rifa");
    }
  }

  // Step: Success
  if (step === "success" && success) {
    const publicUrl = `${window.location.origin}/r/${success.raffle.slug}`;
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="py-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-extrabold text-gray-900">
                Rifa creada correctamente
              </h1>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  URL publica
                </p>
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:underline text-sm break-all font-medium"
                  >
                    {publicUrl}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl);
                    }}
                    className="shrink-0 p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                    title="Copiar"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  ID de tu rifa
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-mono font-bold text-gray-900 break-all">
                    {success.raffle.id}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(success.raffle.id);
                    }}
                    className="shrink-0 p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                    title="Copiar"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <a
                href="/dashboard"
                className="block w-full text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200"
              >
                Ir al dashboard
              </a>

              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Ver mi rifa
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step: Form
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <a
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Volver al dashboard
          </a>
        </div>

        <Card>
          <CardHeader>
            <h1 className="text-lg font-bold text-gray-900">Crear tu rifa</h1>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                name="title"
                label="Premio / Nombre"
                placeholder="Ej: iPhone 17 Pro"
                required
              />

              <Textarea
                name="description"
                label="Descripción / Características"
                placeholder="Describe el premio y sus características..."
                rows={3}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen del premio (opcional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, WebP o GIF. Máximo 5MB.
                </p>
                {fileError && (
                  <p className="text-sm text-red-600 mt-1">{fileError}</p>
                )}
                {selectedFile && !fileError && (
                  <p className="text-xs text-green-600 mt-1">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <Input
                name="raffle_date"
                label="Fecha de la rifa"
                type="date"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="number_from"
                  label="Número inicial"
                  type="number"
                  min={0}
                  defaultValue={1}
                  required
                />
                <Input
                  name="number_to"
                  label="Número final"
                  type="number"
                  min={0}
                  defaultValue={100}
                  required
                />
              </div>

              <Input
                name="ticket_price"
                label="Precio del boleto"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="10000"
                required
              />

              <Input
                name="whatsapp"
                label="Tu número de WhatsApp"
                placeholder="+57 300 123 4567"
                required
              />

              <Select
                name="winner_method"
                label="Método de determinación del ganador"
                options={[
                  { value: "random", label: "Selección aleatoria" },
                  { value: "manual", label: "Manual" },
                ]}
              />

              <Textarea
                name="terms"
                label="Términos y condiciones"
                placeholder="Términos y condiciones de la rifa..."
                rows={3}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-1"
                  size="lg"
                >
                  Crear rifa
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
