'use client'

import React, { useState } from 'react'
import { FaStar, FaTimes, FaCheck } from 'react-icons/fa'
import { useTheme } from '../hooks/useTheme'
import { authCookies } from '../utils/cookies'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: number
  ticketTitle: string
  onRatingSubmitted: () => void
  userType?: 'client' | 'admin'
}

export default function RatingModal({ 
  isOpen, 
  onClose, 
  ticketId, 
  ticketTitle, 
  onRatingSubmitted,
  userType = 'client'
}: RatingModalProps) {
  const { theme } = useTheme()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      setError('Por favor, selecione uma avaliação')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const token = authCookies.getToken()
      if (!token) {
        throw new Error('Sessão expirada')
      }

      const endpoint = userType === 'admin' 
        ? `/admin/ticket/${ticketId}/rate` 
        : `/helpdesk/client/ticket/${ticketId}/rate`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          satisfaction_rating: rating,
          feedback: feedback.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao enviar avaliação')
      }

      // Sucesso
      onRatingSubmitted()
      onClose()
      
      // Reset form
      setRating(0)
      setFeedback('')
      setError('')
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar avaliação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0)
      setFeedback('')
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={handleClose}
      />
      <div className={`relative w-full max-w-md rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
        {/* Header */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Avaliar Atendimento
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
          <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Chamado: {ticketTitle}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Rating Stars */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Como você avalia o atendimento?
            </label>
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={isSubmitting}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                  }`}
                >
                  <FaStar 
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : theme === 'dark' 
                          ? 'text-gray-600' 
                          : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-center mt-2">
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {rating === 0 && 'Selecione uma avaliação'}
                {rating === 1 && 'Muito insatisfeito'}
                {rating === 2 && 'Insatisfeito'}
                {rating === 3 && 'Neutro'}
                {rating === 4 && 'Satisfeito'}
                {rating === 5 && 'Muito satisfeito'}
              </span>
            </div>
          </div>

          {/* Feedback */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Comentário (opcional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={isSubmitting}
              placeholder="Conte-nos sobre sua experiência com o atendimento..."
              rows={4}
              className={`w-full px-3 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 resize-none ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cancelar
            </button>
            <button
              onClick={handleRatingSubmit}
              disabled={isSubmitting || rating === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                rating === 0 || isSubmitting
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <FaCheck className="w-4 h-4" />
                  <span>Enviar Avaliação</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 