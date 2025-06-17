import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from '../contexts/AuthContext'
import DentistBookingManagement from './DentistBookingManagement'
import NotificationCenter from './NotificationCenter'
import { 
  Calendar, MapPin, DollarSign, Clock, Star, User, Phone, Mail, 
  Plus, Edit, Trash2, CheckCircle, XCircle, Package, Users, 
  TrendingUp, AlertCircle, Settings, LogOut, Bell, Eye
} from 'lucide-react'
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown'
import { API_ENDPOINTS } from '../config/api'

export default function DentistDashboard({ onShowProfile }) {
  const { user, token, API_BASE_URL, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Add missing state variables
  const [packages, setPackages] = useState([])
  const [bookingRequests, setBookingRequests] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [showCreatePackage, setShowCreatePackage] = useState(false)
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    procedures_included: '',
    price_usd: '',
    duration_days: '',
    includes_accommodation: false,
    includes_transportation: false,
    max_patients: 1,
    treatment_ids: [] // Added for consistency
  })
  const [editingPackage, setEditingPackage] = useState(null) // State for package being edited
  const [showEditModal, setShowEditModal] = useState(false) // State to show/hide edit modal


  // Treatment and specialization data
  const [treatmentTypes, setTreatmentTypes] = useState([])
  const [selectedTreatments, setSelectedTreatments] = useState([])

  // Procedure data
  const [procedureTypes, setProcedureTypes] = useState([])
  const [selectedProcedures, setSelectedProcedures] = useState([])

  useEffect(() => {
    fetchUnreadCount()
    fetchPendingRequestsCount()
    fetchMyPackages()
    fetchPendingRequests()
    fetchAllBookings()
    fetchTreatmentTypes()
    fetchProcedureTypes()
    setLoading(false)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unread_count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const fetchPendingRequestsCount = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.BOOKINGS.PENDING_REQUESTS, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPendingRequestsCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching pending requests count:', error)
    }
  }

  const fetchMyPackages = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PACKAGES.MY_PACKAGES, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages || [])
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.BOOKINGS.PENDING_REQUESTS, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBookingRequests(data.pending_requests || [])
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    }
  }

  const fetchAllBookings = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.BOOKINGS.MY_BOOKINGS, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAllBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const fetchTreatmentTypes = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TREATMENTS.TREATMENT_TYPES)
      if (response.ok) {
        const data = await response.json()
        setTreatmentTypes(data.treatments || [])
      }
    } catch (err) {
      console.error('Failed to load treatment types:', err)
    }
  }

  const createTreatmentType = async (name) => {
    try {
      const response = await fetch(API_ENDPOINTS.TREATMENTS.CREATE_TREATMENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      })

      if (response.ok) {
        const data = await response.json()
        setTreatmentTypes(prev => [...prev, data.treatment])
        return data.treatment
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to create treatment type')
      }
    } catch (err) {
      alert('Failed to create treatment type')
    }
  }

  const fetchProcedureTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/packages/procedures`)
      if (response.ok) {
        const data = await response.json()
        setProcedureTypes(data.procedures || [])
      }
    } catch (err) {
      console.error('Failed to load procedure types:', err)
    }
  }

  const createProcedureType = async (name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/packages/procedures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      })
      if (response.ok) {
        const data = await response.json()
        setProcedureTypes(prev => [...prev, data.procedure])
        return data.procedure
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to create procedure type')
      }
    } catch (err) {
      // Improved error handling: show backend error message if available
      if (err instanceof Response) {
        try {
          const errorData = await err.json();
          alert(errorData.error || 'Failed to create procedure type');
        } catch (e) {
          alert('Failed to create procedure type');
        }
      } else {
        alert('Failed to create procedure type');
      }
    }
  }

  const createPackage = async (e) => {
    e.preventDefault()
    try {
      const packageData = {
        ...newPackage,
        price_usd: parseFloat(newPackage.price_usd),
        duration_days: parseInt(newPackage.duration_days) || null,
        procedures_included: typeof newPackage.procedures_included === 'string' 
          ? newPackage.procedures_included.split(',').map(p => p.trim()).filter(p => p) 
          : Array.isArray(newPackage.procedures_included) ? newPackage.procedures_included.filter(p => p) : [],
        treatment_ids: selectedTreatments,
        procedure_ids: selectedProcedures
      }

      const response = await fetch(API_ENDPOINTS.PACKAGES.LIST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(packageData)
      })

      if (response.ok) {
        setShowCreatePackage(false)
        setNewPackage({
          name: '',
          description: '',
          procedures_included: '',
          price_usd: '',
          duration_days: '',
          includes_accommodation: false,
          includes_transportation: false,
          max_patients: 1,
          treatment_ids: [] // Reset treatment IDs
        })
        setSelectedTreatments([])
        setSelectedProcedures([])
        fetchMyPackages()
        alert('Package created successfully!')
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Error creating package')
    }
  }

  const handleEditClick = (pkg) => {
    setEditingPackage({
      ...pkg,
      procedures_included: Array.isArray(pkg.procedures_included) ? pkg.procedures_included.join(', ') : pkg.procedures_included || ''
    });
    setSelectedTreatments(pkg.treatments ? pkg.treatments.map(t => t.id) : [])
    setSelectedProcedures(pkg.procedures ? pkg.procedures.map(p => p.id) : [])
    setShowEditModal(true)
  }

  const handleDeletePackage = async (packageId) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        const response = await fetch(API_ENDPOINTS.PACKAGES.DETAIL(packageId), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          alert('Package deleted successfully!');
          fetchMyPackages(); // Refresh the package list
        } else {
          const data = await response.json();
          alert(`Error: ${data.error || 'Failed to delete package'}`);
        }
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Error deleting package');
      }
    }
  };
  
  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    if (!editingPackage) return;

    try {
      const updatedData = {
        ...editingPackage,
        price_usd: parseFloat(editingPackage.price_usd),
        duration_days: parseInt(editingPackage.duration_days) || null,
        procedures_included: typeof editingPackage.procedures_included === 'string' 
          ? editingPackage.procedures_included.split(',').map(p => p.trim()).filter(p => p) 
          : Array.isArray(editingPackage.procedures_included) ? editingPackage.procedures_included.filter(p => p) : [],
        treatment_ids: selectedTreatments,
        procedure_ids: selectedProcedures
      };
      
      // Remove id from the payload as it's in the URL
      const { id, ...payload } = updatedData;

      const response = await fetch(API_ENDPOINTS.PACKAGES.DETAIL(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Package updated successfully!');
        setShowEditModal(false);
        setEditingPackage(null);
        fetchMyPackages(); // Refresh list
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to update package'}`);
      }
    } catch (error) {
      console.error('Error updating package:', error);
      alert('Error updating package');
    }
  };


  const updateBookingStatus = async (bookingId, status, confirmedDate = null) => {
    try {
      const requestBody = { status }
      if (confirmedDate) {
        requestBody.confirmed_date = confirmedDate
      }

      const response = await fetch(API_ENDPOINTS.BOOKINGS.STATUS(bookingId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        fetchPendingRequests()
        fetchAllBookings()
        alert(`Booking ${status} successfully!`)
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Error updating booking status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStats = () => {
    const totalBookings = allBookings.length
    const pendingCount = bookingRequests.length
    const confirmedCount = allBookings.filter(b => b.status === 'confirmed').length
    const completedCount = allBookings.filter(b => b.status === 'completed').length
    const totalRevenue = allBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.total_amount, 0)

    return { totalBookings, pendingCount, confirmedCount, completedCount, totalRevenue }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
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
            <h1 className="text-2xl font-bold text-cyan-500">Dentist Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Dr. {user?.last_name || user?.username}</span>
              <Button variant="outline" onClick={onShowProfile} className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Profile</span>
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
                <Package className="h-8 w-8 text-cyan-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Packages</p>
                  <p className="text-2xl font-bold text-gray-900">{packages.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.confirmedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Bookings
              {pendingRequestsCount > 0 && (
                <Badge className="bg-yellow-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0">
                  {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              My Packages
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-6">
            <DentistBookingManagement />
          </TabsContent>

          <TabsContent value="packages" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My Dental Packages</h2>
                <Button 
                  onClick={() => setShowCreatePackage(true)} 
                  className="bg-cyan-500 hover:bg-cyan-600 text-white flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Package
                </Button>
              </div>

              {packages.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-24 w-24 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No packages yet</h3>
                  <p className="mt-2 text-gray-500">Create your first dental package to start attracting patients.</p>
                  <Button 
                    onClick={() => setShowCreatePackage(true)} 
                    className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Package
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {packages.map((pkg) => (
                    <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{pkg.name}</CardTitle>
                            <Badge className="mt-2 bg-cyan-100 text-cyan-800">
                              ${pkg.price_usd}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(pkg)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeletePackage(pkg.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{pkg.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-2" />
                            {pkg.duration_days} days
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <DollarSign className="h-4 w-4 mr-2" />
                            ${pkg.price_usd} USD
                          </div>
                        </div>
                        {pkg.procedures_included && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Procedures:</p>
                            <div className="flex flex-wrap gap-1">
                              {pkg.procedures_included.map((procedure, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {procedure}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Create Package Modal */}
              {showCreatePackage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4">Create New Package</h3>
                    <form onSubmit={createPackage} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Package Name
                        </label>
                        <input
                          type="text"
                          required
                          value={newPackage.name}
                          onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                          placeholder="e.g., Complete Smile Makeover"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          required
                          value={newPackage.description}
                          onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                          rows="3"
                          placeholder="Describe what this package includes..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price (USD)
                        </label>
                        <input
                          type="number"
                          required
                          value={newPackage.price_usd}
                          onChange={(e) => setNewPackage({...newPackage, price_usd: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                          placeholder="e.g., 1200"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (Days)
                        </label>
                        <input
                          type="number"
                          value={newPackage.duration_days || ''}
                          onChange={(e) => setNewPackage({...newPackage, duration_days: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                          min="1"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="treatments" className="block text-sm font-medium text-gray-700 mb-1">
                          Associated Treatments (select multiple)
                        </label>
                        <MultiSelectDropdown
                          options={treatmentTypes.map(t => ({ id: t.id, name: t.name }))}
                          selectedValues={selectedTreatments}
                          onSelectionChange={setSelectedTreatments}
                          placeholder="Select treatments..."
                          onCreateNew={createTreatmentType}
                          allowCustom={true}
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="procedures" className="block text-sm font-medium text-gray-700 mb-1">
                          Procedures Included (select multiple)
                        </label>
                        <MultiSelectDropdown
                          options={procedureTypes.map(p => ({ id: p.id, name: p.name }))}
                          selectedValues={selectedProcedures}
                          onSelectionChange={setSelectedProcedures}
                          placeholder="Select procedures..."
                          onCreateNew={createProcedureType}
                          allowCustom={true}
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newPackage.includes_accommodation}
                            onChange={(e) => setNewPackage({...newPackage, includes_accommodation: e.target.checked})}
                            className="mr-2 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                          />
                          Includes Accommodation
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newPackage.includes_transportation}
                            onChange={(e) => setNewPackage({...newPackage, includes_transportation: e.target.checked})}
                            className="mr-2 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                          />
                          Includes Transportation
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Patients (optional)</label>
                        <input
                          type="number"
                          value={newPackage.max_patients || 1}
                          onChange={(e) => setNewPackage({...newPackage, max_patients: e.target.value ? parseInt(e.target.value) : 1})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                          min="1"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowCreatePackage(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                          Create Package
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Edit Package Modal */}
              {showEditModal && editingPackage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4">Edit Package</h3>
                    <form onSubmit={handleUpdatePackage} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                        <input
                          type="text"
                          required
                          value={editingPackage.name}
                          onChange={(e) => setEditingPackage({...editingPackage, name: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          required
                          value={editingPackage.description}
                          onChange={(e) => setEditingPackage({...editingPackage, description: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                          rows="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
                        <input
                          type="number"
                          required
                          value={editingPackage.price_usd}
                          onChange={(e) => setEditingPackage({...editingPackage, price_usd: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                        <input
                          type="number"
                          value={editingPackage.duration_days || ''}
                          onChange={(e) => setEditingPackage({...editingPackage, duration_days: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                          min="1"
                        />
                      </div>
                       {/* Treatment Types Dropdown for Edit Modal */}
                      <div className="mb-4">
                        <label htmlFor="edit-treatments" className="block text-sm font-medium text-gray-700 mb-1">
                          Associated Treatments (select multiple)
                        </label>
                        <MultiSelectDropdown
                          options={treatmentTypes.map(t => ({ id: t.id, name: t.name }))}
                          selectedValues={selectedTreatments} // Use selectedTreatments state here too
                          onSelectionChange={setSelectedTreatments}
                          placeholder="Select treatments..."
                          onCreateNew={createTreatmentType}
                          allowCustom={true}
                        />
                      </div>
                      {/* Procedures MultiSelectDropdown in Edit Package Modal */}
                      <div className="mb-4">
                        <label htmlFor="edit-procedures" className="block text-sm font-medium text-gray-700 mb-1">
                          Procedures Included (select multiple)
                        </label>
                        <MultiSelectDropdown
                          options={procedureTypes.map(p => ({ id: p.id, name: p.name }))}
                          selectedValues={selectedProcedures}
                          onSelectionChange={setSelectedProcedures}
                          placeholder="Select procedures..."
                          onCreateNew={createProcedureType}
                          allowCustom={true}
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingPackage.includes_accommodation}
                            onChange={(e) => setEditingPackage({...editingPackage, includes_accommodation: e.target.checked})}
                            className="mr-2 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                          />
                          Includes Accommodation
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingPackage.includes_transportation}
                            onChange={(e) => setEditingPackage({...editingPackage, includes_transportation: e.target.checked})}
                            className="mr-2 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                          />
                          Includes Transportation
                        </label>
                      </div>
                       <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Patients (optional)</label>
                        <input
                          type="number"
                          value={editingPackage.max_patients || 1}
                          onChange={(e) => setEditingPackage({...editingPackage, max_patients: e.target.value ? parseInt(e.target.value) : 1})}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500"
                          min="1"
                        />
                      </div>
                      <div className="flex justify-end space-x-2 mt-6">
                        <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); setEditingPackage(null); }}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationCenter />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Username</label>
                      <p className="text-gray-900">{user?.username || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        <p className="text-gray-900">{user?.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">User Type</label>
                      <Badge className="bg-cyan-100 text-cyan-800 capitalize">
                        {user?.user_type}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Member Since</label>
                      <p className="text-gray-900">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button onClick={onShowProfile} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Profile
                    </Button>
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

