import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, BellRing, Check, X, Eye, Trash2, RefreshCw, Calendar, User, MessageSquare, Star, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const NotificationCenter = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [user])

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      fetchNotifications()
      fetchUnreadCount()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const unreadOnly = filter === 'unread' ? '?unread_only=true' : ''
      const response = await fetch(`http://localhost:5000/api/notifications/${unreadOnly}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unread_count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        fetchNotifications()
        fetchUnreadCount()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        setMessage('All notifications marked as read')
        fetchNotifications()
        fetchUnreadCount()
      }
    } catch (error) {
      setMessage('Error marking notifications as read')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        setMessage('Notification deleted')
        fetchNotifications()
        fetchUnreadCount()
        setIsDetailModalOpen(false)
      }
    } catch (error) {
      setMessage('Error deleting notification')
      console.error('Error:', error)
    }
  }

  const clearAllNotifications = async () => {
    if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/notifications/clear-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        setMessage('All notifications cleared')
        fetchNotifications()
        fetchUnreadCount()
      }
    } catch (error) {
      setMessage('Error clearing notifications')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const openNotificationDetail = (notification) => {
    setSelectedNotification(notification)
    setIsDetailModalOpen(true)
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_request':
        return <Calendar className="h-5 w-5 text-blue-500" />
      case 'booking_confirmed':
        return <Check className="h-5 w-5 text-green-500" />
      case 'booking_declined':
        return <X className="h-5 w-5 text-red-500" />
      case 'booking_cancelled':
        return <X className="h-5 w-5 text-gray-500" />
      case 'booking_updated':
        return <RefreshCw className="h-5 w-5 text-blue-500" />
      case 'message_received':
        return <MessageSquare className="h-5 w-5 text-purple-500" />
      case 'review_received':
        return <Star className="h-5 w-5 text-yellow-500" />
      case 'system':
        return <AlertCircle className="h-5 w-5 text-gray-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking_request':
        return 'border-l-blue-400 bg-blue-50/30'
      case 'booking_confirmed':
        return 'border-l-green-400 bg-green-50/30'
      case 'booking_declined':
        return 'border-l-red-400 bg-red-50/30'
      case 'booking_cancelled':
        return 'border-l-gray-400 bg-gray-50/30'
      case 'booking_updated':
        return 'border-l-blue-400 bg-blue-50/30'
      case 'message_received':
        return 'border-l-purple-400 bg-purple-50/30'
      case 'review_received':
        return 'border-l-yellow-400 bg-yellow-50/30'
      case 'system':
        return 'border-l-gray-400 bg-gray-50/30'
      default:
        return 'border-l-gray-400 bg-gray-50/30'
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read
    if (filter === 'read') return notification.is_read
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-cyan-600" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
            <p className="text-gray-600">Stay updated with your booking activities</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              fetchNotifications()
              fetchUnreadCount()
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              disabled={loading}
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <div className="flex justify-between items-center">
          <TabsList className="grid w-auto grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read" className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Read ({notifications.length - unreadCount})
            </TabsTrigger>
          </TabsList>
          
          {notifications.length > 0 && (
            <Button
              onClick={clearAllNotifications}
              disabled={loading}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <Bell className="h-full w-full" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {filter === 'unread' ? 'No unread notifications' : 
                 filter === 'read' ? 'No read notifications' : 'No notifications'}
              </h3>
              <p className="mt-2 text-gray-500">
                {filter === 'unread' ? 'All caught up! New notifications will appear here.' :
                 filter === 'read' ? 'Read notifications will appear here.' :
                 'Booking updates and messages will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${getNotificationColor(notification.type)} ${
                    !notification.is_read ? 'ring-2 ring-cyan-100' : ''
                  }`}
                  onClick={() => openNotificationDetail(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Notification Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h4>
                            <p className={`text-sm mt-1 ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          
                          {/* Unread Indicator */}
                          {!notification.is_read && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="h-2 w-2 bg-cyan-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openNotificationDetail(notification)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Notification Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && getNotificationIcon(selectedNotification.type)}
              Notification Details
            </DialogTitle>
            <DialogDescription>
              {selectedNotification && formatTimeAgo(selectedNotification.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-4">
              {/* Notification Content */}
              <div className={`p-4 rounded-lg border-l-4 ${getNotificationColor(selectedNotification.type)}`}>
                <h4 className="font-medium text-gray-900">{selectedNotification.title}</h4>
                <p className="text-sm text-gray-700 mt-2">{selectedNotification.message}</p>
              </div>

              {/* Notification Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <Badge variant="outline" className="capitalize">
                    {selectedNotification.type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={selectedNotification.is_read ? 'bg-gray-100 text-gray-800' : 'bg-cyan-100 text-cyan-800'}>
                    {selectedNotification.is_read ? 'Read' : 'Unread'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Received:</span>
                  <span>{new Date(selectedNotification.created_at).toLocaleString()}</span>
                </div>
                {selectedNotification.related_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Related ID:</span>
                    <span>#{selectedNotification.related_id}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteNotification(selectedNotification.id)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default NotificationCenter

