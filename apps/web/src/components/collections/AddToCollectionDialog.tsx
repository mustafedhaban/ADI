import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  api,
  type CollectionSummary,
} from "@/lib/api";
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

export function AddToCollectionDialog({
  open,
  onOpenChange,
  referenceIds,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceIds: string[];
  onAdded?: () => void;
}) {
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setShowCreate(false);
    setName("");
    setDescription("");
    api
      .listCollections()
      .then((res) => setCollections(res.items))
      .catch((err: Error) => toast.error(err.message));
  }, [open]);

  async function addTo(collectionId: string) {
    setLoading(true);
    try {
      const result = await api.addReferencesToCollection(
        collectionId,
        referenceIds,
      );
      const parts = [];
      if (result.added.length) parts.push(`Added ${result.added.length}`);
      if (result.skippedDuplicates.length)
        parts.push(`${result.skippedDuplicates.length} already in collection`);
      toast.success(parts.join(" · ") || "Done");
      onAdded?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setLoading(false);
    }
  }

  async function createAndAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Collection name is required");
      return;
    }
    setCreating(true);
    try {
      const created = await api.createCollection({
        name: name.trim(),
        description: description.trim() || null,
      });
      await api.addReferencesToCollection(created.id, referenceIds);
      toast.success(`Created “${created.name}” and added references`);
      onAdded?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to collection</DialogTitle>
          <DialogDescription>
            {referenceIds.length} reference
            {referenceIds.length === 1 ? "" : "s"} selected. A reference can
            belong to many collections.
          </DialogDescription>
        </DialogHeader>

        {!showCreate ? (
          <div className="flex flex-col gap-3">
            <div className="max-h-64 overflow-y-auto rounded-md border">
              {collections.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No collections yet.
                </p>
              ) : (
                <div className="flex flex-col">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      type="button"
                      disabled={loading}
                      onClick={() => void addTo(collection.id)}
                      className="flex items-start justify-between gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted"
                    >
                      <span>
                        <span className="block text-sm font-medium">
                          {collection.name}
                        </span>
                        {collection.description && (
                          <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-1">
                            {collection.description}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {collection.referenceCount}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreate(true)}
            >
              Create New Collection
            </Button>
          </div>
        ) : (
          <form onSubmit={createAndAdd} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-collection-name">Name *</Label>
              <Input
                id="new-collection-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-collection-description">Description</Label>
              <Textarea
                id="new-collection-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
              >
                Back
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create & Add"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
