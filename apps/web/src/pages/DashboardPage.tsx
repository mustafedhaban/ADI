import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  api,
  type CollectionSummary,
  type DashboardStats,
  type ProjectSummary,
  type Reference,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Empty, ErrorNote, Loading, Meta } from "@/components/common/Primitives";
import { StyleTerm } from "@/components/references/StyleTerm";

const SEP = "~||~";

function relativeAge(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.round(days / 30)}mo`;
}

function TermFrequency({
  rows,
  max,
  demonstrate = false,
  axis,
}: {
  rows: Array<{ term: string; count: number }>;
  max: number;
  demonstrate?: boolean;
  axis: "styles" | "patterns" | "industries";
}) {
  return (
    <ul className="flex flex-col">
      {rows.map((row) => (
        <li key={row.term}>
          <Link
            to={`/references?${axis}=${encodeURIComponent(row.term)}`}
            className="flex items-baseline gap-3 border-b border-border py-2 transition-colors last:border-0 hover:bg-muted/40"
          >
            <span className="w-36 shrink-0 truncate text-[0.9375rem]">
              {demonstrate ? <StyleTerm term={row.term} /> : row.term}
            </span>
            <span className="relative h-px flex-1 bg-rule-strong/40">
              <span
                className="absolute inset-y-0 left-0 h-px bg-primary"
                style={{ width: `${Math.round((row.count / max) * 100)}%` }}
              />
            </span>
            <span className="tabular w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
              {row.count}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refs, setRefs] = useState<Reference[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDashboard().then(setStats).catch((e: Error) => setError(e.message));
    api.listReferences().then((r) => setRefs(r.items)).catch(() => undefined);
    api.listCollections().then((r) => setCollections(r.items)).catch(() => undefined);
    api.listProjects("active").then((r) => setProjects(r.items)).catch(() => undefined);
  }, []);

  const analysis = useMemo(() => {
    const styles = new Map<string, number>();
    const patterns = new Map<string, number>();
    const industries = new Map<string, number>();
    const pairs = new Map<string, number>();

    for (const ref of refs) {
      for (const s of ref.styles) styles.set(s, (styles.get(s) ?? 0) + 1);
      for (const p of ref.patterns) patterns.set(p, (patterns.get(p) ?? 0) + 1);
      for (const i of ref.industries) {
        industries.set(i, (industries.get(i) ?? 0) + 1);
      }
      for (const s of ref.styles) {
        for (const p of ref.patterns) {
          const key = s + SEP + p;
          pairs.set(key, (pairs.get(key) ?? 0) + 1);
        }
      }
    }

    const top = (m: Map<string, number>, n: number) =>
      [...m.entries()]
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, n);

    return {
      styles: top(styles, 8),
      patterns: top(patterns, 8),
      industries: top(industries, 8),
      pairs: [...pairs.entries()]
        .map(([key, count]) => {
          const [style, pattern] = key.split(SEP);
          return { style: style ?? "", pattern: pattern ?? "", count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      styleCount: styles.size,
      patternCount: patterns.size,
    };
  }, [refs]);

  if (error) return <ErrorNote>Failed to load dashboard: {error}</ErrorNote>;
  if (!stats) return <Loading>Loading archive…</Loading>;

  const recent = stats.recent.slice(0, 4);

  const summary = [
    { label: "References", value: stats.total, to: "/references" },
    { label: "Styles indexed", value: analysis.styleCount },
    { label: "Patterns indexed", value: analysis.patternCount },
    { label: "Collections", value: collections.length, to: "/collections" },
    { label: "Active projects", value: projects.length, to: "/projects" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <Meta className="text-primary">Dashboard</Meta>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">
            Design Intelligence
          </h1>
          <p className="prose-measure text-sm text-ink-2">
            Vault overview — co-occurrence and recent judgment, not vanity charts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/import">Bulk Import</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/references/quick-import">Quick Import</Link>
          </Button>
          <Button asChild>
            <Link to="/references/new">Add Reference</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {summary.map((s) => {
          const body = (
            <CardContent className="p-4">
              <div className="tabular font-display text-2xl leading-none">{s.value}</div>
              <Meta className="mt-2 block">{s.label}</Meta>
            </CardContent>
          );
          return s.to ? (
            <Link key={s.label} to={s.to} className="transition-opacity hover:opacity-80">
              <Card className="h-full hover:border-primary">{body}</Card>
            </Link>
          ) : (
            <Card key={s.label}>{body}</Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <Meta>Intelligence</Meta>
          <CardTitle className="text-xl md:text-2xl">
            Which styles carry which patterns
          </CardTitle>
          <CardDescription>
            Style × pattern co-occurrence across the library — open a pair to see
            every reference that proves it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysis.pairs.length === 0 ? (
            <Empty>Not enough classified references yet.</Empty>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {analysis.pairs.map((pair) => (
                <li key={pair.style + SEP + pair.pattern}>
                  <Link
                    to={`/references?styles=${encodeURIComponent(pair.style)}&patterns=${encodeURIComponent(pair.pattern)}`}
                    className="flex items-center gap-4 rounded-md border border-border bg-muted/20 px-4 py-3.5 transition-colors hover:border-rule-strong"
                  >
                    <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 text-lg">
                      <StyleTerm term={pair.style} />
                      <span aria-hidden className="text-rule-strong">
                        ×
                      </span>
                      <span className="font-display">{pair.pattern}</span>
                    </span>
                    <Badge variant="outline" className="tabular font-mono">
                      {pair.count}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Most indexed — styles</CardTitle>
          </CardHeader>
          <CardContent>
            <TermFrequency
              rows={analysis.styles}
              max={analysis.styles[0]?.count ?? 1}
              demonstrate
              axis="styles"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Most indexed — patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <TermFrequency
              rows={analysis.patterns}
              max={analysis.patterns[0]?.count ?? 1}
              axis="patterns"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Most indexed — industries</CardTitle>
          </CardHeader>
          <CardContent>
            <TermFrequency
              rows={analysis.industries}
              max={analysis.industries[0]?.count ?? 1}
              axis="industries"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Latest</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/references">Explore all →</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <Empty
              action={
                <Button asChild>
                  <Link to="/references/new">Add Reference</Link>
                </Button>
              }
            >
              The library is empty.
            </Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recent.map((ref) => (
                <Link
                  key={ref.id}
                  to={`/references/${ref.id}`}
                  className="flex flex-col gap-2 rounded-md border border-border p-4 transition-colors hover:border-rule-strong"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Meta className="truncate">{ref.source}</Meta>
                    <Badge variant="secondary" className="shrink-0 font-mono">
                      {relativeAge(ref.createdAt)}
                    </Badge>
                  </div>
                  <span className="font-display text-lg leading-tight">{ref.title}</span>
                  <span className="flex flex-wrap items-baseline gap-x-2.5 text-sm">
                    {ref.styles.slice(0, 2).map((s, i) => (
                      <span key={s} className="inline-flex items-baseline gap-2.5">
                        {i > 0 && (
                          <span aria-hidden className="text-rule-strong">
                            /
                          </span>
                        )}
                        <StyleTerm term={s} />
                      </span>
                    ))}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {projects.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">In progress</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/projects">All projects →</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 p-0">
            {projects.slice(0, 4).map((project, i) => (
              <div key={project.id}>
                {i > 0 && <Separator />}
                <Link
                  to={`/projects/${project.id}`}
                  className="flex flex-wrap items-baseline gap-x-4 px-5 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="font-display text-lg">{project.name}</span>
                  <Meta className="truncate">{project.clientName}</Meta>
                  <Meta className="tabular ml-auto shrink-0">
                    {project.collectionCount} coll · {project.referenceCount} refs
                  </Meta>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
