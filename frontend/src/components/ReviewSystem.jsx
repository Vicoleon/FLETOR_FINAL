import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Clock, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { API_ENDPOINTS } from '../config/api'

const ReviewSystem = ({ dentistId, bookingId, showCreateReview = false }) => {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState(null)
  const [pendingReviews, setPendingReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Create review state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  })
  
  // Response state
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)
  const [responseText, setResponseText] = useState('')
  
  const token = localStorage.getItem('token')
  const isAdmin = user?.user_type === 'admin'
  const isDentist = user?.user_type === 'dentist'

  useEffect(() => {
    if (dentistId) {
      fetchReviews()
      fetchReviewStats()
    }
    if (isAdmin) {
      fetchPendingReviews()
    }
  }, [dentistId, user])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_ENDPOINTS.REVIEWS.DENTIST}/${dentistId}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviewStats = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.REVIEWS.STATS}/${dentistId}`)
      if (response.ok) {
        const data = await response.json()
        setReviewStats(data)
      }
    } catch (error) {
      console.error('Error fetching review stats:', error)
    }
  }

  const fetchPendingReviews = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.REVIEWS.PENDING, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPendingReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching pending reviews:', error)
    }
  }

  const handleCreateReview = async () => {
    if (!newReview.comment.trim()) {
      setMessage('Please write a comment')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(API_ENDPOINTS.REVIEWS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_id: bookingId,
          rating: newReview.rating,
          comment: newReview.comment
        })
      })

      if (response.ok) {
        setMessage('Review submitted successfully! It will be visible after moderation.')
        setShowCreateModal(false)
        setNewReview({ rating: 5, comment: '' })
        // Don't refresh reviews immediately since it needs moderation
      } else {
        const error = await response.json()
        setMessage(error.error || 'Failed to submit review')
      }
    } catch (error) {
      setMessage('Error submitting review')
    } finally {
      setLoading(false)
    }
  }

  const handleModerateReview = async (reviewId, action, adminNotes = '') => {
    try {
      setLoading(true)
      const response = await fetch(`${API_ENDPOINTS.REVIEWS.MODERATE}/${reviewId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          admin_notes: adminNotes
        })
      })

      if (response.ok) {
        setMessage(`Review ${action}d successfully`)
        fetchPendingReviews()
        if (action === 'approve') {
          fetchReviews()
          fetchReviewStats()
        }
      } else {
        const error = await response.json()
        setMessage(error.error || `Failed to ${action} review`)
      }
    } catch (error) {
      setMessage(`Error ${action}ing review`)
    } finally {
      setLoading(false)
    }
  }

  const handleRespondToReview = async () => {
    if (!responseText.trim()) {
      setMessage('Please write a response')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_ENDPOINTS.REVIEWS.RESPOND}/${selectedReview.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          response: responseText
        })
      })

      if (response.ok) {
        setMessage('Response added successfully')
        setShowResponseModal(false)
        setResponseText('')
        setSelectedReview(null)
        fetchReviews()
      } else {
        const error = await response.json()
        setMessage(error.error || 'Failed to add response')
      }
    } catch (error) {
      setMessage('Error adding response')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    )
  }

  const renderReviewStats = () => {
    if (!reviewStats) return null

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Review Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600">
                {reviewStats.average_rating}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(reviewStats.average_rating))}
              </div>
              <div className="text-sm text-gray-600">
                {reviewStats.total_reviews} reviews
              </div>
            </div>
            
            <div className="col-span-2">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-8">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${reviewStats.total_reviews > 0 
                            ? (reviewStats.rating_distribution[rating] / reviewStats.total_reviews) * 100 
                            : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">
                      {reviewStats.rating_distribution[rating]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderReview = (review) => (
    <Card key={review.id} className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{review.patient_name || 'Anonymous'}</span>
              </div>
              {renderStars(review.rating)}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(review.created_at).toLocaleDateString()}
            </div>
          </div>
          
          {isDentist && !review.dentist_response && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedReview(review)
                setShowResponseModal(true)
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Respond
            </Button>
          )}
        </div>
        
        <p className="text-gray-700 mb-4">{review.comment}</p>
        
        {review.dentist_response && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Dentist Response</Badge>
              <span className="text-sm text-gray-500">
                {new Date(review.response_date).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700">{review.dentist_response}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderPendingReview = (review) => (
    <Card key={review.id} className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {renderStars(review.rating)}
              <Badge variant="outline" className="text-orange-600">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              <strong>Patient:</strong> {review.patient?.name}<br />
              <strong>Dentist:</strong> {review.dentist?.name}<br />
              <strong>Clinic:</strong> {review.dentist?.clinic}<br />
              <strong>Date:</strong> {new Date(review.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <p className="text-gray-700 mb-4">{review.comment}</p>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleModerateReview(review.id, 'approve')}
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleModerateReview(review.id, 'reject')}
            disabled={loading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Pending Reviews ({pendingReviews.length})
            </CardTitle>
            <CardDescription>
              Reviews waiting for moderation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingReviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No pending reviews
              </p>
            ) : (
              pendingReviews.map(renderPendingReview)
            )}
          </CardContent>
        </Card>
        
        {message && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
            {message}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Review Button */}
      {showCreateReview && user?.user_type === 'patient' && (
        <Card>
          <CardContent className="pt-6">
            <Button onClick={() => setShowCreateModal(true)} className="w-full">
              Write a Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review Stats */}
      {renderReviewStats()}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No reviews yet
            </p>
          ) : (
            reviews.map(renderReview)
          )}
        </CardContent>
      </Card>

      {/* Create Review Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience with other patients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              {renderStars(newReview.rating, true, (rating) => 
                setNewReview(prev => ({ ...prev, rating }))
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Comment</label>
              <Textarea
                placeholder="Tell us about your experience..."
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ 
                  ...prev, 
                  comment: e.target.value 
                }))}
                rows={4}
              />
            </div>
            {message && (
              <div className="text-sm text-red-600">{message}</div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleCreateReview} disabled={loading} className="flex-1">
                {loading ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Response Modal */}
      <Dialog open={showResponseModal} onOpenChange={setShowResponseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Your response will be visible to all patients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReview && (
              <div className="bg-gray-50 p-4 rounded">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating)}
                </div>
                <p className="text-gray-700">{selectedReview.comment}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Your Response</label>
              <Textarea
                placeholder="Thank you for your feedback..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
              />
            </div>
            {message && (
              <div className="text-sm text-red-600">{message}</div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleRespondToReview} disabled={loading} className="flex-1">
                {loading ? 'Submitting...' : 'Submit Response'}
              </Button>
              <Button variant="outline" onClick={() => setShowResponseModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {message && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
          {message}
        </div>
      )}
    </div>
  )
}

export default ReviewSystem

