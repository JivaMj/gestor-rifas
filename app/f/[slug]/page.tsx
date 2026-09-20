import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFiadoBySlug } from "@/actions/fiados";
import { FiadoClient } from "@/components/fiado-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const fiado = await getFiadoBySlug(slug);

  if (!fiado) {
    return { title: "Publicacion no encontrada" };
  }

  const title = `${fiado.title} - Actividad Fiada`;
  const description =
    fiado.description || `${fiado.title} - precio: $${fiado.price}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: fiado.image_url
        ? [{ url: fiado.image_url, width: 800, height: 600 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: fiado.image_url ? [fiado.image_url] : [],
    },
  };
}

export default async function FiadoPage({ params }: PageProps) {
  const { slug } = await params;
  const fiado = await getFiadoBySlug(slug);

  if (!fiado) {
    notFound();
  }

  return <FiadoClient fiado={fiado} />;
}
