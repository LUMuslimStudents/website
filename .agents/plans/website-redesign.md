# Website Redesign Plan — LUMS

Redesign of the LUMS (Lund University Muslim Students) website: remove old/generic
content, replace with curated, relevant content for three audiences. This document
is the shared plan. Nothing here is committed to implementation yet — items marked
_(suggestion)_ are for the user to pick from when implementation starts.

## Goal & Constraints

- **Three target audiences:** members (priority 1), newcomers/curious students, sponsors/partners.
- **Minimize new backend work.** Reuse what already exists. Prefer static / data-driven pages.
- **Easy to extend.** The user must be able to add content later by editing simple data files, not writing new components.
- **First impression matters.** This is the org's first-ever website after 3 years operating; it must feel professional so members return and newcomers convert.

## What Already Exists (reuse, don't rebuild)

- Auth: signup, login, email verification, forgot/reset password (`src/pages/`, `useAuth`)
- Events system with registration (`src/pages/Events.tsx`) — real, substantial
- Membership + Stripe checkout (`Membership.tsx`, `MembershipCheckout.tsx`, `PaymentSuccess.tsx`)
- Suggestions page
- Admin dashboard: users, events, settings, treasury (`src/pages/AdminDashboard.tsx`, `src/components/admin/`)
- Blog (stub only — deferred ~1 month, needs backend)
- Backend infra available: Supabase, Stripe, Prisma
- Home, Mission pages

**Implication:** the member-facing plumbing largely exists. This redesign is mostly
content, curation, and surfacing value — not new infrastructure.

---

## Audience 1 — Members (Priority 1)

The value mostly needs to be **surfaced and organized**, not built. Core deliverable
is a scalable Resources hub.

### Resources Hub (core architecture)

- **Data-driven:** a single config/data file defines categories and items. Adding
  content later = add an entry to that file. No backend, no new components.
- **Wrapper pages:** every resource gets its own detail page giving context (what it
  is, how to use it, who it's for) before sending the user to an external link or PDF.
  Better UX and SEO than raw redirects.
- **Item shape:** title, short description, icon, category, and a target — which can be
  an external URL, a PDF in `public/`, or an internal detail page for longer content.
- **Structure:** Resources hub landing → category sections → cards → wrapper detail page.

### Proposed categories (initial)

1. **Practical / Living in Lund** — Halal map, prayer room finding guide.
2. **Connect** — WhatsApp groups, LinkedIn community.
3. **Governance / Transparency** — by-laws, protocols, annual meeting documents.
   (Also builds trust with newcomers and sponsors.)
4. **Academic / Support** — empty bucket now, ready for future school-help content.

### Content decisions captured

- User wants **pages for everything** — a wrapper page per resource, with details
  before the external link/PDF redirect.
- PDFs and external links live inside those wrapper pages, not as bare links.

---

## Audience 2 — Newcomers / Curious Students

Answer "who are you and do I belong here?" quickly. All static content.

- Strong About/Mission + "what we do" (events, prayer, community).
- Clear path to "your next event" — low commitment, high welcome.
- This is where the professional first impression lands.

---

## Audience 3 — Sponsors / Partners

Start lean — **no new system now.** Design for easy upgrade later.

- Single strong pitch page: why partner, the three tiers, what each gets.
- **Three partnership types:**
  1. **Collaboration** — donating goods, co-organizing events, or sponsoring a sum of money.
  2. **Advertising.**
  3. **Partnership** — longer-term ongoing support.
- **Apply:** email link or embedded Google/Typeform form to start (zero backend).
- **Sponsors on the page:** read from a simple sponsors data file (logo, name, tier,
  link). Add sponsors immediately by editing one file.

### Sponsor admin system _(deferred — design for it now)_

- User wants an eventual **admin CMS to manage sponsors** on the page.
- Approach: start with the static sponsors data file. Later, the "system" is just an
  admin UI (extending the existing admin dashboard + Supabase) that writes to the same
  data source. Start static, upgrade in place — not a rebuild.
- Rationale for deferring: build a real system only once inbound volume justifies it;
  starting lean reveals what sponsors actually ask for before coding.

---

## Content Suggestions Backlog _(pick from these at implementation time)_

Non-typical, high-value ideas most student orgs don't do well:

- **New-to-Lund starter kit** _(suggestion — top pick for newcomers)_ — onboarding guide
  for international Muslim students: personnummer, banking, halal groceries, where to
  pray on campus, housing tips. Nobody centralizes this. Open question: fold under
  Resources vs. standalone newcomer landing page.
- **Prayer times + qibla for Lund** _(suggestion — top pick for members)_ — daily-utility
  widget; the "reason to return." Client-side calculation library, minimal backend.
- **Ramadan hub** _(suggestion)_ — community iftar schedule, taraweeh locations, volunteer
  signups. Seasonal engagement spike, shareable.
- **Senior–junior mentorship / buddy program** _(suggestion)_ — pair new international
  students with established ones by program. Start as a simple form.
- **Graduate handoff / community marketplace** _(suggestion)_ — graduating students pass
  furniture/kitchenware to incoming ones. Start with a WhatsApp link; practical and
  community-building.
- **Wellbeing + chaplaincy contact** _(suggestion)_ — discreet "someone to talk to" page
  (imam contact, mental health resources). Rare and meaningful.
- **Career / alumni network** _(suggestion)_ — tie into the LinkedIn community: Muslim
  professionals, ethical finance basics, halal-friendly employers.

### Larger features to revisit later _(budget/scope dependent)_

- **Gallery** _(suggestion)_ — worthwhile backend add for member engagement; needs storage
  + admin upload. Park behind a budget check.
- **Blog** — basis exists; needs backend; user plans to revisit in ~1 month.
- **Sponsor admin CMS** — see Audience 3.

---

## Open Questions (to resolve at implementation)

1. Resources: single scrolling hub vs. hub + subpage per category. (User leans toward
   pages/wrappers for everything.)
2. Starter kit: under Resources or standalone newcomer page.
3. Sponsor apply mechanism: email link vs. embedded form.

## Working Agreement

- Phase now: set up layout + structure + the data-driven foundations.
- Content added incrementally later by the user editing data files.
- User decides which items/suggestions to implement when implementation begins.
