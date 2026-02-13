# Replit.md

## Overview

This is a React frontend application built with Vite as the build tool. The project uses JavaScript (with TypeScript support available) and is configured for rapid development with Hot Module Reloading (HMR). Currently, it's a minimal starter template that can be extended into a full web application.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 for building user interfaces
- **Build Tool**: Vite 5 for fast development builds and optimized production bundles
- **Language**: JavaScript with optional TypeScript support (TypeScript is configured but files use .jsx extension)
- **Entry Point**: `src/index.jsx` serves as the application entry point, mounted to a root div in `index.html`

### Design Decisions

1. **Vite over Create React App**
   - Problem: Need fast development experience with quick startup and HMR
   - Solution: Vite provides near-instant server start and lightning-fast HMR
   - Pros: Much faster than traditional bundlers, native ES modules support
   - Cons: Slightly different configuration from webpack-based tools

2. **JavaScript with TypeScript Config**
   - Problem: Flexibility between JS and TS
   - Solution: TypeScript is configured but not enforced - files can be renamed from .jsx to .tsx as needed
   - Pros: Gradual TypeScript adoption possible
   - Cons: Mixed codebase could lead to inconsistency

### Server Configuration

- Development server runs on host `0.0.0.0` port `5000`
- All hosts are allowed (configured for Replit's proxy system)

## External Dependencies

### Build Dependencies

| Package | Purpose |
|---------|---------|
| `vite` | Build tool and dev server |
| `@vitejs/plugin-react` | React support for Vite (Fast Refresh, JSX) |
| `react` | UI component library |
| `react-dom` | React DOM renderer |
| `typescript` | TypeScript compiler (optional use) |
| `@types/react` | TypeScript definitions for React |
| `@types/react-dom` | TypeScript definitions for React DOM |

### External Services

Currently, no external APIs, databases, or third-party services are integrated. This is a clean starter template ready for additional integrations as needed.