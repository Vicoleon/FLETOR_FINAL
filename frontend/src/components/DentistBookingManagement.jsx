import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, User, Phone, Mail, CheckCircle, XCircle, AlertCircle, DollarSign, Star, RefreshCw, Bell, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const DentistBookingManagement = () => {
  const { user } = useAuth()
  const [pendingRequests, setPendingRequests] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false)
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false)
  const [isBookingDetailModalOpen, setIsBookingDetailModalOpen] = useState(false)
  const [confirmedDate, setConfirmedDate] = useState('')
  const [declineReason, setDeclineReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (user && user.user_type === 'dentist') {
      fetchPendingRequests()
      fetchAllBookings()
    }
  }, [user])

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (user && user.user_type === 'dentist') {
        fetchPendingRequests()
        fetchAllBookings()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user, autoRefresh])

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/bookings/pending-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPendingRequests(data.pending_requests || [])
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    }
  }

  const fetchAllBookings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/bookings/my-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAllBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const handleAcceptBooking = async (e) => {
    e.preventDefault()
    if (!selectedRequest || !confirmedDate) return

    setLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/bookings/${selectedRequest.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          confirmed_date: confirmedDate
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('✅ Booking accepted successfully! Patient has been notified.')
        setIsAcceptModalOpen(false)
        setConfirmedDate('')
        setSelectedRequest(null)
        fetchPendingRequests()
        fetchAllBookings()
      } else {
        setMessage(data.error || 'Failed to accept booking')
      }
    } catch (error) {
      setMessage('Error accepting booking')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeclineBooking = async (e) => {
    e.preventDefault()
    if (!selectedRequest) return

    setLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/bookings/${selectedRequest.id}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: declineReason || 'No reason provided'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('📝 Booking declined. Patient has been notified.')
        setIsDeclineModalOpen(false)
        setDeclineReason('')
        setSelectedRequest(null)
        fetchPendingRequests()
        fetchAllBookings()
      } else {
        setMessage(data.error || 'Failed to decline booking')
      }
    } catch (error) {
      setMessage('Error declining booking')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBookingStatus = async (bookingId, newStatus, additionalData = {}) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          ...additionalData
        })
      })

      if (response.ok) {
        setMessage(`✅ Booking status updated to ${newStatus.replace('_', ' ')}`)
        fetchAllBookings()
        setIsBookingDetailModalOpen(false)
      } else {
        const data = await response.json()
        setMessage(data.error || 'Failed to update booking status')
      }
    } catch (error) {
      setMessage('Error updating booking status')
      console.error('Error:', error)
    }
  }

  const openAcceptModal = (request) => {
    setSelectedRequest(request)
    setIsAcceptModalOpen(true)
    setMessage('')
    // Set default date to preferred date or tomorrow
    const defaultDate = request.preferred_date || getMinDate()
    setConfirmedDate(defaultDate)
  }

  const openDeclineModal = (request) => {
    setSelectedRequest(request)
    setIsDeclineModalOpen(true)
    setMessage('')
    setDeclineReason('')
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

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const formatTimeAgo = (timeSince) => {
    if (timeSince.days > 0) {
      return `${timeSince.days} day${timeSince.days > 1 ? 's' : ''} ago`
    } else if (timeSince.hours > 0) {
      return `${timeSince.hours} hour${timeSince.hours > 1 ? 's' : ''} ago`
    } else {
      return `${timeSince.minutes} minute${timeSince.minutes > 1 ? 's' : ''} ago`
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

  const canUpdateStatus = (booking) => {
    return ['confirmed', 'in_progress'].includes(booking.status)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-gray-600">Manage patient booking requests and appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              fetchPendingRequests()
              fetchAllBookings()
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {pendingRequests.length} Pending
          </Badge>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('✅') || message.includes('📝') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            All Bookings ({allBookings.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab - Uber-like Request Queue */}
        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <Clock className="h-full w-full" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No pending requests</h3>
              <p className="mt-2 text-gray-500">New booking requests will appear here automatically.</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Bell className="h-4 w-4" />
                <span>Real-time notifications enabled</span>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-yellow-400 hover:shadow-md transition-shadow bg-yellow-50/30">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{request.package?.name}</CardTitle>
                          <Badge className="bg-yellow-100 text-yellow-800 animate-pulse">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(request.time_since_request)}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {request.patient?.first_name} {request.patient?.last_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Preferred: {formatDate(request.preferred_date)}
                          </span>
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-cyan-50 text-cyan-800">
                        <DollarSign className="h-3 w-3 mr-1" />
                        ${request.package?.price_usd}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Patient Info */}
                    <div className="bg-white p-3 rounded-lg border">
                      <h4 className="font-medium text-sm mb-2">Patient Information</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{request.patient?.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{request.patient?.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{request.patient?.country || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-gray-400" />
                          <span>New Patient</span>
                        </div>
                      </div>
                    </div>

                    {/* Special Requests */}
                    {request.special_requests && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-sm mb-1 text-blue-800">Special Requests</h4>
                        <p className="text-sm text-blue-700">{request.special_requests}</p>
                      </div>
                    )}

                    {/* Package Details */}
                    <div className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                      <span>Duration: {request.package?.duration_days} days</span>
                      <span>Treatment: {request.package?.category || 'Dental'}</span>
                    </div>

                    {/* Action Buttons - Uber-like */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => openDeclineModal(request)}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                      <Button
                        onClick={() => openAcceptModal(request)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* All Bookings Tab */}
        <TabsContent value="all" className="space-y-4">
          {allBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <Calendar className="h-full w-full" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No bookings yet</h3>
              <p className="mt-2 text-gray-500">Accepted bookings will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {allBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openBookingDetail(booking)}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{booking.package?.name}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {booking.patient?.first_name} {booking.patient?.last_name}
                          </span>
                          {booking.confirmed_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(booking.confirmed_date)}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(booking.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(booking.status)}
                            {getStatusText(booking.status)}
                          </div>
                        </Badge>
                        <Badge variant="outline" className="bg-cyan-50 text-cyan-800">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${booking.package?.price_usd}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Created: {formatDate(booking.created_at)}</span>
                      <span>Duration: {booking.package?.duration_days} days</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
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

      {/* Accept Booking Modal */}
      <Dialog open={isAcceptModalOpen} onOpenChange={setIsAcceptModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Accept Booking Request
            </DialogTitle>
            <DialogDescription>
              Confirm the appointment date for {selectedRequest?.patient?.first_name} {selectedRequest?.patient?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <form onSubmit={handleAcceptBooking} className="space-y-4">
              {/* Request Summary */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800">{selectedRequest.package?.name}</h4>
                <p className="text-sm text-green-700">{selectedRequest.package?.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-green-700">Duration: {selectedRequest.package?.duration_days} days</span>
                  <span className="font-bold text-green-800">${selectedRequest.package?.price_usd}</span>
                </div>
              </div>

              {/* Patient preferred date */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-blue-800">Patient's preferred date:</span>
                <p className="text-blue-700">{formatDate(selectedRequest.preferred_date)}</p>
              </div>

              {/* Confirmed Date */}
              <div className="space-y-2">
                <Label htmlFor="confirmed_date">Confirm Appointment Date</Label>
                <Input
                  id="confirmed_date"
                  type="date"
                  min={getMinDate()}
                  value={confirmedDate}
                  onChange={(e) => setConfirmedDate(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">Choose the final appointment date</p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAcceptModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? 'Accepting...' : 'Accept Booking'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Decline Booking Modal */}
      <Dialog open={isDeclineModalOpen} onOpenChange={setIsDeclineModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Decline Booking Request
            </DialogTitle>
            <DialogDescription>
              Provide a reason for declining {selectedRequest?.patient?.first_name} {selectedRequest?.patient?.last_name}'s request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <form onSubmit={handleDeclineBooking} className="space-y-4">
              {/* Request Summary */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800">{selectedRequest.package?.name}</h4>
                <p className="text-sm text-red-700">Patient: {selectedRequest.patient?.first_name} {selectedRequest.patient?.last_name}</p>
                <p className="text-sm text-red-700">Preferred date: {formatDate(selectedRequest.preferred_date)}</p>
              </div>

              {/* Decline Reason */}
              <div className="space-y-2">
                <Label htmlFor="decline_reason">Reason for Declining (Optional)</Label>
                <Textarea
                  id="decline_reason"
                  placeholder="e.g., Schedule conflict, not suitable for treatment, etc."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500">This will be shared with the patient</p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeclineModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  {loading ? 'Declining...' : 'Decline Booking'}
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
                  <span className="text-sm">{selectedBooking.patient?.first_name} {selectedBooking.patient?.last_name}</span>
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

              {/* Status Update Actions */}
              {canUpdateStatus(selectedBooking) && (
                <div className="border-t pt-4">
                  <span className="text-sm font-medium">Update Status:</span>
                  <div className="flex gap-2 mt-2">
                    {selectedBooking.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'in_progress', {
                          actual_start_date: new Date().toISOString().split('T')[0]
                        })}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Start Treatment
                      </Button>
                    )}
                    {selectedBooking.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateBookingStatus(selectedBooking.id, 'completed', {
                          actual_end_date: new Date().toISOString().split('T')[0]
                        })}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Complete Treatment
                      </Button>
                    )}
                  </div>
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DentistBookingManagement

