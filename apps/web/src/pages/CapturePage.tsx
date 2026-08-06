import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  api,
  type CaptureRun,
  type CaptureStatusResponse,
  type Reference,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Empty,
  ErrorNote,
  Loading,
  Meta,
  Section,
} from "@/components/common/Primitives";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Capture admin — queue, progress, failures, statistics.

   Polls while a run is active. All browser work happens server-side; this page
   only starts runs and reads state.
--------------------------------------------------------------------------- */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

function ProgressBar({ run }: { run: CaptureRun }) {
  const done = run.completed + run.failed + run.skipped;
  const pct = run.total ? Math.round((done / run.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Meta className="tabular">
          {done} of {run.total} · {pct}%
        </Meta>
        <Meta
          className={cn(
            run.status === "running" && "text-signal",
            run.status === "failed" && "text-destructive",
          )}
        >
          {run.status}
        </Meta>
      </div>
      <div className="h-1 w-full bg-surface-2">
        <div
          className="h-1 bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-5">
        <Meta className="tabular">{run.completed} captured</Meta>
        <Meta className="tabular text-destructive">{run.failed} failed</Meta>
        <Meta className="tabular">{run.skipped} skipped</Meta>
      </div>
    </div>
  );
}

export function CapturePage() {
  const [status, setStatus] = useState<CaptureStatusResponse | null>(null);
  const [runs, setRuns] = useState<CaptureRun[]>([]);
  const [failures, setFailures] = useState<Reference[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, r, refs] = await Promise.all([
        api.getCaptureStatus(),
        api.listCaptureRuns(),
        api.listReferences(),
      ]);
      setStatus(s);
      setRuns(r.items);
      setFailures(refs.items.filter((x) => x.captureStatus === "failed"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll only while a run is active.
  useEffect(() => {
    if (!status?.running) {
      if (timer.current) window.clearInterval(timer.current);
      return;
    }
    timer.current = window.setInterval(() => void load(), 3000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [status?.running, load]);

  async function start(body: Parameters<typeof api.startCaptureBatch>[0] = {}) {
    setBusy(true);
    try {
      const res = await api.startCaptureBatch(body);
      toast.success(res.runId ? "Capture run started" : "Run accepted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start run");
    } finally {
      setBusy(false);
    }
  }

  async function retryAll() {
    setBusy(true);
    try {
      await api.retryFailedCaptures();
      toast.success("Retrying failed captures");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    try {
      await api.cancelCapture();
      toast.success("Cancelling after the current reference");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    }
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!status) return <Loading>Loading capture status…</Loading>;

  const s = status.stats.byStatus;
  const activeRun = runs.find((r) => r.status === "running") ?? runs[0];
  const pendingCount = s.pending + s.queued + s.processing;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 border-b pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Meta className="text-primary">Pipeline</Meta>
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">
              Visual Capture
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {status.running ? (
              <Button variant="outline" onClick={() => void cancel()}>
                Cancel run
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled={busy || !failures.length}
                  onClick={() => void retryAll()}
                >
                  Retry {failures.length} failed
                </Button>
                <Button
                  disabled={busy || !status.available}
                  onClick={() => void start({ includeFailed: true })}
                >
                  Capture {pendingCount} outstanding
                </Button>
              </>
            )}
          </div>
        </div>

        {!status.available && (
          <ErrorNote>
            Capture driver unavailable. Install Playwright and run{" "}
            <code className="font-mono">npx playwright install chromium</code>.
          </ErrorNote>
        )}

        <dl className="flex flex-wrap gap-x-12 gap-y-5">
          {[
            { label: "References", value: status.stats.totalReferences },
            { label: "Captured", value: s.completed },
            { label: "Outstanding", value: pendingCount },
            { label: "Failed", value: s.failed },
            { label: "Assets", value: status.stats.assetCount },
            {
              label: "Storage",
              value: formatBytes(status.storage.bytes),
            },
          ].map((stat) => (
            <div key={stat.label}>
              <dd className="tabular font-display text-[2rem] leading-none">
                {stat.value}
              </dd>
              <dt className="mt-1.5">
                <Meta>{stat.label}</Meta>
              </dt>
            </div>
          ))}
        </dl>

        <Meta>
          driver: {status.driver} ·{" "}
          {status.available ? "available" : "unavailable"} ·{" "}
          {status.storage.files} files
        </Meta>
      </header>

      {activeRun && (
        <Section eyebrow="Current run" title="Progress">
          <div className="bg-card p-6">
            <ProgressBar run={activeRun} />
            {activeRun.message && (
              <p className="mt-4 text-sm text-ink-2">{activeRun.message}</p>
            )}
          </div>
        </Section>
      )}

      <Section
        eyebrow={`Failures · ${failures.length}`}
        title="Needs attention"
        description="References whose last capture attempt failed. Common causes: dead URLs, bot protection, or pages that never reach a stable frame."
      >
        {failures.length === 0 ? (
          <Empty>No failed captures.</Empty>
        ) : (
          <div className="bg-card">
            {failures.map((ref) => (
              <div
                key={ref.id}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b px-4 py-3 last:border-0"
              >
                <Link
                  to={`/references/${ref.id}`}
                  className="font-display text-lg hover:text-primary"
                >
                  {ref.title}
                </Link>
                <Meta className="tabular">
                  {ref.captureAttempts} attempt
                  {ref.captureAttempts === 1 ? "" : "s"}
                </Meta>
                <span className="w-full truncate font-mono text-xs text-destructive">
                  {ref.captureError ?? "Unknown error"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section eyebrow="History" title="Runs">
        {runs.length === 0 ? (
          <Empty>No capture runs yet.</Empty>
        ) : (
          <div className="bg-card">
            {runs.map((run) => (
              <div
                key={run.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b px-4 py-3 last:border-0"
              >
                <Meta className="tabular w-40 shrink-0">
                  {new Date(run.createdAt).toLocaleString()}
                </Meta>
                <Meta
                  className={cn(
                    "w-20 shrink-0",
                    run.status === "running" && "text-signal",
                    run.status === "failed" && "text-destructive",
                  )}
                >
                  {run.status}
                </Meta>
                <Meta className="tabular">
                  {run.completed}/{run.total} captured · {run.failed} failed ·{" "}
                  {run.skipped} skipped
                </Meta>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
