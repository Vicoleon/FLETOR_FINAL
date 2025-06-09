# OdontoTravel Deployment Guide

This guide covers deployment for both local development and production environments.

## 🏠 Local Development

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or pnpm

### Quick Start
```bash
# Install all dependencies
npm run setup

# Start development servers (both frontend and backend)
npm start

# Or start individually:
npm run dev:backend    # Flask API on http://localhost:5000
npm run dev:frontend   # React app on http://localhost:5173
```

### Environment Configuration
The app automatically detects the environment:
- **Development**: Uses `http://localhost:5000` for API calls
- **Production**: Uses environment variables or defaults to Render URLs

## 🚀 Production Deployment to Render

### Option 1: Separate Services (Recommended)

#### Backend Deployment
1. **Create Web Service** in Render dashboard
2. **Connect your repository**
3. **Configure service**:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python src/main_full.py`
   - **Environment**: `Python`

4. **Set Environment Variables**:
   ```
   FLASK_ENV=production
   SECRET_KEY=<generate-secure-key>
   PORT=5000
   DATABASE_URL=<postgresql-url>  # Optional: Add PostgreSQL database
   ```

#### Frontend Deployment
1. **Create Static Site** in Render dashboard
2. **Connect your repository**
3. **Configure service**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Set Environment Variables**:
   ```
   VITE_API_BASE_URL=https://your-backend-service.onrender.com
   VITE_APP_NAME=OdontoTravel
   VITE_APP_ENV=production
   ```

### Option 2: Single Service Deployment

1. **Create Web Service** in Render dashboard
2. **Use root directory** (not backend subdirectory)
3. **Configure service**:
   - **Build Command**: `./build.sh`
   - **Start Command**: `npm run start:prod`
   - **Environment**: `Node`

## 🗄️ Database Configuration

### Development
- Uses SQLite database (`dental_tourism.db`)
- Automatically created on first run

### Production
- Supports PostgreSQL (recommended)
- Add PostgreSQL database in Render
- Set `DATABASE_URL` environment variable

## 🔧 Environment Variables

### Backend Variables
| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `FLASK_ENV` | `development` | `production` | Flask environment |
| `SECRET_KEY` | Default key | **Required** | Flask secret key |
| `PORT` | `5000` | Render assigned | Server port |
| `DATABASE_URL` | SQLite | PostgreSQL URL | Database connection |

### Frontend Variables
| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5000` | Backend URL | API endpoint |
| `VITE_APP_NAME` | `OdontoTravel` | `OdontoTravel` | App name |
| `VITE_APP_ENV` | `development` | `production` | Environment |

## 🔄 CORS Configuration

The app automatically configures CORS based on environment:
- **Development**: Allows all origins
- **Production**: Restricts to specific domains for security

## 📝 Deployment Checklist

### Before Deployment
- [ ] Update API URLs in frontend
- [ ] Set production environment variables
- [ ] Test build process locally
- [ ] Ensure database migrations work
- [ ] Update CORS settings

### After Deployment
- [ ] Verify health endpoint: `/api/health`
- [ ] Test user registration/login
- [ ] Check database connectivity
- [ ] Monitor application logs
- [ ] Test all major features

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check frontend environment variables
   - Verify backend CORS configuration
   - Ensure URLs match exactly

2. **Database Connection**
   - Verify `DATABASE_URL` format
   - Check PostgreSQL service status
   - Review database logs

3. **Build Failures**
   - Check Node.js/Python versions
   - Verify all dependencies are listed
   - Review build logs for specific errors

4. **API Connection Issues**
   - Verify `VITE_API_BASE_URL` is correct
   - Check network connectivity
   - Review browser console for errors

### Useful Commands

```bash
# Test production build locally
npm run build
npm run start:prod

# Check environment detection
node -e "console.log('DEV:', import.meta.env.DEV)"

# Test API connectivity
curl https://your-backend-url.onrender.com/api/health
```

## 📊 Monitoring

### Health Checks
- Backend: `GET /api/health`
- Returns: `{"status": "healthy", "message": "Dental Tourism API is running"}`

### Logs
- Monitor Render service logs for errors
- Check browser console for frontend issues
- Review database connection logs

## 🔐 Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **CORS**: Properly configured for production
3. **HTTPS**: Enforced in production
4. **Database**: Use strong passwords and SSL connections
5. **Secrets**: Use Render's secret generation for keys

## 📈 Scaling

### Performance Optimization
- Use Gunicorn with multiple workers
- Enable database connection pooling
- Implement caching strategies
- Optimize frontend bundle size

### Monitoring
- Set up health checks
- Monitor response times
- Track error rates
- Monitor database performance 