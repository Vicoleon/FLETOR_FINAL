# OdontoTravel Tourism Platform

A complete Uber-like dental tourism marketplace connecting patients with dentists in Costa Rica.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ and pip
- Git

### 1. Frontend Setup (React)
```bash
cd frontend
npm install
npm run dev
```
Frontend will run on: http://localhost:5173

### 2. Backend Setup (Flask)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```
Backend will run on: http://localhost:5000

### 3. Database Setup
The SQLite database is included and ready to use. See `database/` folder for:
- `dental_tourism.db` - Pre-populated database
- `database_schema.sql` - SQL schema for other databases

## 📁 Project Structure

```
dental-tourism-complete-project/
├── frontend/                 # React.js frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts (Auth, etc.)
│   │   └── App.jsx         # Main app component
│   ├── package.json
│   └── vite.config.js
├── backend/                 # Flask API backend
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── main.py         # Flask application
│   ├── requirements.txt
│   └── instance/           # Database instance folder
├── database/               # Database files and schema
│   ├── dental_tourism.db   # SQLite database (ready to use)
│   └── database_schema.sql # SQL schema
└── docs/                   # Documentation
    ├── CURSOR_DEVELOPMENT_GUIDE.md
    ├── DEPLOYMENT_GUIDE.md
    └── README.md
```

## 🎯 Features

### ✅ Uber-like Marketplace
- Real-time booking requests
- Dentist accept/decline functionality
- Auto-refresh every 30 seconds
- Status tracking through entire lifecycle

### ✅ Complete Authentication
- JWT token-based authentication
- Patient and dentist registration
- Profile management
- Session handling

### ✅ Advanced Booking System
- Booking lifecycle: Pending → Confirmed → In Progress → Completed
- Payment status management
- Booking history and analytics
- Cancellation and modification

### ✅ Real-time Notifications
- Notification center with filtering
- Unread count badges
- Auto-refresh functionality
- Mark as read/unread

### ✅ Professional UI/UX
- Beautiful cyan color scheme
- Responsive design (mobile + desktop)
- Shadcn/UI components
- Smooth animations and loading states

### ✅ Browser Extension Compatibility
- Robust error handling for extension conflicts
- Professional error messages with solutions
- Graceful degradation
- Enterprise-level stability

## 🌐 Live Demo

- **Frontend:** https://nyvlcdku.manus.space
- **Backend API:** https://9yhyi3cq08wq.manus.space

## 📚 Documentation

- **Development Guide:** `docs/CURSOR_DEVELOPMENT_GUIDE.md` - Complete setup instructions for Cursor IDE
- **Deployment Guide:** `docs/DEPLOYMENT_GUIDE.md` - Production deployment instructions
- **Browser Extension Fix:** `docs/BROWSER_EXTENSION_FIX_RESULTS.md` - Error handling documentation

## 🛠️ Technology Stack

### Frontend
- **React.js** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Shadcn/UI** - Professional component library
- **Lucide Icons** - Beautiful icon set
- **Vite** - Fast build tool

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **JWT** - Authentication tokens
- **SQLite** - Database (production-ready)

### Development Tools
- **Cursor IDE** - AI-powered development
- **Git** - Version control
- **npm/pip** - Package management

## 🚀 Getting Started with Cursor

1. **Open in Cursor:**
   ```bash
   cursor dental-tourism-complete-project
   ```

2. **Install Extensions:**
   - Python extension
   - ES7+ React/Redux/React-Native snippets
   - Tailwind CSS IntelliSense
   - SQLite Viewer

3. **Follow the Development Guide:**
   See `docs/CURSOR_DEVELOPMENT_GUIDE.md` for detailed instructions

## 🎯 Next Steps

1. **Customize Branding:** Update colors, logos, and content
2. **Add Features:** Implement additional Uber-like features
3. **Deploy:** Use the deployment guide for production
4. **Scale:** Add more dentists and expand to other countries

## 📞 Support

For development questions, refer to the comprehensive documentation in the `docs/` folder.

---

**Ready to revolutionize dental tourism! 🦷✈️**

