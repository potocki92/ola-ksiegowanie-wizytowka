# AGENTS.md

## Project Context

This repository contains a professional business website built with:

- Astro
- TypeScript
- Tailwind CSS
- PocketBase
- Zod

The project starts as a company website but is designed to evolve into a larger business platform including:

- customer accounts
- authentication
- invoices
- documents
- financial tracking
- company dashboard

The application must be built with production-quality standards from the beginning.

The main priorities are:

1. Maintainability
2. Clean architecture
3. Performance
4. SEO
5. Accessibility
6. Scalability

---

# Core Development Principles

## 1. Think Before Coding

Do not immediately write code.

Before implementing:

- Understand the requested goal.
- Identify assumptions.
- Explain important tradeoffs.
- Ask questions when requirements are ambiguous.
- Present alternative approaches when multiple solutions exist.

Never silently choose an architecture when the requirement is unclear.

Prefer:

- simple solutions
- maintainable solutions
- solutions aligned with the existing architecture

Avoid:

- unnecessary complexity
- premature optimization
- speculative features

---

# 2. Simplicity First

Write the minimum amount of code required to solve the problem.

Do not create:

- unnecessary abstractions
- generic solutions without a real use case
- unused utilities
- unnecessary configuration options
- complex systems for simple problems

Before creating an abstraction, ask:

"Will this be reused multiple times?"

If not:

- keep it local
- keep it simple

A smaller clear solution is preferred over a larger flexible solution.

---

# 3. Surgical Changes

When modifying existing code:

- Change only what is necessary.
- Do not refactor unrelated code.
- Do not rewrite working code without a reason.
- Match existing project conventions.
- Do not remove existing functionality.

If your changes create unused:

- imports
- variables
- functions

remove only those created by your changes.

Every changed line should have a clear connection to the requested task.

---

# 4. Architecture Rules

This project follows a feature-based architecture.

Expected structure:

```
src/
├── assets/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── sections/
│
├── features/
│   ├── company/
│   ├── pricing/
│   ├── contact/
│   └── future-features/
│
├── layouts/
│
├── pages/
│
├── lib/
│   ├── pocketbase/
│   ├── seo/
│   └── utils/
│
├── styles/
│
└── types/
```

Rules:

- Components are responsible only for presentation.
- Business logic belongs inside feature modules.
- Pages should compose components, not contain complex logic.
- PocketBase communication must happen only through service layers.
- Shared functionality belongs in `lib`.
- Avoid creating random folders without architectural justification.

---

# 5. Astro Development Rules

Astro is the primary frontend framework.

Prioritize:

- static generation where possible
- server rendering only when required
- minimal JavaScript shipped to the browser
- excellent performance

Prefer Astro components over client-side frameworks.

Avoid unnecessary:

```
client:load
client:idle
client:visible
```

Use client-side JavaScript only when there is a clear user interaction requirement.

Performance and SEO are first-class requirements.

---

# 6. TypeScript Standards

TypeScript must be used everywhere.

Rules:

- Never use `any` unless absolutely necessary.
- Prefer explicit types.
- Create reusable types for shared data structures.
- Keep types close to their domain.

Good:

```ts
interface Service {
  id: string;
  title: string;
  price: number;
}
```

Avoid:

```ts
const data: any = response;
```

---

# 7. PocketBase Integration Rules

PocketBase is the backend layer.

Never access PocketBase directly from UI components.

Required data flow:

```
Component
    |
Feature Service
    |
PocketBase Client
    |
Database
```

Example:

```
features/pricing/

pricing.service.ts
pricing.types.ts
pricing.mapper.ts
```

Services are responsible for:

- fetching data
- transforming data
- validating data
- applying business rules

Components only display prepared data.

---

# 8. UI/UX Standards

This project uses UI/UX Pro Max principles.

Every interface must consider:

- visual hierarchy
- typography
- spacing
- accessibility
- responsive design
- user experience

Avoid generic AI-generated interfaces.

Do not automatically create:

- excessive gradients
- meaningless cards
- unnecessary animations
- oversized hero sections without purpose
- random icon usage

The design must feel like a professional company product.

---

# 9. Component Rules

Components must:

- have one clear responsibility
- receive data through props
- remain easy to understand
- be reusable when appropriate

Avoid:

- huge components
- components mixing business logic and UI
- hidden side effects
- duplicated markup

Naming convention:

```
PascalCase.astro
```

Examples:

```
HeroSection.astro
PricingCard.astro
ContactForm.astro
```

---

# 10. SEO Requirements

Every public page must include:

- proper page title
- meta description
- Open Graph metadata
- semantic HTML
- accessible structure

Use:

- correct heading hierarchy
- descriptive links
- optimized images
- structured content

SEO is part of development, not a later improvement.

---

# 11. Validation and Security

Future versions of this project will handle:

- customer accounts
- invoices
- documents
- business information

Always consider security.

Never trust:

- user input
- browser state
- submitted forms

Validate external data.

Preferred validation library:

```
Zod
```

---

# 12. Testing and Verification

Every meaningful change requires verification.

Before finishing a task check:

- application builds successfully
- TypeScript has no errors
- lint passes
- functionality works

For larger features define success criteria.

Example:

Task:

"Create contact form"

Success criteria:

```
✓ User can submit form
✓ Invalid data is rejected
✓ Data is stored correctly
✓ Error states work
✓ Mobile layout works
✓ Build succeeds
```

---

# 13. Git Discipline

Keep commits focused.

Preferred commit style:

```
feat: add pricing section

fix: validate contact form

refactor: simplify pocketbase service
```

Avoid:

- mixing unrelated changes
- huge unclear commits
- committing generated files unnecessarily

---

# 14. Documentation Rules

Documentation is part of the project.

Update documentation when changing:

- architecture
- dependencies
- environment variables
- major features

Required files:

```
README.md
ARCHITECTURE.md
AGENTS.md
.env.example
```

---

# 15. AI Assistant Workflow

Follow this workflow for every task.

## Step 1 - Understand

Before coding:

Explain:

- what will change
- why it is needed
- possible risks


## Step 2 - Plan

Create a short implementation plan.

Example:

```
1. Create component
   Verify: component renders correctly

2. Add service layer
   Verify: data loads correctly

3. Run build
   Verify: production build succeeds
```


## Step 3 - Implement

Make only required changes.

Follow existing architecture.

Do not introduce unnecessary dependencies.

---

## Step 4 - Review

Before finishing:

Check:

- code quality
- architecture compliance
- unused code
- security concerns
- documentation impact

---

# Installed AI Skills

This project uses the following AI development skills.

## Superpowers

Purpose:

- structured development workflow
- planning before implementation
- architectural thinking
- code review discipline


## UI/UX Pro Max

Purpose:

- professional interface design
- UX decisions
- design consistency
- accessibility


AI assistants must follow these principles during development.

---

# Final Rule

Build the right product, not the most code.

Prefer:

- simple
- clear
- maintainable
- scalable
- production-ready solutions

Avoid complexity unless it provides real value.