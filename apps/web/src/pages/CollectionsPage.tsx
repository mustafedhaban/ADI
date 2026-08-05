import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { api, type CollectionSummary } from "@/lib/api";
import { CollectionCard } from "@/components/collections/CollectionCard";
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
  Loading,
  Meta,
  PageHeader,
} from "@/components/common/Primitives";

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

  const totalRefs = items.reduce((sum, c) => sum + c.referenceCount, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Sets"
        title="Collections"
        lede="Curated visual research sets — each one an argument about taste, not a folder. A reference can belong to many collections; nothing is moved or copied."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> New Collection
          </Button>
        }
      />

      {!loading && items.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <Meta className="tabular" aria-live="polite">
            {items.length} collection{items.length === 1 ? "" : "s"}
          </Meta>
          <Meta className="tabular">
            {totalRefs} linked reference{totalRefs === 1 ? "" : "s"}
          </Meta>
        </div>
      )}

      {loading ? (
        <Loading>Loading collections…</Loading>
      ) : items.length === 0 ? (
        <Empty
          action={
            <Button onClick={() => setCreateOpen(true)}>
              Create collection
            </Button>
          }
        >
          No collections yet. Create one to start grouping references into a
          curated research set.
        </Empty>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create collection</DialogTitle>
            <DialogDescription>
              Name a curated set for a project, client, or research theme.
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
                placeholder="What argument does this set make?"
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
