import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPromotionBySlug } from "@/actions/promotions";
import { PromotionClient } from "@/components/promotion-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const promo = await getPromotionBySlug(slug);

  if (!promo) {
    return { title: "Promocion no encontrada" };
  }

  const title = `${promo.title} - Promocion`;
  const description = promo.description || `Promocion: ${promo.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: promo.image_url
        ? [{ url: promo.image_url, width: 800, height: 600 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: promo.image_url ? [promo.image_url] : [],
    },
  };
}

export default async function PromotionPage({ params }: PageProps) {
  const { slug } = await params;
  const promo = await getPromotionBySlug(slug);

  if (!promo) {
    notFound();
  }

  return <PromotionClient promotion={promo} />;
}
