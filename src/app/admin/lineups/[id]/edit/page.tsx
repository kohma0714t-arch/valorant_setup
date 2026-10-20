import { notFound } from "next/navigation";
import { LineupForm } from "@/components/admin/LineupForm";
import { getCharacters, getLineup, getMaps, getPurposes } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLineupPage({ params }: PageProps) {
  const { id } = await params;
  const [maps, characters, purposes, lineup] = await Promise.all([
    getMaps(),
    getCharacters(),
    getPurposes(),
    getLineup(id, { includeDraft: true }),
  ]);

  if (!lineup) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-fg">
          EDIT LINEUP
        </h2>
        <p className="text-xs text-muted">
          定点ID: <code className="font-mono text-fg">{lineup.id}</code> の編集
        </p>
      </div>

      <LineupForm
        maps={maps}
        characters={characters}
        purposes={purposes}
        initialLineup={lineup}
      />
    </div>
  );
}
