import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ExternalLink, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { api, type CollectionSummary, type Reference } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ErrorNote,
  HeaderActions,
  HeaderTool,
  Loading,
  Meta,
  PageHeader,
  Tag,
} from "@/components/common/Primitives";
import { StyleTerm } from "@/components/references/StyleTerm";
import { AddToCollectionDialog } from "@/components/collections/AddToCollectionDialog";

/** One taxonomy axis. Tags link back into a filtered library view. */
function Axis({
  label,
  values,
  axis,
}: {
  label: string;
  values: string[];
  axis?: "styles" | "patterns" | "industries" | "pageTypes" | "tags";
}) {
  if (!values.length) return null;
  return (
    <div className="flex flex-col gap-2 border-t py-4 first:border-0 sm:flex-row sm:gap-6">
      <Meta className="sm:w-28 sm:shrink-0 sm:pt-1">{label}</Meta>
      <div className="flex flex-wrap gap-1.5">
        {values.map((value) =>
          axis ? (
            <Link key={value} to={`/references?${axis}=${encodeURIComponent(value)}`}>
              <Tag className="transition-colors hover:border-rule-strong hover:bg-surface-2">
                {value}
              </Tag>
            </Link>
          ) : (
            <Tag key={value}>{value}</Tag>
          ),
        )}
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

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!reference) return <Loading>Loading reference…</Loading>;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        back={{ to: "/references", label: "Library" }}
        eyebrow={`${reference.type} · ${reference.source}`}
        title={reference.title}
        actions={
          <HeaderActions
            primary={
              <Button onClick={() => setPickerOpen(true)}>
                <FolderPlus /> Add to Collection
              </Button>
            }
            secondary={
              <>
                <HeaderTool
                  onClick={() => navigate(`/references/${reference.id}/edit`)}
                >
                  Edit
                </HeaderTool>
                <HeaderTool tone="danger" onClick={() => setConfirmOpen(true)}>
                  Delete
                </HeaderTool>
              </>
            }
          />
        }
      />

      {/* The specimen: this reference's visual character, set large. */}
      <div className="flex flex-col gap-5 bg-card p-8">
        <Meta>Visual character</Meta>
        {reference.styles.length ? (
          <p className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-4xl leading-tight md:text-5xl">
            {reference.styles.map((style, i) => (
              <span key={style} className="inline-flex items-baseline gap-5">
                {i > 0 && (
                  <span aria-hidden className="text-rule-strong">
                    /
                  </span>
                )}
                <Link
                  to={`/references?styles=${encodeURIComponent(style)}`}
                  className="transition-opacity hover:opacity-60"
                >
                  <StyleTerm term={style} />
                </Link>
              </span>
            ))}
          </p>
        ) : (
          <p className="meta">Unclassified</p>
        )}
        <a
          href={reference.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 break-all font-mono text-xs text-ink-2 transition-colors hover:text-primary"
        >
          {reference.url}
          <ExternalLink aria-hidden className="size-3.5 shrink-0" />
        </a>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-8">
          {reference.description && (
            <p className="prose-measure text-base leading-relaxed">
              {reference.description}
            </p>
          )}

          {reference.whySaved && (
            <div className="border-l-2 border-primary pl-5">
              <Meta>Why saved</Meta>
              <p className="prose-measure mt-2 text-base italic leading-relaxed">
                {reference.whySaved}
              </p>
            </div>
          )}

          {reference.whatToLearn.length > 0 && (
            <div className="flex flex-col gap-2">
              <Meta>What to learn</Meta>
              <ul className="flex flex-col">
                {reference.whatToLearn.map((item) => (
                  <li
                    key={item}
                    className="border-b py-2 text-sm last:border-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {collections.length > 0 && (
            <div className="flex flex-col gap-2">
              <Meta>In collections</Meta>
              <div className="flex flex-wrap gap-1.5">
                {collections.map((collection) => (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.id}`}
                  >
                    <Tag className="transition-colors hover:border-rule-strong hover:bg-surface-2">
                      {collection.name}
                    </Tag>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="flex flex-col">
        <Meta className="mb-3 block">Classification</Meta>
        <div className="rounded-md border bg-card px-5 py-1">
          <Axis label="Industries" values={reference.industries} axis="industries" />
          <Axis label="Page types" values={reference.pageTypes} axis="pageTypes" />
          <Axis label="Styles" values={reference.styles} axis="styles" />
          <Axis label="Patterns" values={reference.patterns} axis="patterns" />
          <Axis label="Tags" values={reference.tags} axis="tags" />
        </div>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete reference?</DialogTitle>
            <DialogDescription>
              This permanently removes “{reference.title}” from the library and
              from every collection it belongs to.
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
