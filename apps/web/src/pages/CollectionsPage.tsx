import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FolderPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, type CollectionSummary } from "@/lib/api";
import { CollectionCover } from "@/components/collections/CollectionCover";
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

export function CollectionsPage() {
  const [items, setItems] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.listCollections();
      setItems(res.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Collection name is required");
      return;
    }
    setSaving(true);
    try {
      await api.createCollection({
        name: name.trim(),
        description: description.trim() || null,
      });
      toast.success("Collection created");
      setCreateOpen(false);
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Collections</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Group references into reusable inspiration sets for projects,
            clients, and research themes. References are not moved — they can
            belong to many collections.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> New Collection
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading collections…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <FolderPlus className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            No collections yet. Create one to start grouping references.
          </p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            Create collection
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.id}`}
              className="group overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <CollectionCover images={collection.coverImages} />
              <div className="flex flex-col gap-2 p-4">
                <h2 className="text-lg font-semibold leading-snug">
                  {collection.name}
                </h2>
                {collection.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {collection.description}
                  </p>
                )}
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {collection.referenceCount} reference
                    {collection.referenceCount === 1 ? "" : "s"}
                  </span>
                  <span>{formatDate(collection.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create collection</DialogTitle>
            <DialogDescription>
              Name a set for a project, client, or research theme.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="collection-name">Name *</Label>
              <Input
                id="collection-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="collection-description">Description</Label>
              <Textarea
                id="collection-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
