# About ZeroUp Partners

## The Idea

Most platforms built around "social impact" are donation portals. You send money, you get a receipt, maybe a thank-you email — and that's the end of your relationship with the work.

ZeroUp Partners is built on a different belief: **that real, lasting change requires shared ownership, not charity.**

This is a platform for people who want to be part of something — not just fund it from a distance.

---

## What It Is

ZeroUp Partners is the digital home of the **Zero Partners ecosystem** — a global network of individuals, professionals, and organizations who co-create social impact alongside communities, not above them.

The platform connects three kinds of people:

- **Partners** — individuals and organizations who bring resources, skills, networks, and time
- **Communities** — groups who define their own needs and lead their own development
- **Projects** — real, live initiatives that sit at the intersection of both

The dashboard, the constellation map, the leaderboards, the contribution tracking — all of it exists to support one thing: a living system where impact compounds over time and everyone can see exactly how.

---

## Why It Exists

The ZeroUp Initiative was founded on a frustration with how "development" usually works — where solutions arrive from outside a community, shaped by outsiders' assumptions, funded by distant donors who never see the outcomes.

The Initiative — anchored by the **Pan African Centre for Social Development and Accountability (PACSDA)** — takes the opposite approach:

> *"They didn't come with solutions. They came with questions. That respect made all the difference."*
> — Chief Emmanuel Adeyemi, Community Leader, Ibadan, Nigeria

Communities define what they need. Partners provide resources and expertise. Local leaders drive execution. Everyone tracks progress. And when a community succeeds, they become partners themselves — creating a regenerative loop rather than a dependency.

---

## What Partners Actually Do

Being a Zero Partner is not one thing. The platform recognizes six distinct ways people contribute:

| Contribution | What It Looks Like |
|---|---|
| **Funding** | Direct financial support for specific project phases |
| **Skills** | Professional expertise — legal, medical, engineering, creative — deployed where it matters |
| **Mentorship** | Guiding community leaders and young people through growth |
| **Technology** | Tools, platforms, and digital access that communities otherwise couldn't reach |
| **Networks** | Introductions and connections that open doors |
| **Research & Insight** | Knowledge that shapes strategy and proves outcomes |

The platform tracks all of these — not just money — because the team believes impact grows when the right resources meet the right context.

---

## How the Platform Works

### The Constellation
The homepage is a live map — a constellation of every active project and partner, connected by real contribution data pulled directly from the database. Watch new nodes appear as partners join and projects launch. Hover over any node to see who's funding what and how the ecosystem is growing.

### The Dashboard
Every partner gets a personal hub where they can:
- Log and track contributions
- See their impact score and badges
- View monthly contribution trends
- Access bank transfer details for the partnered account (PACSDA, GT Bank)
- Download a personalized Partner Flier to share recognition on social media

### Recognition & Community
The platform runs a monthly **Partner of the Month** program — surfacing the partner who contributed most that month and celebrating them publicly. The community leaderboard shows all-time rankings, active-this-month stats, and recent activity from across the ecosystem.

### Projects
Partners can browse live social impact projects, see their funding progress in real time, contribute directly to specific causes, and upload receipts for verification. Contributions go through an approval flow so every approved payment is verified before appearing in public totals.

### Transparency
All contribution data, funding progress, and impact metrics are visible to every partner. Open impact reporting, clear funding pathways, and community-led accountability are not aspirational — they're built into how the platform calculates and displays everything.

---

## The Technical Platform

The application is built with **Next.js 15** (App Router), **TypeScript**, **Tailwind CSS**, **Firebase** (Firestore + Auth + Storage), and **Framer Motion**. It is deployed on Vercel.

Key architectural decisions reflect the product values:
- **Real-time data everywhere** — the constellation, dashboards, and leaderboards all use Firestore `onSnapshot` listeners so partners see the ecosystem live, not a stale snapshot
- **No SSR on interactive sections** — dynamically imported components avoid hydration issues while keeping load fast
- **Dark and light mode** — full theme support because partners use this platform in all kinds of environments
- **Mobile-first** — the layout, navigation, and constellation adapt gracefully from desktop to phone

---

## Who It's For

ZeroUp Partners is for people who believe that the way most "impact" work is structured — top-down, extractive, temporary — is fundamentally broken, and who want to be part of building something that actually stays.

It is particularly focused on Africa, though the ecosystem is global. Partners from Singapore, London, Lagos, Nairobi, and elsewhere are part of the same constellation.

If you've ever written a cheque to a cause and wondered what happened to it — this platform is the answer to that question, built as infrastructure.

---

## Contact

- General: support@zeroup.org
- Partner Inquiries: partners@zeroup.org
- Contributions: GT Bank · Account 0219230107 · PACSDA

---

*ZeroUp Partners — Building sustainable impact together.*
