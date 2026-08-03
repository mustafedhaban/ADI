import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  api,
  type CollectionSummary,
  type ProjectDetail,
  type ProjectInput,
  type Taxonomy,
} from "@/lib/api";
import { CollectionCover } from "@/components/collections/CollectionCover";
import { ProjectResearchPanel } from "@/components/projects/ProjectResearchPanel";
import { MultiCheckGroup } from "@/components/references/MultiCheckGroup";
import { ReferenceCard } from "@/components/references/ReferenceCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function linesToArray(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

function arrayToLines(values: string[] | undefined): string {
  return (values ?? []).join("\n");
}

function BriefText({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}

function BriefTags({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <Badge key={value} variant="outline">
            {value}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function hasBriefContent(project: ProjectDetail): boolean {
  return Boolean(
    project.audience ||
      project.audienceNeeds ||
      project.businessGoals ||
      project.projectGoals ||
      project.desiredStyles.length ||
      project.avoidStyles.length ||
      project.keyMessages ||
      project.contentTypes.length ||
      project.requiredFeatures.length ||
      project.preferredSources.length ||
      project.referenceKeywords.length ||
      project.competitors.length ||
      project.competitorNotes ||
      project.constraints,
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addCollectionOpen, setAddCollectionOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"existing" | "new">("existing");
  const [availableCollections, setAvailableCollections] = useState<
    CollectionSummary[]
  >([]);
  const [pickedCollections, setPickedCollections] = useState<string[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [pickerLoading, setPickerLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProjectInput>({});
  const [briefForm, setBriefForm] = useState<ProjectInput>({});
  const [featuresText, setFeaturesText] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [competitorsText, setCompetitorsText] = useState("");

  async function load() {
    if (!id) return;
    try {
      const [item, tax] = await Promise.all([
        api.getProject(id),
        api.getTaxonomy(),
      ]);
      setProject(item);
      setTaxonomy(tax);
      setForm({
        name: item.name,
        clientName: item.clientName ?? "",
        description: item.description ?? "",
        industry: item.industry ?? "",
        audience: item.audience ?? "",
        location: item.location ?? "",
        projectType: item.projectType ?? "",
        designGoals: item.designGoals ?? "",
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  function openBriefEditor() {
    if (!project) return;
    setBriefForm({
      audience: project.audience ?? "",
      audienceNeeds: project.audienceNeeds ?? "",
      businessGoals: project.businessGoals ?? "",
      projectGoals: project.projectGoals ?? "",
      desiredStyles: [...project.desiredStyles],
      avoidStyles: [...project.avoidStyles],
      keyMessages: project.keyMessages ?? "",
      contentTypes: [...project.contentTypes],
      requiredFeatures: [...project.requiredFeatures],
      preferredSources: [...project.preferredSources],
      referenceKeywords: [...project.referenceKeywords],
      competitors: [...project.competitors],
      competitorNotes: project.competitorNotes ?? "",
      constraints: project.constraints ?? "",
    });
    setFeaturesText(arrayToLines(project.requiredFeatures));
    setKeywordsText(arrayToLines(project.referenceKeywords));
    setCompetitorsText(arrayToLines(project.competitors));
    setBriefOpen(true);
  }

  async function openAddCollection() {
    setAddCollectionOpen(true);
    setPickerMode("existing");
    setPickedCollections([]);
    setNewCollectionName("");
    setNewCollectionDescription("");
    setPickerLoading(true);
    try {
      const res = await api.listCollections();
      const linked = new Set(project?.collections.map((c) => c.id) ?? []);
      setAvailableCollections(res.items.filter((c) => !linked.has(c.id)));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load collections",
      );
    } finally {
      setPickerLoading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!id || !form.name?.trim()) return;
    setSaving(true);
    try {
      await api.updateProject(id, {
        name: form.name.trim(),
        clientName: form.clientName?.trim() || null,
        description: form.description?.trim() || null,
        industry: form.industry || null,
        audience: form.audience?.trim() || null,
        location: form.location?.trim() || null,
        projectType: form.projectType || null,
        designGoals: form.designGoals?.trim() || null,
      });
      toast.success("Project updated");
      setEditOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBrief(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await api.updateProject(id, {
        audience: briefForm.audience?.trim() || null,
        audienceNeeds: briefForm.audienceNeeds?.trim() || null,
        businessGoals: briefForm.businessGoals?.trim() || null,
        projectGoals: briefForm.projectGoals?.trim() || null,
        desiredStyles: briefForm.desiredStyles ?? [],
        avoidStyles: briefForm.avoidStyles ?? [],
        keyMessages: briefForm.keyMessages?.trim() || null,
        contentTypes: briefForm.contentTypes ?? [],
        requiredFeatures: linesToArray(featuresText),
        preferredSources: briefForm.preferredSources ?? [],
        referenceKeywords: linesToArray(keywordsText),
        competitors: linesToArray(competitorsText),
        competitorNotes: briefForm.competitorNotes?.trim() || null,
        constraints: briefForm.constraints?.trim() || null,
      });
      toast.success("Research brief saved");
      setBriefOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!id || !project) return;
    const next = project.status === "active" ? "archived" : "active";
    try {
      await api.updateProject(id, { status: next });
      toast.success(
        next === "archived" ? "Project archived" : "Project restored",
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
  }

  async function handleDelete() {
    if (!id) return;
    setSaving(true);
    try {
      await api.deleteProject(id);
      toast.success("Project deleted — collections and references kept");
      navigate("/projects");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
      setDeleteOpen(false);
    }
  }

  async function handleAddExistingCollections() {
    if (!id || !pickedCollections.length) return;
    setSaving(true);
    try {
      const result = await api.addCollectionsToProject(id, pickedCollections);
      toast.success(
        `Added ${result.added.length}${
          result.skippedDuplicates.length
            ? `, skipped ${result.skippedDuplicates.length} duplicates`
            : ""
        }`,
      );
      setAddCollectionOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Add failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAndAddCollection(e: FormEvent) {
    e.preventDefault();
    if (!id || !newCollectionName.trim()) {
      toast.error("Collection name is required");
      return;
    }
    setSaving(true);
    try {
      const created = await api.createCollection({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || null,
      });
      await api.addCollectionsToProject(id, [created.id]);
      toast.success("Collection created and linked");
      setAddCollectionOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveCollection(collectionId: string) {
    if (!id) return;
    try {
      await api.removeCollectionFromProject(id, collectionId);
      toast.success("Collection unlinked from project");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-card p-6 text-destructive">
        {error}
      </div>
    );
  }

  if (!project) {
    return <div className="text-muted-foreground">Loading project…</div>;
  }

  const metaRows = [
    { label: "Client", value: project.clientName },
    { label: "Industry", value: project.industry },
    { label: "Location", value: project.location },
    { label: "Project Type", value: project.projectType },
  ].filter((row) => row.value);

  const contextItems = [
    { label: "Target audience", value: project.audience },
    {
      label: "Desired styles",
      value: project.desiredStyles.length
        ? project.desiredStyles.join(", ")
        : null,
    },
    {
      label: "Avoid styles",
      value: project.avoidStyles.length ? project.avoidStyles.join(", ") : null,
    },
    { label: "Project goals", value: project.projectGoals },
    {
      label: "Reference keywords",
      value: project.referenceKeywords.length
        ? project.referenceKeywords.join(", ")
        : null,
    },
  ].filter((item) => item.value);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link to="/projects">
            <ArrowLeft /> Back to projects
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void openAddCollection()}>
            <Plus /> Add Collection
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil /> Edit Overview
          </Button>
          <Button variant="outline" onClick={() => void handleArchive()}>
            {project.status === "active" ? "Archive" : "Restore"}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 /> Delete
          </Button>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Project Overview
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl tracking-tight">{project.name}</h1>
          <Badge
            variant={project.status === "active" ? "default" : "secondary"}
          >
            {project.status}
          </Badge>
        </div>
        {project.description && (
          <p className="max-w-3xl text-muted-foreground">{project.description}</p>
        )}
        {metaRows.length > 0 && (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metaRows.map((row) => (
              <div key={row.label}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="mt-1 text-sm">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {project.designGoals && (
          <div>
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
              Design Goals
            </h2>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {project.designGoals}
            </p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {project.collectionCount} collection
          {project.collectionCount === 1 ? "" : "s"} · {project.referenceCount}{" "}
          unique reference
          {project.referenceCount === 1 ? "" : "s"}
        </p>
      </section>

      <section className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Research Brief
            </p>
            <h2 className="mt-1 font-display text-3xl tracking-tight">
              Design requirements
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Structured context for what is being designed and which qualities
              to research. Used later by AI research — context only for now.
            </p>
          </div>
          <Button onClick={openBriefEditor}>
            <Pencil /> Edit Research Brief
          </Button>
        </div>

        {!hasBriefContent(project) ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            No research brief yet. Add audience, goals, styles, and constraints
            to guide collection curation.
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold">1. Audience</h3>
              <BriefText label="Target audience" value={project.audience} />
              <BriefText label="Audience needs" value={project.audienceNeeds} />
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold">2. Business Goals</h3>
              <BriefText label="Business goals" value={project.businessGoals} />
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold">3. Project Goals</h3>
              <BriefText label="Project goals" value={project.projectGoals} />
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold">4. Design Direction</h3>
              <BriefTags label="Desired styles" values={project.desiredStyles} />
              <BriefTags label="Avoid styles" values={project.avoidStyles} />
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold">5. Content</h3>
              <BriefText label="Key messages" value={project.keyMessages} />
              <BriefTags label="Content types" values={project.contentTypes} />
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold">6. Functional Requirements</h3>
              <BriefTags
                label="Required features"
                values={project.requiredFeatures}
              />
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold">7. Inspiration</h3>
              <BriefTags
                label="Preferred sources"
                values={project.preferredSources}
              />
              <BriefTags
                label="Reference keywords"
                values={project.referenceKeywords}
              />
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold">8. Competitive Context</h3>
              <BriefTags label="Competitors" values={project.competitors} />
              <BriefText
                label="Competitor notes"
                value={project.competitorNotes}
              />
            </div>
            <div className="flex flex-col gap-4 lg:col-span-2">
              <h3 className="font-semibold">9. Constraints</h3>
              <BriefText label="Constraints" value={project.constraints} />
            </div>
          </div>
        )}
      </section>

      <ProjectResearchPanel project={project} onLibraryChanged={load} />

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Research Collections
            </p>
            <h2 className="mt-1 font-display text-2xl tracking-tight">
              Collections
            </h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void openAddCollection()}
          >
            <FolderPlus /> Add
          </Button>
        </div>
        {project.collections.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            No collections linked yet. Add an existing set or create a new one.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.collections.map((collection) => (
              <div
                key={collection.id}
                className="overflow-hidden rounded-xl border bg-card shadow-sm"
              >
                <Link to={`/collections/${collection.id}`}>
                  <CollectionCover images={collection.coverImages} />
                </Link>
                <div className="flex flex-col gap-2 p-4">
                  <Link
                    to={`/collections/${collection.id}`}
                    className="font-semibold hover:underline"
                  >
                    {collection.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {collection.referenceCount} reference
                    {collection.referenceCount === 1 ? "" : "s"}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void handleRemoveCollection(collection.id)}
                  >
                    Unlink
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Aggregated References
          </p>
          <h2 className="mt-1 font-display text-2xl tracking-tight">
            References
          </h2>
        </div>

        {contextItems.length > 0 && (
          <div className="rounded-xl border bg-muted/40 p-5">
            <h3 className="text-sm font-semibold">Research Context</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Why these references are being collected — from the research
              brief. Collections are not auto-filtered.
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {contextItems.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-sm">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {project.references.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            Aggregated references from project collections will appear here.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.references.map((ref) => (
              <ReferenceCard key={ref.id} reference={ref} />
            ))}
          </div>
        )}
      </section>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit project overview</DialogTitle>
            <DialogDescription>
              Update core project metadata. Research brief is edited separately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-project-name">Name *</Label>
              <Input
                id="edit-project-name"
                value={form.name ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-client">Client Name</Label>
              <Input
                id="edit-client"
                value={form.clientName ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientName: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Industry</Label>
                <Select
                  value={form.industry || undefined}
                  onValueChange={(value) =>
                    setForm((f) => ({
                      ...f,
                      industry: value === "__none__" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {(taxonomy?.industries ?? []).map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Project Type</Label>
                <Select
                  value={form.projectType || undefined}
                  onValueChange={(value) =>
                    setForm((f) => ({
                      ...f,
                      projectType: value === "__none__" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {(taxonomy?.projectTypes ?? []).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={form.location ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-goals">Design Goals</Label>
              <Textarea
                id="edit-goals"
                value={form.designGoals ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, designGoals: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={briefOpen} onOpenChange={setBriefOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Research Brief</DialogTitle>
            <DialogDescription>
              All fields are optional. Styles and sources use ADI taxonomy
              values.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveBrief} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="brief-audience">Target Audience</Label>
              <Input
                id="brief-audience"
                value={briefForm.audience ?? ""}
                onChange={(e) =>
                  setBriefForm((f) => ({ ...f, audience: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="brief-audience-needs">Audience Needs</Label>
              <Textarea
                id="brief-audience-needs"
                value={briefForm.audienceNeeds ?? ""}
                onChange={(e) =>
                  setBriefForm((f) => ({
                    ...f,
                    audienceNeeds: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="brief-business">Business Goals</Label>
              <Textarea
                id="brief-business"
                value={briefForm.businessGoals ?? ""}
                onChange={(e) =>
                  setBriefForm((f) => ({
                    ...f,
                    businessGoals: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="brief-project-goals">Project Goals</Label>
              <Textarea
                id="brief-project-goals"
                value={briefForm.projectGoals ?? ""}
                onChange={(e) =>
                  setBriefForm((f) => ({
                    ...f,
                    projectGoals: e.target.value,
                  }))
                }
              />
            </div>
            <MultiCheckGroup
              label="Desired Styles"
              options={taxonomy?.styles ?? []}
              values={briefForm.desiredStyles ?? []}
              onChange={(desiredStyles) =>
                setBriefForm((f) => ({ ...f, desiredStyles }))
              }
              maxHeight="max-h-36"
            />
            <MultiCheckGroup
              label="Avoid Styles"
              options={taxonomy?.styles ?? []}
              values={briefForm.avoidStyles ?? []}
              onChange={(avoidStyles) =>
                setBriefForm((f) => ({ ...f, avoidStyles }))
              }
              maxHeight="max-h-36"
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="brief-messages">Key Messages</Label>
              <Textarea
                id="brief-messages"
                value={briefForm.keyMessages ?? ""}
                onChange={(e) =>
                  setBriefForm((f) => ({ ...f, keyMessages: e.target.value }))
                }
              />
            </div>
            <MultiCheckGroup
              label="Content Types"
              options={taxonomy?.contentTypes ?? []}
              values={briefForm.contentTypes ?? []}
              onChange={(contentTypes) =>
                setBriefForm((f) => ({ ...f, contentTypes }))
              }
              maxHeight="max-h-36"
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="brief-features">Required Features</Label>
              <Textarea
                id="brief-features"
                placeholder="One feature per line"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
              />
            </div>
            <MultiCheckGroup
              label="Preferred Sources"
              options={taxonomy?.sources ?? []}
              values={briefForm.preferredSources ?? []}
              onChange={(preferredSources) =>
                setBriefForm((f) => ({ ...f, preferredSources }))
              }
              maxHeight="max-h-36"
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="brief-keywords">Reference Keywords</Label>
              <Textarea
                id="brief-keywords"
                placeholder="Keywords, comma or line separated"
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="brief-competitors">Competitors</Label>
              <Textarea
                id="brief-competitors"
                placeholder="One competitor per line"
                value={competitorsText}
                onChange={(e) => setCompetitorsText(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="brief-competitor-notes">Competitor Notes</Label>
              <Textarea
                id="brief-competitor-notes"
                value={briefForm.competitorNotes ?? ""}
                onChange={(e) =>
                  setBriefForm((f) => ({
                    ...f,
                    competitorNotes: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="brief-constraints">Constraints</Label>
              <Textarea
                id="brief-constraints"
                value={briefForm.constraints ?? ""}
                onChange={(e) =>
                  setBriefForm((f) => ({ ...f, constraints: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBriefOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save brief"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This removes the project only. Collections and references stay in
              the library.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={saving}
              onClick={() => void handleDelete()}
            >
              {saving ? "Deleting…" : "Delete project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addCollectionOpen} onOpenChange={setAddCollectionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add collection</DialogTitle>
            <DialogDescription>
              Link an existing collection or create a new one. References are
              not copied.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={pickerMode === "existing" ? "default" : "outline"}
              onClick={() => setPickerMode("existing")}
            >
              Existing
            </Button>
            <Button
              size="sm"
              variant={pickerMode === "new" ? "default" : "outline"}
              onClick={() => setPickerMode("new")}
            >
              Create new
            </Button>
          </div>

          {pickerMode === "existing" ? (
            <>
              {pickerLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : availableCollections.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No other collections available. Create a new one instead.
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto rounded-md border">
                  {availableCollections.map((collection) => {
                    const checked = pickedCollections.includes(collection.id);
                    return (
                      <label
                        key={collection.id}
                        className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-0 hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setPickedCollections((prev) =>
                              checked
                                ? prev.filter(
                                    (value) => value !== collection.id,
                                  )
                                : [...prev, collection.id],
                            )
                          }
                        />
                        <span className="text-sm">
                          {collection.name}
                          <span className="ml-2 text-muted-foreground">
                            ({collection.referenceCount})
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddCollectionOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={saving || pickedCollections.length === 0}
                  onClick={() => void handleAddExistingCollections()}
                >
                  {saving
                    ? "Adding…"
                    : `Add${pickedCollections.length ? ` ${pickedCollections.length}` : ""}`}
                </Button>
              </div>
            </>
          ) : (
            <form
              onSubmit={handleCreateAndAddCollection}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-collection-name">Name *</Label>
                <Input
                  id="new-collection-name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-collection-description">Description</Label>
                <Textarea
                  id="new-collection-description"
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddCollectionOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating…" : "Create & link"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
