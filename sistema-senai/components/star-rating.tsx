'use client'

import React from 'react'
import { FaStar } from 'react-icons/fa'
import { useTheme } from '../hooks/useTheme'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

export default function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  showValue = false,
  className = ''
}: StarRatingProps) {
  const { theme } = useTheme()

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const starSize = sizeClasses[size]

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {Array.from({ length: maxRating }, (_, index) => (
        <FaStar
          key={index}
          className={`${starSize} ${
            index < rating
              ? 'text-yellow-400 fill-current'
              : theme === 'dark' 
                ? 'text-gray-600' 
                : 'text-gray-300'
          }`}
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