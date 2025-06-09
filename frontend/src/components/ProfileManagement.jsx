import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from '../contexts/AuthContext'
import { API_ENDPOINTS } from '../config/api'
import { User, Mail, Phone, MapPin, Calendar, Shield, Key, Bell, CheckCircle, AlertCircle, ArrowLeft, UserCircle, Briefcase } from 'lucide-react'
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown'

const ProfileManagement = ({ onBackToDashboard }) => {
  const { user, updateProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Treatment and specialization data
  const [treatmentTypes, setTreatmentTypes] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [selectedTreatments, setSelectedTreatments] = useState([])
  const [selectedSpecializations, setSelectedSpecializations] = useState([])
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
    fetchNotifications()
    fetchUnreadCount()
    fetchTreatmentTypes()
    fetchSpecializations()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        
        // Set selected treatments and specializations if dentist
        if (data.profile.user_type === 'dentist' && data.profile.specializations) {
          setSelectedSpecializations(data.profile.specializations.map(spec => spec.id))
        }
      } else {
        setError('Failed to load profile')
      }
    } catch (err) {
      setError('Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(API_ENDPOINTS.AUTH.NOTIFICATIONS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (err) {
      console.error('Error loading notifications:', err)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(API_ENDPOINTS.AUTH.NOTIFICATIONS_UNREAD, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unread_count)
      }
    } catch (err) {
      console.error('Error loading unread count:', err)
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

  const fetchSpecializations = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TREATMENTS.SPECIALIZATIONS)
      if (response.ok) {
        const data = await response.json()
        setSpecializations(data.specializations || [])
      }
    } catch (err) {
      console.error('Failed to load specializations:', err)
    }
  }

  const createTreatmentType = async (name) => {
    try {
      const token = localStorage.getItem('token')
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
        setMessage('New treatment type created successfully')
        setTimeout(() => setMessage(''), 3000)
        return data.treatment
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create treatment type')
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      setError('Failed to create treatment type')
      setTimeout(() => setError(''), 5000)
    }
  }

  const createSpecialization = async (name) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(API_ENDPOINTS.TREATMENTS.CREATE_SPECIALIZATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      })

      if (response.ok) {
        const data = await response.json()
        setSpecializations(prev => [...prev, data.specialization])
        setMessage('New specialization created successfully')
        setTimeout(() => setMessage(''), 3000)
        return data.specialization
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create specialization')
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      setError('Failed to create specialization')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleProfileUpdate = async (updatedData) => {
    setSaving(true)
    setError('')
    setMessage('')
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      })
      
      if (response.ok) {
        setMessage('Profile updated successfully!')
        await fetchProfile()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    
    // Validation
    if (!passwordData.current_password) {
      setPasswordError('Current password is required')
      return
    }
    
    if (!passwordData.new_password) {
      setPasswordError('New password is required')
      return
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match')
      return
    }
    
    if (passwordData.new_password.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
      return
    }
    
    // Check if new password has letters and numbers
    if (!/[A-Za-z]/.test(passwordData.new_password)) {
      setPasswordError('Password must contain at least one letter')
      return
    }
    
    if (!/\d/.test(passwordData.new_password)) {
      setPasswordError('Password must contain at least one number')
      return
    }
    
    if (passwordData.current_password === passwordData.new_password) {
      setPasswordError('New password must be different from current password')
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setPasswordError('You must be logged in to change password')
        return
      }
      
      const response = await fetch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setPasswordSuccess('Password changed successfully!')
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      } else {
        setPasswordError(data.error || 'Failed to change password')
      }
    } catch (err) {
      console.error('Password change error:', err)
      setPasswordError('Network error - please try again')
    }
  }

  const markNotificationRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_ENDPOINTS.AUTH.NOTIFICATIONS}/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      await fetchNotifications()
      await fetchUnreadCount()
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_ENDPOINTS.AUTH.NOTIFICATIONS}/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      await fetchNotifications()
      await fetchUnreadCount()
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={onBackToDashboard}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile Management</h1>
                <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={profile?.email_verified ? "default" : "destructive"} className="bg-cyan-100 text-cyan-800">
                {profile?.email_verified ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verified
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Unverified
                  </>
                )}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {profile?.user_type}
              </Badge>
            </div>
          </div>

          {message && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Preferences</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileForm 
                profile={profile} 
                onUpdate={handleProfileUpdate} 
                saving={saving}
                treatmentTypes={treatmentTypes}
                specializations={specializations}
                selectedTreatments={selectedTreatments}
                selectedSpecializations={selectedSpecializations}
                onTreatmentSelectionChange={setSelectedTreatments}
                onSpecializationSelectionChange={setSelectedSpecializations}
                onCreateTreatment={createTreatmentType}
                onCreateSpecialization={createSpecialization}
              />
            </TabsContent>

            <TabsContent value="security">
              <SecuritySettings 
                passwordData={passwordData}
                setPasswordData={setPasswordData}
                onPasswordChange={handlePasswordChange}
                passwordError={passwordError}
                passwordSuccess={passwordSuccess}
              />
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationCenter 
                notifications={notifications}
                onMarkRead={markNotificationRead}
                onMarkAllRead={markAllNotificationsRead}
                unreadCount={unreadCount}
              />
            </TabsContent>

            <TabsContent value="preferences">
              <UserPreferences profile={profile} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

const ProfileForm = ({ 
  profile, 
  onUpdate, 
  saving, 
  treatmentTypes, 
  specializations,
  selectedTreatments,
  selectedSpecializations,
  onTreatmentSelectionChange,
  onSpecializationSelectionChange,
  onCreateTreatment,
  onCreateSpecialization
}) => {
  const [formData, setFormData] = useState({})

  useEffect(() => {
    if (profile) {
      setFormData({ ...profile })
    }
  }, [profile])

  const handleSubmit = (e) => {
    e.preventDefault()
    const updatedData = {
      ...formData,
      specialization_ids: selectedSpecializations,
      treatment_ids: selectedTreatments
    }
    onUpdate(updatedData)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5 text-cyan-600" />
          <span>Personal Information</span>
        </CardTitle>
        <CardDescription>
          Update your personal details and contact information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name || ''}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name || ''}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {profile?.user_type === 'patient' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country || ''}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="Enter your country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical_history">Medical History</Label>
                <Textarea
                  id="medical_history"
                  value={formData.medical_history || ''}
                  onChange={(e) => handleChange('medical_history', e.target.value)}
                  placeholder="Enter any relevant medical history"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact || ''}
                  onChange={(e) => handleChange('emergency_contact', e.target.value)}
                  placeholder="Emergency contact information"
                />
              </div>
            </>
          )}

          {profile?.user_type === 'dentist' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number || ''}
                    onChange={(e) => handleChange('license_number', e.target.value)}
                    placeholder="Enter your license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="years_experience">Years of Experience</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    value={formData.years_experience || ''}
                    onChange={(e) => handleChange('years_experience', parseInt(e.target.value))}
                    placeholder="Years of experience"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clinic_name">Clinic Name</Label>
                  <Input
                    id="clinic_name"
                    value={formData.clinic_name || ''}
                    onChange={(e) => handleChange('clinic_name', e.target.value)}
                    placeholder="Enter your clinic name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_address">Clinic Address</Label>
                <Textarea
                  id="clinic_address"
                  value={formData.clinic_address || ''}
                  onChange={(e) => handleChange('clinic_address', e.target.value)}
                  placeholder="Enter your clinic address"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Tell patients about yourself and your practice"
                  rows={4}
                />
              </div>

              {/* Specializations Dropdown */}
              <MultiSelectDropdown
                label="Specializations"
                options={specializations}
                selectedValues={selectedSpecializations}
                onSelectionChange={onSpecializationSelectionChange}
                onCreateNew={onCreateSpecialization}
                allowCustom={true}
                placeholder="Select your specializations..."
                customPlaceholder="Enter new specialization..."
                className="mb-6"
              />
            </>
          )}

          <Button 
            type="submit" 
            className="w-full bg-cyan-600 hover:bg-cyan-700"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Update Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

