"use client";

import { useState, useEffect } from "react";
import { getActiveFiados } from "@/actions/fiados";
import { Card } from "@/components/ui/card";
import type { Fiado } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FiadosPage() {
  const [fiados, setFiados] = useState<Fiado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getActiveFiados();
      if (!cancelled) {
        setFiados(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Cargando publicaciones...</p>
        </div>
      </div>
    );
  }

  if (fiados.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h1 className="text-lg font-extrabold text-gray-900 mb-2">
            No hay publicaciones
          </h1>
          <p className="text-gray-500">
            Todavia no hay actividades fiadas disponibles.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            Actividades Fiadas
          </h1>
          <p className="text-gray-500">
            Productos y servicios disponibles a credito
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fiados.map((fiado) => (
            <a
              key={fiado.id}
              href={`/f/${fiado.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                {fiado.image_url && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={fiado.image_url}
                      alt={fiado.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                    {fiado.title}
                  </h3>
                  {fiado.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {fiado.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-green-600">
                      {formatCurrency(fiado.price)}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        fiado.payment_type === "immediate"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {fiado.payment_type === "immediate"
                        ? "Inmediato"
                        : "A credito"}
                    </span>
                  </div>
                  {fiado.discount_info && (
                    <p className="text-xs text-green-600 font-medium mt-2">
                      {fiado.discount_info}
                    </p>
                  )}
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
