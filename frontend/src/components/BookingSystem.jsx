import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, Star, DollarSign, User, Phone, Mail, CheckCircle, XCircle, AlertCircle, Bell, RefreshCw, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const BookingSystem = () => {
  const { user } = useAuth()
  const [packages, setPackages] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [bookingData, setBookingData] = useState({
    preferred_date: '',
    special_requests: ''
  })
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [isBookingDetailModalOpen, setIsBookingDetailModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('browse')

  useEffect(() => {
    fetchPackages()
    if (user) {
      fetchMyBookings()
    }
  }, [user])

  const fetchPackages = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/packages/')
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages || [])
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
  }

  const fetchMyBookings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/bookings/my-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMyBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPackage) return

    setLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          package_id: selectedPackage.id,
          preferred_date: bookingData.preferred_date,
          special_requests: bookingData.special_requests
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Booking request sent successfully! The dentist will be notified.')
        setIsBookingModalOpen(false)
        setBookingData({ preferred_date: '', special_requests: '' })
        setSelectedPackage(null)
        fetchMyBookings() // Refresh bookings
        setActiveTab('my-bookings') // Switch to bookings tab
      } else {
        setMessage(data.error || 'Failed to create booking request')
      }
    } catch (error) {
      setMessage('Error creating booking request')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancellation_reason: 'Cancelled by patient'
        })
      })

      if (response.ok) {
        setMessage('Booking cancelled successfully')
        fetchMyBookings()
        setIsBookingDetailModalOpen(false)
      } else {
        const data = await response.json()
        setMessage(data.error || 'Failed to cancel booking')
      }
    } catch (error) {
      setMessage('Error cancelling booking')
      console.error('Error:', error)
    }
  }

  const openBookingModal = (pkg) => {
    setSelectedPackage(pkg)
    setIsBookingModalOpen(true)
    setMessage('')
  }

  const openBookingDetail = (booking) => {
    setSelectedBooking(booking)
    setIsBookingDetailModalOpen(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'declined': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'declined': return <XCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      case 'in_progress': return <RefreshCw className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review'
      case 'confirmed': return 'Confirmed'
      case 'declined': return 'Declined'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const canCancelBooking = (booking) => {
    return booking.status === 'pending' || booking.status === 'confirmed'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dental Booking System</h2>
          <p className="text-gray-600">Browse packages and manage your dental appointments</p>
        </div>
        {user && user.user_type === 'patient' && (
          <Button
            onClick={fetchMyBookings}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Tabs for Patient View */}
      {user && user.user_type === 'patient' ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Packages</TabsTrigger>
            <TabsTrigger value="my-bookings" className="flex items-center gap-2">
              My Bookings
              {myBookings.filter(b => b.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {myBookings.filter(b => b.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Browse Packages Tab */}
          <TabsContent value="browse" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <User className="h-4 w-4" />
                          Dr. {pkg.dentist?.first_name} {pkg.dentist?.last_name}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
                        {pkg.category || 'Dental'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{pkg.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{pkg.duration_days} days treatment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>San José, Costa Rica</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span>4.8/5 rating</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-lg font-bold text-cyan-600">${pkg.price_usd}</p>
                          <p className="text-xs text-green-600">Save 70%+ vs US prices</p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => openBookingModal(pkg)}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                    >
                      Request Booking
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* My Bookings Tab */}
          <TabsContent value="my-bookings" className="space-y-6">
            {myBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-24 w-24 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No bookings yet</h3>
                <p className="mt-2 text-gray-500">Start by browsing available packages.</p>
                <Button 
                  onClick={() => setActiveTab('browse')}
                  className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  Browse Packages
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openBookingDetail(booking)}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{booking.package?.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <User className="h-4 w-4" />
                            Dr. {booking.dentist?.first_name} {booking.dentist?.last_name}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(booking.status)}
                            {getStatusText(booking.status)}
                          </div>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {booking.status === 'confirmed' && booking.confirmed_date 
                              ? `Confirmed: ${formatDate(booking.confirmed_date)}`
                              : `Preferred: ${formatDate(booking.preferred_date)}`
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span>${booking.total_amount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>Requested {formatDate(booking.created_at)}</span>
                        </div>
                      </div>

                      {booking.special_requests && (
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <strong>Special Requests:</strong> {booking.special_requests}
                        </div>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          openBookingDetail(booking)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        // Non-patient view (browse only)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <User className="h-4 w-4" />
                      Dr. {pkg.dentist?.first_name} {pkg.dentist?.last_name}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
                    {pkg.category || 'Dental'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{pkg.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{pkg.duration_days} days treatment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>San José, Costa Rica</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>4.8/5 rating</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-bold text-cyan-600">${pkg.price_usd}</p>
                      <p className="text-xs text-green-600">Save 70%+ vs US prices</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => openBookingModal(pkg)}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                  disabled={!user || user.user_type !== 'patient'}
                >
                  {!user ? 'Login to Book' : user.user_type !== 'patient' ? 'Patient Only' : 'Request Booking'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Request Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Booking</DialogTitle>
            <DialogDescription>
              Send a booking request to Dr. {selectedPackage?.dentist?.first_name} {selectedPackage?.dentist?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPackage && (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{selectedPackage.name}</h4>
                <p className="text-sm text-gray-600">{selectedPackage.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm">Duration: {selectedPackage.duration_days} days</span>
                  <span className="font-bold text-cyan-600">${selectedPackage.price_usd}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_date">Preferred Date</Label>
                <Input
                  id="preferred_date"
                  type="date"
                  min={getMinDate()}
                  value={bookingData.preferred_date}
                  onChange={(e) => setBookingData({...bookingData, preferred_date: e.target.value})}
                  required
                />
                <p className="text-xs text-gray-500">The dentist will confirm the final date</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_requests">Special Requests (Optional)</Label>
                <Textarea
                  id="special_requests"
                  placeholder="Any special requirements, medical conditions, or preferences..."
                  value={bookingData.special_requests}
                  onChange={(e) => setBookingData({...bookingData, special_requests: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="bg-cyan-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-cyan-800">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm font-medium">How it works:</span>
                </div>
                <ul className="text-xs text-cyan-700 mt-1 space-y-1">
                  <li>• Your request will be sent to the dentist immediately</li>
                  <li>• The dentist will review and respond within 24 hours</li>
                  <li>• You'll receive a notification when they accept or decline</li>
                  <li>• No payment required until booking is confirmed</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  {loading ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Detail Modal */}
      <Dialog open={isBookingDetailModalOpen} onOpenChange={setIsBookingDetailModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Booking #{selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge className={getStatusColor(selectedBooking.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(selectedBooking.status)}
                    {getStatusText(selectedBooking.status)}
                  </div>
                </Badge>
              </div>

              {/* Package Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{selectedBooking.package?.name}</h4>
                <p className="text-sm text-gray-600">{selectedBooking.package?.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm">Dr. {selectedBooking.dentist?.first_name} {selectedBooking.dentist?.last_name}</span>
                  <span className="font-bold text-cyan-600">${selectedBooking.total_amount}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Preferred Date:</span>
                  <span className="text-sm">{formatDate(selectedBooking.preferred_date)}</span>
                </div>
                {selectedBooking.confirmed_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Confirmed Date:</span>
                    <span className="text-sm font-medium text-green-600">{formatDate(selectedBooking.confirmed_date)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Requested:</span>
                  <span className="text-sm">{formatDate(selectedBooking.created_at)}</span>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div>
                  <span className="text-sm font-medium">Special Requests:</span>
                  <p className="text-sm text-gray-600 mt-1">{selectedBooking.special_requests}</p>
                </div>
              )}

              {/* Decline/Cancellation Reason */}
              {selectedBooking.declined_reason && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <span className="text-sm font-medium text-red-800">Decline Reason:</span>
                  <p className="text-sm text-red-700 mt-1">{selectedBooking.declined_reason}</p>
                </div>
              )}

              {selectedBooking.cancellation_reason && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm font-medium text-gray-800">Cancellation Reason:</span>
                  <p className="text-sm text-gray-700 mt-1">{selectedBooking.cancellation_reason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsBookingDetailModalOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                {canCancelBooking(selectedBooking) && (
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    className="flex-1"
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State for Packages */}
      {packages.length === 0 && activeTab === 'browse' && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-24 w-24 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No packages available</h3>
          <p className="mt-2 text-gray-500">Check back later for new dental packages.</p>
        </div>
      )}
    </div>
  )
}

export default BookingSystem

