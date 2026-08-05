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
import { Empty, ErrorNote, Loading, Meta } from "@/components/common/Primitives";
import { StyleTerm } from "@/components/references/StyleTerm";

/* ---------------------------------------------------------------------------
   Dashboard — rebuilt.

   The previous version charted `type` and `source`: the two axes with almost
   no variance (99% website, 88% "Other"). A bar reading "99% website" is not
   information.

   The rich axes are styles (25 distinct), patterns (27) and industries (22).
   The primary move is what no reference site in the collection does: show
   which styles CO-OCCUR with which patterns. That relationship is the actual
   intelligence in 104 references x 5 taxonomy axes.

   The latest strip follows It's Nice That's "Nice Feed": a compact band with
   relative ages, not a four-card grid.
--------------------------------------------------------------------------- */

/** Taxonomy terms contain spaces, so pair keys need a separator they can't hold. */
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
            className="flex items-baseline gap-3 border-b py-2 transition-colors last:border-0 hover:bg-card"
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
  const maxPair = analysis.pairs[0]?.count ?? 1;

  const summary = [
    { label: "References", value: stats.total, to: "/references" },
    { label: "Styles indexed", value: analysis.styleCount },
    { label: "Patterns indexed", value: analysis.patternCount },
    { label: "Collections", value: collections.length, to: "/collections" },
    { label: "Active projects", value: projects.length, to: "/projects" },
  ];

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-7 border-b pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Meta>Alool Design Intelligence</Meta>
            <h1 className="masthead">Design Intelligence</h1>
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

        <dl className="flex flex-wrap gap-x-12 gap-y-5">
          {summary.map((s) => {
            const body = (
              <>
                <dd className="tabular font-display text-[2.25rem] leading-none">
                  {s.value}
                </dd>
                <dt className="mt-1.5">
                  <Meta>{s.label}</Meta>
                </dt>
              </>
            );
            return s.to ? (
              <Link
                key={s.label}
                to={s.to}
                className="transition-opacity hover:opacity-60"
              >
                {body}
              </Link>
            ) : (
              <div key={s.label}>{body}</div>
            );
          })}
        </dl>
      </header>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Meta>Intelligence</Meta>
          <h2 className="font-display text-[1.75rem] leading-tight">
            Which styles carry which patterns
          </h2>
          <p className="prose-measure text-sm text-muted-foreground">
            Style × pattern co-occurrence across the whole library — the pairings
            the archive actually demonstrates, ranked by frequency. Open one to
            see every reference that proves it.
          </p>
        </div>

        {analysis.pairs.length === 0 ? (
          <Empty>Not enough classified references yet.</Empty>
        ) : (
          <ul className="grid gap-px bg-border sm:grid-cols-2">
            {analysis.pairs.map((pair) => (
              <li key={pair.style + SEP + pair.pattern}>
                <Link
                  to={`/references?styles=${encodeURIComponent(pair.style)}&patterns=${encodeURIComponent(pair.pattern)}`}
                  className="flex items-center gap-4 bg-card px-4 py-3.5 transition-colors hover:bg-white"
                >
                  <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 text-lg">
                    <StyleTerm term={pair.style} />
                    <span aria-hidden className="text-rule-strong">
                      ×
                    </span>
                    <span className="font-display">{pair.pattern}</span>
                  </span>
                  <span
                    aria-hidden
                    className="hidden h-px w-16 shrink-0 self-center bg-rule-strong/40 sm:block"
                  >
                    <span
                      className="block h-px bg-primary"
                      style={{
                        width: `${Math.round((pair.count / maxPair) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="tabular shrink-0 font-mono text-xs text-muted-foreground">
                    {pair.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Meta>Most indexed — styles</Meta>
          <TermFrequency
            rows={analysis.styles}
            max={analysis.styles[0]?.count ?? 1}
            demonstrate
            axis="styles"
          />
        </div>
        <div className="flex flex-col gap-3">
          <Meta>Most indexed — patterns</Meta>
          <TermFrequency
            rows={analysis.patterns}
            max={analysis.patterns[0]?.count ?? 1}
            axis="patterns"
          />
        </div>
        <div className="flex flex-col gap-3">
          <Meta>Most indexed — industries</Meta>
          <TermFrequency
            rows={analysis.industries}
            max={analysis.industries[0]?.count ?? 1}
            axis="industries"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 border-b pb-2">
          <Meta>Latest</Meta>
          <Link
            to="/references"
            className="meta transition-colors hover:text-foreground"
          >
            Explore all →
          </Link>
        </div>
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
          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((ref) => (
              <Link
                key={ref.id}
                to={`/references/${ref.id}`}
                className="flex flex-col gap-2 bg-card p-4 transition-colors hover:bg-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <Meta className="truncate">{ref.source}</Meta>
                  <Meta className="shrink-0">{relativeAge(ref.createdAt)}</Meta>
                </div>
                <span className="font-display text-lg leading-tight">
                  {ref.title}
                </span>
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
      </section>

      {projects.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 border-b pb-2">
            <Meta>In progress</Meta>
            <Link
              to="/projects"
              className="meta transition-colors hover:text-foreground"
            >
              All projects →
            </Link>
          </div>
          {projects.slice(0, 4).map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="flex flex-wrap items-baseline gap-x-4 border-b py-3 transition-colors last:border-0 hover:bg-card"
            >
              <span className="font-display text-lg">{project.name}</span>
              <Meta className="truncate">{project.clientName}</Meta>
              <Meta className="tabular ml-auto shrink-0">
                {project.collectionCount} coll · {project.referenceCount} refs
              </Meta>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
