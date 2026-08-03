import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Library,
  Layers,
  Link2,
  Palette,
  Plus,
  Shapes,
  Upload,
} from "lucide-react";
import { api, type DashboardStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReferenceCard } from "@/components/references/ReferenceCard";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDashboard()
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-card p-6 text-destructive">
        Failed to load dashboard: {error}
      </div>
    );
  }

  if (!stats) {
    return <div className="text-muted-foreground">Loading dashboard…</div>;
  }

  const cards = [
    { label: "References", value: stats.total, icon: Library },
    { label: "Industries", value: stats.industryCount, icon: Layers },
    { label: "Styles", value: stats.styleCount, icon: Palette },
    { label: "Patterns", value: stats.patternCount, icon: Shapes },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Reference Library
          </p>
          <h1 className="font-display mt-2 text-4xl tracking-tight md:text-5xl">
            Design intelligence at a glance
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Collect, organize, and review high-quality design references for
            Alool projects.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/import">
              <Upload /> Import JSON
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/references/quick-import">
              <Link2 /> Quick Import URL
            </Link>
          </Button>
          <Button asChild>
            <Link to="/references/new">
              <Plus /> Add Reference
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>{label}</CardDescription>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By type</CardTitle>
            <CardDescription>Distribution across reference types</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.byType.length === 0 && (
              <p className="text-sm text-muted-foreground">No references yet.</p>
            )}
            {stats.byType.map((row) => (
              <div
                key={row.type}
                className="flex items-center justify-between text-sm"
              >
                <span className="capitalize">{row.type}</span>
                <span className="font-medium">{row.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By source</CardTitle>
            <CardDescription>Where references were discovered</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.bySource.length === 0 && (
              <p className="text-sm text-muted-foreground">No references yet.</p>
            )}
            {stats.bySource.map((row) => (
              <div
                key={row.source}
                className="flex items-center justify-between text-sm"
              >
                <span>{row.source}</span>
                <span className="font-medium">{row.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent references</h2>
          <Button asChild variant="ghost">
            <Link to="/references">View all</Link>
          </Button>
        </div>
        {stats.recent.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 p-8">
              <p className="text-muted-foreground">
                Your library is empty. Add a reference or import a JSON file to
                get started.
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link to="/references/new">Add Reference</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/import">Import JSON</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.recent.map((ref) => (
              <ReferenceCard key={ref.id} reference={ref} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
