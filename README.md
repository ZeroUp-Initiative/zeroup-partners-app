# ZeroUp Partners App

A comprehensive social impact contribution tracking and management platform for the ZeroUp Initiative. Partners can make financial contributions toward social impact projects, track their impact, and engage with a community of like-minded individuals.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/zeroupacademy-7190s-projects/ZeroUp-partners-app)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Firebase](https://img.shields.io/badge/Powered%20by-Firebase-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com)

## ✨ Features

### For Partners (Users)
- 📊 **Dashboard** - Real-time overview of contributions, impact score, and badges
- 💰 **Contribution Tracking** - Log and track financial contributions to projects
- 📈 **Analytics** - Personal impact analytics with charts and trends
- 👥 **Community** - Leaderboard, Partner of the Month, and community activities
- 🪙 **Gamification** - Earn Dreamers Coins, unlock achievements, and level up
- 🔔 **Notifications** - Real-time updates on contribution approvals and achievements
- 👤 **Profile** - Customizable profile with photo upload

### For Administrators
- 📁 **Project Management** - Create, edit, and manage social impact projects
- ✅ **Transaction Approval** - Review and approve/reject contribution submissions
- 👨‍💼 **User Management** - Manage users and assign admin roles
- 📊 **Reports** - Export transactions and analytics as CSV

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Authentication** | Firebase Auth |
| **Database** | Firebase Firestore |
| **Storage** | Cloudinary |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Error Monitoring** | Sentry |
| **Testing** | Jest + React Testing Library |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (20+ recommended)
- npm or yarn
- Firebase project
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ZeroUp-Initiative/zeroup-partners-app.git
   cd zeroup-partners-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Firebase configuration in `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Firebase Setup

1. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Firestore Indexes**
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Deploy Cloud Functions** (for user cleanup on deletion)
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   ├── analytics/         # User analytics page
│   ├── community/         # Community/leaderboard page
│   ├── contributions/     # Contribution history page
│   ├── dashboard/         # Main user dashboard
│   ├── dreamers-coin/     # Gamification page
│   └── projects/          # Projects listing
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication components
│   ├── contributions/    # Contribution-related components
│   ├── layout/           # Header, navigation components
│   └── ui/               # shadcn/ui components
├── contexts/             # React contexts (Auth, etc.)
├── functions/            # Firebase Cloud Functions
├── lib/                  # Utilities and services
│   ├── firebase/        # Firebase client config
│   ├── gamification.ts  # Gamification service
│   ├── notifications.ts # Notification service
│   └── types.ts         # TypeScript type definitions
├── public/              # Static assets
└── __tests__/           # Test files
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |

## 🔐 Security

- Firebase Authentication for secure user management
- Firestore Security Rules for database access control
- Server-side admin role verification
- Environment variables for sensitive configuration
- Sentry for error monitoring in production

## 🌐 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

## 📄 License

This project is proprietary software owned by ZeroUp Initiative.

## 🤝 Contributing

This is a private project. For any inquiries, please contact the ZeroUp Initiative team.

---

Built with ❤️ by the ZeroUp Initiative
