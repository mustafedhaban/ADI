# ADI Phase 3 — Knowledge Intelligence Execution Guide

## Mission

The goal of this phase is **not to increase the number of references**.

The goal is to transform ADI from a visual reference library into an evidence-based design intelligence platform.

Every decision in this phase should improve the quality, structure, explainability, and usefulness of design knowledge.

Raw quantity is secondary.

---

# Core Principle

Evidence → Observation → Knowledge → Intelligence

Never skip a layer.

Do not infer what can be observed.

Do not summarize what has not been verified.

Do not generate AI conclusions until structured evidence exists.

---

# Working Rules

You are responsible for planning and executing this phase.

Continue autonomously until every task in this document is complete.

Do not stop after each milestone.

Only stop when:

• blocked by missing client input
• blocked by missing credentials
• blocked by external services
• blocked by a genuine architectural decision

Everything else should be solved independently.

---

# Decision Framework

When multiple solutions exist:

Prefer

correctness
>
maintainability
>
extensibility
>
performance
>
speed

Never implement shortcuts that reduce data quality.

Never fabricate information.

Never write metadata before evidence exists.

---

# Existing Architecture

Preserve the existing architecture.

Do not redesign working systems.

Reuse existing modules whenever possible.

Current pillars include:

• Taxonomy
• Capture Pipeline
• Structured Observations
• Collections
• Projects
• AI Research
• Design DNA

Extend them.

Do not replace them.

---

# Phase Overview

This phase has seven milestones.

Complete them in order.

Do not begin the next milestone until the previous one is verified.

---

# Milestone 1

Complete Batch 1

Current state

153 references

50 imported

18 curated

32 remaining

For every remaining reference:

Verify screenshots

Verify taxonomy

Correct metadata

Rewrite whySaved

Rewrite whatToLearn

Record structured observations

Verify AI affordances

Verify capture completeness

Only observable facts may become observations.

No assumptions.

Success criteria

Every Batch 1 reference reaches the same quality level.

---

# Milestone 2

Observation Explorer

Create a first-class Observation workspace.

The Observation system must become explorable.

Users must be able to:

Browse observations

Search observations

Filter observations

Inspect observation details

View all references containing an observation

Navigate from observation → references

Navigate from reference → observations

No AI required.

Everything should come from structured data.

---

# Milestone 3

Observation Analytics

Build analytical views over observations.

Examples include:

Most common observations

Rare observations

Observation frequency

Observation co-occurrence

Observation distribution

Observation by taxonomy

Observation by source

Observation by collection

Observation by project

Observation by time

Observation growth

Analytics must use structured observations.

Never infer.

---

# Milestone 4

Observation Comparison

Allow comparisons between:

References

Collections

Projects

Observation sets

Highlight:

Shared observations

Unique observations

Missing observations

Frequency differences

Pattern overlap

Everything should remain evidence-backed.

---

# Milestone 5

Collection Intelligence

Collections should become knowledge summaries.

Instead of showing only counts,

generate observation summaries.

Examples:

Most common navigation

Most common typography

Most common interaction

Most common layouts

Most common AI patterns

Most common accessibility patterns

Most distinctive traits

Every statement must be backed by observations.

Clicking a summary should reveal supporting references.

---

# Milestone 6

Knowledge Quality Dashboard

Build a dashboard describing the health of ADI.

Examples:

References

Captured

Observed

Curated

Compared

Collections

Projects

Coverage %

Capture %

Observation %

Incomplete references

Missing screenshots

Missing observations

Missing taxonomy

Unknown values

Failed captures

Everything should update automatically.

---

# Milestone 7

Batch 2

Only begin after:

Batch 1 is complete

Observation Explorer exists

Analytics exist

Collection Intelligence exists

Quality Dashboard exists

Use the same workflow.

Import

↓

Capture

↓

Review

↓

Observe

↓

Validate

↓

Complete

Never bypass review.

Never import faster than references can be verified.

Maintain quality over speed.

---

# AI Research

Do not enable AI Research yet.

Instead,

prepare AI Research to consume observations.

Avoid duplicate vision work.

Future AI should read structured evidence.

Not screenshots.

---

# Design DNA

Do not redesign Design DNA.

Instead,

prepare it for the future.

Future Design DNA should consume:

Observations

Analytics

Comparisons

Collection summaries

Coverage statistics

Only use screenshots where structured evidence is insufficient.

---

# Quality Standards

Every feature must include:

Tests

Type safety

Build verification

Accessibility

Responsive behavior

Error handling

Loading states

Empty states

Performance considerations

Documentation

No regressions.

---

# Verification

After every milestone perform:

Tests

Typecheck

Production build

Route verification

Database verification

API verification

Regression verification

Only continue after verification succeeds.

---

# Reporting

After every milestone produce a report containing:

Objective

Architecture

Files changed

Database impact

API impact

UI impact

Performance impact

Tests

Known limitations

Future opportunities

Do not ask whether to continue.

Automatically begin the next milestone.

---

# Completion

Only stop when:

All seven milestones are complete

or

A real blocker prevents further progress.

If blocked,

produce a detailed technical report describing:

What is complete

What remains

Why it is blocked

Possible solutions

Recommended solution

Expected impact

Otherwise continue autonomously.


# Tool Usage Policy

Before implementing a feature, determine whether an installed tool, skill, or MCP can improve accuracy, speed, or quality.

When appropriate:

• Use RepoPrompt to understand architecture before editing.
• Use Playwright to verify visual behavior instead of assuming.
• Use installed MCP servers to gather information rather than recreating it manually.
• Use existing project documentation before introducing new patterns.
• Prefer existing utilities over creating duplicates.
• Search the repository before adding new components or services.

Treat external tools as part of the development workflow, not optional extras.

If a tool fails or is unavailable, degrade gracefully and continue using the best available approach. Record the limitation in the milestone report rather than stopping unnecessarily.