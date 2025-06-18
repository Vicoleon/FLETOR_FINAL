// Enhanced matching algorithm for patient-dentist pairing
export class DentistMatchingService {
  constructor() {
    this.weights = {
      specialization: 0.3,
      location: 0.25,
      price: 0.2,
      rating: 0.15,
      experience: 0.1
    }
  }

  /**
   * Calculate matching score between patient requirements and dentist
   * @param {Object} patientRequirements - Patient's search criteria
   * @param {Object} dentist - Dentist profile with packages
   * @returns {number} - Matching score (0-100)
   */
  calculateMatchScore(patientRequirements, dentist) {
    let totalScore = 0
    let totalWeight = 0

    // Specialization matching
    if (patientRequirements.specializations?.length > 0) {
      const specializationScore = this.calculateSpecializationMatch(
        patientRequirements.specializations,
        dentist.specializations || []
      )
      totalScore += specializationScore * this.weights.specialization
      totalWeight += this.weights.specialization
    }

    // Location proximity (if coordinates available)
    if (patientRequirements.location && dentist.location) {
      const locationScore = this.calculateLocationMatch(
        patientRequirements.location,
        dentist.location
      )
      totalScore += locationScore * this.weights.location
      totalWeight += this.weights.location
    }

    // Price range matching
    if (patientRequirements.priceRange) {
      const priceScore = this.calculatePriceMatch(
        patientRequirements.priceRange,
        dentist.packages || []
      )
      totalScore += priceScore * this.weights.price
      totalWeight += this.weights.price
    }

    // Rating consideration
    if (dentist.rating) {
      const ratingScore = (dentist.rating / 5) * 100
      totalScore += ratingScore * this.weights.rating
      totalWeight += this.weights.rating
    }

    // Experience consideration
    if (dentist.years_experience) {
      const experienceScore = Math.min((dentist.years_experience / 20) * 100, 100)
      totalScore += experienceScore * this.weights.experience
      totalWeight += this.weights.experience
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0
  }

  calculateSpecializationMatch(requiredSpecs, dentistSpecs) {
    if (requiredSpecs.length === 0) return 100
    
    const matches = requiredSpecs.filter(reqSpec => 
      dentistSpecs.some(dentistSpec => 
        dentistSpec.name.toLowerCase().includes(reqSpec.toLowerCase()) ||
        reqSpec.toLowerCase().includes(dentistSpec.name.toLowerCase())
      )
    )
    
    return (matches.length / requiredSpecs.length) * 100
  }

  calculateLocationMatch(patientLocation, dentistLocation) {
    // Simple string matching for now - can be enhanced with geocoding
    if (patientLocation.toLowerCase() === dentistLocation.toLowerCase()) {
      return 100
    }
    
    // Partial matching for city/region
    const patientWords = patientLocation.toLowerCase().split(' ')
    const dentistWords = dentistLocation.toLowerCase().split(' ')
    
    const commonWords = patientWords.filter(word => 
      dentistWords.some(dWord => dWord.includes(word) || word.includes(dWord))
    )
    
    return Math.min((commonWords.length / Math.max(patientWords.length, 1)) * 100, 100)
  }

  calculatePriceMatch(priceRange, packages) {
    if (packages.length === 0) return 0
    
    const [minPrice, maxPrice] = priceRange
    const matchingPackages = packages.filter(pkg => 
      pkg.price_usd >= minPrice && pkg.price_usd <= maxPrice
    )
    
    return (matchingPackages.length / packages.length) * 100
  }

  /**
   * Sort dentists by matching score and other criteria
   * @param {Array} dentists - Array of dentist objects
   * @param {Object} patientRequirements - Patient's search criteria
   * @param {string} sortBy - Sorting preference
   * @returns {Array} - Sorted array of dentists with match scores
   */
  rankDentists(dentists, patientRequirements, sortBy = 'match') {
    // Calculate match scores for all dentists
    const dentistsWithScores = dentists.map(dentist => ({
      ...dentist,
      matchScore: this.calculateMatchScore(patientRequirements, dentist)
    }))

    // Sort based on criteria
    return dentistsWithScores.sort((a, b) => {
      switch (sortBy) {
        case 'match':
          return b.matchScore - a.matchScore
        case 'price':
          const avgPriceA = this.getAveragePrice(a.packages || [])
          const avgPriceB = this.getAveragePrice(b.packages || [])
          return avgPriceA - avgPriceB
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'experience':
          return (b.years_experience || 0) - (a.years_experience || 0)
        default:
          return b.matchScore - a.matchScore
      }
    })
  }

  getAveragePrice(packages) {
    if (packages.length === 0) return 0
    const total = packages.reduce((sum, pkg) => sum + (pkg.price_usd || 0), 0)
    return total / packages.length
  }

  /**
   * Apply advanced filters to dentist list
   * @param {Array} dentists - Array of dentist objects
   * @param {Object} filters - Filter criteria
   * @returns {Array} - Filtered array of dentists
   */
  applyAdvancedFilters(dentists, filters) {
    return dentists.filter(dentist => {
      // Text search in name, clinic, bio
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase()
        const searchableText = [
          dentist.first_name,
          dentist.last_name,
          dentist.clinic_name,
          dentist.bio,
          dentist.specialization
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchLower)) {
          return false
        }
      }

      // Price range filter
      if (filters.priceRange && dentist.packages) {
        const [minPrice, maxPrice] = filters.priceRange
        const hasPackageInRange = dentist.packages.some(pkg => 
          pkg.price_usd >= minPrice && pkg.price_usd <= maxPrice
        )
        if (!hasPackageInRange) {
          return false
        }
      }

      // Specialization filter
      if (filters.specializations?.length > 0) {
        const hasMatchingSpec = filters.specializations.some(filterSpec =>
          dentist.specializations?.some(dentistSpec =>
            dentistSpec.name.toLowerCase().includes(filterSpec.toLowerCase())
          ) || dentist.specialization?.toLowerCase().includes(filterSpec.toLowerCase())
        )
        if (!hasMatchingSpec) {
          return false
        }
      }

      // Procedures filter
      if (filters.procedures?.length > 0) {
        const hasMatchingProcedure = dentist.packages?.some(pkg =>
          pkg.procedures?.some(proc =>
            filters.procedures.some(filterProc =>
              proc.name.toLowerCase().includes(filterProc.toLowerCase())
            )
          ) || pkg.procedures_included?.some(proc =>
            filters.procedures.some(filterProc =>
              proc.toLowerCase().includes(filterProc.toLowerCase())
            )
          )
        )
        if (!hasMatchingProcedure) {
          return false
        }
      }

      // Rating filter
      if (filters.minRating > 0) {
        if ((dentist.rating || 0) < filters.minRating) {
          return false
        }
      }

      // Experience filter
      if (filters.minExperience > 0) {
        if ((dentist.years_experience || 0) < filters.minExperience) {
          return false
        }
      }

      // Duration filter
      if (filters.maxDuration > 0) {
        const hasPackageWithinDuration = dentist.packages?.some(pkg =>
          (pkg.duration_days || 0) <= filters.maxDuration
        )
        if (!hasPackageWithinDuration) {
          return false
        }
      }

      // Accommodation filter
      if (filters.includesAccommodation) {
        const hasAccommodation = dentist.packages?.some(pkg => pkg.includes_accommodation)
        if (!hasAccommodation) {
          return false
        }
      }

      // Transportation filter
      if (filters.includesTransportation) {
        const hasTransportation = dentist.packages?.some(pkg => pkg.includes_transportation)
        if (!hasTransportation) {
          return false
        }
      }

      // Verification filter
      if (filters.isVerified) {
        if (!dentist.is_verified) {
          return false
        }
      }

      // Location filter
      if (filters.location) {
        const locationMatch = dentist.clinic_address?.toLowerCase().includes(filters.location.toLowerCase())
        if (!locationMatch) {
          return false
        }
      }

      return true
    })
  }
}

// Geolocation utilities
export class LocationService {
  static async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        error => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      )
    })
  }

  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }
}

export default DentistMatchingService

