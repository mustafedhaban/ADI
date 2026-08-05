import { useRef, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { FileJson, FolderOpen, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  api,
  type ImportConfirmResponse,
  type ImportPreviewResponse,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Empty,
  ErrorNote,
  Meta,
  PageHeader,
  Section,
  Stat,
  StatusMark,
} from "@/components/common/Primitives";

type Stage = "upload" | "preview" | "result";

/** One accepted file plus the references parsed out of it. */
interface LoadedFile {
  id: string;
  name: string;
  references: unknown[];
}

interface RejectedFile {
  name: string;
  reason: string;
}

/** Maps merged-payload indexes back to the file each record came from. */
interface FileRange {
  name: string;
  start: number;
  end: number;
}

function isJsonFile(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith(".json") ||
    file.type === "application/json"
  );
}

/**
 * Accepts `{ "references": [...] }` (the documented format) and tolerates a
 * bare `[...]` array so hand-trimmed files still import.
 */
function extractReferences(raw: unknown): unknown[] | string {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const references = (raw as Record<string, unknown>).references;
    if (Array.isArray(references)) return references;
    return 'Missing a "references" array';
  }
  return "Root JSON value must be an object or array";
}

/** Recursively collect files from a dropped folder. */
async function readEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file(
        (file) => resolve([file]),
        () => resolve([]),
      );
    });
  }

  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const entries: FileSystemEntry[] = [];
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve) =>
        reader.readEntries(resolve, () => resolve([])),
      );
      if (!batch.length) break;
      entries.push(...batch);
    }
    const nested = await Promise.all(entries.map(readEntry));
    return nested.flat();
  }

  return [];
}

async function filesFromDrop(dataTransfer: DataTransfer): Promise<File[]> {
  const items = [...dataTransfer.items];
  const canWalk = items.some(
    (item) => typeof item.webkitGetAsEntry === "function",
  );
  if (!canWalk) return [...dataTransfer.files];

  const entries = items
    .map((item) => item.webkitGetAsEntry())
    .filter((entry): entry is FileSystemEntry => Boolean(entry));

  if (!entries.length) return [...dataTransfer.files];

  const collected = await Promise.all(entries.map(readEntry));
  return collected.flat();
}

function statusTone(
  status: string,
): "accent" | "signal" | "muted" | "ink" {
  if (status === "valid") return "accent";
  if (status === "warning") return "signal";
  return "muted";
}

