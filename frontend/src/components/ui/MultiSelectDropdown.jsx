import { useState, useRef, useEffect } from 'react'
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { Badge } from "./badge"
import { ChevronDown, X, Plus, Check } from 'lucide-react'

export function MultiSelectDropdown({ 
  label, 
  options = [], 
  selectedValues = [], 
  onSelectionChange, 
  onCreateNew, 
  allowCustom = false,
  placeholder = "Select options...",
  customPlaceholder = "Enter new option...",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setShowCustomInput(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (optionId) => {
    const isSelected = selectedValues.includes(optionId)
    if (isSelected) {
      onSelectionChange(selectedValues.filter(id => id !== optionId))
    } else {
      onSelectionChange([...selectedValues, optionId])
    }
  }

  const handleCreateCustom = async () => {
    if (!customValue.trim()) return

    try {
      if (onCreateNew) {
        await onCreateNew(customValue.trim())
        setCustomValue('')
        setShowCustomInput(false)
      }
    } catch (error) {
      console.error('Error creating custom option:', error)
    }
  }

  const removeSelection = (optionId) => {
    onSelectionChange(selectedValues.filter(id => id !== optionId))
  }

  const getSelectedOptions = () => {
    return options.filter(option => selectedValues.includes(option.id))
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && <Label className="text-sm font-medium mb-2">{label}</Label>}
      
      {/* Selected items display */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {getSelectedOptions().map((option) => (
            <Badge key={option.id} variant="secondary" className="text-xs">
              {option.name}
              <button
                onClick={() => removeSelection(option.id)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 border border-gray-300 rounded-md bg-white text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        <span className="text-gray-700">
          {selectedValues.length > 0 
            ? `${selectedValues.length} selected`
            : placeholder
          }
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown content */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          
          {/* Search input */}
          <div className="p-2 border-b">
            <Input
              type="text"
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Options list */}
          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex items-center justify-center w-4 h-4 mr-2 border border-gray-300 rounded">
                    {selectedValues.includes(option.id) && (
                      <Check className="h-3 w-3 text-cyan-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{option.name}</div>
                    {option.description && (
                      <div className="text-xs text-gray-500">{option.description}</div>
                    )}
                  </div>
                  {option.is_system_default && (
                    <Badge variant="outline" className="text-xs">System</Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="p-2 text-sm text-gray-500 text-center">
                No options found
              </div>
            )}
          </div>

          {/* Add custom option */}
          {allowCustom && (
            <div className="border-t">
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full p-2 text-left hover:bg-gray-100 flex items-center text-sm text-cyan-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add custom option
                </button>
              ) : (
                <div className="p-2 space-y-2">
                  <Input
                    type="text"
                    placeholder={customPlaceholder}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateCustom()}
                    className="text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCustom}
                      disabled={!customValue.trim()}
                      className="bg-cyan-500 hover:bg-cyan-600"
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCustomInput(false)
                        setCustomValue('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 