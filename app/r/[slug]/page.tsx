import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRaffleBySlug } from "@/actions/raffles";
import { RaffleClient } from "@/components/raffle-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { raffle } = await getRaffleBySlug(slug);

  if (!raffle) {
    return { title: "Rifa no encontrada" };
  }

  const title = `${raffle.title} - Rifa`;
  const description =
    raffle.description || `Participa en la rifa de ${raffle.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: raffle.prize_image_url
        ? [{ url: raffle.prize_image_url, width: 800, height: 600 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: raffle.prize_image_url ? [raffle.prize_image_url] : [],
    },
  };
}

export default async function RafflePage({ params }: PageProps) {
  const { slug } = await params;
  const { raffle, tickets } = await getRaffleBySlug(slug);

  if (!raffle) {
    notFound();
  }

  return <RaffleClient raffle={raffle} tickets={tickets} />;
}
