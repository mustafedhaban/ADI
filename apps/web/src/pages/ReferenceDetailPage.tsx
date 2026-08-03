import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  FolderPlus,
  ImageOff,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  api,
  type CollectionSummary,
  type Reference,
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
import { Separator } from "@/components/ui/separator";
import { AddToCollectionDialog } from "@/components/collections/AddToCollectionDialog";

function TagList({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Badge key={value} variant="secondary">
            {value}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function ReferenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reference, setReference] = useState<Reference | null>(null);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadCollections(referenceId: string) {
    try {
      const res = await api.listCollectionsForReference(referenceId);
      setCollections(res.items);
    } catch {
      setCollections([]);
    }
  }

  useEffect(() => {
    if (!id) return;
    api
      .getReference(id)
      .then((ref) => {
        setReference(ref);
        void loadCollections(ref.id);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await api.deleteReference(id);
      toast.success("Reference deleted");
      navigate("/references");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-card p-6 text-destructive">
        {error}
      </div>
    );
  }

  if (!reference) {
    return <div className="text-muted-foreground">Loading reference…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link to="/references">
            <ArrowLeft /> Back to library
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPickerOpen(true)}>
            <FolderPlus /> Add to Collection
          </Button>
          <Button asChild variant="outline">
            <Link to={`/references/${reference.id}/edit`}>
              <Pencil /> Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="aspect-[16/10] bg-muted">
            {reference.image ? (
              <img
                src={reference.image}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageOff className="size-10 opacity-50" />
                <span className="text-sm">No preview image</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge>{reference.type}</Badge>
              <Badge variant="outline">{reference.source}</Badge>
            </div>
            <h1 className="font-display text-4xl tracking-tight">
              {reference.title}
            </h1>
            <a
              href={reference.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              {reference.url}
              <ExternalLink className="size-3.5" />
            </a>
          </div>

          {reference.description && (
            <p className="leading-relaxed text-muted-foreground">
              {reference.description}
            </p>
          )}

          <Separator />

          {reference.whySaved && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                Why saved
              </h2>
              <p className="leading-relaxed">{reference.whySaved}</p>
            </div>
          )}

          {reference.whatToLearn.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                What to learn
              </h2>
              <ul className="flex flex-col gap-1.5">
                {reference.whatToLearn.map((item) => (
                  <li key={item} className="text-sm leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {collections.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                Collections
              </h2>
              <div className="flex flex-col gap-1.5">
                {collections.map((collection) => (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {collection.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 rounded-xl border bg-card p-6 md:grid-cols-2">
        <TagList label="Industries" values={reference.industries} />
        <TagList label="Page types" values={reference.pageTypes} />
        <TagList label="Styles" values={reference.styles} />
        <TagList label="Patterns" values={reference.patterns} />
        <TagList label="Tags" values={reference.tags} />
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete reference?</DialogTitle>
            <DialogDescription>
              This will permanently remove “{reference.title}” from the library.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddToCollectionDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        referenceIds={[reference.id]}
        onAdded={() => void loadCollections(reference.id)}
      />
    </div>
  );
}
