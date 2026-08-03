import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollectionCover({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) {
  const pics = images.filter(Boolean).slice(0, 4);

  if (!pics.length) {
    return (
      <div
        className={cn(
          "flex aspect-[16/10] items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <ImageOff className="size-8 opacity-50" />
          <span className="text-xs uppercase tracking-wide">No cover</span>
        </div>
      </div>
    );
  }

  if (pics.length === 1) {
    return (
      <div className={cn("aspect-[16/10] overflow-hidden bg-muted", className)}>
        <img src={pics[0]} alt="" className="size-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid aspect-[16/10] overflow-hidden bg-muted",
        pics.length === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2",
        className,
      )}
    >
      {pics.map((src) => (
        <img key={src} src={src} alt="" className="size-full object-cover" />
      ))}
    </div>
  );
}
