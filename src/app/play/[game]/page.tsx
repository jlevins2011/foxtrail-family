import { PlaySpace } from "@/components/PlaySpace";
import { notFound } from "next/navigation";
import { games } from "@/config/games";
export const metadata = {
  title: "Your adventure",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game } = await params;
  if (!games.some((g) => g.id === game)) notFound();
  return <PlaySpace game={game} />;
}
