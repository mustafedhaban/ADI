# Alool Design Intelligence — Reference Import Specification

Version: 1.0
Status: Initial
Purpose: Define the JSON format used to bulk import design references

---

# 1. Purpose

This document defines the standard JSON format used to import
design references into Alool Design Intelligence (ADI).

The format is intentionally simple and human-readable.

It should be possible to:

- Create JSON files manually
- Generate JSON files using AI
- Import large reference collections
- Validate records before importing
- Reuse the same format in future systems

---

# 2. Import File Format

The root JSON value must be an object containing a `references` array.

Example:

{
  "references": [
    {
      "title": "Example Design Reference",
      "source": "Awwwards",
      "url": "https://example.com",
      "type": "website",
      "description": "A modern website with strong editorial typography.",
      "whySaved": "Strong visual hierarchy and effective use of typography.",
      "whatToLearn": [
        "Hero composition",
        "Typography hierarchy",
        "Visual storytelling"
      ],
      "industries": [
        "Technology"
      ],
      "pageTypes": [
        "Homepage"
      ],
      "styles": [
        "Editorial",
        "Premium"
      ],
      "patterns": [
        "Hero",
        "Storytelling"
      ],
      "tags": [
        "large typography",
        "asymmetric layout"
      ]
    }
  ]
}

---

# 3. Required Fields

The following fields are required:

- title
- source
- url
- type

---

# 4. Optional Fields

The following fields are optional:

- description
- whySaved
- whatToLearn
- industries
- pageTypes
- styles
- patterns
- tags
- image

---

# 5. Field Definitions

## title

Type:

string

Description:

The human-readable name of the design reference.

Example:

"Modern NGO Homepage"

Rules:

- Must not be empty.
- Should be concise.
- Should describe the reference clearly.

---

## source

Type:

string

Description:

The platform or website where the reference was discovered.

Examples:

- Awwwards
- Behance
- Dribbble
- Pinterest
- Mobbin
- Land-book
- Godly
- SiteInspire
- Are.na
- Savee
- X
- Figma Community
- Other

---

## url

Type:

string

Description:

The canonical URL of the referenced website, project, or page.

Rules:

- Must be a valid HTTP or HTTPS URL.
- Must be normalized where possible.
- Duplicate URLs should be detected before import.

---

## image

Type:

string

Description:

Optional path to a locally stored preview image.

Example:

"references/modern-ngo-homepage.webp"

The image field may be omitted during initial import.

The system should support adding images later.

---

## type

Type:

string

Allowed values:

- website
- ui
- mobile
- branding
- component

---

## description

Type:

string

Description:

A short explanation of what the reference is.

Example:

"A modern nonprofit website using editorial typography and documentary photography."

---

## whySaved

Type:

string

Description:

Explains why the reference is valuable.

Example:

"Strong use of large typography and documentary imagery creates a human-centered visual identity."

Avoid generic descriptions such as:

"Nice design."

---

## whatToLearn

Type:

array of strings

Description:

Specific design lessons that can be learned from the reference.

Example:

[
  "Hero composition",
  "Typography hierarchy",
  "Image cropping",
  "CTA placement"
]

---

## industries

Type:

array of strings

Description:

Industries relevant to the reference.

Values must come from DESIGN-TAXONOMY.md.

Multiple values are allowed.

---

## pageTypes

Type:

array of strings

Description:

Page types represented by the reference.

Values must come from DESIGN-TAXONOMY.md.

---

## styles

Type:

array of strings

Description:

Visual styles demonstrated by the reference.

Values must come from DESIGN-TAXONOMY.md.

---

## patterns

Type:

array of strings

Description:

Design patterns demonstrated by the reference.

Values must come from DESIGN-TAXONOMY.md.

---

## tags

Type:

array of strings

Description:

Specific design characteristics.

Tags may be predefined taxonomy values or descriptive tags.

Examples:

[
  "large typography",
  "asymmetric layout",
  "documentary photography",
  "scroll animation"
]

---

# 6. Validation

The import system must validate every record.

Validation rules:

1. Required fields must exist.
2. Required string fields cannot be empty.
3. URLs must be valid HTTP or HTTPS URLs.
4. Type must be a valid reference type.
5. Source should match a known source or `Other`.
6. Taxonomy values should match the controlled vocabulary.
7. Duplicate URLs must be detected.
8. Duplicate references should not be imported automatically.
9. Invalid records must be reported.
10. Valid records should be previewed before import.

---

# 7. Import Behavior

The import process should have three stages.

## Stage 1 — Upload

User selects a JSON file.

The system reads the file and validates its structure.

---

## Stage 2 — Preview

Display:

Total records:
100

Valid:
98

Warnings:
1

Errors:
1

Show a table containing:

- Title
- Source
- URL
- Type
- Validation status

---

## Stage 3 — Import

The user confirms the import.

Valid records are inserted into SQLite.

Invalid records are skipped.

The system displays:

Imported:
98

Skipped:
1

Warnings:
1

Duplicates:
0

---

# 8. Duplicate Detection

The primary duplicate key is:

url

If the URL already exists in the database:

- Do not create a duplicate record.
- Mark the record as a duplicate.
- Show it in the import results.

Future versions may support more sophisticated duplicate detection.

---

# 9. Import File Naming

Use descriptive filenames.

Examples:

references-premium-web-design.json

references-saas-technology.json

references-ngo-nonprofit.json

references-african-design.json

references-editorial-storytelling.json

references-master-100.json

---

# 10. Recommended Import Directory

Bulk import files should be stored in:

imports/references/

Example:

imports/
└── references/
    ├── references-premium-web-design.json
    ├── references-saas-technology.json
    └── references-master-100.json

---

# 11. Future Compatibility

The JSON import format should remain independent of SQLite.

The same JSON structure should eventually be usable for:

- SQLite
- PostgreSQL
- Frappe
- API imports
- AI-generated datasets
- MCP tools

The frontend and database implementation must not change
the external import format without a deliberate version change.

---

# 12. Versioning

The import format version is currently:

1.0

Future breaking changes should increment the major version.

Example:

1.0
2.0

Non-breaking additions may increment the minor version.

Example:

1.1
1.2