# UTD Career Spark

A comprehensive career development platform designed specifically for University of Texas at Dallas students. This application provides personalized career guidance, job market insights, project recommendations, and academic planning tools.

## 🚀 Features

- **Job Market Overview**: Real-time job market data, trending skills, and salary insights
- **Project Recommendations**: Personalized project ideas to build your portfolio
- **Academic Planning**: Course recommendations and degree planning tools
- **AI-Powered Chat**: Interactive career guidance with intelligent recommendations
- **Profile Management**: Comprehensive user profile with skills and experience tracking

## 🏗️ Architecture

This project consists of two main components:

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Python + FastAPI + Uvicorn

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn

### 1. Clone the Repository

```bash
git clone <repository-url>
cd utd-career-spark
```

### 2. Set Up the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

The backend will be available at `http://localhost:8000`

### 3. Set Up the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📁 Project Structure

```
utd-career-spark/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React context providers
│   │   └── lib/             # Utility functions
│   ├── package.json
│   └── README.md
├── backend/                  # Python FastAPI backend
│   ├── main.py              # FastAPI application entry point
│   ├── run.py               # Development server runner
│   ├── requirements.txt     # Python dependencies
│   └── README.md
└── README.md               # This file
```

## 🛠️ Development

### Frontend Development

See [frontend/README.md](./frontend/README.md) for detailed frontend setup and development instructions.

### Backend Development

See [backend/README.md](./backend/README.md) for detailed backend setup and development instructions.

## 🎯 Key Features

### Dashboard

- Interactive cards for each major section
- Real-time loading states with skeleton animations
- Responsive design optimized for all devices

### AI Chat Interface

- Intelligent career guidance
- Tool-based recommendations
- Real-time API simulation for job market, projects, and academics

### User Profile Management

- Comprehensive onboarding flow
- Skills and experience tracking
- Academic information management

## 🚀 Deployment

### Frontend Deployment

The frontend can be deployed to any static hosting service:

- Vercel
- Netlify
- AWS S3 + CloudFront

### Backend Deployment

The backend can be deployed to:

- AWS Lambda
- Google Cloud Run
- Heroku
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Backend powered by [FastAPI](https://fastapi.tiangolo.com/)
- Icons from [Lucide React](https://lucide.dev/)
