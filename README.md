# Forget Me Not (FMN)

**A travel-shopping record and sharing web app.**

Forget Me Not helps travelers keep track of what they bought during a
trip---and share useful shopping information with other travelers. Each
record connects a product with its price, currency, purchase location,
date, and photos, so practical details are easier to find after the
trip.

> Record what you bought, and help the next traveler know where to buy
> it and how much it costs.

**Repository:** https://github.com/potsurii/FMN

## Why FMN?

Travel-shopping details are easy to lose across camera rolls, receipts,
notes, and memory. FMN organizes those details around trips, making
personal records easier to revisit and selected information easier to
share.

FMN is designed around travel-shopping records rather than e-commerce
transactions, social feeds, or map-based navigation.

## Features

### 1. Trip-based shopping records

-   Create trips with a name, dates, and a cover image.
-   Add product records with a name, price, currency, purchase location,
    purchase date, category, image, and notes.
-   Browse, view, edit, and delete trip and product records.
-   Review trip-level summaries, including spending, item count, and
    category count.

### 2. Travel-shopping information sharing

-   Control visibility at the trip level; item visibility follows its
    trip.
-   Keep records in private trips out of public browsing.
-   Share practical product and purchase information with other
    travelers.
-   Provide a simple **Recommend / Not Recommend** signal.

### 3. Shopping to-dos

-   Keep a list of products to look for during a trip.
-   Track planned shopping separately from completed purchase records.
-   Where available, use existing product details to prefill a to-do or
    record draft.

### 4. AI Companion with explicit confirmation

The Companion helps interpret requests, search relevant personal
history, and prepare record or to-do drafts. It is designed as a
constrained workflow---not an unrestricted assistant with direct
database-write access.

-   Prepare a draft for the user to review.
-   Require explicit confirmation before formal writes.
-   Route confirmed changes through the application's existing write
    flows.
-   Bound agent-loop execution to reduce the risk of runaway tool calls.

AI features require a valid server-side Gemini API key and a compatible
model configuration.

## Tech stack

  -----------------------------------------------------------------------
  Area                                Technology
  ----------------------------------- -----------------------------------
  Web framework                       Next.js 15

  UI                                  React 19, TypeScript

  Styling                             Tailwind CSS 4

  Authentication and database         Supabase

  Server/client Supabase integration  `@supabase/ssr`,
                                      `@supabase/supabase-js`

  Icons                               `lucide-react`

  Code quality                        ESLint, TypeScript

  Verification                        Project-specific batch and
                                      architecture-check scripts
  -----------------------------------------------------------------------

## Engineering highlights

-   **Authentication-aware server/client integration:** Supabase clients
    are configured separately for browser and server use; server-side
    session handling uses Next.js cookies.
-   **Access boundaries:** trip visibility determines whether associated
    shopping records can be shared.
-   **Controlled AI writes:** the Companion prepares drafts and requires
    user confirmation instead of letting the model write directly to the
    database.
-   **Bounded orchestration:** the agent loop has a maximum step count,
    and server-side code owns the model configuration and tool
    declarations.
-   **Repeatable checks:** the repository includes type-checking,
    linting, architecture checks, and targeted verification scripts for
    implementation batches.

## Getting started

### Prerequisites

-   Node.js and npm
-   A Supabase project
-   A Gemini API key if you want to use the AI Companion

### 1. Clone and install

``` bash
git clone https://github.com/potsurii/FMN.git
cd FMN
npm install
```

### 2. Configure environment variables

Create a local environment file named `.env.local` in the project root
and add the values for your own services:

``` dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

Fill in the first two values from your Supabase project settings.
`GEMINI_API_KEY` is a server-side secret used by the AI integration; do
not prefix it with `NEXT_PUBLIC_`, commit it, or expose it in browser
code.

The repository currently does not include a root `.env.example`
template, so the variable names above are documented from the
application configuration. Keep your local values private.

### 3. Set up Supabase

Configure your Supabase project and ensure its database schema, access
policies, and required storage buckets match the project implementation
before using the app. The repository contains a local Supabase
configuration at `supabase/config.toml`; review it and the accompanying
Supabase files before running local Supabase services.

The public Supabase URL and anonymous key are intended for client-side
use, but data access must still be protected by the database's
authorization policies. Never treat the anonymous key as a substitute
for access control.

### 4. Run the development server

``` bash
npm run dev
```

Open <http://localhost:3000>.

### 5. Build for production

``` bash
npm run build
npm run start
```

Deployment also requires correctly configured environment variables and
a Supabase project whose schema and policies are ready.

## Quality checks

The following scripts are defined in `package.json`:

``` bash
npm run lint
npm run typecheck
npm run phase3:check
npm run architecture:scan
```

Targeted verification scripts are also available:

``` bash
npm run test:batch1
npm run test:batch2a
npm run test:batch2b
npm run test:batch2c1
npm run test:batch2c2
npm run test:batch2c3
npm run test:batch3
npm run test:batch4a
npm run test:batch4c
npm run test:batch5s1
npm run test:batch5s3
```

These commands are provided by the repository; their inclusion here does
not imply that every check has been run against your local environment.

## Environment variables

  ---------------------------------------------------------------------------------
  Variable                          Purpose                 Exposure
  --------------------------------- ----------------------- -----------------------
  `NEXT_PUBLIC_SUPABASE_URL`        Supabase project URL    Available to browser
                                                            code

  `NEXT_PUBLIC_SUPABASE_ANON_KEY`   Supabase                Available to browser
                                    anonymous/public client code; database policies
                                    key                     must enforce access

  `GEMINI_API_KEY`                  Authenticate            Secret; keep on the
                                    server-side requests to server
                                    Gemini                  
  ---------------------------------------------------------------------------------

The model name and timeout are configured in
`lib/providers/gemini/config.ts`. If the AI Companion cannot reach the
provider, verify that the configured model is currently supported by
your Gemini API account, and check the provider response and server
logs.

## Project structure

Key paths verified in the repository include:

``` text
.
├── app/                     # Next.js application routes
├── components/              # Reusable UI components
├── lib/
│   ├── supabase/             # Browser, server, and middleware Supabase clients
│   └── providers/
│       └── gemini/           # Gemini provider configuration
├── scripts/                  # Verification and architecture-check scripts
├── supabase/
│   └── config.toml           # Local Supabase configuration
├── middleware.ts             # Request/session middleware
├── next.config.ts
├── package.json
└── tsconfig.json
```

This is a high-level orientation, not an exhaustive file tree.

## Screenshots

Screenshots are optional for the README to be useful, but real
screenshots of the running application can help reviewers understand the
product quickly. If added, use genuine screenshots from the app and
avoid including personal information, credentials, or private records.

## Project status

FMN is a personal software project built to explore a travel-shopping
record and sharing workflow, with a constrained AI Companion layered on
top of explicit application actions.

## License

No root-level `LICENSE` file was found during the repository review.
Until a license is added, do not assume that public visibility on GitHub
grants permission to reuse, modify, or redistribute this project. Add a
license only after deciding how the project should be shared.
