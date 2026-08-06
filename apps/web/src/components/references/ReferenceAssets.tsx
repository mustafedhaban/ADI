import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type AssetsResponse, type ReferenceAsset } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Empty, Meta } from "@/components/common/Primitives";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Captured assets panel — every stored asset plus its metadata, and recapture.
--------------------------------------------------------------------------- */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const KIND_ORDER: Record<string, number> = {
  desktop: 0,
  mobile: 1,
  hero: 2,
  thumbnail: 3,
  fullpage: 4,
};

function AssetTile({ asset }: { asset: ReferenceAsset }) {
  return (
    <figure className="flex flex-col gap-2">
      <a
        href={asset.url}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden border bg-surface-2 transition-colors hover:border-rule-strong"
      >
        <img
          src={asset.url}
          alt={`${asset.kind} capture`}
          loading="lazy"
          className={cn(
            "w-full object-cover object-top",
            asset.kind === "fullpage" ? "max-h-80" : "",
          )}
        />
      </a>
      <figcaption className="flex flex-col gap-0.5">
        <Meta className="text-foreground">{asset.kind}</Meta>
        <Meta className="tabular">
          {asset.width}×{asset.height} · {asset.format} ·{" "}
          {formatBytes(asset.fileSize)}
          {asset.viewportWidth
            ? ` · vp ${asset.viewportWidth}×${asset.viewportHeight}@${asset.deviceScaleFactor}x`
            : ""}
        </Meta>
        <Meta className="truncate" title={asset.checksum}>
          sha256 {asset.checksum.slice(0, 12)}…
        </Meta>
      </figcaption>
    </figure>
  );
}

export function ReferenceAssets({ referenceId }: { referenceId: string }) {
  const [data, setData] = useState<AssetsResponse | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (all = showAll) => {
      try {
        setData(await api.getReferenceAssets(referenceId, all));
      } catch {
        setData(null);
      }
    },
    [referenceId, showAll],
  );

  useEffect(() => {
    void load();
  }, [load]);

  async function recapture() {
    setBusy(true);
    toast.info("Capturing — this can take up to a minute");
    try {
      const outcome = await api.captureReference(referenceId, true);
      if (outcome.status === "completed") {
        toast.success(`Captured ${outcome.assets.length} assets (v${outcome.version})`);
      } else {
        toast.error(outcome.error ?? "Capture failed");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Capture failed");
    } finally {
      setBusy(false);
    }
  }

  const items = (data?.items ?? [])
    .slice()
    .sort(
      (a, b) =>
        b.version - a.version ||
        (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9),
    );

  const versions = [...new Set(items.map((a) => a.version))];

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Meta>Captured assets</Meta>
          <h2 className="font-display text-2xl leading-tight">
            Visual capture
          </h2>
          {data && (
            <Meta className="tabular">
              status {data.captureStatus}
              {data.capturedAt
                ? ` · ${new Date(data.capturedAt).toLocaleString()}`
                : ""}
              {data.captureAttempts
                ? ` · ${data.captureAttempts} attempt${data.captureAttempts === 1 ? "" : "s"}`
                : ""}
              {versions.length > 1 ? ` · ${versions.length} versions` : ""}
            </Meta>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {versions.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const next = !showAll;
                setShowAll(next);
                void load(next);
              }}
            >
              {showAll ? "Current only" : "All versions"}
            </Button>
          )}
          <Button size="sm" disabled={busy} onClick={() => void recapture()}>
            {busy ? "Capturing…" : items.length ? "Recapture" : "Capture"}
          </Button>
        </div>
      </div>

      {data?.captureError && (
        <p className="border-l-2 border-destructive bg-surface-2 px-4 py-3 font-mono text-xs text-destructive">
          {data.captureError}
        </p>
      )}

      {items.length === 0 ? (
        <Empty
          action={
            <Button disabled={busy} onClick={() => void recapture()}>
              Capture now
            </Button>
          }
        >
          No screenshots captured yet. Capturing loads the page in a headless
          browser and stores desktop, mobile, full-page, hero and thumbnail
          images locally.
        </Empty>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((asset) => (
            <AssetTile key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </section>
  );
}
