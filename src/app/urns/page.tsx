import { db } from "@/lib/clients/db";

export default async function UrnsPage() {
  const urns = await db.metadata.findMany();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Urns</h1>
      {urns.length === 0 ? (
        <p className="mt-2 text-muted-foreground">No urns found.</p>
      ) : (
        <div>
          {urns.map((urn) => (
            <li key={urn.urnId}>{urn.urnId}</li>
          ))}
        </div>
      )}
    </main>
  );
}
