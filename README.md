# 🎙️ Interview Coach AI

Interview Coach AI is a sophisticated, full-stack practice environment designed to help candidates master behavioral and technical interviews. It provides a seamless, local-first experience for recording answers, receiving real-time AI-powered feedback, and tracking progress over time.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)

---

## ✨ Key Features

- **🚀 Live Transcription:** Uses the browser's Web Speech API for near-instant, local-first transcription—no expensive cloud API required.
- **📊 AI Scoring Engine:** A custom-built TypeScript scoring engine that analyzes answers based on:
  - **STAR Method** (Situation, Task, Action, Result)
  - **Delivery Metrics** (WPM, filler words, hedging)
  - **Content Quality** (Action verbs, quantification, technical depth)
- **📈 Progress Tracking:** Detailed dashboard showing score trends, best attempts, and specific areas for improvement.
- **🔐 Flexible Auth:** 
  - **Guest Mode:** Start practicing immediately with local storage.
  - **Email OTP:** Secure, passwordless login via NextAuth and Nodemailer.
  - **History Sync:** Seamlessly claim guest attempts after signing in.
- **🎯 Dynamic Rubrics:** Scoring adjusts automatically based on the question type (Behavioral, Technical, or System Design).
- **🎨 Modern UI:** A clean, responsive dashboard styled with Tailwind CSS 4.0 and featuring dark mode support.

---

## 🛠️ Tech Stack

- **Frontend:** [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://reactjs.org/)
- **Styling:** [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (via [Prisma ORM](https://www.prisma.io/))
- **Authentication:** [NextAuth.js v5](https://authjs.dev/) (Beta)
- **Transcription:** Browser [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- **Testing:** [Playwright](https://playwright.dev/) for smoke tests
- **Mail:** [Nodemailer](https://nodemailer.com/) for OTP delivery

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js:** 22.18.0 or later
- **Database:** A PostgreSQL instance (or change provider in `schema.prisma` for local SQLite)
- **Browser:** Chrome or Edge (for Web Speech API support)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/interview-coach-ai.git
cd interview-coach-ai/web

# Install dependencies
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env.local` and configure your variables:

```bash
cp .env.example .env.local
```

Key variables to set:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `NEXTAUTH_SECRET`: A secure random string for session encryption.
- `EMAIL_SERVER_HOST`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`: For OTP emails.
- `EMAIL_FROM`: The sender address for OTP emails.

### 4. Database Initialization

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the question bank
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start practicing!

---

## 🏗️ Architecture

### Client-Side Transcription
By utilizing the `window.SpeechRecognition` API, we achieve low-latency transcription directly in the browser. This reduces server load and ensures privacy, as audio data doesn't necessarily need to be sent to a backend for initial processing.

### Server-Side Scoring
Once a transcript is finalized, it's sent to `/api/score`. Our custom scoring engine (located in `web/lib/scoring.ts`) evaluates the text across multiple dimensions:
- **Lexical Analysis:** Detects filler words ("um", "uh") and hedges ("maybe", "i think").
- **Structural Analysis:** Checks for STAR components and logical flow.
- **Contextual Alignment:** Compares the answer against the specific question's requirements and mode (e.g., Technical vs. Behavioral).

---

## 📂 Project Structure

```
.
├── web/                   # Main Next.js Application
│   ├── app/               # App Router (Pages & API)
│   ├── components/        # React Components (Recorder, Dashboard, etc.)
│   ├── lib/               # Utilities, Scoring Engine, Prisma Client
│   ├── prisma/            # Database Schema & Seeds
│   └── tests/             # Playwright E2E Tests
└── transcriber/           # [Legacy] Python Transcription Service
```

---

## 🧪 Testing

Run smoke tests to ensure core functionality:

```bash
cd web
npm run test:smoke
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

Happy practicing! 🚀
