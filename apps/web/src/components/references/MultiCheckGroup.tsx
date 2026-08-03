import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function MultiCheckGroup({
  label,
  options,
  values,
  onChange,
  className,
  maxHeight = "max-h-40",
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (next: string[]) => void;
  className?: string;
  maxHeight?: string;
}) {
  function toggle(option: string) {
    if (values.includes(option)) {
      onChange(values.filter((v) => v !== option));
    } else {
      onChange([...values, option]);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label>{label}</Label>
      <div
        className={cn(
          "overflow-y-auto rounded-md border bg-card p-3",
          maxHeight,
        )}
      >
        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={values.includes(option)}
                onCheckedChange={() => toggle(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
