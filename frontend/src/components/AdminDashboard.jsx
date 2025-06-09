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
  Eye, Ban, UserCheck, Trash2, Edit, RefreshCw,
  Target, AlertTriangle, Award, MapPin
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
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')
  
  // Package Management
  const [packages, setPackages] = useState([])
  const [packagesPage, setPackagesPage] = useState(1)
  
  // Analytics
  const [revenueData, setRevenueData] = useState({})

  useEffect(() => {
    fetchDashboardStats()
    fetchUsers()
    fetchBookings(1, 'all')
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

  const fetchBookings = async (page = 1, status = 'all') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        ...(status && status !== 'all' && { status })
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

          {/* Packages Management */}
          <TabsContent value="packages" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Package Management</CardTitle>
                    <CardDescription>Manage all dental packages and their availability</CardDescription>
                  </div>
                  <Button onClick={() => fetchPackages(1)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packages.packages?.map((pkg) => (
                    <div key={pkg.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg">{pkg.name}</h3>
                            <Badge className={pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {pkg.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="bg-cyan-50 text-cyan-800">
                              ${pkg.price_usd}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3 line-clamp-2">{pkg.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">Dentist:</span>
                              <p>Dr. {pkg.dentist?.first_name} {pkg.dentist?.last_name}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Clinic:</span>
                              <p>{pkg.dentist?.clinic_name || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Duration:</span>
                              <p>{pkg.duration_days} days</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Max Patients:</span>
                              <p>{pkg.max_patients}</p>
                            </div>
                          </div>
                          
                          {pkg.procedures_included && (
                            <div className="mt-3">
                              <span className="font-medium text-gray-500">Procedures:</span>
                              <p className="text-sm text-gray-700">{pkg.procedures_included}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Package className="h-4 w-4" />
                              <span>ID: {pkg.id}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Created: {new Date(pkg.created_at).toLocaleDateString()}</span>
                            </div>
                            {pkg.includes_accommodation && (
                              <Badge variant="outline" className="text-xs">
                                <span>🏨 Accommodation</span>
                              </Badge>
                            )}
                            {pkg.includes_transportation && (
                              <Badge variant="outline" className="text-xs">
                                <span>🚗 Transportation</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button 
                            size="sm" 
                            variant={pkg.is_active ? "destructive" : "default"}
                            onClick={() => togglePackageStatus(pkg.id)}
                          >
                            {pkg.is_active ? (
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
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Empty state */}
                {(!packages.packages || packages.packages.length === 0) && (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-24 w-24 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No packages found</h3>
                    <p className="mt-2 text-gray-500">Dental packages will appear here once dentists create them.</p>
                  </div>
                )}
                
                {/* Pagination */}
                {packages.packages && packages.packages.length > 0 && (
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-gray-500">
                      Showing {packages.packages?.length || 0} of {packages.total || 0} packages
                    </p>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!packages.has_prev}
                        onClick={() => {
                          const newPage = packagesPage - 1
                          setPackagesPage(newPage)
                          fetchPackages(newPage)
                        }}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!packages.has_next}
                        onClick={() => {
                          const newPage = packagesPage + 1
                          setPackagesPage(newPage)
                          fetchPackages(newPage)
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Management */}
          <TabsContent value="bookings" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Booking Management</CardTitle>
                    <CardDescription>Monitor and manage all booking requests and appointments</CardDescription>
                  </div>
                  <Button onClick={() => fetchBookings(1, bookingStatusFilter)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                {/* Status Filter */}
                <div className="flex gap-4 mt-4">
                  <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => fetchBookings(1, bookingStatusFilter)}>
                    <Search className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.bookings?.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg">Booking #{booking.id}</h3>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-800">
                              ${booking.total_amount}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            {/* Patient Info */}
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <h4 className="font-medium text-blue-800 mb-1 flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                Patient
                              </h4>
                              <p className="text-sm font-medium">{booking.patient?.name || 'N/A'}</p>
                              <p className="text-xs text-gray-600">{booking.patient?.email || 'N/A'}</p>
                            </div>
                            
                            {/* Dentist Info */}
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <h4 className="font-medium text-purple-800 mb-1 flex items-center">
                                <UserCheck className="h-4 w-4 mr-1" />
                                Dentist
                              </h4>
                              <p className="text-sm font-medium">{booking.dentist?.name || 'N/A'}</p>
                              <p className="text-xs text-gray-600">{booking.dentist?.clinic || 'N/A'}</p>
                            </div>
                            
                            {/* Package Info */}
                            <div className="bg-cyan-50 p-3 rounded-lg">
                              <h4 className="font-medium text-cyan-800 mb-1 flex items-center">
                                <Package className="h-4 w-4 mr-1" />
                                Package
                              </h4>
                              <p className="text-sm font-medium">{booking.package?.name || 'N/A'}</p>
                              <p className="text-xs text-gray-600">Price: ${booking.package?.price || booking.total_amount}</p>
                            </div>
                          </div>
                          
                          {/* Dates and Timeline */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <span className="font-medium text-gray-500">Requested:</span>
                              <p>{new Date(booking.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Preferred Date:</span>
                              <p>{booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : 'Not set'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Confirmed Date:</span>
                              <p className={booking.confirmed_date ? 'text-green-600 font-medium' : 'text-gray-400'}>
                                {booking.confirmed_date ? new Date(booking.confirmed_date).toLocaleDateString() : 'Not confirmed'}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Last Updated:</span>
                              <p>{new Date(booking.updated_at || booking.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          {/* Special Requests */}
                          {booking.special_requests && (
                            <div className="bg-gray-50 p-3 rounded-lg mb-3">
                              <span className="font-medium text-gray-700">Special Requests:</span>
                              <p className="text-sm text-gray-600 mt-1">{booking.special_requests}</p>
                            </div>
                          )}
                          
                          {/* Decline/Cancellation Reason */}
                          {(booking.declined_reason || booking.cancellation_reason) && (
                            <div className="bg-red-50 p-3 rounded-lg mb-3">
                              <span className="font-medium text-red-800">
                                {booking.declined_reason ? 'Decline Reason:' : 'Cancellation Reason:'}
                              </span>
                              <p className="text-sm text-red-700 mt-1">
                                {booking.declined_reason || booking.cancellation_reason}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>ID: {booking.id}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Created: {new Date(booking.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          
                          {/* Quick Actions based on status */}
                          {booking.status === 'pending' && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Awaiting Response
                            </Badge>
                          )}
                          {booking.status === 'confirmed' && (
                            <Badge className="bg-green-100 text-green-800 text-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirmed
                            </Badge>
                          )}
                          {booking.status === 'completed' && (
                            <Badge className="bg-blue-100 text-blue-800 text-center">
                              <Star className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Empty state */}
                {(!bookings.bookings || bookings.bookings.length === 0) && (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-24 w-24 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No bookings found</h3>
                    <p className="mt-2 text-gray-500">
                      {bookingStatusFilter && bookingStatusFilter !== 'all' 
                        ? `No ${bookingStatusFilter} bookings at the moment.`
                        : 'Booking requests will appear here once patients start making appointments.'
                      }
                    </p>
                  </div>
                )}
                
                {/* Pagination */}
                {bookings.bookings && bookings.bookings.length > 0 && (
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-gray-500">
                      Showing {bookings.bookings?.length || 0} of {bookings.total || 0} bookings
                      {bookingStatusFilter && bookingStatusFilter !== 'all' && (
                        <span className="ml-1">({bookingStatusFilter} status)</span>
                      )}
                    </p>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!bookings.has_prev}
                        onClick={() => {
                          const newPage = bookingsPage - 1
                          setBookingsPage(newPage)
                          fetchBookings(newPage, bookingStatusFilter)
                        }}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!bookings.has_next}
                        onClick={() => {
                          const newPage = bookingsPage + 1
                          setBookingsPage(newPage)
                          fetchBookings(newPage, bookingStatusFilter)
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics Dashboard</CardTitle>
                <CardDescription>Comprehensive insights into platform performance and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="current" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="current">Current Month</TabsTrigger>
                    <TabsTrigger value="historical">Historical Trends</TabsTrigger>
                  </TabsList>
                  
                  {/* Current Month Analytics */}
                  <TabsContent value="current" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      
                      {/* Overview Cards */}
                      <Card className="col-span-full">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                            Current Month Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">{stats.total_users || 0}</div>
                              <div className="text-sm text-gray-600">Total Users</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{stats.total_bookings || 0}</div>
                              <div className="text-sm text-gray-600">Total Bookings</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">${stats.total_revenue || 0}</div>
                              <div className="text-sm text-gray-600">Revenue</div>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                              <div className="text-2xl font-bold text-orange-600">{stats.total_packages || 0}</div>
                              <div className="text-sm text-gray-600">Active Packages</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Conversion Rate */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <Target className="h-5 w-5 mr-2 text-green-600" />
                            Conversion Funnel
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Inquiries</span>
                              <span className="font-semibold">100</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{width: '100%'}}></div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Consultations</span>
                              <span className="font-semibold">75</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-purple-600 h-2 rounded-full" style={{width: '75%'}}></div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Bookings</span>
                              <span className="font-semibold">45</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-600 h-2 rounded-full" style={{width: '45%'}}></div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Completed</span>
                              <span className="font-semibold">38</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-emerald-600 h-2 rounded-full" style={{width: '38%'}}></div>
                            </div>
                            
                            <div className="pt-2 border-t">
                              <div className="text-center">
                                <span className="text-2xl font-bold text-green-600">38%</span>
                                <p className="text-sm text-gray-600">Overall Conversion Rate</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Cancellations & No-Shows */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                            Cancellations & No-Shows
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-red-600">12%</div>
                              <p className="text-sm text-gray-600">Cancellation Rate</p>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Schedule Conflicts</span>
                                <span className="font-medium">40%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Financial Reasons</span>
                                <span className="font-medium">25%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Medical Concerns</span>
                                <span className="font-medium">20%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Other</span>
                                <span className="font-medium">15%</span>
                              </div>
                            </div>
                            
                            <div className="pt-2 border-t">
                              <div className="text-center">
                                <span className="text-lg font-bold text-orange-600">5</span>
                                <p className="text-xs text-gray-600">No-Shows This Month</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Popular Packages */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <Star className="h-5 w-5 mr-2 text-yellow-600" />
                            Popular Packages
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                              <div>
                                <p className="font-medium text-sm">Complete Smile Makeover</p>
                                <p className="text-xs text-gray-600">45 bookings</p>
                              </div>
                              <Badge className="bg-yellow-100 text-yellow-800">Top</Badge>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                              <div>
                                <p className="font-medium text-sm">Dental Implant Package</p>
                                <p className="text-xs text-gray-600">32 bookings</p>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800">#2</Badge>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                              <div>
                                <p className="font-medium text-sm">Teeth Whitening Plus</p>
                                <p className="text-xs text-gray-600">28 bookings</p>
                              </div>
                              <Badge className="bg-green-100 text-green-800">#3</Badge>
                            </div>
                            
                            <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                              <div>
                                <p className="font-medium text-sm">Orthodontic Care</p>
                                <p className="text-xs text-gray-600">21 bookings</p>
                              </div>
                              <Badge className="bg-purple-100 text-purple-800">#4</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Top Performing Dentists */}
                      <Card className="col-span-full md:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <Award className="h-5 w-5 mr-2 text-purple-600" />
                            Top Performing Dentists
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            
                            {/* By Bookings */}
                            <div>
                              <h4 className="font-medium text-sm mb-3 text-blue-600">Most Bookings</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                  <div>
                                    <p className="font-medium text-sm">Dr. Maria Rodriguez</p>
                                    <p className="text-xs text-gray-600">Smile Clinic</p>
                                  </div>
                                  <span className="font-bold text-blue-600">23</span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <div>
                                    <p className="font-medium text-sm">Dr. Carlos Mendez</p>
                                    <p className="text-xs text-gray-600">Dental Excellence</p>
                                  </div>
                                  <span className="font-bold text-gray-600">18</span>
                                </div>
                              </div>
                            </div>

                            {/* By Rating */}
                            <div>
                              <h4 className="font-medium text-sm mb-3 text-yellow-600">Highest Rated</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                                  <div>
                                    <p className="font-medium text-sm">Dr. Ana Silva</p>
                                    <p className="text-xs text-gray-600">Premium Dental</p>
                                  </div>
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 text-yellow-400 mr-1" />
                                    <span className="font-bold text-yellow-600">4.9</span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <div>
                                    <p className="font-medium text-sm">Dr. Luis Torres</p>
                                    <p className="text-xs text-gray-600">Modern Dentistry</p>
                                  </div>
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 text-yellow-400 mr-1" />
                                    <span className="font-bold text-gray-600">4.8</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* By Revenue */}
                            <div>
                              <h4 className="font-medium text-sm mb-3 text-green-600">Highest Revenue</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                                  <div>
                                    <p className="font-medium text-sm">Dr. Maria Rodriguez</p>
                                    <p className="text-xs text-gray-600">Smile Clinic</p>
                                  </div>
                                  <span className="font-bold text-green-600">$12.5K</span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <div>
                                    <p className="font-medium text-sm">Dr. Carlos Mendez</p>
                                    <p className="text-xs text-gray-600">Dental Excellence</p>
                                  </div>
                                  <span className="font-bold text-gray-600">$9.8K</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Procedure Demand Trends */}
                      <Card className="col-span-full">
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                            Procedure Demand Trends
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <div className="text-center p-3 bg-indigo-50 rounded-lg">
                              <div className="text-xl font-bold text-indigo-600">35%</div>
                              <div className="text-xs text-gray-600">Cosmetic Dentistry</div>
                              <div className="text-xs text-green-600">↑ 12%</div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-xl font-bold text-blue-600">28%</div>
                              <div className="text-xs text-gray-600">Dental Implants</div>
                              <div className="text-xs text-green-600">↑ 8%</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                              <div className="text-xl font-bold text-purple-600">20%</div>
                              <div className="text-xs text-gray-600">Orthodontics</div>
                              <div className="text-xs text-red-600">↓ 3%</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <div className="text-xl font-bold text-green-600">12%</div>
                              <div className="text-xs text-gray-600">Teeth Whitening</div>
                              <div className="text-xs text-green-600">↑ 15%</div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                              <div className="text-xl font-bold text-orange-600">8%</div>
                              <div className="text-xs text-gray-600">Root Canal</div>
                              <div className="text-xs text-gray-600">→ 0%</div>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                              <div className="text-xl font-bold text-red-600">5%</div>
                              <div className="text-xs text-gray-600">Emergency Care</div>
                              <div className="text-xs text-red-600">↓ 5%</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Estimated Revenue Forecast */}
                      <Card className="col-span-full md:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                            Revenue Forecast
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">$45.2K</div>
                              <div className="text-sm text-gray-600">Projected This Month</div>
                              <div className="text-xs text-green-600">Based on 38 pending bookings</div>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">$186K</div>
                              <div className="text-sm text-gray-600">Quarterly Forecast</div>
                              <div className="text-xs text-blue-600">15% growth projected</div>
                            </div>
                          </div>
                          
                          <div className="mt-4 space-y-2">
                                                         <div className="flex justify-between text-sm">
                               <span>High-value procedures (&gt;$2K)</span>
                               <span className="font-medium">$28.5K (63%)</span>
                             </div>
                            <div className="flex justify-between text-sm">
                              <span>Standard procedures ($500-$2K)</span>
                              <span className="font-medium">$12.8K (28%)</span>
                            </div>
                                                         <div className="flex justify-between text-sm">
                               <span>Basic procedures (&lt;$500)</span>
                               <span className="font-medium">$3.9K (9%)</span>
                             </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  {/* Historical Trends */}
                  <TabsContent value="historical" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Monthly Revenue Trend */}
                      <Card className="col-span-full">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                            Monthly Revenue Trends (Last 6 Months)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {[
                              { month: 'June 2025', revenue: 42500, bookings: 45, growth: 8 },
                              { month: 'May 2025', revenue: 39200, bookings: 42, growth: 12 },
                              { month: 'April 2025', revenue: 35100, bookings: 38, growth: -3 },
                              { month: 'March 2025', revenue: 36200, bookings: 41, growth: 15 },
                              { month: 'February 2025', revenue: 31500, bookings: 35, growth: 5 },
                              { month: 'January 2025', revenue: 30000, bookings: 33, growth: 0 }
                            ].map((item, index) => (
                              <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{item.month}</p>
                                  <p className="text-sm text-gray-600">{item.bookings} bookings</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">${(item.revenue / 1000).toFixed(1)}K</p>
                                  <p className={`text-sm ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.growth >= 0 ? '↑' : '↓'} {Math.abs(item.growth)}%
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* User Growth Trends */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Users className="h-5 w-5 mr-2 text-purple-600" />
                            User Growth Trends
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-purple-600">24%</div>
                              <p className="text-sm text-gray-600">Monthly Growth Rate</p>
                            </div>
                            
                                                         <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm">New Patients</span>
                                <span className="font-medium">+42 this month</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">New Dentists</span>
                                <span className="font-medium">+8 this month</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Retention Rate</span>
                                <span className="font-medium">89%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Seasonal Trends */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                            Seasonal Trends
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="p-3 bg-orange-50 rounded-lg">
                              <p className="font-medium text-orange-800">Peak Season</p>
                              <p className="text-sm text-orange-600">December - February</p>
                              <p className="text-xs text-gray-600">35% increase in cosmetic procedures</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="font-medium text-blue-800">High Season</p>
                              <p className="text-sm text-blue-600">June - August</p>
                              <p className="text-xs text-gray-600">20% increase in dental tourism</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium text-gray-800">Low Season</p>
                              <p className="text-sm text-gray-600">March - May</p>
                              <p className="text-xs text-gray-600">Focus on maintenance procedures</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Geographic Trends */}
                      <Card className="col-span-full">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <MapPin className="h-5 w-5 mr-2 text-green-600" />
                            Geographic Distribution & Trends
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-medium text-sm mb-3">Top Origin Countries</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">🇺🇸 United States</span>
                                  <span className="font-medium">45%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">🇨🇦 Canada</span>
                                  <span className="font-medium">28%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">🇬🇧 United Kingdom</span>
                                  <span className="font-medium">15%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">🇦🇺 Australia</span>
                                  <span className="font-medium">12%</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm mb-3">Popular Destinations</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Mexico City</span>
                                  <span className="font-medium">32%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Cancún</span>
                                  <span className="font-medium">28%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Guadalajara</span>
                                  <span className="font-medium">25%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Tijuana</span>
                                  <span className="font-medium">15%</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-sm mb-3">Growth Markets</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">🇩🇪 Germany</span>
                                  <span className="font-medium text-green-600">↑ 45%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">🇯🇵 Japan</span>
                                  <span className="font-medium text-green-600">↑ 38%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">🇫🇷 France</span>
                                  <span className="font-medium text-green-600">↑ 22%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">🇧🇷 Brazil</span>
                                  <span className="font-medium text-green-600">↑ 18%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
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