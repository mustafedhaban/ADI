import { useEffect, useState } from "react";
import { History, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  api,
  type DesignDnaDetail,
  type DesignDnaEvidenceGroup,
  type DesignDnaSectionKey,
  type DesignDnaStructure,
  type DesignDnaSummary,
  type ProjectDesignDnaResponse,
  type ProjectDetail,
} from "@/lib/api";
import {
  AiMark,
  AiSurface,
  Empty,
  ErrorNote,
  formatDateTime,
  Loading,
  Meta,
  Metric,
  StatusMark,
} from "@/components/common/Primitives";
import { ReferenceCard } from "@/components/references/ReferenceCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Mirrors DESIGN_DNA_SECTIONS on the API — order and labels shown to the user. */
const SECTIONS: Array<{
  key: DesignDnaSectionKey;
  label: string;
  fields: string[] | null;
}> = [
  {
    key: "visualLanguage",
    label: "Visual Language",
    fields: ["overallStyle", "visualCharacteristics", "designPrinciples"],
  },
  {
    key: "colorDirection",
    label: "Color Direction",
    fields: [
      "paletteCharacteristics",
      "dominantApproach",
      "contrast",
      "usagePatterns",
    ],
  },
  {
    key: "typography",
    label: "Typography",
    fields: [
      "typographyStyles",
      "hierarchyPatterns",
      "scaleCharacteristics",
      "fontCharacteristics",
    ],
  },
  {
    key: "layout",
    label: "Layout",
    fields: [
      "layoutPatterns",
      "gridPatterns",
      "spacingPatterns",
      "compositionPatterns",
    ],
  },
  {
    key: "imagery",
    label: "Imagery",
    fields: [
      "imageryStyles",
      "photographyCharacteristics",
      "illustrationCharacteristics",
      "imageTreatment",
    ],
  },
  {
    key: "components",
    label: "Components",
    fields: [
      "navigationPatterns",
      "heroPatterns",
      "cardPatterns",
      "ctaPatterns",
      "footerPatterns",
      "otherPatterns",
    ],
  },
  {
    key: "motionInteraction",
    label: "Motion & Interaction",
    fields: ["animationPatterns", "interactionPatterns", "transitionPatterns"],
  },
  {
    key: "contentPresentation",
    label: "Content Presentation",
    fields: ["storytellingPatterns", "contentHierarchy", "contentPatterns"],
  },
  {
    key: "patterns",
    label: "Patterns",
    fields: ["recurringPatterns", "strongPatterns", "emergingPatterns"],
  },
  {
    key: "antiPatterns",
    label: "Anti-Patterns",
    fields: ["avoidPatterns", "overusedPatterns", "conflictsWithBrief"],
  },
  { key: "keyInsights", label: "Key Insights", fields: null },
];

