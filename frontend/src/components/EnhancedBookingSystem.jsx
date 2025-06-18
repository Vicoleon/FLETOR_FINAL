import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Calendar, Clock, MapPin, Star, DollarSign, User, Phone, Mail, CheckCircle, XCircle, AlertCircle, Bell, RefreshCw, Eye, Filter, Search, X, Award, Plane, Hotel, Target, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { API_ENDPOINTS } from '../config/api'
import DentistMatchingService, { LocationService } from '../services/DentistMatchingService'
import { useCurrency } from '../services/CurrencyService'

const EnhancedBookingSystem = () => {
  const { user } = useAuth()
  const { formatCurrency, convertUSDToCRC, exchangeRate, loading: currencyLoading } = useCurrency()
  const [matchingService] = useState(() => new DentistMatchingService())
  
  // State management
  const [packages, setPackages] = useState([])
  const [filteredPackages, setFilteredPackages] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [bookingData, setBookingData] = useState({
    preferred_date: '',
    special_requests: ''
  })
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [isBookingDetailModalOpen, setIsBookingDetailModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('browse')
  
  // Enhanced filter and search state
  const [treatmentTypes, setTreatmentTypes] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [showCurrencyToggle, setShowCurrencyToggle] = useState(true)
  const [preferredCurrency, setPreferredCurrency] = useState('USD')
  
  // Advanced filter state
  const [filters, setFilters] = useState({
    searchText: '',
    priceRange: [0, 5000],
    procedures: [],
    specializations: [],
    minRating: 0,
    minExperience: 0,
    maxDuration: 30,
    includesAccommodation: false,
    includesTransportation: false,
    isVerified: false,
    location: '',
    sortBy: 'match' // match, price, rating, experience, duration
  })

  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchPackages()
    fetchTreatmentTypes()
    fetchSpecializations()
    getUserLocation()
    if (user) {
      fetchMyBookings()
    }
  }, [user])

  useEffect(() => {
    applyAdvancedFilters()
  }, [packages, filters])

  const getUserLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation()
      setUserLocation(location)
    } catch (error) {
      console.log('Location access denied or not available')
    }
  }

  const fetchTreatmentTypes = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TREATMENTS.TREATMENT_TYPES)
      if (response.ok) {
        const data = await response.json()
        setTreatmentTypes(data.treatments || [])
      }
    } catch (error) {
      console.error('Error fetching treatment types:', error)
    }
  }

  const fetchSpecializations = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TREATMENTS.SPECIALIZATIONS)
      if (response.ok) {
        const data = await response.json()
        setSpecializations(data.specializations || [])
      }
    } catch (error) {
      console.error('Error fetching specializations:', error)
    }
  }

  const fetchPackages = async () => {
    try {
      setLoading(true)
      const response = await fetch(API_ENDPOINTS.PACKAGES.LIST)
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages || [])
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyBookings = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.BOOKINGS.MY_BOOKINGS, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setMyBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const applyAdvancedFilters = () => {
    if (!packages.length) {
      setFilteredPackages([])
      return
    }

    // Group packages by dentist for better matching
    const dentistPackages = packages.reduce((acc, pkg) => {
      const dentistId = pkg.dentist_id
      if (!acc[dentistId]) {
        acc[dentistId] = {
          dentist: pkg.dentist || {},
          packages: []
        }
      }
      acc[dentistId].packages.push(pkg)
      return acc
    }, {})

    // Apply filters using matching service
    const dentists = Object.values(dentistPackages).map(item => ({
      ...item.dentist,
      packages: item.packages
    }))

    const filteredDentists = matchingService.applyAdvancedFilters(dentists, filters)
    
    // Create patient requirements for matching
    const patientRequirements = {
      specializations: filters.specializations,
      location: filters.location || userLocation,
      priceRange: filters.priceRange,
      procedures: filters.procedures
    }

    // Rank dentists by matching score
    const rankedDentists = matchingService.rankDentists(
      filteredDentists, 
      patientRequirements, 
      filters.sortBy
    )

    // Flatten back to packages with match scores
    const rankedPackages = rankedDentists.flatMap(dentist => 
      dentist.packages.map(pkg => ({
        ...pkg,
        dentist: dentist,
        matchScore: dentist.matchScore
      }))
    )

    setFilteredPackages(rankedPackages)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      searchText: '',
      priceRange: [0, 5000],
      procedures: [],
      specializations: [],
      minRating: 0,
      minExperience: 0,
      maxDuration: 30,
      includesAccommodation: false,
      includesTransportation: false,
      isVerified: false,
      location: '',
      sortBy: 'match'
    })
  }

  const handleBooking = async () => {
    if (!selectedPackage || !bookingData.preferred_date) {
      setMessage('Please select a date for your appointment')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(API_ENDPOINTS.BOOKINGS.CREATE, {
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

      if (response.ok) {
        setMessage('Booking request sent successfully!')
        setIsBookingModalOpen(false)
        setBookingData({ preferred_date: '', special_requests: '' })
        fetchMyBookings()
      } else {
        const error = await response.json()
        setMessage(error.error || 'Failed to create booking')
      }
    } catch (error) {
      setMessage('Error creating booking')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (priceUSD) => {
    if (preferredCurrency === 'CRC') {
      const priceCRC = convertUSDToCRC(priceUSD)
      return formatCurrency(priceCRC, 'CRC')
    }
    return formatCurrency(priceUSD, 'USD')
  }

  const renderAdvancedFilters = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Advanced Filters
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            className="ml-auto"
          >
            Clear All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search">Search Dentists or Clinics</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name, clinic, or specialization..."
                value={filters.searchText}
                onChange={(e) => handleFilterChange('searchText', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="City or region..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>
        </div>

        {/* Price Range */}
        <div>
          <Label>Price Range: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}</Label>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => handleFilterChange('priceRange', value)}
            max={5000}
            min={0}
            step={50}
            className="mt-2"
          />
        </div>

        {/* Specializations */}
        <div>
          <Label>Specializations</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {specializations.map(spec => (
              <Badge
                key={spec.id}
                variant={filters.specializations.includes(spec.name) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const current = filters.specializations
                  const updated = current.includes(spec.name)
                    ? current.filter(s => s !== spec.name)
                    : [...current, spec.name]
                  handleFilterChange('specializations', updated)
                }}
              >
                {spec.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Treatment Types */}
        <div>
          <Label>Procedures</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {treatmentTypes.map(treatment => (
              <Badge
                key={treatment.id}
                variant={filters.procedures.includes(treatment.name) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const current = filters.procedures
                  const updated = current.includes(treatment.name)
                    ? current.filter(p => p !== treatment.name)
                    : [...current, treatment.name]
                  handleFilterChange('procedures', updated)
                }}
              >
                {treatment.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Rating and Experience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Minimum Rating: {filters.minRating} stars</Label>
            <Slider
              value={[filters.minRating]}
              onValueChange={(value) => handleFilterChange('minRating', value[0])}
              max={5}
              min={0}
              step={0.5}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Minimum Experience: {filters.minExperience} years</Label>
            <Slider
              value={[filters.minExperience]}
              onValueChange={(value) => handleFilterChange('minExperience', value[0])}
              max={30}
              min={0}
              step={1}
              className="mt-2"
            />
          </div>
        </div>

        {/* Duration and Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Maximum Duration: {filters.maxDuration} days</Label>
            <Slider
              value={[filters.maxDuration]}
              onValueChange={(value) => handleFilterChange('maxDuration', value[0])}
              max={30}
              min={1}
              step={1}
              className="mt-2"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="accommodation"
                checked={filters.includesAccommodation}
                onCheckedChange={(checked) => handleFilterChange('includesAccommodation', checked)}
              />
              <Label htmlFor="accommodation">Includes Accommodation</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="transportation"
                checked={filters.includesTransportation}
                onCheckedChange={(checked) => handleFilterChange('includesTransportation', checked)}
              />
              <Label htmlFor="transportation">Includes Transportation</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="verified"
                checked={filters.isVerified}
                onCheckedChange={(checked) => handleFilterChange('isVerified', checked)}
              />
              <Label htmlFor="verified">Verified Dentists Only</Label>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <Label>Sort By</Label>
          <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Best Match</SelectItem>
              <SelectItem value="price">Price (Low to High)</SelectItem>
              <SelectItem value="rating">Rating (High to Low)</SelectItem>
              <SelectItem value="experience">Experience (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )

  const renderPackageCard = (pkg) => (
    <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {pkg.name}
              {pkg.matchScore && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {Math.round(pkg.matchScore)}% match
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Dr. {pkg.dentist?.first_name} {pkg.dentist?.last_name} - {pkg.dentist?.clinic_name}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-cyan-600">
              {formatPrice(pkg.price_usd)}
            </div>
            {preferredCurrency === 'USD' && (
              <div className="text-sm text-gray-500">
                ≈ {formatCurrency(convertUSDToCRC(pkg.price_usd), 'CRC')}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{pkg.description}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{pkg.duration_days} days</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="text-sm">{pkg.dentist?.rating || 'No rating'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{pkg.dentist?.clinic_address || 'Location not specified'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{pkg.dentist?.years_experience || 0} years exp.</span>
          </div>
        </div>

        {pkg.includes_accommodation && (
          <Badge variant="outline" className="mr-2 mb-2">
            <Hotel className="h-3 w-3 mr-1" />
            Accommodation
          </Badge>
        )}
        {pkg.includes_transportation && (
          <Badge variant="outline" className="mr-2 mb-2">
            <Plane className="h-3 w-3 mr-1" />
            Transportation
          </Badge>
        )}
        {pkg.dentist?.is_verified && (
          <Badge variant="outline" className="mr-2 mb-2">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )}

        <div className="mt-4">
          <Button 
            onClick={() => {
              setSelectedPackage(pkg)
              setIsBookingModalOpen(true)
            }}
            className="w-full"
            disabled={!user}
          >
            {user ? 'Book Appointment' : 'Login to Book'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Currency Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Find Your Perfect Dentist</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Currency:</Label>
            <Select value={preferredCurrency} onValueChange={setPreferredCurrency}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="CRC">CRC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Exchange Rate Info */}
      {!currencyLoading && (
        <div className="text-sm text-gray-500">
          Current rate: 1 USD = ₡{Math.round(exchangeRate)} CRC
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && renderAdvancedFilters()}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Found {filteredPackages.length} dental packages
          {filters.searchText && ` for "${filters.searchText}"`}
        </p>
        <Button variant="ghost" onClick={fetchPackages} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Package Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map(renderPackageCard)}
        </div>
      )}

      {/* No Results */}
      {!loading && filteredPackages.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No packages found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search criteria
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              {selectedPackage && `${selectedPackage.name} - ${formatPrice(selectedPackage.price_usd)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="preferred_date">Preferred Date</Label>
              <Input
                id="preferred_date"
                type="date"
                value={bookingData.preferred_date}
                onChange={(e) => setBookingData(prev => ({
                  ...prev,
                  preferred_date: e.target.value
                }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="special_requests">Special Requests</Label>
              <Textarea
                id="special_requests"
                placeholder="Any special requirements or questions..."
                value={bookingData.special_requests}
                onChange={(e) => setBookingData(prev => ({
                  ...prev,
                  special_requests: e.target.value
                }))}
              />
            </div>
            {message && (
              <div className="text-sm text-red-600">{message}</div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleBooking} disabled={loading} className="flex-1">
                {loading ? 'Booking...' : 'Confirm Booking'}
              </Button>
              <Button variant="outline" onClick={() => setIsBookingModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EnhancedBookingSystem

