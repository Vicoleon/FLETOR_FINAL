# Frontend Development

React.js application for the dental tourism platform.

## Quick Start

```bash
npm install
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Components

- `src/App.jsx` - Main application component
- `src/contexts/AuthContext.jsx` - Authentication context
- `src/components/AuthModal.jsx` - Login/registration modal
- `src/components/PatientDashboard.jsx` - Patient interface
- `src/components/DentistDashboard.jsx` - Dentist interface
- `src/components/BookingSystem.jsx` - Booking management
- `src/components/NotificationCenter.jsx` - Notification system

## Configuration

- API base URL is configured in `src/contexts/AuthContext.jsx`
- For local development, change to: `http://localhost:5000/api`
- For production, use the live API URL

## Styling

- Tailwind CSS for utility-first styling
- Shadcn/UI for professional components
- Custom cyan color scheme throughout

## Browser Extension Compatibility

The application includes robust error handling for browser extension conflicts. See the main documentation for details.

