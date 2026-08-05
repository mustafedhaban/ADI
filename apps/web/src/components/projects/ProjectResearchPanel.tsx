import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import {
  api,
  type CollectionSummary,
  type ProjectDetail,
  type ResearchCandidate,
  type ResearchProviderStatus,
  type ResearchRunDetail,
  type ResearchRunSummary,
} from "@/lib/api";
import {
  AiMark,
  AiSurface,
  Empty,
  ErrorNote,
  formatDateTime,
  Meta,
  StatusMark,
  Tag,
} from "@/components/common/Primitives";
import { MultiCheckGroup } from "@/components/references/MultiCheckGroup";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const RESEARCH_SOURCE_OPTIONS = [
  "Web",
  "Awwwards",
  "Behance",
  "Dribbble",
  "Pinterest",
  "Mobbin",
  "SiteInspire",
  "Land-book",
  "Other",
];

function candidateTone(
  status: ResearchCandidate["status"],
): "signal" | "accent" | "muted" {
  if (status === "accepted") return "accent";
  if (status === "rejected") return "muted";
  return "signal";
}

function CandidateCard({
  candidate,
  selected,
  onToggle,
  onAccept,
  onReject,
}: {
  candidate: ResearchCandidate;
  selected: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const reviewed = candidate.status !== "candidate";

  return (
    <article
      className={cn(
        "flex flex-col border bg-card",
        candidate.status === "rejected" && "opacity-60",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {candidate.image ? (
          <img
            src={candidate.image}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col justify-end gap-1 px-4 py-3">
            <Meta>No preview</Meta>
            <p className="font-display text-xl leading-tight text-ink-2 line-clamp-3">
              {candidate.title}
            </p>
          </div>
        )}
        <label className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 border border-rule-strong bg-card px-2 py-1 text-xs">
          <input type="checkbox" checked={selected} onChange={onToggle} />
          Select
        </label>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Meta className="mb-1.5 block">{candidate.source}</Meta>
            <h3 className="font-display text-lg leading-tight text-balance">
              {candidate.title}
            </h3>
          </div>
          <a
            href={candidate.url}
            target="_blank"
            rel="noreferrer"
            aria-label="Open source"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>

        <p className="truncate font-mono text-xs text-muted-foreground">
          {candidate.url}
        </p>

        <AiSurface reviewed={reviewed} className="px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {reviewed ? (
              <StatusMark tone={candidateTone(candidate.status)}>
                {candidate.status}
              </StatusMark>
            ) : (
              <AiMark>AI draft</AiMark>
            )}
            <Meta className="tabular">
              Score{" "}
              {candidate.relevanceScore === null ? "—" : candidate.relevanceScore}
            </Meta>
          </div>
          <p className="mt-2 text-sm text-ink-2">
            {candidate.relevanceReason ?? "AI analysis unavailable."}
          </p>
        </AiSurface>

        {candidate.matchedCriteria.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidate.matchedCriteria.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </div>
        )}

        {(candidate.suggestedStyles.length > 0 ||
          candidate.suggestedPatterns.length > 0 ||
          candidate.suggestedTags.length > 0) && (
          <div className="space-y-1 font-mono text-xs text-muted-foreground">
            {candidate.suggestedStyles.length > 0 && (
              <p>Styles — {candidate.suggestedStyles.join(", ")}</p>
            )}
            {candidate.suggestedPatterns.length > 0 && (
              <p>Patterns — {candidate.suggestedPatterns.join(", ")}</p>
            )}
            {candidate.suggestedTags.length > 0 && (
              <p>Tags — {candidate.suggestedTags.join(", ")}</p>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-2 border-t pt-3">
          <Button size="sm" variant="outline" onClick={onAccept}>
            Accept
          </Button>
          <Button size="sm" variant="ghost" onClick={onReject}>
            Reject
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProjectResearchPanel({
  project,
  onLibraryChanged,
}: {
  project: ProjectDetail;
  onLibraryChanged: () => Promise<void>;
}) {
  const [history, setHistory] = useState<ResearchRunSummary[]>([]);
  const [active, setActive] = useState<ResearchRunDetail | null>(null);
  const [providers, setProviders] = useState<ResearchProviderStatus | null>(
    null,
  );
  const [configOpen, setConfigOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [focus, setFocus] = useState("");
  const [limit, setLimit] = useState<"10" | "20" | "30">("20");
  const [sources, setSources] = useState<string[]>(["Web"]);
  const [selected, setSelected] = useState<string[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [collectionId, setCollectionId] = useState("");
  const [busy, setBusy] = useState(false);

  const briefChips = useMemo(
    () =>
      [
        project.industry && `Industry: ${project.industry}`,
        project.audience && `Audience: ${project.audience}`,
        project.projectGoals && `Goals: ${project.projectGoals}`,
        project.desiredStyles.length &&
          `Desired: ${project.desiredStyles.join(", ")}`,
        project.avoidStyles.length &&
          `Avoid: ${project.avoidStyles.join(", ")}`,
        project.referenceKeywords.length &&
          `Keywords: ${project.referenceKeywords.join(", ")}`,
      ].filter(Boolean) as string[],
    [project],
  );

  async function loadHistory(selectId?: string) {
    const [historyRes, providerRes] = await Promise.all([
      api.listProjectResearch(project.id),
      api.getResearchProviders(),
    ]);
    setHistory(historyRes.items);
    setProviders(providerRes);
    const targetId = selectId ?? historyRes.items[0]?.id;
    if (targetId) {
      const detail = await api.getResearch(targetId);
      setActive(detail);
      setSelected([]);
    } else {
      setActive(null);
    }
  }

  useEffect(() => {
    void loadHistory().catch((err) => {
      toast.error(err instanceof Error ? err.message : "Failed to load research");
    });
  }, [project.id]);

  async function handleStart(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await api.startResearch({
        projectId: project.id,
        focus: focus.trim() || null,
        limit: Number(limit) as 10 | 20 | 30,
        sources,
      });
      toast.success(
        `Research completed — ${result.candidates.length} candidate${
          result.candidates.length === 1 ? "" : "s"
        }`,
      );
      if (result.message) toast.message(result.message);
      setConfigOpen(false);
      await loadHistory(result.researchId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Research failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(
    candidateId: string,
    status: "accepted" | "rejected",
  ) {
    try {
      await api.updateResearchCandidate(candidateId, status);
      if (active) {
        const detail = await api.getResearch(active.id);
        setActive(detail);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleAddToLibrary() {
    if (!active || !selected.length) return;
    setBusy(true);
    try {
      const result = await api.addResearchToLibrary(active.id, selected);
      toast.success(
        `Library: ${result.created} created, ${result.reused} reused`,
      );
      if (result.failed.length) {
        toast.message(`${result.failed.length} candidate(s) failed`);
      }
      setActive(result.research);
      setSelected([]);
      await onLibraryChanged();
      await loadHistory(active.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Add to library failed");
    } finally {
      setBusy(false);
    }
  }

  async function openCollectionDialog() {
    setCollectionOpen(true);
    try {
      const linked = project.collections;
      setCollections(linked);
      setCollectionId(linked[0]?.id ?? "");
      if (!linked.length) {
        const all = await api.listCollections();
        setCollections(all.items);
        setCollectionId(all.items[0]?.id ?? "");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load collections",
      );
    }
  }

  async function handleAddToCollection() {
    if (!active || !selected.length || !collectionId) return;
    setBusy(true);
    try {
      await api.addResearchToLibrary(active.id, selected);
      const result = await api.addResearchToCollection(
        active.id,
        collectionId,
        selected,
      );
      toast.success(
        `Added ${result.added.length} to collection${
          result.skippedDuplicates.length
            ? ` (${result.skippedDuplicates.length} already present)`
            : ""
        }`,
      );
      setCollectionOpen(false);
      setSelected([]);
      await onLibraryChanged();
      await loadHistory(active.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Add to collection failed",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="prose-measure text-pretty text-sm text-muted-foreground">
          Discover candidate references from the web using this project’s
          research brief. Candidates are machine-proposed and reviewed by a
          human before entering the library.
        </p>
        <Button onClick={() => setConfigOpen(true)} className="shrink-0">
          <Search /> Research Design References
        </Button>
      </div>

      {providers && (
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-y py-3">
          <StatusMark tone={providers.search.available ? "accent" : "signal"}>
            Search{" "}
            {providers.search.available
              ? providers.search.name
              : "not configured"}
          </StatusMark>
          <StatusMark tone={providers.ai.available ? "accent" : "signal"}>
            AI {providers.ai.available ? providers.ai.name : "not configured"}
          </StatusMark>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Meta>Research history</Meta>
        {history.length === 0 ? (
          <Empty
            eyebrow="No runs yet"
            action={
              <Button onClick={() => setConfigOpen(true)}>
                Start research
              </Button>
            }
          >
            Research history will appear here after the first search. Configure
            search before running — candidates stay drafts until you accept them.
          </Empty>
        ) : (
          <div className="overflow-hidden border bg-card">
            {history.map((run) => {
              const isActive = active?.id === run.id;
              return (
                <button
                  key={run.id}
                  type="button"
                  className={cn(
                    "flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-3 text-left last:border-0 transition-colors hover:bg-surface-2",
                    isActive && "bg-surface-2",
                  )}
                  onClick={() =>
                    void api.getResearch(run.id).then((detail) => {
                      setActive(detail);
                      setSelected([]);
                    })
                  }
                >
                  <span className="meta tabular">{formatDateTime(run.createdAt)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {run.focus || "Brief-based research"}
                  </span>
                  <span className="meta tabular">
                    {run.candidateCount} candidate
                    {run.candidateCount === 1 ? "" : "s"}
                  </span>
                  <StatusMark
                    tone={run.status === "completed" ? "ink" : "signal"}
                  >
                    {run.status}
                  </StatusMark>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {active && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-display text-xl leading-tight">
                Candidates
              </h3>
              <Meta className="mt-1.5 block tabular">
                {active.candidates.length} result
                {active.candidates.length === 1 ? "" : "s"}
                {selected.length > 0 ? ` · ${selected.length} selected` : ""}
              </Meta>
              {active.message && (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {active.message}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!selected.length || busy}
                onClick={() => void handleAddToLibrary()}
              >
                Add to Library
              </Button>
              <Button
                size="sm"
                disabled={!selected.length || busy}
                onClick={() => void openCollectionDialog()}
              >
                Add to Collection
              </Button>
            </div>
          </div>

          {active.candidates.length === 0 ? (
            <Empty>No candidates in this run.</Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {active.candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  selected={selected.includes(candidate.id)}
                  onToggle={() =>
                    setSelected((prev) =>
                      prev.includes(candidate.id)
                        ? prev.filter((id) => id !== candidate.id)
                        : [...prev, candidate.id],
                    )
                  }
                  onAccept={() => void setStatus(candidate.id, "accepted")}
                  onReject={() => void setStatus(candidate.id, "rejected")}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Research Design References</DialogTitle>
            <DialogDescription>
              Uses the project research brief as context. Results are candidates
              for human review — nothing is auto-published.
            </DialogDescription>
          </DialogHeader>

          <div className="border bg-surface-2 p-4">
            <Meta>Brief context</Meta>
            <p className="mt-2 font-display text-lg leading-tight">
              {project.name}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {briefChips.length ? (
                briefChips.map((chip) => <Tag key={chip}>{chip}</Tag>)
              ) : (
                <p className="text-sm text-muted-foreground">
                  No brief details yet — add a research brief for better
                  results.
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleStart} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="research-focus">Research Focus</Label>
              <Textarea
                id="research-focus"
                placeholder="Find premium NGO websites with strong storytelling…"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Number of results</Label>
              <Select
                value={limit}
                onValueChange={(value) =>
                  setLimit(value as "10" | "20" | "30")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <MultiCheckGroup
              label="Research sources"
              options={RESEARCH_SOURCE_OPTIONS}
              values={sources}
              onChange={(next) =>
                setSources(next.length ? next : ["Web"])
              }
              maxHeight="max-h-40"
            />
            {!providers?.search.available && (
              <ErrorNote>
                Search is not configured. Set TAVILY_API_KEY on the API server.
              </ErrorNote>
            )}
            {!providers?.ai.available && (
              <p className="font-mono text-xs text-muted-foreground">
                AI analysis is not configured (OPENAI_API_KEY). Candidates can
                still be returned without relevance scoring.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfigOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy || !providers?.search.available}>
                {busy ? "Researching…" : "Start research"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={collectionOpen} onOpenChange={setCollectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to collection</DialogTitle>
            <DialogDescription>
              Candidates are added to the library first (reusing duplicates),
              then linked to the selected collection. Choose a project
              collection when possible.
            </DialogDescription>
          </DialogHeader>
          {collections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No collections available. Create and link a collection to this
              project first.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>Collection</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCollectionOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy || !collectionId || !selected.length}
              onClick={() => void handleAddToCollection()}
            >
              {busy ? "Adding…" : "Add to collection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
