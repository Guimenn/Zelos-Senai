'use client'

import React from 'react'
import { FaStar } from 'react-icons/fa'
import { useTheme } from '../hooks/useTheme'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showValue?: boolean
  className?: string
  interactive?: boolean
  onRatingChange?: (rating: number) => void
}

export default function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  showValue = false,
  className = '',
  interactive = false,
  onRatingChange
}: StarRatingProps) {
  const { theme } = useTheme()
  const [hoveredRating, setHoveredRating] = React.useState(0)

  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  }

  const starSize = sizeClasses[size]

  const handleStarClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1)
    }
  }

  const handleStarHover = (starIndex: number) => {
    if (interactive) {
      setHoveredRating(starIndex + 1)
    }
  }

  const handleStarLeave = () => {
    if (interactive) {
      setHoveredRating(0)
    }
  }

  const displayRating = hoveredRating || rating

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: maxRating }, (_, index) => (
        <FaStar
          key={index}
          className={`${starSize} ${
            index < displayRating
              ? 'text-yellow-400 fill-current'
              : theme === 'dark' 
                ? 'text-gray-600' 
                : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => handleStarClick(index)}
          onMouseEnter={() => handleStarHover(index)}
          onMouseLeave={handleStarLeave}
        />
      ))}
      {showValue && (
        <span className={`text-sm font-medium ml-2 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {rating}/{maxRating}
        </span>
      )}
    </div>
  )
} 