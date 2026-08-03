import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  api,
  type ProjectInput,
  type ProjectSummary,
  type Taxonomy,
} from "@/lib/api";
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

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

const emptyForm: ProjectInput = {
  name: "",
  clientName: "",
  description: "",
  industry: "",
  audience: "",
  location: "",
  projectType: "",
  designGoals: "",
};

export function ProjectsPage() {
  const [items, setItems] = useState<ProjectSummary[]>([]);
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectSummary | null>(null);
  const [form, setForm] = useState<ProjectInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const active = useMemo(
    () => items.filter((p) => p.status === "active"),
    [items],
  );
  const archived = useMemo(
    () => items.filter((p) => p.status === "archived"),
    [items],
  );

  async function load() {
    setLoading(true);
    try {
      const [projectsRes, tax] = await Promise.all([
        api.listProjects(),
        api.getTaxonomy(),
      ]);
      setItems(projectsRes.items);
      setTaxonomy(tax);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setCreateOpen(true);
  }

  function openEdit(project: ProjectSummary) {
    setEditing(project);
    setForm({
      name: project.name,
      clientName: project.clientName ?? "",
      description: project.description ?? "",
      industry: project.industry ?? "",
      audience: project.audience ?? "",
      location: project.location ?? "",
      projectType: project.projectType ?? "",
      designGoals: project.designGoals ?? "",
    });
    setEditOpen(true);
  }

  function payloadFromForm(): ProjectInput {
    return {
      name: form.name?.trim(),
      clientName: form.clientName?.trim() || null,
      description: form.description?.trim() || null,
      industry: form.industry || null,
      audience: form.audience?.trim() || null,
      location: form.location?.trim() || null,
      projectType: form.projectType || null,
      designGoals: form.designGoals?.trim() || null,
    };
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error("Project name is required");
      return;
    }
    setSaving(true);
    try {
      await api.createProject(payloadFromForm());
      toast.success("Project created");
      setCreateOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing || !form.name?.trim()) return;
    setSaving(true);
    try {
      await api.updateProject(editing.id, payloadFromForm());
      toast.success("Project updated");
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(project: ProjectSummary) {
    try {
      await api.updateProject(project.id, { status: "archived" });
      toast.success("Project archived");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Archive failed");
    }
  }

  async function handleRestore(project: ProjectSummary) {
    try {
      await api.updateProject(project.id, { status: "active" });
      toast.success("Project restored");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  async function handleDelete(project: ProjectSummary) {
    if (
      !window.confirm(
        `Delete “${project.name}”? Collections and references will be kept.`,
      )
    ) {
      return;
    }
    try {
      await api.deleteProject(project.id);
      toast.success("Project deleted — collections and references kept");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function renderForm(
    onSubmit: (e: FormEvent) => void,
    submitLabel: string,
    onCancel: () => void,
  ) {
    return (
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="project-name">Name *</Label>
          <Input
            id="project-name"
            value={form.name ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="project-client">Client Name</Label>
          <Input
            id="project-client"
            value={form.clientName ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, clientName: e.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="project-description">Description</Label>
          <Textarea
            id="project-description"
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-audience">Audience</Label>
            <Input
              id="project-audience"
              value={form.audience ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, audience: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-location">Location</Label>
            <Input
              id="project-location"
              value={form.location ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="project-goals">Design Goals</Label>
          <Textarea
            id="project-goals"
            value={form.designGoals ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, designGoals: e.target.value }))
            }
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    );
  }

  function ProjectCard({ project }: { project: ProjectSummary }) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              to={`/projects/${project.id}`}
              className="text-lg font-semibold leading-snug hover:underline"
            >
              {project.name}
            </Link>
            {project.clientName && (
              <p className="mt-1 text-sm text-muted-foreground">
                {project.clientName}
              </p>
            )}
          </div>
          <Badge variant={project.status === "active" ? "default" : "secondary"}>
            {project.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {project.industry && <span>{project.industry}</span>}
          <span>
            {project.collectionCount} collection
            {project.collectionCount === 1 ? "" : "s"}
          </span>
          <span>
            {project.referenceCount} reference
            {project.referenceCount === 1 ? "" : "s"}
          </span>
          <span>Updated {formatDate(project.updatedAt)}</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm" variant="outline">
            <Link to={`/projects/${project.id}`}>Open</Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEdit(project)}>
            Edit
          </Button>
          {project.status === "active" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleArchive(project)}
            >
              Archive
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleRestore(project)}
            >
              Restore
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => void handleDelete(project)}
          >
            Delete
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Projects</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Organize design research around real client work. Link collections
            of references to each project brief — without copying assets.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> New Project
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading projects…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <Briefcase className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            No projects yet. Create one to start organizing research.
          </p>
          <Button className="mt-4" onClick={openCreate}>
            Create project
          </Button>
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Active ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active projects.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>

          {archived.length > 0 && (
            <section className="flex flex-col gap-4 border-t pt-6">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Archived ({archived.length})
              </h2>
              <div className="grid gap-4 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
                {archived.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
            <DialogDescription>
              Define the client brief. Status defaults to active.
            </DialogDescription>
          </DialogHeader>
          {renderForm(handleCreate, "Create", () => setCreateOpen(false))}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>
              Update project research metadata.
            </DialogDescription>
          </DialogHeader>
          {renderForm(handleEdit, "Save", () => setEditOpen(false))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