export function ImportPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [ranges, setRanges] = useState<FileRange[]>([]);
  const [payload, setPayload] = useState<unknown>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportConfirmResponse | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalReferences = files.reduce(
    (sum, file) => sum + file.references.length,
    0,
  );

  async function addFiles(incoming: File[]) {
    const jsonFiles = incoming.filter(isJsonFile);
    const skipped: RejectedFile[] = incoming
      .filter((file) => !isJsonFile(file))
      .map((file) => ({ name: file.name, reason: "Not a .json file" }));

    if (!jsonFiles.length && !skipped.length) return;

    setBusy(true);
    const accepted: LoadedFile[] = [];

    for (const file of jsonFiles) {
      try {
        const parsed = JSON.parse(await file.text());
        const references = extractReferences(parsed);
        if (typeof references === "string") {
          skipped.push({ name: file.name, reason: references });
          continue;
        }
        if (!references.length) {
          skipped.push({ name: file.name, reason: "No references in file" });
          continue;
        }
        accepted.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          references,
        });
      } catch {
        skipped.push({ name: file.name, reason: "Invalid JSON" });
      }
    }

    setFiles((current) => {
      const seen = new Set(current.map((f) => f.id));
      const fresh = accepted.filter((f) => !seen.has(f.id));
      const duplicates = accepted.length - fresh.length;
      if (duplicates) {
        toast.info(
          `${duplicates} file${duplicates === 1 ? "" : "s"} already added`,
        );
      }
      if (fresh.length) {
        toast.success(
          `Added ${fresh.length} file${fresh.length === 1 ? "" : "s"}`,
        );
      }
      return [...current, ...fresh];
    });

    if (skipped.length) {
      setRejected((current) => [...current, ...skipped]);
      toast.error(
        `Skipped ${skipped.length} file${skipped.length === 1 ? "" : "s"}`,
      );
    }

    setBusy(false);
  }

  async function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (stage !== "upload") return;
    const dropped = await filesFromDrop(e.dataTransfer);
    if (!dropped.length) {
      toast.error("No files found in the drop");
      return;
    }
    await addFiles(dropped);
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((file) => file.id !== id));
  }

  /** Merge every file into one payload so cross-file duplicates are caught. */
  async function validateAll() {
    if (!files.length) return;
    setBusy(true);
    try {
      const merged: unknown[] = [];
      const fileRanges: FileRange[] = [];
      for (const file of files) {
        fileRanges.push({
          name: file.name,
          start: merged.length,
          end: merged.length + file.references.length - 1,
        });
        merged.push(...file.references);
      }

      const body = { references: merged };
      const res = await api.previewImport(body);
      setPayload(body);
      setRanges(fileRanges);
      setPreview(res);
      setResult(null);
      setStage("preview");
      toast.success(
        `Validated ${merged.length} record${merged.length === 1 ? "" : "s"} from ${files.length} file${files.length === 1 ? "" : "s"}`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to validate import files",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!payload) return;
    setBusy(true);
    try {
      const res = await api.confirmImport(payload);
      setResult(res);
      setStage("result");
      toast.success(`Imported ${res.imported} references`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStage("upload");
    setFiles([]);
    setRejected([]);
    setRanges([]);
    setPayload(null);
    setPreview(null);
    setResult(null);
  }

  function fileForIndex(index: number): string {
    return (
      ranges.find((range) => index >= range.start && index <= range.end)?.name ??
      "—"
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Add"
        title="Bulk JSON import"
        lede="Drop one or more references JSON files — or a whole folder — review validation results, then import valid records into the library."
      />

      {stage === "upload" && (
        <Section
          eyebrow="01 · Upload"
          title="Add files"
          description='Expected format: { "references": [ … ] } — a bare array also works. Files are merged so duplicates across files are caught in one pass.'
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => void handleDrop(e)}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={cn(
              "flex cursor-pointer flex-col items-start gap-3 border border-dashed bg-card px-6 py-12 transition-colors",
              dragging
                ? "border-primary bg-surface-2"
                : "hover:border-rule-strong hover:bg-surface-2",
            )}
          >
            {dragging ? (
              <FolderOpen className="size-6 text-primary" aria-hidden />
            ) : (
              <Upload className="size-6 text-muted-foreground" aria-hidden />
            )}
            <div>
              <p className="font-display text-xl leading-tight">
                {dragging
                  ? "Drop to add"
                  : "Drag & drop JSON files or a folder"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Or click to choose multiple files — e.g. everything in
                imports/references/
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const selected = [...(e.target.files ?? [])];
                if (selected.length) void addFiles(selected);
                e.target.value = "";
              }}
            />
          </div>

          {files.length === 0 && rejected.length === 0 && (
            <Empty eyebrow="Waiting for files">
              No files staged yet. Drop a JSON export to begin validation.
            </Empty>
          )}

          {files.length > 0 && (
            <div className="overflow-hidden border bg-card">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 border-b px-4 py-3 last:border-0"
                >
                  <FileJson
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {file.name}
                  </span>
                  <Meta className="tabular shrink-0">
                    {file.references.length} record
                    {file.references.length === 1 ? "" : "s"}
                  </Meta>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="meta shrink-0 transition-colors hover:text-destructive"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Trash2 className="size-3" aria-hidden /> Remove
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {rejected.length > 0 && (
            <ErrorNote>
              Skipped {rejected.length} file
              {rejected.length === 1 ? "" : "s"}
              <ul className="mt-2 flex flex-col gap-1 text-ink-2">
                {rejected.map((file, i) => (
                  <li key={`${file.name}-${i}`} className="text-sm">
                    <span className="font-medium text-destructive">
                      {file.name}
                    </span>{" "}
                    — {file.reason}
                  </li>
                ))}
              </ul>
            </ErrorNote>
          )}

          {files.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={busy} onClick={() => void validateAll()}>
                {busy
                  ? "Reading…"
                  : `Validate ${totalReferences} record${totalReferences === 1 ? "" : "s"} from ${files.length} file${files.length === 1 ? "" : "s"}`}
              </Button>
              <Button variant="outline" onClick={reset}>
                Clear all
              </Button>
            </div>
          )}
        </Section>
      )}

      {stage === "preview" && preview && (
        <>
          <Section
            eyebrow="02 · Preview"
            title="Validation"
            description={`${files.length} file${files.length === 1 ? "" : "s"}: ${files.map((f) => f.name).join(", ")}`}
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              <Stat label="Total" value={preview.summary.total} />
              <Stat label="Valid" value={preview.summary.valid} />
              <Stat label="Warnings" value={preview.summary.warnings} />
              <Stat label="Errors" value={preview.summary.errors} />
              <Stat label="Duplicates" value={preview.summary.duplicates} />
            </div>
          </Section>

          <div className="overflow-hidden border bg-card">
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead className="border-b bg-surface-2">
                  <tr>
                    <th className="px-4 py-3">
                      <Meta>Status</Meta>
                    </th>
                    <th className="px-4 py-3">
                      <Meta>File</Meta>
                    </th>
                    <th className="px-4 py-3">
                      <Meta>Title</Meta>
                    </th>
                    <th className="px-4 py-3">
                      <Meta>Source</Meta>
                    </th>
                    <th className="px-4 py-3">
                      <Meta>Type</Meta>
                    </th>
                    <th className="px-4 py-3">
                      <Meta>URL</Meta>
                    </th>
                    <th className="px-4 py-3">
                      <Meta>Issues</Meta>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.records.map((row) => (
                    <tr key={row.index} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <StatusMark tone={statusTone(row.status)}>
                          {row.status}
                        </StatusMark>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                        {fileForIndex(row.index)}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3">
                        {row.title ?? "—"}
                      </td>
                      <td className="px-4 py-3">{row.source ?? "—"}</td>
                      <td className="px-4 py-3">{row.type ?? "—"}</td>
                      <td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs">
                        {row.url ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.issues.length
                          ? row.issues.map((i) => i.message).join("; ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStage("upload")}>
              Back to files
            </Button>
            <Button variant="outline" onClick={reset}>
              Start over
            </Button>
            <Button
              disabled={busy || preview.importableCount === 0}
              onClick={() => void confirmImport()}
            >
              {busy
                ? "Importing…"
                : `Import ${preview.importableCount} valid record${preview.importableCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        </>
      )}

      {stage === "result" && result && (
        <>
          <Section
            eyebrow="03 · Complete"
            title="Import complete"
            description="Valid records were inserted. Invalid and duplicate records were skipped."
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              <Stat label="Imported" value={result.imported} />
              <Stat label="Skipped" value={result.skipped} />
              <Stat label="Warnings" value={result.warnings} />
              <Stat label="Duplicates" value={result.duplicates} />
              <Stat label="Errors" value={result.errors} />
            </div>
          </Section>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={reset}>
              Import more files
            </Button>
            <Button asChild>
              <Link to="/references">View library</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
