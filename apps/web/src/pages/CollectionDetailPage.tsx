import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  api,
  type CollectionDetail,
  type ProjectSummary,
  type Reference,
} from "@/lib/api";
import { CollectionCover } from "@/components/collections/CollectionCover";
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
import { Textarea } from "@/components/ui/textarea";

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [pickerRefs, setPickerRefs] = useState<Reference[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<ProjectSummary[]>(
    [],
  );
  const [pickedProjects, setPickedProjects] = useState<string[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const [item, projectRes] = await Promise.all([
        api.getCollection(id),
        api.listProjectsForCollection(id),
      ]);
      setCollection(item);
      setProjects(projectRes.items);
      setName(item.name);
      setDescription(item.description ?? "");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function openAddDialog() {
    setAddOpen(true);
    setLibraryLoading(true);
    setPicked([]);
    try {
      const res = await api.listReferences();
      const existing = new Set(collection?.references.map((r) => r.id) ?? []);
      setPickerRefs(res.items.filter((r) => !existing.has(r.id)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load library");
    } finally {
      setLibraryLoading(false);
    }
  }

  async function openAddProjectDialog() {
    setAddProjectOpen(true);
    setProjectsLoading(true);
    setPickedProjects([]);
    try {
      const res = await api.listProjects("active");
      const linked = new Set(projects.map((p) => p.id));
      setAvailableProjects(res.items.filter((p) => !linked.has(p.id)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setProjectsLoading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!id || !name.trim()) return;
    setSaving(true);
    try {
      await api.updateCollection(id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      toast.success("Collection updated");
      setEditOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setSaving(true);
    try {
      await api.deleteCollection(id);
      toast.success("Collection deleted — references were kept");
      navigate("/collections");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
      setDeleteOpen(false);
    }
  }

  async function handleRemove(referenceId: string) {
    if (!id) return;
    try {
      await api.removeReferenceFromCollection(id, referenceId);
      toast.success("Removed from collection");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  }

  async function handleAddSelected() {
    if (!id || !picked.length) return;
    setSaving(true);
    try {
      const result = await api.addReferencesToCollection(id, picked);
      toast.success(
        `Added ${result.added.length}${
          result.skippedDuplicates.length
            ? `, skipped ${result.skippedDuplicates.length} duplicates`
            : ""
        }`,
      );
      setAddOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Add failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddToProjects() {
    if (!id || !pickedProjects.length) return;
    setSaving(true);
    try {
      let added = 0;
      let skipped = 0;
      for (const projectId of pickedProjects) {
        const result = await api.addCollectionsToProject(projectId, [id]);
        added += result.added.length;
        skipped += result.skippedDuplicates.length;
      }
      toast.success(
        `Linked to ${added} project${added === 1 ? "" : "s"}${
          skipped ? ` (${skipped} already linked)` : ""
        }`,
      );
      setAddProjectOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Link failed");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-card p-6 text-destructive">
        {error}
      </div>
    );
  }

  if (!collection) {
    return <div className="text-muted-foreground">Loading collection…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link to="/collections">
            <ArrowLeft /> Back to collections
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void openAddDialog()}>
            <Plus /> Add references
          </Button>
          <Button variant="outline" onClick={() => void openAddProjectDialog()}>
            <Briefcase /> Add to project
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <CollectionCover images={collection.coverImages} />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-4xl tracking-tight">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-muted-foreground">{collection.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {collection.referenceCount} reference
            {collection.referenceCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl tracking-tight">Used in projects</h2>
          <Button size="sm" variant="outline" onClick={() => void openAddProjectDialog()}>
            <Briefcase /> Add to project
          </Button>
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This collection is not linked to any projects yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {projects.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Badge
                  variant={project.status === "active" ? "default" : "secondary"}
                  className="cursor-pointer"
                >
                  {project.name}
                  {project.status === "archived" ? " (archived)" : ""}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </section>

      {collection.references.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          This collection is empty. Add references from the library or this
          page.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collection.references.map((ref) => (
            <div key={ref.id} className="relative">
              <ReferenceCard reference={ref} />
              <Button
                size="sm"
                variant="secondary"
                className="absolute right-3 top-3"
                onClick={() => void handleRemove(ref.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit collection</DialogTitle>
            <DialogDescription>
              Update the name or description. References are unchanged.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete collection?</DialogTitle>
            <DialogDescription>
              This removes the collection only. References stay in the library.
              Project links to this collection will be removed.
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
              {saving ? "Deleting…" : "Delete collection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add references</DialogTitle>
            <DialogDescription>
              Select references from the library to associate with this
              collection.
            </DialogDescription>
          </DialogHeader>
          {libraryLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : pickerRefs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All library references are already in this collection.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-md border">
              {pickerRefs.map((ref) => {
                const checked = picked.includes(ref.id);
                return (
                  <label
                    key={ref.id}
                    className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-0 hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setPicked((prev) =>
                          checked
                            ? prev.filter((value) => value !== ref.id)
                            : [...prev, ref.id],
                        )
                      }
                    />
                    <span className="text-sm">{ref.title}</span>
                  </label>
                );
              })}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={saving || picked.length === 0}
              onClick={() => void handleAddSelected()}
            >
              {saving
                ? "Adding…"
                : `Add${picked.length ? ` ${picked.length}` : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addProjectOpen} onOpenChange={setAddProjectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add to project</DialogTitle>
            <DialogDescription>
              Link this collection to one or more active projects. References
              are not copied.
            </DialogDescription>
          </DialogHeader>
          {projectsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : availableProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No other active projects available.{" "}
              <Link to="/projects" className="underline">
                Create a project
              </Link>{" "}
              first.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-md border">
              {availableProjects.map((project) => {
                const checked = pickedProjects.includes(project.id);
                return (
                  <label
                    key={project.id}
                    className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-0 hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setPickedProjects((prev) =>
                          checked
                            ? prev.filter((value) => value !== project.id)
                            : [...prev, project.id],
                        )
                      }
                    />
                    <span className="text-sm">
                      {project.name}
                      {project.clientName ? (
                        <span className="ml-2 text-muted-foreground">
                          ({project.clientName})
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddProjectOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={saving || pickedProjects.length === 0}
              onClick={() => void handleAddToProjects()}
            >
              {saving
                ? "Linking…"
                : `Link${pickedProjects.length ? ` ${pickedProjects.length}` : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
