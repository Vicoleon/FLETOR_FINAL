import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Calendar, DollarSign, Phone, Plane, Star, Shield, Users, Zap, Heart, Settings } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthModal from './components/AuthModal'
import PatientDashboard from './components/PatientDashboard'
import DentistDashboard from './components/DentistDashboard'
import AdminDashboard from './components/AdminDashboard'
import ProfileManagement from './components/ProfileManagement'
import './App.css'

function AppContent() {
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' or 'profile'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show dashboard if user is logged in
  if (user) {
    if (currentView === 'profile') {
      return <ProfileManagement onBackToDashboard={() => setCurrentView('dashboard')} />
    }
    
    if (user.user_type === 'patient') {
      return <PatientDashboard onShowProfile={() => setCurrentView('profile')} />
    } else if (user.user_type === 'dentist') {
      return <DentistDashboard onShowProfile={() => setCurrentView('profile')} />
    } else if (user.user_type === 'admin') {
      return <AdminDashboard onShowProfile={() => setCurrentView('profile')} />
    }
  }

  // Show landing page if not logged in
  return <LandingPage onShowAuth={() => setShowAuthModal(true)} showAuthModal={showAuthModal} setShowAuthModal={setShowAuthModal} />
}

function LandingPage({ onShowAuth, showAuthModal, setShowAuthModal }) {
  const [selectedProcedure, setSelectedProcedure] = useState('dental-implants')
  
  const procedures = {
    'dental-implants': { us: 5000, cr: 1200, savings: 3800, percent: 76 },
    'porcelain-veneers': { us: 1500, cr: 400, savings: 1100, percent: 73 },
    'dental-crowns': { us: 1200, cr: 350, savings: 850, percent: 71 },
    'dental-bridges': { us: 3500, cr: 900, savings: 2600, percent: 74 }
  }

  const currentProcedure = procedures[selectedProcedure]

  const clinicFeatures = [
    { icon: Shield, title: "Internationally Accredited", description: "JCI and ADA certified facilities" },
    { icon: Users, title: "English-Speaking Staff", description: "Fluent communication throughout your care" },
    { icon: Zap, title: "Advanced Technology", description: "Latest dental equipment and techniques" },
    { icon: Heart, title: "Personalized Care", description: "Dedicated patient coordinators" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-cyan-500">Costa Rica Dental</h1>
              </div>
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                <a href="#procedures" className="text-gray-700 hover:text-cyan-500 px-3 py-2 text-sm font-medium">Procedures</a>
                <a href="#clinics" className="text-gray-700 hover:text-cyan-500 px-3 py-2 text-sm font-medium">Clinics</a>
                <a href="#calculator" className="text-gray-700 hover:text-cyan-500 px-3 py-2 text-sm font-medium">Cost Calculator</a>
                <a href="#testimonials" className="text-gray-700 hover:text-cyan-500 px-3 py-2 text-sm font-medium">Reviews</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-white">
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
              <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={onShowAuth}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Save 70% on World-Class 
                <span className="text-yellow-300"> Dental Care</span>
              </h1>
              <p className="text-xl mb-8 text-cyan-100">
                Experience premium dental treatments in beautiful Costa Rica. 
                Internationally certified dentists, modern facilities, and significant savings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" className="bg-gray-800 hover:bg-gray-900 text-white font-semibold" onClick={onShowAuth}>
                  <Calendar className="w-5 h-5 mr-2" />
                  Free Consultation
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-cyan-600">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Calculate Savings
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                  <span>No Hidden Fees</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                  <span>All-Inclusive Packages</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                  <span>Travel Assistance</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 text-gray-900 shadow-xl">
              <h3 className="text-2xl font-bold text-center mb-6">Instant Savings Calculator</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Procedure:</label>
                  <Select value={selectedProcedure} onValueChange={setSelectedProcedure}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dental-implants">Dental Implants</SelectItem>
                      <SelectItem value="porcelain-veneers">Porcelain Veneers</SelectItem>
                      <SelectItem value="dental-crowns">Dental Crowns</SelectItem>
                      <SelectItem value="dental-bridges">Dental Bridges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span>US Price:</span>
                    <span className="font-semibold text-red-600">${currentProcedure.us.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Costa Rica Price:</span>
                    <span className="font-semibold text-green-600">${currentProcedure.cr.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Your Savings:</span>
                      <span className="text-green-600">
                        ${currentProcedure.savings.toLocaleString()}
                        <span className="text-sm ml-1">({currentProcedure.percent}% savings)</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" onClick={onShowAuth}>
                  Get Detailed Quote
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Costa Rica Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Costa Rica for Dental Care?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Combine world-class dental treatment with a tropical vacation. Our partner 
              clinics offer the same quality as top US facilities at a fraction of the cost.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {clinicFeatures.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-cyan-500" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Patients Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied patients who chose Costa Rica for their dental care.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                location: "Florida, USA",
                procedure: "Full Mouth Reconstruction",
                rating: 5,
                comment: "I saved over $25,000 and got better care than I could have imagined. The dentists were world-class and the experience was like a vacation!"
              },
              {
                name: "Robert Chen",
                location: "California, USA", 
                procedure: "Dental Implants",
                rating: 5,
                comment: "The quality of care exceeded my expectations. Modern facilities, English-speaking staff, and incredible savings. I'm planning to return for my wife's treatment."
              },
              {
                name: "Maria Rodriguez",
                location: "Texas, USA",
                procedure: "Smile Makeover", 
                rating: 5,
                comment: "From consultation to follow-up, everything was seamless. The virtual consultations made planning easy, and the results speak for themselves."
              }
            ].map((testimonial, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <CardDescription>{testimonial.location}</CardDescription>
                    </div>
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <Badge variant="outline">{testimonial.procedure}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 italic">"{testimonial.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Smile?
          </h2>
          <p className="text-xl mb-8 text-cyan-100">
            Schedule your free virtual consultation today and discover how much you can save 
            on world-class dental care in beautiful Costa Rica.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gray-800 hover:bg-gray-900 text-white font-semibold" onClick={onShowAuth}>
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Free Consultation
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-cyan-600">
              <Plane className="w-5 h-5 mr-2" />
              View Travel Packages
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center">
              <span>info@costaricadental.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

