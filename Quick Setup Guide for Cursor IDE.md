# Quick Setup Guide for Cursor IDE

## 🚀 Instant Setup (2 minutes)

### 1. Open in Cursor
```bash
# Extract the project
unzip dental-tourism-complete-project.zip
cd dental-tourism-complete-project

# Open in Cursor
cursor .
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies (in new terminal)
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Start Development
```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
python src/main.py

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### 4. Access Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

## 🎯 What You Get

### ✅ Complete Uber-like Platform
- Real-time booking requests
- Dentist accept/decline functionality
- Auto-refresh notifications
- Professional UI with cyan theme
- Mobile-responsive design

### ✅ Production-Ready Features
- JWT authentication
- SQLite database (ready to use)
- Browser extension compatibility
- Error handling and validation
- Complete API documentation

### ✅ Development Tools
- Cursor IDE optimized
- Hot reload for frontend
- Auto-restart for backend
- Comprehensive documentation
- Git-ready project structure

## 📁 Project Structure
```
dental-tourism-complete-project/
├── frontend/          # React.js application
├── backend/           # Flask API
├── database/          # SQLite database + schema
├── docs/              # Complete documentation
├── README.md          # Main project guide
└── package.json       # Project scripts
```

## 🔧 Cursor IDE Extensions
Install these for optimal experience:
- Python extension
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- SQLite Viewer

## 📚 Documentation
- `README.md` - Main project overview
- `docs/CURSOR_DEVELOPMENT_GUIDE.md` - Detailed setup guide
- `frontend/README.md` - React.js documentation
- `backend/README.md` - Flask API documentation
- `database/README.md` - Database schema guide

## 🌐 Live Demo
- **Frontend:** https://nyvlcdku.manus.space
- **Backend:** https://9yhyi3cq08wq.manus.space

## 🎉 Ready to Code!
Your complete dental tourism platform is ready for development in Cursor IDE!

