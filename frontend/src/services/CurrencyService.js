// Currency conversion service for CRC/USD
export class CurrencyService {
  constructor() {
    this.apiKey = process.env.REACT_APP_EXCHANGE_API_KEY || 'demo'
    this.baseUrl = 'https://api.exchangerate-api.com/v4/latest'
    this.fallbackUrl = 'https://api.fixer.io/latest'
    this.cache = new Map()
    this.cacheExpiry = 30 * 60 * 1000 // 30 minutes
  }

  /**
   * Get current exchange rate from USD to CRC
   * @returns {Promise<number>} Exchange rate
   */
  async getUSDToCRCRate() {
    const cacheKey = 'USD_CRC_RATE'
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.rate
    }

    try {
      // Try primary API
      let response = await fetch(`${this.baseUrl}/USD`)
      
      if (!response.ok) {
        // Fallback to secondary API
        response = await fetch(`${this.fallbackUrl}?access_key=${this.apiKey}&base=USD&symbols=CRC`)
      }

      const data = await response.json()
      const rate = data.rates?.CRC || data.rates?.['CRC'] || 520 // Fallback rate
      
      // Cache the result
      this.cache.set(cacheKey, {
        rate,
        timestamp: Date.now()
      })
      
      return rate
    } catch (error) {
      console.error('Error fetching exchange rate:', error)
      
      // Return cached rate if available, otherwise fallback
      if (cached) {
        return cached.rate
      }
      
      // Fallback rate (approximate)
      return 520
    }
  }

  /**
   * Convert USD to CRC
   * @param {number} usdAmount - Amount in USD
   * @returns {Promise<number>} Amount in CRC
   */
  async convertUSDToCRC(usdAmount) {
    const rate = await this.getUSDToCRCRate()
    return usdAmount * rate
  }

  /**
   * Convert CRC to USD
   * @param {number} crcAmount - Amount in CRC
   * @returns {Promise<number>} Amount in USD
   */
  async convertCRCToUSD(crcAmount) {
    const rate = await this.getUSDToCRCRate()
    return crcAmount / rate
  }

  /**
   * Format currency amount with proper symbols
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (USD or CRC)
   * @param {string} locale - Locale for formatting
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    const options = {
      style: 'currency',
      currency: currency === 'CRC' ? 'CRC' : 'USD',
      minimumFractionDigits: currency === 'CRC' ? 0 : 2,
      maximumFractionDigits: currency === 'CRC' ? 0 : 2
    }

    try {
      if (currency === 'CRC') {
        // Custom formatting for CRC since it might not be supported
        return `₡${Math.round(amount).toLocaleString(locale)}`
      }
      
      return new Intl.NumberFormat(locale, options).format(amount)
    } catch (error) {
      // Fallback formatting
      if (currency === 'CRC') {
        return `₡${Math.round(amount).toLocaleString()}`
      }
      return `$${amount.toFixed(2)}`
    }
  }

  /**
   * Get dual currency display
   * @param {number} usdAmount - Amount in USD
   * @param {boolean} showBoth - Whether to show both currencies
   * @returns {Promise<Object>} Object with USD and CRC amounts and formatted strings
   */
  async getDualCurrencyDisplay(usdAmount, showBoth = true) {
    const crcAmount = await this.convertUSDToCRC(usdAmount)
    
    return {
      usd: {
        amount: usdAmount,
        formatted: this.formatCurrency(usdAmount, 'USD')
      },
      crc: {
        amount: crcAmount,
        formatted: this.formatCurrency(crcAmount, 'CRC')
      },
      display: showBoth 
        ? `${this.formatCurrency(usdAmount, 'USD')} / ${this.formatCurrency(crcAmount, 'CRC')}`
        : this.formatCurrency(usdAmount, 'USD')
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Get last update time for exchange rate
   * @returns {Date|null} Last update time or null if no cached data
   */
  getLastUpdateTime() {
    const cached = this.cache.get('USD_CRC_RATE')
    return cached ? new Date(cached.timestamp) : null
  }
}

// React hook for currency conversion
import { useState, useEffect } from 'react'

export function useCurrency() {
  const [currencyService] = useState(() => new CurrencyService())
  const [exchangeRate, setExchangeRate] = useState(520) // Default rate
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const updateExchangeRate = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const rate = await currencyService.getUSDToCRCRate()
      setExchangeRate(rate)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
      console.error('Failed to update exchange rate:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    updateExchangeRate()
    
    // Update every 30 minutes
    const interval = setInterval(updateExchangeRate, 30 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const convertUSDToCRC = (usdAmount) => {
    return usdAmount * exchangeRate
  }

  const convertCRCToUSD = (crcAmount) => {
    return crcAmount / exchangeRate
  }

  const formatCurrency = (amount, currency = 'USD') => {
    return currencyService.formatCurrency(amount, currency)
  }

  const getDualDisplay = async (usdAmount, showBoth = true) => {
    return currencyService.getDualCurrencyDisplay(usdAmount, showBoth)
  }

  return {
    exchangeRate,
    lastUpdated,
    loading,
    error,
    convertUSDToCRC,
    convertCRCToUSD,
    formatCurrency,
    getDualDisplay,
    updateExchangeRate,
    currencyService
  }
}

export default CurrencyService

