# Frontend - UTD Career Spark

React-based frontend application for the UTD Career Spark platform, built with modern web technologies and best practices.

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **React Router** - Client-side routing
- **Lucide React** - Icons

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🏗️ Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   └── MainChatOverlay.tsx
│   ├── contexts/          # React context providers
│   │   └── UserDataContext.tsx
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── pages/             # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Academics.tsx
│   │   ├── JobMarket.tsx
│   │   ├── Projects.tsx
│   │   └── Profile.tsx
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
├── components.json         # shadcn/ui configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for consistent, accessible UI components. All components are located in `src/components/ui/`.

### Key Components

- **Cards**: Dashboard cards with loading states
- **Forms**: User profile and onboarding forms
- **Navigation**: Responsive navigation and routing
- **Chat Interface**: AI-powered career guidance chat
- **Skeletons**: Loading state animations

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=UTD Career Spark
```

### Tailwind CSS

The project uses Tailwind CSS for styling. Configuration is in `tailwind.config.ts`.

### TypeScript

TypeScript configuration is in `tsconfig.json`. The project uses strict type checking.

## 🚀 Development

### Adding New Components

1. **Create component file:**
   ```bash
   touch src/components/NewComponent.tsx
   ```

2. **Use shadcn/ui CLI for UI components:**
   ```bash
   npx shadcn@latest add button
   ```

### State Management

The app uses React Context for state management:
- `UserDataContext`: User profile and preferences
- Local state for component-specific data

### Routing

Routes are defined in `App.tsx` using React Router:
- `/` - Dashboard
- `/academics` - Academic planning
- `/job-market` - Job market overview
- `/projects` - Project recommendations
- `/profile` - User profile

## 🎯 Key Features

### Dashboard
- Interactive agent cards
- Real-time loading states
- Responsive grid layout

### Chat Interface
- AI-powered career guidance
- Tool call simulation
- Real-time status updates

### User Profile
- Comprehensive onboarding
- Skills and experience tracking
- Academic information management

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   npm run dev -- --port 3001
   ```

2. **Dependencies issues:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript errors:**
   ```bash
   npm run lint
   ```

### Performance

- Use React.memo for expensive components
- Implement lazy loading for routes
- Optimize images and assets

## 📦 Building for Production

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Preview the build:**
   ```bash
   npm run preview
   ```

3. **Deploy the `dist` folder** to your hosting service

## 🧪 Testing

Currently, the project doesn't have automated tests. Consider adding:
- Unit tests with Jest and React Testing Library
- Integration tests for key user flows
- E2E tests with Playwright or Cypress

## 📚 Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new files
3. Add proper prop types and interfaces
4. Test your changes thoroughly
5. Update documentation as needed