const SecuritySettings = ({ passwordData, setPasswordData, onPasswordChange, passwordError, passwordSuccess }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-cyan-600" />
            <span>Change Password</span>
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passwordSuccess && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{passwordSuccess}</AlertDescription>
            </Alert>
          )}

          {passwordError && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{passwordError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onPasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                placeholder="Enter your current password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                placeholder="Enter your new password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                placeholder="Confirm your new password"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700">
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

const NotificationCenter = ({ notifications, onMarkRead, onMarkAllRead, unreadCount }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-cyan-600" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="px-2 py-1">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onMarkAllRead}
              className="text-cyan-600 border-cyan-600 hover:bg-cyan-50"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <CardDescription>
          Stay updated with your booking requests and system notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.is_read 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-cyan-50 border-cyan-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleDateString()} at{' '}
                      {new Date(notification.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkRead(notification.id)}
                      className="text-cyan-600 hover:text-cyan-700"
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const UserPreferences = ({ profile }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="w-5 h-5 text-cyan-600" />
          <span>Account Preferences</span>
        </CardTitle>
        <CardDescription>
          Manage your account settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive email updates about your bookings</p>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Data Export</h4>
              <p className="text-sm text-gray-600">Download a copy of your account data</p>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
            <div>
              <h4 className="font-medium text-red-600">Delete Account</h4>
              <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProfileManagement

