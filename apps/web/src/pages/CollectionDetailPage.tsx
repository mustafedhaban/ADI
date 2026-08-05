import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  api,
  type CollectionDetail,
  type ProjectSummary,
  type Reference,
} from "@/lib/api";
import { CollectionCover } from "@/components/collections/CollectionCover";
import {
  ReferenceCard,
  ReferenceRow,
} from "@/components/references/ReferenceCard";
import { StyleTerm } from "@/components/references/StyleTerm";
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
import {
  Empty,
  ErrorNote,
  HeaderActions,
  HeaderTool,
  Loading,
  Meta,
  Metric,
  PageHeader,
  Section,
  Tag,
  ViewToggle,
} from "@/components/common/Primitives";

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
  const [view, setView] = useState<"grid" | "index">("grid");

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

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!collection) return <Loading>Loading collection…</Loading>;

  const coverStyles = [
    ...new Set(collection.references.flatMap((r) => r.styles)),
  ];

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        back={{ to: "/collections", label: "Collections" }}
        eyebrow="Research set"
        title={collection.name}
        lede={collection.description ?? undefined}
        actions={
          <HeaderActions
            primary={
              <Button onClick={() => void openAddDialog()}>
                <Plus /> Add references
              </Button>
            }
            secondary={
              <>
                <HeaderTool onClick={() => void openAddProjectDialog()}>
                  Link project
                </HeaderTool>
                <HeaderTool onClick={() => setEditOpen(true)}>Edit</HeaderTool>
                <HeaderTool tone="danger" onClick={() => setDeleteOpen(true)}>
                  Delete
                </HeaderTool>
              </>
            }
          />
        }
      />

      {/* Editorial masthead — cover + archive meta */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
        <CollectionCover
          images={collection.coverImages}
          styles={coverStyles}
          label={collection.name}
          size="lg"
          className="border bg-card"
        />

        <div className="flex flex-col justify-end gap-6">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Metric
              value={collection.referenceCount}
              label={`reference${collection.referenceCount === 1 ? "" : "s"}`}
            />
            <Metric
              value={projects.length}
              label={`project${projects.length === 1 ? "" : "s"}`}
            />
            {coverStyles.length > 0 && (
              <Metric
                value={coverStyles.length}
                label={`style${coverStyles.length === 1 ? "" : "s"}`}
              />
            )}
          </div>

          <div className="flex flex-col gap-2 border-t pt-5">
            <div className="flex items-center justify-between gap-3">
              <Meta>Used in projects</Meta>
              <button
                type="button"
                onClick={() => void openAddProjectDialog()}
                className="meta transition-colors hover:text-foreground"
              >
                + Link
              </button>
            </div>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not linked to any project yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {projects.map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`}>
                    <Tag className="transition-colors hover:border-rule-strong hover:bg-surface-2">
                      {project.name}
                      {project.status === "archived" ? " · archived" : ""}
                    </Tag>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {coverStyles.length > 0 && (
            <div className="flex flex-col gap-2 border-t pt-5">
              <Meta>Style character</Meta>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-lg leading-snug text-ink-2">
                {coverStyles.slice(0, 8).map((term, i) => (
                  <span key={term} className="inline-flex items-baseline gap-3">
                    {i > 0 && (
                      <span aria-hidden className="text-rule-strong">
                        /
                      </span>
                    )}
                    <StyleTerm term={term} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Section
        eyebrow="Contents"
        title="References"
        description="The curated board for this set — same specimen language as the library."
        action={<ViewToggle value={view} onChange={setView} />}
      >
        {collection.references.length === 0 ? (
          <Empty
            eyebrow="Empty board"
            action={
              <Button onClick={() => void openAddDialog()}>
                Add references
              </Button>
            }
          >
            This set has no references yet. Add from the library to build the
            research board.
          </Empty>
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {collection.references.map((ref) => (
              <div key={ref.id} className="group/item relative">
                <ReferenceCard reference={ref} />
                <button
                  type="button"
                  onClick={() => void handleRemove(ref.id)}
                  className="meta absolute right-2.5 top-2.5 rounded-sm border border-rule-strong bg-card px-2 py-1 opacity-0 transition-opacity hover:border-destructive hover:text-destructive focus-visible:opacity-100 group-hover/item:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden border bg-card">
            {collection.references.map((ref) => (
              <div key={ref.id} className="group/row relative">
                <ReferenceRow reference={ref} />
                <button
                  type="button"
                  onClick={() => void handleRemove(ref.id)}
                  className="meta absolute right-3 top-1/2 -translate-y-1/2 rounded-sm border border-rule-strong bg-card px-2 py-1 opacity-0 transition-opacity hover:border-destructive hover:text-destructive focus-visible:opacity-100 group-hover/row:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

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
            <Loading>Loading library…</Loading>
          ) : pickerRefs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All library references are already in this collection.
            </p>
          ) : (
            <div className="thin-scroll max-h-80 overflow-y-auto border">
              {pickerRefs.map((ref) => {
                const checked = picked.includes(ref.id);
                return (
                  <label
                    key={ref.id}
                    className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 last:border-0 hover:bg-surface-2"
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
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{ref.title}</span>
                      <Meta className="mt-0.5 block truncate">
                        {ref.type} · {ref.source}
                      </Meta>
                    </span>
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
            <DialogTitle>Link to project</DialogTitle>
            <DialogDescription>
              Attach this collection to one or more active projects. References
              are not copied.
            </DialogDescription>
          </DialogHeader>
          {projectsLoading ? (
            <Loading>Loading projects…</Loading>
          ) : availableProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No other active projects available.{" "}
              <Link to="/projects" className="underline">
                Create a project
              </Link>{" "}
              first.
            </p>
          ) : (
            <div className="thin-scroll max-h-80 overflow-y-auto border">
              {availableProjects.map((project) => {
                const checked = pickedProjects.includes(project.id);
                return (
                  <label
                    key={project.id}
                    className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 last:border-0 hover:bg-surface-2"
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
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{project.name}</span>
                      {project.clientName && (
                        <Meta className="mt-0.5 block truncate">
                          {project.clientName}
                        </Meta>
                      )}
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
