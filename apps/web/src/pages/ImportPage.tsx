import { useState } from "react";
import { Link } from "react-router-dom";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import {
  api,
  type ImportConfirmResponse,
  type ImportPreviewResponse,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Stage = "upload" | "preview" | "result";

function statusVariant(status: string) {
  if (status === "valid") return "default" as const;
  if (status === "warning") return "secondary" as const;
  return "outline" as const;
}

export function ImportPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [payload, setPayload] = useState<unknown>(null);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportConfirmResponse | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    setFileName(file.name);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setPayload(json);
      const res = await api.previewImport(json);
      setPreview(res);
      setResult(null);
      setStage("preview");
      toast.success("Import file validated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to read import file",
      );
      setStage("upload");
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
    setPayload(null);
    setPreview(null);
    setResult(null);
    setFileName("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight">Bulk JSON import</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Upload a references JSON file, review validation results, then import
          valid records into the library.
        </p>
      </div>

      {stage === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Stage 1 — Upload</CardTitle>
            <CardDescription>
              Expected format: {"{ \"references\": [ ... ] }"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/40 px-6 py-16 text-center transition hover:bg-muted/70">
              <Upload className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Choose a JSON file</p>
                <p className="text-sm text-muted-foreground">
                  From imports/references/ or anywhere on disk
                </p>
              </div>
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </label>
          </CardContent>
        </Card>
      )}

      {stage === "preview" && preview && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Stage 2 — Preview</CardTitle>
              <CardDescription>{fileName}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Stat label="Total" value={preview.summary.total} />
              <Stat label="Valid" value={preview.summary.valid} />
              <Stat label="Warnings" value={preview.summary.warnings} />
              <Stat label="Errors" value={preview.summary.errors} />
              <Stat label="Duplicates" value={preview.summary.duplicates} />
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">URL</th>
                    <th className="px-4 py-3 font-medium">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.records.map((row) => (
                    <tr key={row.index} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(row.status)}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{row.title ?? "—"}</td>
                      <td className="px-4 py-3">{row.source ?? "—"}</td>
                      <td className="px-4 py-3">{row.type ?? "—"}</td>
                      <td className="max-w-[220px] truncate px-4 py-3">
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
            <Button variant="outline" onClick={reset}>
              Choose another file
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
          <Card>
            <CardHeader>
              <CardTitle>Stage 3 — Import complete</CardTitle>
              <CardDescription>
                Valid records were inserted. Invalid and duplicate records were
                skipped.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Stat label="Imported" value={result.imported} />
              <Stat label="Skipped" value={result.skipped} />
              <Stat label="Warnings" value={result.warnings} />
              <Stat label="Duplicates" value={result.duplicates} />
              <Stat label="Errors" value={result.errors} />
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>
              Import another file
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
