"use client";

import { useState, useEffect } from "react";
import { getActivePromotions } from "@/actions/promotions";
import { Card } from "@/components/ui/card";
import type { Promotion } from "@/types";

export default function PromosPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getActivePromotions();
      if (!cancelled) {
        setPromos(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Cargando promociones...</p>
        </div>
      </div>
    );
  }

  if (promos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h1 className="text-lg font-extrabold text-gray-900 mb-2">No hay promociones</h1>
          <p className="text-gray-500">Todavia no hay promociones disponibles.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Promociones</h1>
          <p className="text-gray-500">Ofertas y descuentos disponibles</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map((promo) => (
            <a key={promo.id} href={`/promo/${promo.slug}`} target="_blank" rel="noopener noreferrer" className="block group">
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                {promo.image_url && (
                  <div className="h-40 overflow-hidden">
                    <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{promo.title}</h3>
                  {promo.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{promo.description}</p>}
                  {promo.availability && <p className="text-xs text-purple-600 font-medium">{promo.availability}</p>}
                  {promo.address && <p className="text-xs text-gray-400 mt-1">{promo.address}</p>}
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
