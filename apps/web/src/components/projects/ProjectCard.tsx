import { Link } from "react-router-dom";
import type { ProjectSummary } from "@/lib/api";
import {
  formatShortDate,
  Meta,
  Metric,
  StatusMark,
  Tag,
} from "@/components/common/Primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Project card — research project, not a CRUD record.
   Surfaces: what, who, stage density, collections, references, status.
--------------------------------------------------------------------------- */

function briefReady(project: ProjectSummary): boolean {
  return Boolean(
    project.audience ||
      project.projectGoals ||
      project.businessGoals ||
      project.desiredStyles.length ||
      project.referenceKeywords.length ||
      project.constraints,
  );
}

export function ProjectCard({
  project,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  className,
}: {
  project: ProjectSummary;
  onEdit?: (project: ProjectSummary) => void;
  onArchive?: (project: ProjectSummary) => void;
  onRestore?: (project: ProjectSummary) => void;
  onDelete?: (project: ProjectSummary) => void;
  className?: string;
}) {
  const archived = project.status === "archived";
  const hasBrief = briefReady(project);

  return (
    <article
      className={cn(
        "flex flex-col gap-4 border bg-card p-5 transition-colors hover:border-rule-strong",
        archived && "opacity-80",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Meta>
            {[project.industry, project.projectType].filter(Boolean).join(" · ") ||
              "Project"}
          </Meta>
          <StatusMark tone={archived ? "muted" : "accent"}>
            {archived ? "Archived" : "Active"}
          </StatusMark>
        </div>

        <Link
          to={`/projects/${project.id}`}
          className="font-display text-xl leading-tight text-balance transition-colors hover:text-primary"
        >
          {project.name}
        </Link>

        {project.clientName && (
          <p className="text-sm text-ink-2">{project.clientName}</p>
        )}

        {project.description && (
          <p className="line-clamp-2 text-pretty text-sm text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 border-y py-3">
        <Metric value={project.collectionCount} label="collections" />
        <Metric value={project.referenceCount} label="references" />
        <StatusMark tone={hasBrief ? "ink" : "signal"}>
          {hasBrief ? "Brief ready" : "Brief incomplete"}
        </StatusMark>
      </div>

      {(project.desiredStyles.length > 0 || project.location) && (
        <div className="flex flex-wrap gap-1.5">
          {project.location && <Tag>{project.location}</Tag>}
          {project.desiredStyles.slice(0, 3).map((style) => (
            <Tag key={style}>{style}</Tag>
          ))}
          {project.desiredStyles.length > 3 && (
            <Tag>+{project.desiredStyles.length - 3}</Tag>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Button asChild size="sm">
          <Link to={`/projects/${project.id}`}>Open</Link>
        </Button>
        {onEdit && (
          <Button size="sm" variant="outline" onClick={() => onEdit(project)}>
            Edit
          </Button>
        )}
        {archived
          ? onRestore && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRestore(project)}
              >
                Restore
              </Button>
            )
          : onArchive && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onArchive(project)}
              >
                Archive
              </Button>
            )}
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(project)}
          >
            Delete
          </Button>
        )}
      </div>

      <Meta>Updated {formatShortDate(project.updatedAt)}</Meta>
    </article>
  );
}
