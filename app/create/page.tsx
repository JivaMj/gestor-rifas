"use client";

import { useState, useRef } from "react";
import { validateCreationCode, createRaffleWithCode } from "@/actions/codes";
import { validateImageFile, formatFileSize } from "@/lib/validation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type Step = "code" | "form" | "success";

export default function CreatePage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [success, setSuccess] = useState<{
    raffle: { slug: string; id: string };
    adminCode: string;
  } | null>(null);

  // WhatsApp from admin
  const adminWhatsApp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "5730012345678";

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setCodeLoading(true);
    setCodeError("");

    const result = await validateCreationCode(code);
    setCodeLoading(false);

    if (result.valid) {
      setStep("form");
    } else {
      setCodeError(result.error || "Código inválido");
    }
  }

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
    const result = await createRaffleWithCode(code, input, file);
    setLoading(false);

    if (result.success && result.raffle && result.adminCode) {
      if (result.warning) {
        toast("warning", result.warning);
      } else {
        toast("success", "Rifa creada correctamente");
      }
      setSuccess({
        raffle: { slug: result.raffle.slug, id: result.raffle.id },
        adminCode: result.adminCode,
      });
      setStep("success");
    } else {
      setError(result.error || "Error al crear la rifa");
      toast("error", result.error || "Error al crear la rifa");
    }
  }

  // Step: Code verification
  if (step === "code") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-sm shadow-xl border-0">
          <CardContent className="py-8 px-8">
            <div className="text-center mb-6">
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
                    d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-extrabold text-gray-900">Crear rifa</h1>
              <p className="text-sm text-gray-500 mt-1">
                Ingresa el código que te dio el administrador
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CREAR-XXXXXX"
                autoFocus
                error={codeError}
              />
              <Button
                type="submit"
                loading={codeLoading}
                className="w-full"
                size="lg"
              >
                Validar código
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                ¿No tienes código? Contacta al administrador
              </p>
              <a
                href={`https://wa.me/${adminWhatsApp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 mt-2 font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Contactar por WhatsApp
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step: Success
  if (step === "success" && success) {
    const publicUrl = `${window.location.origin}/r/${success.raffle.slug}`;
    const manageUrl = `${window.location.origin}/manage/${success.raffle.id}?code=${success.adminCode}`;
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

            {/* WARNING BOX */}
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-5">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-red-600 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-extrabold text-red-800 mb-1">
                    Guarda estos datos ahora
                  </p>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Si pierdes estos datos no podras gestionar tu rifa. No hay
                    forma de recuperarlos.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Enlace de acceso rapido - PRIMERO */}
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                <div className="flex items-start gap-2 mb-2">
                  <svg
                    className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.813a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.25 8.5"
                    />
                  </svg>
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                    Enlace de acceso rapido
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <a
                    href={manageUrl}
                    className="text-sm font-mono font-bold text-red-900 break-all hover:underline"
                  >
                    {manageUrl}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(manageUrl);
                    }}
                    className="shrink-0 p-1.5 rounded-lg bg-red-200 hover:bg-red-300 transition-colors"
                    title="Copiar"
                  >
                    <svg
                      className="w-4 h-4 text-red-700"
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
                <p className="text-xs text-red-700 font-semibold">
                  Este enlace contiene tus credenciales. NO lo compartas con nadie.
                </p>
              </div>

              {/* ID de la rifa */}
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

              {/* Codigo de administracion */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                  Codigo de administracion
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-2xl font-mono font-extrabold text-amber-900">
                    {success.adminCode}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(success.adminCode);
                    }}
                    className="shrink-0 p-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 transition-colors"
                    title="Copiar"
                  >
                    <svg
                      className="w-4 h-4 text-amber-700"
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
                <p className="text-xs text-amber-700 mt-2">
                  Con este codigo accedes a gestionar tu rifa en{" "}
                  <span className="font-mono font-semibold">/manage</span>
                </p>
              </div>

              {/* URL publica */}
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

              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200"
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
          <button
            onClick={() => setStep("code")}
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
            Cambiar código
          </button>
        </div>

        <Card>
          <CardHeader>
            <h1 className="text-lg font-bold text-gray-900">Crear tu rifa</h1>
            <p className="text-sm text-gray-500">
              Código: <span className="font-mono font-medium">{code}</span>
            </p>
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