function humanizeField(field: string): string {
  const spaced = field.replace(/([A-Z])/g, " $1").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function linesToArray(value: string): string[] {
  return [
    ...new Set(
      value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function sectionFieldValues(
  structure: DesignDnaStructure,
  key: DesignDnaSectionKey,
  field: string,
): string[] {
  const section = structure[key];
  if (!section || Array.isArray(section)) return [];
  return asStringArray(section[field]);
}

function evidenceFor(
  evidence: DesignDnaEvidenceGroup[],
  section: DesignDnaSectionKey,
  insight: string,
): DesignDnaEvidenceGroup | null {
  return (
    evidence.find(
      (group) => group.section === section && group.insight === insight,
    ) ?? null
  );
}

function InsightRow({
  section,
  insight,
  evidence,
  onViewEvidence,
}: {
  section: DesignDnaSectionKey;
  insight: string;
  evidence: DesignDnaEvidenceGroup[];
  onViewEvidence: (group: DesignDnaEvidenceGroup) => void;
}) {
  const group = evidenceFor(evidence, section, insight);
  return (
    <li className="flex items-start justify-between gap-3 border-b border-border/70 py-2.5 last:border-0">
      <span className="text-pretty text-sm leading-relaxed">{insight}</span>
      {group && (
        <button
          type="button"
          onClick={() => onViewEvidence(group)}
          className="meta shrink-0 tabular transition-colors hover:text-foreground"
        >
          Evidence · {group.references.length}
        </button>
      )}
    </li>
  );
}

export function ProjectDesignDnaPanel({
  project,
  onChanged,
}: {
  project: ProjectDetail;
  onChanged?: () => void | Promise<void>;
}) {
  const [state, setState] = useState<ProjectDesignDnaResponse | null>(null);
  const [viewing, setViewing] = useState<DesignDnaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [evidenceGroup, setEvidenceGroup] =
    useState<DesignDnaEvidenceGroup | null>(null);
  const [editingSection, setEditingSection] =
    useState<DesignDnaSectionKey | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});

  async function load(selectId?: string) {
    setLoading(true);
    try {
      const res = await api.getProjectDesignDna(project.id);
      setState(res);
      const target = selectId
        ? (res.versions.find((v) => v.id === selectId)
            ? await api.getDesignDna(selectId)
            : res.current)
        : viewing
          ? ((await api
              .getDesignDna(viewing.id)
              .catch(() => null)) ?? res.current)
          : res.current;
      setViewing(target);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Design DNA");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const versions = state?.versions ?? [];
  const aiAvailable = state?.providers.ai.available ?? false;
  const projectReferenceCount = state?.referenceCount ?? project.referenceCount;

  const publishedVersion =
    versions.find((v) => v.status === "published") ?? null;

  async function handleGenerate() {
    setGenerating(true);
    try {
      const created = await api.generateDesignDna(project.id);
      toast.success(`Design DNA version ${created.version} generated as draft`);
      await load(created.id);
      await onChanged?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Design DNA generation failed",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish(dna: DesignDnaSummary | DesignDnaDetail) {
    try {
      await api.publishDesignDna(dna.id);
      toast.success(`Version ${dna.version} published`);
      await load(dna.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    }
  }

  async function handleUnpublish(dna: DesignDnaSummary | DesignDnaDetail) {
    try {
      await api.unpublishDesignDna(dna.id);
      toast.success(`Version ${dna.version} moved back to draft`);
      await load(dna.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unpublish failed");
    }
  }

  function openEditor(key: DesignDnaSectionKey) {
    if (!viewing) return;
    const section = SECTIONS.find((s) => s.key === key)!;
    const draft: Record<string, string> = {};
    if (section.fields === null) {
      draft.keyInsights = asStringArray(viewing.structure.keyInsights).join(
        "\n",
      );
    } else {
      for (const field of section.fields) {
        draft[field] = sectionFieldValues(viewing.structure, key, field).join(
          "\n",
        );
      }
    }
    setEditDraft(draft);
    setEditingSection(key);
  }

  async function handleSaveSection() {
    if (!viewing || !editingSection) return;
    const section = SECTIONS.find((s) => s.key === editingSection)!;
    setSaving(true);
    try {
      const patch: Partial<DesignDnaStructure> = {};
      if (section.fields === null) {
        patch.keyInsights = linesToArray(editDraft.keyInsights ?? "");
      } else {
        const group: Record<string, string[]> = {};
        for (const field of section.fields) {
          group[field] = linesToArray(editDraft[field] ?? "");
        }
        patch[editingSection] = group;
      }

      await api.updateDesignDna(viewing.id, patch);
      toast.success(`${section.label} saved`);
      setEditingSection(null);
      await load(viewing.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const editingMeta = editingSection
    ? SECTIONS.find((s) => s.key === editingSection)!
    : null;

  const isDraft = viewing?.status === "draft";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="prose-measure text-pretty text-sm text-muted-foreground">
          A structured synthesis of the design patterns found across this
          project’s research references. It describes evidence, not a design
          decision — Design Direction comes later.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          {versions.length > 0 && (
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
              <History /> Versions ({versions.length})
            </Button>
          )}
          <Button
            onClick={() => void handleGenerate()}
            disabled={generating || projectReferenceCount === 0 || !aiAvailable}
          >
            {generating
              ? "Generating…"
              : versions.length
                ? "Regenerate Design DNA"
                : "Generate Design DNA"}
          </Button>
        </div>
      </div>

      {!aiAvailable && (
        <AiSurface>
          <AiMark>Provider unavailable</AiMark>
          <p className="mt-2 text-sm text-ink-2">
            AI provider is not configured. Set <code className="font-mono text-xs">OPENAI_API_KEY</code>{" "}
            to generate Design DNA — no DNA is ever fabricated without it.
          </p>
        </AiSurface>
      )}

      {projectReferenceCount === 0 && (
        <Empty>Add research references to this project before generating Design DNA.</Empty>
      )}

      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? (
        <Loading>Loading Design DNA…</Loading>
      ) : !viewing ? (
        <Empty eyebrow="Not generated">
          Design DNA has not been synthesized yet. When generated, it will
          describe patterns across the {projectReferenceCount} reference
          {projectReferenceCount === 1 ? "" : "s"} reachable through this
          project’s collections — not the whole library.
        </Empty>
      ) : (
        <>
          <div
            className={cn(
              "flex flex-col gap-3 border-l-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center",
              isDraft
                ? "border-signal bg-surface-2"
                : "border-border bg-card",
            )}
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Meta className="tabular">Version {viewing.version}</Meta>
              {isDraft ? (
                <AiMark>AI draft</AiMark>
              ) : (
                <StatusMark tone="accent">Published</StatusMark>
              )}
              <Metric
                value={viewing.referenceCount}
                label={`reference${viewing.referenceCount === 1 ? "" : "s"}`}
              />
              <Metric
                value={viewing.evidenceCount}
                label={`evidence link${viewing.evidenceCount === 1 ? "" : "s"}`}
              />
              <Meta>Generated {formatDateTime(viewing.generatedAt)}</Meta>
            </div>
            <div className="sm:ml-auto">
              {viewing.status === "published" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleUnpublish(viewing)}
                >
                  Unpublish
                </Button>
              ) : (
                <Button size="sm" onClick={() => void handlePublish(viewing)}>
                  Publish
                </Button>
              )}
            </div>
          </div>

          {publishedVersion && publishedVersion.id !== viewing.id && (
            <p className="text-sm text-muted-foreground">
              Version {publishedVersion.version} is currently published.
            </p>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {SECTIONS.map((section, index) => {
              const isFlat = section.fields === null;
              const flatItems = isFlat
                ? asStringArray(viewing.structure.keyInsights)
                : [];
              const hasContent = isFlat
                ? flatItems.length > 0
                : section.fields!.some(
                    (field) =>
                      sectionFieldValues(viewing.structure, section.key, field)
                        .length > 0,
                  );

              return (
                <section
                  key={section.key}
                  className={cn(
                    "flex flex-col gap-3 border bg-card p-5",
                    isFlat && "lg:col-span-2",
                  )}
                >
                  <div className="flex items-start justify-between gap-3 border-b pb-3">
                    <div>
                      <Meta className="tabular">
                        {String(index + 1).padStart(2, "0")}
                      </Meta>
                      <h3 className="mt-1 font-display text-xl leading-tight">
                        {section.label}
                      </h3>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditor(section.key)}
                    >
                      <Pencil /> Edit
                    </Button>
                  </div>

                  {!hasContent ? (
                    <p className="text-sm text-muted-foreground">
                      No evidence-backed findings in this section.
                    </p>
                  ) : isFlat ? (
                    <ul className="flex flex-col">
                      {flatItems.map((insight) => (
                        <InsightRow
                          key={insight}
                          section={section.key}
                          insight={insight}
                          evidence={viewing.evidence}
                          onViewEvidence={setEvidenceGroup}
                        />
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {section.fields!.map((field) => {
                        const values = sectionFieldValues(
                          viewing.structure,
                          section.key,
                          field,
                        );
                        if (!values.length) return null;
                        return (
                          <div key={field}>
                            <Meta>{humanizeField(field)}</Meta>
                            <ul className="mt-1 flex flex-col">
                              {values.map((value) => (
                                <InsightRow
                                  key={value}
                                  section={section.key}
                                  insight={value}
                                  evidence={viewing.evidence}
                                  onViewEvidence={setEvidenceGroup}
                                />
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}

      <Dialog
        open={Boolean(evidenceGroup)}
        onOpenChange={(open) => !open && setEvidenceGroup(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Evidence trail</DialogTitle>
            <DialogDescription>
              How this claim is grounded in the project’s references.
            </DialogDescription>
          </DialogHeader>
          {evidenceGroup && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="border-l-2 border-border pl-4">
                  <Meta>01 · Insight</Meta>
                  <p className="mt-2 text-pretty text-base leading-relaxed">
                    {evidenceGroup.insight}
                  </p>
                </div>
                <div className="border-l-2 border-primary pl-4">
                  <Meta>02 · Evidence</Meta>
                  <p className="mt-2 text-sm text-ink-2">
                    Supported by{" "}
                    <span className="tabular font-mono">
                      {evidenceGroup.references.length}
                    </span>{" "}
                    linked reference
                    {evidenceGroup.references.length === 1 ? "" : "s"} from this
                    project’s collections.
                  </p>
                </div>
                <div>
                  <Meta className="mb-3 block">03 · References</Meta>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {evidenceGroup.references.map((reference) => (
                      <ReferenceCard key={reference.id} reference={reference} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              Previous versions are preserved. Only one version can be
              published.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col divide-y border">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <span className="font-display text-lg">
                  Version {version.version}
                </span>
                {version.status === "published" ? (
                  <StatusMark tone="accent">Published</StatusMark>
                ) : (
                  <AiMark>Draft</AiMark>
                )}
                <Meta>{formatDateTime(version.generatedAt)}</Meta>
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setHistoryOpen(false);
                      void load(version.id);
                    }}
                  >
                    Open
                  </Button>
                  {version.status !== "published" && (
                    <Button
                      size="sm"
                      onClick={() => void handlePublish(version)}
                    >
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingSection)}
        onOpenChange={(open) => !open && setEditingSection(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {editingMeta?.label}</DialogTitle>
            <DialogDescription>
              One statement per line. Only this section is changed; other
              sections stay as generated.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {(editingMeta?.fields ?? ["keyInsights"]).map((field) => (
              <div key={field} className="flex flex-col gap-2">
                <Label htmlFor={`dna-${field}`}>{humanizeField(field)}</Label>
                <Textarea
                  id={`dna-${field}`}
                  rows={4}
                  value={editDraft[field] ?? ""}
                  onChange={(e) =>
                    setEditDraft((draft) => ({
                      ...draft,
                      [field]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSection(null)}>
                Cancel
              </Button>
              <Button
                disabled={saving}
                onClick={() => void handleSaveSection()}
              >
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
