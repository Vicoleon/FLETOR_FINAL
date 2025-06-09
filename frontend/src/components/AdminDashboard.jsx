import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '../contexts/AuthContext'
import { 
  Users, Shield, Package, Calendar, DollarSign, TrendingUp, 
  AlertCircle, CheckCircle, XCircle, Search, Filter, Settings,
  LogOut, BarChart3, PieChart, Activity, Clock, Star,
  Eye, Ban, UserCheck, Trash2, Edit, RefreshCw
} from 'lucide-react'

export default function AdminDashboard({ onShowProfile }) {
  const { user, token, API_BASE_URL, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  
  // User Management
  const [users, setUsers] = useState([])
  const [usersPage, setUsersPage] = useState(1)
  const [userFilter, setUserFilter] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [userSearch, setUserSearch] = useState('')
  
  // Booking Management
  const [bookings, setBookings] = useState([])
  const [bookingsPage, setBookingsPage] = useState(1)
  const [bookingStatusFilter, setBookingStatusFilter] = useState('')
  
  // Package Management
  const [packages, setPackages] = useState([])
  const [packagesPage, setPackagesPage] = useState(1)
  
  // Analytics
  const [revenueData, setRevenueData] = useState({})

  useEffect(() => {
    fetchDashboardStats()
    fetchUsers()
    fetchBookings()
    fetchPackages()
    fetchRevenueAnalytics()
    setLoading(false)
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchUsers = async (page = 1, search = '', userType = 'all') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        ...(search && { search }),
        ...(userType && userType !== 'all' && { user_type: userType })
      })
      
      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchBookings = async (page = 1, status = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        ...(status && { status })
      })
      
      const response = await fetch(`${API_BASE_URL}/admin/bookings?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const fetchPackages = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10'
      })
      
      const response = await fetch(`${API_BASE_URL}/admin/packages?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPackages(data)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
  }

  const fetchRevenueAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/revenue`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setRevenueData(data)
      }
    } catch (error) {
      console.error('Error fetching revenue analytics:', error)
    }
  }

  const toggleUserStatus = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        fetchUsers(usersPage, userSearch, userTypeFilter)
        fetchDashboardStats()
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  const togglePackageStatus = async (packageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/packages/${packageId}/toggle-status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        fetchPackages(packagesPage)
        fetchDashboardStats()
      }
    } catch (error) {
      console.error('Error toggling package status:', error)
    }
  }

  const verifyDentist = async (dentistId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dentists/${dentistId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        fetchUsers(usersPage, userSearch, userTypeFilter)
        alert('Dentist verified successfully!')
      }
    } catch (error) {
      console.error('Error verifying dentist:', error)
    }
  }

  const performSystemCleanup = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/system/cleanup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        alert(`System cleanup completed! Cleaned ${data.cleaned_notifications} notifications and ${data.cleaned_sessions} sessions.`)
      }
    } catch (error) {
      console.error('Error performing cleanup:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      declined: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getUserTypeColor = (userType) => {
    const colors = {
      patient: 'bg-blue-100 text-blue-800',
      dentist: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800'
    }
    return colors[userType] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, Admin</span>
              <Button variant="outline" onClick={onShowProfile} className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
              <Button variant="outline" onClick={logout} className="flex items-center space-x-2">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.users?.total || 0}</p>
                  <p className="text-xs text-gray-500">+{stats.users?.new_this_month || 0} this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.bookings?.total || 0}</p>
                  <p className="text-xs text-gray-500">{stats.bookings?.pending || 0} pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.revenue?.total?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">${stats.revenue?.monthly?.toLocaleString() || 0} this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Packages</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.packages?.active || 0}</p>
                  <p className="text-xs text-gray-500">of {stats.packages?.total || 0} total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.reviews?.average_rating?.toFixed(1) || 0}</p>
                  <p className="text-xs text-gray-500">{stats.reviews?.total || 0} reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Packages
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage patients, dentists, and admin users</CardDescription>
                  </div>
                  <Button onClick={() => fetchUsers(1, userSearch, userTypeFilter)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                {/* Filters */}
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && fetchUsers(1, userSearch, userTypeFilter)}
                    />
                  </div>
                  <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="patient">Patients</SelectItem>
                      <SelectItem value="dentist">Dentists</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => fetchUsers(1, userSearch, userTypeFilter)}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.users?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{user.profile?.first_name} {user.profile?.last_name}</p>
                            <Badge className={getUserTypeColor(user.user_type)}>
                              {user.user_type}
                            </Badge>
                            {user.user_type === 'dentist' && user.profile?.is_verified && (
                              <Badge className="bg-green-100 text-green-800">Verified</Badge>
                            )}
                            {!user.is_active && (
                              <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.user_type === 'dentist' && user.profile && !user.profile.is_verified && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => verifyDentist(user.profile.id)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant={user.is_active ? "destructive" : "default"}
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.is_active ? (
                            <>
                              <Ban className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-gray-500">
                    Showing {users.users?.length || 0} of {users.total || 0} users
                  </p>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!users.has_prev}
                      onClick={() => {
                        const newPage = usersPage - 1
                        setUsersPage(newPage)
                        fetchUsers(newPage, userSearch, userTypeFilter)
                      }}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!users.has_next}
                      onClick={() => {
                        const newPage = usersPage + 1
                        setUsersPage(newPage)
                        fetchUsers(newPage, userSearch, userTypeFilter)
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Management */}
          <TabsContent value="system" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Management</CardTitle>
                  <CardDescription>System maintenance and administration tools</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Database Cleanup</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Clean up old notifications and expired sessions to improve performance.
                      </p>
                      <Button onClick={performSystemCleanup}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Run Cleanup
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">System Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{stats.users?.total || 0}</p>
                          <p className="text-sm text-gray-500">Total Users</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{stats.bookings?.total || 0}</p>
                          <p className="text-sm text-gray-500">Total Bookings</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{stats.packages?.total || 0}</p>
                          <p className="text-sm text-gray-500">Total Packages</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">{stats.reviews?.total || 0}</p>
                          <p className="text-sm text-gray-500">Total Reviews</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 