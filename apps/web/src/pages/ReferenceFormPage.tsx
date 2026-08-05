import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  api,
  type ReferenceInput,
  type Taxonomy,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiCheckGroup } from "@/components/references/MultiCheckGroup";
import { Loading, PageHeader, Section } from "@/components/common/Primitives";

const emptyForm: ReferenceInput = {
  title: "",
  source: "",
  url: "",
  image: "",
  type: "website",
  description: "",
  whySaved: "",
  whatToLearn: [],
  industries: [],
  pageTypes: [],
  styles: [],
  patterns: [],
  tags: [],
};

export function ReferenceFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [form, setForm] = useState<ReferenceInput>(emptyForm);
  const [whatToLearnText, setWhatToLearnText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    api.getTaxonomy().then(setTaxonomy).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!id) return;
    api
      .getReference(id)
      .then((ref) => {
        setForm({
          title: ref.title,
          source: ref.source,
          url: ref.url,
          image: ref.image ?? "",
          type: ref.type,
          description: ref.description ?? "",
          whySaved: ref.whySaved ?? "",
          whatToLearn: ref.whatToLearn,
          industries: ref.industries,
          pageTypes: ref.pageTypes,
          styles: ref.styles,
          patterns: ref.patterns,
          tags: ref.tags,
        });
        setWhatToLearnText(ref.whatToLearn.join("\n"));
        setTagsText(ref.tags.join(", "));
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function update<K extends keyof ReferenceInput>(
    key: K,
    value: ReferenceInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload: ReferenceInput = {
      ...form,
      image: form.image?.trim() ? form.image.trim() : null,
      description: form.description?.trim() || null,
      whySaved: form.whySaved?.trim() || null,
      whatToLearn: whatToLearnText
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean),
      tags: [
        ...new Set([
          ...(form.tags ?? []),
          ...tagsText
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        ]),
      ],
    };

    try {
      const saved = isEdit
        ? await api.updateReference(id!, payload)
        : await api.createReference(payload);
      toast.success(isEdit ? "Reference updated" : "Reference created");
      navigate(`/references/${saved.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save reference";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !taxonomy) {
    return <Loading>Loading form…</Loading>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={{
          to: isEdit ? `/references/${id}` : "/references",
          label: isEdit ? "Reference" : "Library",
        }}
        eyebrow={isEdit ? "Edit" : "Add"}
        title={isEdit ? "Edit reference" : "Add reference"}
        lede="Capture what it is, why it matters, and what to learn from it."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <Section eyebrow="Identity" title="Core fields">
          <div className="grid gap-4 border bg-card p-5 sm:p-6 md:grid-cols-2">
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Type *</Label>
              <Select
                value={form.type}
                onValueChange={(value) => update("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taxonomy.types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Source *</Label>
              <Select
                value={form.source || undefined}
                onValueChange={(value) => update("source", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {taxonomy.sources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                required
                placeholder="https://"
                value={form.url}
                onChange={(e) => update("url", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="image">Image path or URL</Label>
              <Input
                id="image"
                placeholder="references/example.webp"
                value={form.image ?? ""}
                onChange={(e) => update("image", e.target.value)}
              />
            </div>
          </div>
        </Section>

        <Section
          eyebrow="Judgement"
          title="Why it belongs"
          description="Editorial notes — the curator’s voice that makes this reference useful later."
        >
          <div className="grid gap-4 border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description ?? ""}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="whySaved">Why saved</Label>
              <Textarea
                id="whySaved"
                value={form.whySaved ?? ""}
                onChange={(e) => update("whySaved", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="whatToLearn">What to learn (one per line)</Label>
              <Textarea
                id="whatToLearn"
                value={whatToLearnText}
                onChange={(e) => setWhatToLearnText(e.target.value)}
              />
            </div>
          </div>
        </Section>

        <Section
          eyebrow="Taxonomy"
          title="Classification"
          description="Axes used by the library filters. Prefer the controlled vocabulary."
        >
          <div className="grid gap-4 border bg-card p-5 sm:p-6 md:grid-cols-2">
            <MultiCheckGroup
              label="Industries"
              options={taxonomy.industries}
              values={form.industries ?? []}
              onChange={(industries) => update("industries", industries)}
              maxHeight="max-h-48"
            />
            <MultiCheckGroup
              label="Page types"
              options={taxonomy.pageTypes}
              values={form.pageTypes ?? []}
              onChange={(pageTypes) => update("pageTypes", pageTypes)}
              maxHeight="max-h-48"
            />
            <MultiCheckGroup
              label="Styles"
              options={taxonomy.styles}
              values={form.styles ?? []}
              onChange={(styles) => update("styles", styles)}
              maxHeight="max-h-48"
            />
            <MultiCheckGroup
              label="Patterns"
              options={taxonomy.patterns}
              values={form.patterns ?? []}
              onChange={(patterns) => update("patterns", patterns)}
              maxHeight="max-h-48"
            />
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="tags">Additional tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="large typography, scroll animation"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
              />
              <MultiCheckGroup
                label="Suggested tags"
                options={taxonomy.tags}
                values={form.tags ?? []}
                onChange={(tags) => update("tags", tags)}
                maxHeight="max-h-36"
              />
            </div>
          </div>
        </Section>

        <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(isEdit ? `/references/${id}` : "/references")
            }
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !form.source}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create reference"}
          </Button>
        </div>
      </form>
    </div>
  );
}
