# Alool Design Intelligence — Design Taxonomy

Version: 1.0
Status: Initial
Purpose: Controlled vocabulary for organizing design references

---

## 1. Purpose

This document defines the controlled vocabulary used by Alool Design
Intelligence (ADI) to classify, organize, search, and filter design references.

The taxonomy should remain simple in v1.

New values may be added as the library grows, but existing values should
not be renamed casually because they may already be used by stored references.

---

# 2. Reference Types

Reference types describe what the saved reference represents.

- website
- ui
- mobile
- branding
- component

---

# 3. Design Sources

The initial source list includes:

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

The `Other` value should be available when the source is not in the
predefined list.

---

# 4. Industries

Use these values to describe the industry or business context
represented by a design reference.

- Technology
- SaaS
- AI
- Consulting
- Corporate
- NGO
- Nonprofit
- Government
- Education
- Healthcare
- Hospitality
- E-commerce
- Finance
- Fintech
- Real Estate
- Agency
- Portfolio
- Media
- Entertainment
- Manufacturing
- Logistics
- Travel
- Tourism
- Retail
- Construction
- Agriculture
- Social Impact
- Creative
- Other

A reference may belong to multiple industries.

---

# 5. Page Types

Use these values to describe the primary page represented
by the reference.

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
- Campaign
- Dashboard
- Login
- Signup
- Settings
- Other

A reference may belong to multiple page types.

---

# 6. Design Styles

Styles describe the overall visual language or aesthetic direction.

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
- Clean
- Technical
- Cinematic
- Artistic
- Geometric
- Monochrome
- Colorful
- Sophisticated
- Friendly
- Institutional
- Other

A reference may have multiple styles.

---

# 7. Design Patterns

Patterns describe reusable design solutions demonstrated by
a reference.

## Navigation

- Navigation
- Mega Menu
- Sticky Navigation
- Minimal Navigation
- Mobile Navigation

## Hero

- Hero
- Full Screen Hero
- Split Hero
- Editorial Hero
- Video Hero
- Image Hero
- Product Hero
- Text First Hero

## Content

- Services
- Features
- Content Grid
- Card Grid
- Image Gallery
- Storytelling
- Long Form Content
- Editorial Layout

## Social Proof

- Testimonials
- Logo Cloud
- Social Proof
- Client Logos
- Awards

## Business

- Pricing
- Comparison Table
- Product Showcase
- Case Studies
- Portfolio
- Statistics
- Metrics
- Timeline

## Organization

- Team
- FAQ
- Accordion
- Timeline
- Process
- Steps

## Conversion

- CTA
- Donation CTA
- Newsletter Signup
- Contact Form
- Lead Generation

## Footer

- Footer
- Large Footer
- Minimal Footer
- Multi Column Footer

A reference may demonstrate multiple patterns.

---

# 8. Common Design Tags

Tags provide more specific descriptors.

## Typography

- large typography
- oversized typography
- serif typography
- sans serif
- condensed typography
- variable typography
- expressive typography
- typography focused

## Layout

- asymmetric layout
- centered layout
- grid layout
- editorial grid
- masonry
- full width
- split layout
- overlapping elements
- whitespace
- dense layout

## Color

- monochrome
- neutral colors
- bold colors
- gradient
- dark theme
- light theme
- high contrast
- earthy colors
- pastel colors

## Imagery

- documentary photography
- lifestyle photography
- product photography
- portrait photography
- illustration
- 3D
- abstract imagery
- collage
- video
- animation

## Interaction

- scroll animation
- parallax
- hover interaction
- micro interaction
- page transition
- cursor interaction
- sticky sections
- horizontal scroll

## Visual Treatment

- glassmorphism
- grain texture
- noise texture
- blur
- shadows
- borders
- oversized elements
- layered composition

---

# 9. Tagging Rules

Tags should describe observable design characteristics.

Good:

- large typography
- asymmetric layout
- documentary photography
- scroll animation

Avoid vague tags such as:

- beautiful
- nice
- cool
- amazing
- good design

The `whySaved` field should explain the reason a reference was saved.

The `whatToLearn` field should explain the specific design lessons
that can be extracted from the reference.

---

# 10. Classification Rules

When classifying a reference:

1. Use the most specific applicable values.
2. Multiple values are allowed.
3. Do not add unnecessary classifications.
4. Prefer existing taxonomy values over creating synonyms.
5. Use `Other` only when no existing value is appropriate.

Example:

A premium technology homepage with a large editorial hero
may be classified as:

Type:
- website

Industry:
- Technology
- SaaS

Page Type:
- Homepage

Styles:
- Premium
- Editorial
- Minimal

Patterns:
- Hero
- Editorial Hero
- CTA

Tags:
- large typography
- asymmetric layout
- whitespace

---

# 11. Taxonomy Evolution

The taxonomy is expected to evolve.

When adding a new value:

1. Check whether an existing value already represents the concept.
2. Avoid synonyms.
3. Use consistent naming.
4. Add the value to this document.
5. Update database seed data.
6. Update import validation.
7. Do not silently rename existing values.

Taxonomy changes should be treated as intentional data changes.