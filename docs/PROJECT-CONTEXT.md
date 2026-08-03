# Alool Design Intelligence

## Project Status

Version: v1
Status: Initial development
Priority: Reference collection and organization

---

# 1. Purpose

Alool Design Intelligence (ADI) is an internal design research and
inspiration library for Alool's AI-assisted web design and development
workflow.

The system will help Alool:

- Collect high-quality design references
- Organize references by meaningful design attributes
- Search and filter design references
- Build curated collections for client projects
- Extract reusable design patterns
- Create design directions
- Provide structured design context to Claude Code

The long-term goal is to build a reusable design intelligence system
that becomes part of the Alool development workflow.

---

# 2. Core Principle

ADI is not simply a bookmark collection.

The system should capture:

1. What the reference is
2. Where it came from
3. Why it was saved
4. What can be learned from it
5. Which design patterns it demonstrates
6. Which projects it may be relevant to

The goal is to convert design inspiration into structured design knowledge.

---

# 3. Current Version

The first version should focus on:

- Collecting references
- Organizing references
- Searching references
- Filtering references
- Viewing reference details
- Importing references in bulk
- Storing references in SQLite

The system should NOT initially include:

- Frappe
- Authentication
- Multi-user collaboration
- MCP
- Vector database
- Automatic scraping
- Browser extension
- AI API integration
- Advanced recommendation engine

These are future features.

---

# 4. Technology

Frontend:

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons

Backend:

- Node.js
- TypeScript
- Fastify

Database:

- SQLite

ORM:

- Drizzle ORM

Database driver:

- better-sqlite3

---

# 5. Architecture

React frontend
    ↓
Local HTTP API
    ↓
Node.js + Fastify
    ↓
Drizzle ORM
    ↓
SQLite

The architecture should be designed so that the data layer can
eventually migrate to Frappe.

---

# 6. Main Entity

## Design Reference

A Design Reference represents a website, UI, mobile interface,
branding project, or specific design example.

Fields:

- id
- title
- source
- url
- image
- type
- description
- whySaved
- whatToLearn
- createdAt
- updatedAt

Relationships:

- industries
- pageTypes
- styles
- patterns
- tags

---

# 7. Reference Types

- website
- ui
- mobile
- branding
- component

---

# 8. Design Sources

Initial sources:

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

The system should not depend on scraping these platforms.

References can be discovered through AI-assisted web research
and imported into ADI.

---

# 9. Initial Taxonomy

## Industries

- Technology
- SaaS
- AI
- Consulting
- NGO
- Nonprofit
- Government
- Education
- Healthcare
- Hospitality
- E-commerce
- Finance
- Real Estate
- Agency
- Portfolio
- Media
- Entertainment
- Manufacturing
- Logistics
- Travel

## Styles

- Minimal
- Editorial
- Brutalist
- Luxury
- Corporate
- Playful
- Human-centered
- Experimental
- Modern African
- Dark
- Light
- Premium
- Futuristic
- Retro
- Organic
- Bold
- Elegant

## Page Types

- Homepage
- About
- Services
- Solutions
- Pricing
- Case Studies
- Portfolio
- Contact
- Blog
- Article
- Product
- Landing Page
- Careers
- Team
- Resources
- Donation

## Patterns

- Hero
- Navigation
- Services
- Features
- Pricing
- Testimonials
- Case Studies
- Statistics
- Timeline
- Team
- Donation
- CTA
- Footer
- FAQ
- Logo Cloud
- Social Proof
- Storytelling
- Content Grid
- Image Gallery

---

# 10. Reference Collection Workflow

Primary workflow:

AI research
    ↓
Relevant references
    ↓
AI analysis
    ↓
Structured JSON
    ↓
Import into ADI
    ↓
Human review
    ↓
Curated library

Manual workflow:

Find reference
    ↓
Copy URL
    ↓
Quick import
    ↓
Metadata extraction
    ↓
Human review

---

# 11. AI Research Principle

The user does not have time to manually browse hundreds of websites.

ADI should therefore eventually support AI-assisted research.

The desired workflow:

User provides project context
    ↓
AI searches the web
    ↓
AI finds relevant references
    ↓
AI analyzes references
    ↓
AI suggests metadata
    ↓
User approves
    ↓
References enter ADI

The user acts primarily as curator,
not as manual researcher.

---

# 12. Future Project Workflow

New client
    ↓
Project brief
    ↓
Search design library
    ↓
Select references
    ↓
Identify patterns
    ↓
Create design direction
    ↓
Create Design DNA
    ↓
Claude Code
    ↓
Implementation
    ↓
Design review

---

# 13. Long-Term Roadmap

V1:
Reference Library

V1.1:
Bulk JSON Import

V1.2:
Quick URL Import

V1.3:
AI Reference Analysis

V2:
AI Research Agent

V3:
Design Pattern Intelligence

V4:
Claude Code MCP

V5:
Frappe-based platform

---

# 14. Core Philosophy

AI finds.
AI analyzes.
Human approves.
ADI stores.
Claude Code uses.

ADI should become Alool's institutional design knowledge base.