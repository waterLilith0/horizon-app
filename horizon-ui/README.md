<div markdown="3">

# Horizon UI 🌅

A personal website portfolio built by **waterlilith** using **React**, **Vite**, and **Tailwind CSS**. Provides an endpoint for the companion horizon-api.

---

## Features ✨

- 🎨 Masonry Gallery with responsive image loading
- 🌙 Dark/Light Theme toggle with persistent user preference
- 🔗 API Dashboard integration via Grafana Faro monitoring
- ✉️ Contact forms and social media links
- 📱 Fully responsive design for all devices
- 🎯 React Router with custom layout system
- 📊 Project tracking through Grafana Faro

---

## Table of Contents

- [Getting Started](#getting-started)
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Key Components & Patterns](#key-components--patterns)
- [Page Routes](#page-routes)
- [State Management](#state-management)
- [CSS/Styling](#cssstyling)
- [API Integration](#api-integration)
- [Build and Deployment](#build-and-deployment)
- [Development Guidelines](#development-guidelines)
- [Related Projects](#related-projects)

---

## Getting Started 🚀

### Prerequisites

- Node.js v18+ and npm/yarn/pnpm
- A modern code editor (VS Code recommended)
- Optional: Docker for containerized builds

### Installation

```
bash cd horizon-ui
npm install
```

#### Run Development Server

```
bash npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Overview 📖

Horizon UI is a personal website portfolio that showcases:

- **VRChat art** and creative visuals
- **Photography gallery** with masonry layout
- **Personal interests** - topics like Steampunk, Cyberpunk, Anime/Manga, Music
- **Technical projects** including C#, React, TypeScript, JavaScript, Java
- **API Dashboard** providing access to backend services via horizon-api

The site doubles as a blog/tinkering space.

### Key Pages

| Route            | Purpose                         |
| ---------------- | ------------------------------- |
| `/` (Home)       | Gallery of topics and interests |
| `/about-contact` | About me, contact information   |
| `/gallery`       | Main gallery view               |
| `/yt-embed`      | YouTube video embed player      |
| `/privacy`       | Privacy policy                  |
| `/impressum`     | Legal/impressum info            |

---

## Technology Stack 🛠️

### Frontend Dependencies

| Package      | Version | Purpose             |
| ------------ | ------- | ------------------- |
| react        | ^19.2.6 | UI framework        |
| react-dom    | ^19.2.6 | React DOM renderer  |
| react-router | ^7.18.0 | Client-side routing |

### Styling & Layout

| Package           | Version | Purpose              |
| ----------------- | ------- | -------------------- |
| tailwindcss       | ^4.3.1  | Utility-first CSS    |
| @tailwindcss/vite | ^4.3.1  | Tailwind Vite plugin |
| tw-animate-css    | ^1.4.0  | Animation utilities  |

### UI & Components Library

| Package                            | Version | Purpose                      |
| ---------------------------------- | ------- | ---------------------------- |
| lucide-react                       | ^1.20.0 | Icon library                 |
| @fortawesome/free-brands-svg-icons | ^7.2.0  | Brand icons                  |
| @fortawesome/free-solid-svg-icons  | ^7.2.0  | Solid icons                  |
| @fortawesome/react-fontawesome     | ^3.3.1  | React FontAwesome            |
| radix-ui                           | ^1.6.0  | UI primitives, switch/button |

### Utilities & State

| Package                  | Version | Purpose                      |
| ------------------------ | ------- | ---------------------------- |
| jotai                    | ^2.20.1 | Atom-based state management  |
| class-variance-authority | ^0.7.1  | CSS variant utilities (CAVA) |
| clsx                     | ^2.1.1  | Conditional class builder    |
| tailwind-merge           | ^3.6.0  | Merge Tailwind classes       |

### Lazy Loading

| Package                         | Version | Purpose            |
| ------------------------------- | ------- | ------------------ |
| react-lazy-load-image-component | ^1.6.3  | Image lazy loading |

---

## Development Build Tools

| Tool        | Version | Purpose              |
| ----------- | ------- | -------------------- |
| vite        | ^8.0.12 | Dev server & bundler |
| typescript  | ~6.0.2  | Type checking        |
| @babel/core | ^7.29.0 | Babel transpilation  |

---

## Directory Structure 📁

```
horizon-ui/
├── public/              # Static assets: favicons, robots.txt, icons.svg
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── custom/     # Custom-built components
│   │   │   ├── Navbar.tsx      # Navigation bar with theme toggle
│   │   │   ├── Footer.tsx      # Footer with configurable links
│   │   │   ├── MasonryGrid.tsx # Pinterest-style image grid
│   │   │   ├── ResponsiveImage.tsx  # Lazy-loaded responsive images
│   │   │   └── NavButton.tsx   # Mobile menu trigger
│   │   └── ui/         # Standard UI primitives:
│   │       ├── button.tsx        # Button with variants
│   │       ├── card.tsx          # Card and sub-components (Header/Footer)
│   │       ├── switch.tsx        # Theme toggle switch
│   │       ├── separator.tsx     # Horizontal divider lines
│   │       └── aspect-ratio.tsx  # Aspect ratio utilities
│   ├── lib/            # Utility functions
│   │   └── utils.ts    # cn() class helper, splitIntoColumns()
│   ├── pages/          # Route and content pages:
│   │   ├── Layout.tsx      # Main layout wrapper
│   │   ├── Home.tsx        # Home gallery page
│   │   ├── About.tsx       # About/contact info
│   │   ├── Gallery.tsx     # Main gallery view
│   │   ├── VRChatShowcase.tsx  # VRChat content
│   │   ├── YTEmbed.tsx     # YouTube embed player
│   │   ├── Testing.tsx     # Testing utilities
│   │   └── ErrorPages/
│   │       └── NotFound.tsx    # 404 page
│   └── Legal/
│       ├── PrivacyPolicy.tsx
│       └── Impressum.tsx
├── main.tsx                 # App entry with Faro initialization
├── configAtoms.ts           # Jotai atom configuration
├── dataAtoms.ts             # Data/state definitions (themes, links, gallery cards)
├── index.css                # Global styles
├── package.json      # Dependencies and npm scripts
├── tsconfig.app.json     # App TypeScript config
├── tsconfig.node.json    # Vite config scripts
├── vite.config.ts        # Vite build configuration
├── Dockerfile            # Multi-stage container build
└── nginx.conf            # NGINX deployment config
```

---

## Key Components and Patterns 🎨

### Jotai State Management

Horizon UI uses **Jotai** atoms for global state, avoiding prop drilling.

```

tsx
// Example: Accessing gallery cards data
import { useAtomValue } from 'jotai';
import { cardsAtom } from '@/dataAtoms';

function Home() {
const cards = useAtomValue(cardsAtom);

return (

<div>{cards.map((card) => (
<Card key={card.title}>
<CardTitle>{card.title}</CardTitle>
<CardContent>{card.content}</CardContent>
{/_ Footer if configured _/}
</Card>)})}
);
```

---

### Custom UI Components

#### Button Component

Built with Radix UI primitives and CAVA. Variants: `default`, `outline`, `secondary`, `ghost`, `destructive`

#### Card System

Multiple sub-components:

- `Card` Container (configurable width)
- `CardHeader`
- `CardTitle` + `CardDescription`
- `CardContent`
- `CardFooter`

#### Switch Component

Theme toggle that persists to localStorage.

---

## Page Routes 🗺️

Navigation links defined in `src/dataAtoms.ts`:

| Route Path       | Display Name  |
| ---------------- | ------------- |
| `/home`          | Home          |
| `/about-contact` | About         |
| `/gallery`       | Gallery       |
| `/yt-embed`      | YouTube Embed |

### Footer Links (3 Rows)

1. **Row 1**: Home, About Me & Contact
2. **Row 2**: Impressum, Sitemap
3. **Row 3**: Privacy Policy, API Dashboard|

---

## State Management 🔃

### Theme System

- Stored in localStorage for persistence
- Atom: `themeAtom` ("light" \| "dark")
- Default starts with **dark mode**

### Gallery Data

The `cardsAtom` contains objects like:

```typescript
{
  image: string;           // Image URL or empty
  title: string;            // Card title
  content: string;          // Description text
  footer: string?;
  link?: string;           // Optional external link
}
```

All state is centralized in `dataAtoms.ts`:

- `themeAtom` - Current theme state
- `links` - Navigation routes
- `footerRows` - Footer multi-row content
- `socials` - Social media with icons
- `cardsAtom` - Gallery card collection

---

## CSS/Styling 🎭

### Tailwind CSS v4

Utility-first styling throughout the app. Example:

```tsx
<div className="flex flex-col bg-secondary items-center grow">
  <main className="overflow-hidden w-[80%] p-2">
```

### Utility Functions

- **cn()**: Combines clsx + tailwind-merge for conditional classes
- **CAVA**: Provides CSS variant definitions

---

## API Integration 🔌

Grafana Faro integration for observability in `src/main.tsx`:

```typescript
initializeFaro({
  url: "https://faro-collector-prod-eu-west-2.grafana.net/collect/...",
  app: {
    name: "horizon-ui",
    version: packageJson.version,
    environment: "production",
  },
  sessionTracking: { samplingRate: 0.4 },
});
```

Features:

- Error tracking and monitoring
- Performance data collection (APM)
- Distributed web tracing
- React router instrumentation

---

## Build and Deployment 📦

### Docker Multi-Stage Build

**Stage 1**: Node.js build environment (install deps & run `npm run build`)  
**Stage 2**: NGINX production runtime serving the built `dist/` folder.

```dockerfile # Dockerfile excerpts
FROM node:24-alpine AS builder
WORKDIR /app
COPY horizon-ui/package*.json ./
RUN npm ci
COPY horizon-ui/ .
RUN FARO_API_KEY="..." npm run build

FROM nginx:alpine
COPY horizon-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

### Build Commands

- `npm run build` # TypeScript + Vite production build
- `npm run dev` # Development server with hot reload
- `npm run lint` # ESLint static analysis
- `npm run preview` # Preview production build locally

---

## Development Guidelines 📋

### TypeScript Configuration

| File                 | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `tsconfig.json`      | Entry point; references app and node configs |
| `tsconfig.app.json`  | App source file compilation                  |
| `tsconfig.node.json` | Vite/Volar script typings                    |

### Path Aliases

Configured as `@/*` → `./src/*`:

```typescript
// vite.config.ts & tsconfig.app.json: { "@/*": "./src/*" }
```

This allows clean imports:

- `@/components/custom/Navbar`
- `@/lib/utils` (`cn()` helper)
- `@/pages/Home`

---

## Related 🔗

| Project               | URL                            | Purpose      |
| --------------------- | ------------------------------ | ------------ |
| waterlilith.space     | https://waterlilith.space/     | Main website |
| api.waterlilith.space | https://api.waterlilith.space/ | API Service  |

---

## License & Credits 📜

© Miriam Lilith Fix, 2026 | Version: **1.4.2** (from `package.json`)

**Tech Stack**: React + Vite + Tailwind CSS

---

## Support & Contact 📧

- Visit [`/about-contact`](https://waterlilith.space/about-contact) page on the site
- GitHub: [@waterlilith0](https://github.com/waterlilith0)
- Social links listed in [`src/dataAtoms.ts`](./src/dataAtoms#socials)

---

<div class="flex items-center gap-3 text-xs opacity-90 px-4 py-2 bg-neutral-800 rounded">
<strong>Last updated</strong>: October 2026
</div>
