# BOL BHARAT 🇮🇳

> **Speak Up, India!** — A civic issue reporting platform empowering citizens to report and track community problems.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.6-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)

## 📋 Overview

BOL BHARAT is a community-driven platform that enables Indian citizens to:

- **Report Issues** — Submit civic problems with photos, location, and descriptions
- **Track Progress** — Follow the status of reported issues from submission to resolution
- **ML-Powered Analysis** — Automatic categorization and priority detection using machine learning
- **Community Engagement** — Upvote issues to highlight urgent community concerns
- **Hotspot Detection** — Identify areas with recurring problems for proactive intervention

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📸 **Image Upload** | Attach photos with automatic compression and validation |
| 🗺️ **Location Mapping** | Pin issues on an interactive map |
| 🤖 **ML Suggestions** | AI-powered category, priority, and title recommendations |
| 📊 **Analytics Dashboard** | Track issue statistics and trends |
| 🔔 **Real-time Updates** | Live updates via Firebase subscriptions |
| 📱 **Mobile Responsive** | Fully optimized for mobile devices |

## 🛠️ Tech Stack

### Frontend
- **React 18** — UI library with hooks
- **TypeScript** — Type-safe development
- **Tailwind CSS** — Utility-first styling
- **shadcn/ui** — Accessible component library
- **React Router** — Client-side routing
- **React Hook Form** — Form handling with Zod validation

### Backend
- **Firebase Realtime Database** — NoSQL data storage
- **Firebase Storage** — Image uploads and CDN
- **Firebase Authentication** — User management (ready)

### ML Pipeline
- Local ML processing with keyword-based categorization
- Spam and duplicate detection
- Hotspot clustering algorithm
- Extensible for external ML API integration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Firebase project with Realtime Database enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/bol-bharat.git
cd bol-bharat

# Install dependencies
npm install
# or
bun install

# Copy environment variables
cp .env.example .env

# Configure your Firebase credentials in .env

# Start development server
npm run dev
# or
bun dev
```

### Environment Variables

Use two groups of variables:

1. `VITE_FIREBASE_*` for Firebase client config (public, safe for browser)
2. Server-only keys for AI routes (private, stored in Vercel Project Settings)

```env
# Client (public Firebase config)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com

# Server-only secrets (DO NOT prefix with VITE)
NVIDIA_API_KEY=your_nvidia_key
GEMINI_API_KEY=your_gemini_key
ROBOFLOW_API_KEY=your_roboflow_key
ROBOFLOW_POTHOLE_MODEL_ID=pothole-detection-sjbkl/5
ROBOFLOW_GARBAGE_MODEL_ID=garbage-detection-aylah/9
```

In Vercel, add the server keys in Project Settings → Environment Variables.
The frontend now calls `/api/ai/*` routes, so these keys are never exposed to users.

### Optional: One-Time Seed Data

Seeding is optional and not required on every run.

```bash
# Seed only if database is empty
npm run seed

# Force reset and re-seed (only when you explicitly want fresh demo data)
npm run seed:force
```

## 📁 Project Structure

```
bol-bharat/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Issues/      # Issue-related components
│   │   ├── Layout/      # Page layout components
│   │   ├── ReportForm/  # Issue reporting form
│   │   └── ui/          # shadcn/ui components
│   ├── data/            # Mock data and constants
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and Firebase config
│   ├── pages/           # Route pages
│   ├── services/        # API and backend services
│   │   ├── api.ts       # Unified API interface
│   │   ├── database.ts  # Firebase CRUD operations
│   │   ├── mlBackend.ts # ML processing logic
│   │   ├── mlService.ts # ML service interface
│   │   └── storage.ts   # File upload service
│   └── types/           # TypeScript type definitions
├── .env.example         # Environment template
├── tailwind.config.ts   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 8080 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run seed` | Optional one-time seed if DB is empty |
| `npm run seed:force` | Optional reset + re-seed for demo data |

## 🔌 API Reference

### Hooks

```tsx
// Fetch all issues with real-time updates
const { issues, loading, error } = useIssues({ realtime: true });

// Fetch single issue with actions
const { issue, upvote, updateStatus } = useIssue(issueId);

// Create new issue
const { createIssue, loading, mlAnalysis } = useCreateIssue();

// Run ML analysis
const { analyze, analysis } = useMLAnalysis();
```

### Services

```tsx
import { apiCreateIssue, apiGetIssues, apiAnalyzeContent } from '@/services/api';

// Create issue
const response = await apiCreateIssue({
  title: 'Pothole on Main Road',
  description: 'Large pothole causing accidents',
  category: 'roads',
  location: 'MG Road, Pune',
  duration: '1-2 weeks',
  images: ['https://...']
});

// Get all issues
const issues = await apiGetIssues({ category: 'roads', limit: 10 });
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Kartik** — Initial work and development

---

<p align="center">
  <strong>BOL BHARAT</strong> — Empowering citizens to build better communities 🇮🇳
</p>
