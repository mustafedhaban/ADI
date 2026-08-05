import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  api,
  type ProjectInput,
  type ProjectSummary,
  type Taxonomy,
} from "@/lib/api";
import { ProjectCard } from "@/components/projects/ProjectCard";
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
import {
  Empty,
  Loading,
  Meta,
  PageHeader,
  Section,
} from "@/components/common/Primitives";

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

  const totalRefs = items.reduce((sum, p) => sum + p.referenceCount, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Work"
        title="Projects"
        lede="Design research organised around real client work. Each project links collections to a brief — the library stays the single source."
        actions={
          <Button onClick={openCreate}>
            <Plus /> New Project
          </Button>
        }
      />

      {!loading && items.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <Meta className="tabular" aria-live="polite">
            {active.length} active · {archived.length} archived
          </Meta>
          <Meta className="tabular">
            {totalRefs} aggregated reference{totalRefs === 1 ? "" : "s"}
          </Meta>
        </div>
      )}

      {loading ? (
        <Loading>Loading projects…</Loading>
      ) : items.length === 0 ? (
        <Empty action={<Button onClick={openCreate}>Create project</Button>}>
          No projects yet. Create one to start organising research around client
          work.
        </Empty>
      ) : (
        <div className="flex flex-col gap-12">
          <Section eyebrow={`Active · ${active.length}`}>
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active projects.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {active.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={openEdit}
                    onArchive={(p) => void handleArchive(p)}
                    onDelete={(p) => void handleDelete(p)}
                  />
                ))}
              </div>
            )}
          </Section>

          {archived.length > 0 && (
            <Section eyebrow={`Archived · ${archived.length}`}>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {archived.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={openEdit}
                    onRestore={(p) => void handleRestore(p)}
                    onDelete={(p) => void handleDelete(p)}
                  />
                ))}
              </div>
            </Section>
          )}
        </div>
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
