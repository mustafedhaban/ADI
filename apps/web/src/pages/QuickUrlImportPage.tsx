import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, Link2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AiMark,
  AiSurface,
  ErrorNote,
  Meta,
  PageHeader,
  Section,
  StatusMark,
} from "@/components/common/Primitives";
import {
  api,
  type ReferenceInput,
  type ResolveUrlResponse,
  type Taxonomy,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiCheckGroup } from "@/components/references/MultiCheckGroup";

type Stage = "enter" | "edit";

export function QuickUrlImportPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("enter");
  const [urlInput, setUrlInput] = useState("");
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [preview, setPreview] = useState<ResolveUrlResponse | null>(null);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("Other");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [type, setType] = useState("website");
  const [whySaved, setWhySaved] = useState("");
  const [whatToLearnText, setWhatToLearnText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [pageTypes, setPageTypes] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    api.getTaxonomy().then(setTaxonomy).catch(() => undefined);
  }, []);

  function applyPreview(result: ResolveUrlResponse) {
    setPreview(result);
    setTitle(result.title ?? "");
    setUrl(result.url || result.originalUrl);
    setSource(result.source || "Other");
    setDescription(result.description ?? "");
    setImage(result.image ?? "");
    setStage("edit");
  }

  async function handleResolve(e: FormEvent) {
    e.preventDefault();
    setResolving(true);
    setResolveError(null);
    setPreview(null);

    try {
      const result = await api.resolveReferenceUrl(urlInput.trim());
      applyPreview(result);
      if (result.existingId) {
        toast.message("This URL already exists in the library");
      } else if (result.fetchFailed) {
        toast.message("Metadata fetch failed — fill fields manually");
      } else {
        toast.success("Reference preview ready");
      }
    } catch (err) {
      const anyErr = err as Error & {
        status?: number;
        data?: { code?: string; error?: string };
      };
      const message = anyErr.message || "Failed to resolve URL";
      setResolveError(message);

      const blockedCodes = new Set([
        "empty",
        "invalid",
        "protocol",
        "private",
        "blocked",
      ]);
      if (
        anyErr.status === 400 &&
        anyErr.data?.code &&
        blockedCodes.has(anyErr.data.code)
      ) {
        toast.error(message);
        return;
      }

      applyPreview({
        originalUrl: urlInput.trim(),
        url: urlInput.trim(),
        title: null,
        description: null,
        image: null,
        source: "Other",
        fetchFailed: true,
        warnings: [message, "You can still create a reference manually."],
        existingId: null,
      });
      toast.error(message);
    } finally {
      setResolving(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !source) {
      toast.error("Title, URL, and source are required");
      return;
    }

    setSaving(true);
    const payload: ReferenceInput = {
      title: title.trim(),
      url: url.trim(),
      source,
      type,
      description: description.trim() || null,
      image: image.trim() || null,
      whySaved: whySaved.trim() || null,
      whatToLearn: whatToLearnText
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean),
      industries,
      pageTypes,
      styles,
      patterns,
      tags: [
        ...new Set([
          ...tags,
          ...tagsText
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        ]),
      ],
    };

    try {
      const created = await api.createReference(payload);
      toast.success("Reference saved");
      navigate(`/references/${created.id}`);
    } catch (err) {
      const anyErr = err as Error & {
        status?: number;
        data?: { existingId?: string; error?: string };
      };
      if (anyErr.status === 409 && anyErr.data?.existingId) {
        toast.error("A reference with this URL already exists");
        setPreview((prev) =>
          prev
            ? { ...prev, existingId: anyErr.data!.existingId! }
            : prev,
        );
      } else {
        toast.error(anyErr.message || "Failed to save reference");
      }
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setStage("enter");
    setPreview(null);
    setResolveError(null);
    setUrlInput("");
    setTitle("");
    setUrl("");
    setSource("Other");
    setDescription("");
    setImage("");
    setType("website");
    setWhySaved("");
    setWhatToLearnText("");
    setTagsText("");
    setIndustries([]);
    setPageTypes([]);
    setStyles([]);
    setPatterns([]);
    setTags([]);
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={{ to: "/references", label: "Library" }}
        eyebrow="Add"
        title="Quick Import URL"
        lede="Paste a public webpage URL, review extracted metadata, then save it to the Reference Library."
      />

      {stage === "enter" && (
        <Section
          eyebrow="01 · Resolve"
          title="Enter URL"
          description="Fetches publicly available Open Graph / Twitter / HTML metadata only — no crawling."
        >
          <form
            onSubmit={handleResolve}
            className="flex flex-col gap-4 border bg-card p-5 sm:p-6"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="quick-url">Webpage URL</Label>
              <Input
                id="quick-url"
                type="url"
                required
                placeholder="https://"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={resolving}
              />
            </div>
            {resolveError && <ErrorNote>{resolveError}</ErrorNote>}
            <div className="flex justify-end">
              <Button type="submit" disabled={resolving || !urlInput.trim()}>
                {resolving ? (
                  <>
                    <LoaderCircle className="animate-spin" /> Fetching…
                  </>
                ) : (
                  <>
                    <Link2 /> Fetch Reference
                  </>
                )}
              </Button>
            </div>
          </form>
        </Section>
      )}

      {stage === "edit" && preview && taxonomy && (
        <>
          {preview.existingId && (
            <AiSurface>
              <AiMark>Already in library</AiMark>
              <p className="mt-2 text-sm text-ink-2">
                This URL already exists.{" "}
                <Link
                  className="underline transition-colors hover:text-foreground"
                  to={`/references/${preview.existingId}`}
                >
                  View existing reference
                </Link>
              </p>
            </AiSurface>
          )}

          {preview.warnings.length > 0 && (
            <div className="border bg-surface-2 px-4 py-3">
              <Meta>Notes</Meta>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-ink-2">
                {preview.warnings.map((warning) => (
                  <li key={warning}>— {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="flex flex-col overflow-hidden border bg-card">
              <div className="aspect-[16/10] bg-surface-2">
                {image ? (
                  <img
                    src={image}
                    alt=""
                    className="size-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="flex size-full flex-col justify-end gap-1 px-4 py-3">
                    <Meta>No preview image</Meta>
                    <p className="font-display text-xl leading-tight text-ink-2 line-clamp-3">
                      {title || "Untitled reference"}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 border-t p-4">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <StatusMark tone="ink">{source || "Other"}</StatusMark>
                  {preview.fetchFailed && (
                    <AiMark>Manual fill</AiMark>
                  )}
                </div>
                <p className="font-display text-lg leading-tight text-balance">
                  {title || "Untitled reference"}
                </p>
                <a
                  href={url || preview.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 truncate font-mono text-xs text-primary hover:underline"
                >
                  {url || preview.originalUrl}
                  <ExternalLink className="size-3 shrink-0" aria-hidden />
                </a>
              </div>
            </aside>

            <form
              onSubmit={handleSave}
              className="flex flex-col gap-4 border bg-card p-5 sm:p-6"
            >
              <Meta>Review & save</Meta>
              <div className="flex flex-col gap-2">
                <Label htmlFor="qi-title">Title *</Label>
                <Input
                  id="qi-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Type *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taxonomy.types.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Source *</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taxonomy.sources.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="qi-url">URL *</Label>
                <Input
                  id="qi-url"
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="qi-image">Image URL</Label>
                <Input
                  id="qi-image"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="qi-description">Description</Label>
                <Textarea
                  id="qi-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="qi-why">Why saved</Label>
                <Textarea
                  id="qi-why"
                  value={whySaved}
                  onChange={(e) => setWhySaved(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="qi-learn">What to learn (one per line)</Label>
                <Textarea
                  id="qi-learn"
                  value={whatToLearnText}
                  onChange={(e) => setWhatToLearnText(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <MultiCheckGroup
                  label="Industries"
                  options={taxonomy.industries}
                  values={industries}
                  onChange={setIndustries}
                  maxHeight="max-h-36"
                />
                <MultiCheckGroup
                  label="Page types"
                  options={taxonomy.pageTypes}
                  values={pageTypes}
                  onChange={setPageTypes}
                  maxHeight="max-h-36"
                />
                <MultiCheckGroup
                  label="Styles"
                  options={taxonomy.styles}
                  values={styles}
                  onChange={setStyles}
                  maxHeight="max-h-36"
                />
                <MultiCheckGroup
                  label="Patterns"
                  options={taxonomy.patterns}
                  values={patterns}
                  onChange={setPatterns}
                  maxHeight="max-h-36"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="qi-tags">Additional tags (comma-separated)</Label>
                <Input
                  id="qi-tags"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                />
                <MultiCheckGroup
                  label="Suggested tags"
                  options={taxonomy.tags}
                  values={tags}
                  onChange={setTags}
                  maxHeight="max-h-28"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={reset}>
                  Try another URL
                </Button>
                <Button
                  type="submit"
                  disabled={saving || Boolean(preview.existingId)}
                >
                  {saving ? "Saving…" : "Save Reference"}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
