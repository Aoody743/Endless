# Endless CMS Roadmap

## Current State

Endless CMS already has a working TypeScript monorepo, PostgreSQL + Prisma data model, public site routes, section-based page rendering, a Studio shell, bilingual content fields, and mock AI service contracts. It is not release-ready yet.

The biggest gaps today are:

- the public site is still visually inconsistent across pages
- the Studio editor and builder are not reliable enough for daily use
- bilingual rendering is present, but not fully complete across all public content surfaces
- the AI direction has changed and needs to be locked into future execution

## Product Direction

Endless CMS is a writing-first CMS for personal sites, blogs, knowledge notes, showcase pages, and modular public pages.

The public product should feel refined, literary, and calm.
The Studio should eventually feel like a creator workspace, not a generic admin panel.

AI is **not** defined as a suggestion-first assistant anymore. Future AI features are scoped to:

1. formatting
2. translation
3. article summarization

These capabilities should operate on explicit target fields or result panels, not silently overwrite content.

## Phase Breakdown

### Phase 1 — Public Frontend Release Baseline

Goal: finish the public site first and make it cohesive enough for a real public launch.

Scope:

- Home
- Blog
- Blog detail
- Lab
- Friends
- About
- Search
- Tags
- global Header / Footer

Requirements:

- dark and light themes both feel finished
- same-route bilingual toggle works across public content
- page headers, cards, hover motion, spacing, and typography all belong to one visual system
- the home page remains the visual template for the rest of the site
- home cards, avatar card, INFJ card, Discover, and footer stay stable across responsive breakpoints

Release gate:

- all public pages render correctly
- no overlapping cards or broken responsive layouts
- Chinese and English modes both work
- dark and light themes both pass visual review

### Phase 2 — Studio Editing Reliability + Workspace UI

Goal: make the Studio usable for real writing and publishing, while redesigning it into a creator workspace that shares the public site's calm, literary visual language.

Scope:

- bilingual title / summary / markdown / SEO editing
- save / autosave / publish / draft / revision restore
- preview that matches public rendering
- content library, media, and site settings reach reliable baseline usability
- a three-column Studio shell with light navigation, a focused writing/canvas area, and a right publishing/SEO/section inspector
- quieter panels, thinner dividers, restrained hover, and fewer generic dashboard cards

Release gate:

- one author can create, edit, preview, and publish bilingual content without losing data
- Studio feels like the same product as the public frontend, not a generic admin dashboard

### Phase 3 — Advanced Section Builder Usability

Goal: make modular pages truly editable without touching seed data or database rows manually.

Scope:

- Home builder usable
- About / Lab / Friends migrate into the same section editing model
- section add / remove / reorder / enable / disable / save / reload all work consistently

Release gate:

- non-technical editing of the public modular pages is possible inside Studio

### Phase 4 — AI Content Tools

Goal: connect real AI workflows for formatting, translation, and summarization.

Scope:

- format article structure
- translate Chinese <-> English
- generate summaries and SEO descriptions

Constraints:

- AI output must go into an explicit destination
- no silent overwrite of current content

Release gate:

- AI features are useful enough to be applied in real publishing workflows

### Phase 5 — Content Ops and Delivery Hardening

Goal: support stable long-term operation.

Scope:

- stronger media pipeline
- deploy / backup / rollback discipline
- stronger SEO defaults and content management support
- publication safety and URL validation

Release gate:

- site can be run long-term without manual intervention on ordinary publishing tasks

### Phase 6 — v1 Release Readiness

Goal: turn the project from an advanced prototype into a release candidate.

Scope:

- full QA pass
- deployment documentation
- default demo content cleanup
- versioning and release checklist

Release gate:

- public site is consistent
- Studio is reliable
- builder is usable
- AI utilities are integrated
- deployment is stable and documented

## Phase 1 Acceptance Checklist

- Home hero, compact header, Discover, and footer all render correctly
- Blog / Lab / Friends / About follow the same visual language
- bilingual public switching works without language leakage
- both themes feel deliberate rather than inverted
- no missing home cards, no layout overlap, no broken responsive states

## Assumptions

- the current release track is Web-only
- Studio redesign is included in Phase 2 rather than deferred
- no route-based internationalization will be added
- BaoTa + PM2 deployment remains the production path
