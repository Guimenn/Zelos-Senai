'use client'

import React, { useState } from 'react'
import { FaStar, FaTimes, FaCheck, FaUser } from 'react-icons/fa'
import { useTheme } from '../hooks/useTheme'
import { authCookies } from '../utils/cookies'

interface AgentEvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: number
  agentName: string
  onEvaluationSubmitted: () => void
}

export default function AgentEvaluationModal({ 
  isOpen, 
  onClose, 
  agentId, 
  agentName, 
  onEvaluationSubmitted 
}: AgentEvaluationModalProps) {
  const { theme } = useTheme()
  const [ratings, setRatings] = useState({
    technical_skills: 0,
    communication: 0,
    problem_solving: 0,
    teamwork: 0,
    punctuality: 0,
    overall_rating: 0
  })
  const [hoveredRating, setHoveredRating] = useState<{ [key: string]: number }>({})
  const [feedback, setFeedback] = useState({
    strengths: '',
    weaknesses: '',
    recommendations: '',
    comments: ''
  })
  const [isConfidential, setIsConfidential] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const criteria = [
    { key: 'technical_skills', label: 'Habilidades Técnicas', description: 'Conhecimento técnico e domínio das ferramentas' },
    { key: 'communication', label: 'Comunicação', description: 'Clareza na comunicação e interação com clientes' },
    { key: 'problem_solving', label: 'Resolução de Problemas', description: 'Capacidade de analisar e resolver problemas' },
    { key: 'teamwork', label: 'Trabalho em Equipe', description: 'Colaboração e trabalho em grupo' },
    { key: 'punctuality', label: 'Pontualidade', description: 'Cumprimento de prazos e horários' }
  ]

  const getRatingDescription = (rating: number) => {
    if (rating === 0) return 'Selecione uma avaliação'
    if (rating === 1) return 'Muito insatisfatório'
    if (rating === 2) return 'Insatisfatório'
    if (rating === 3) return 'Regular'
    if (rating === 4) return 'Bom'
    if (rating === 5) return 'Excelente'
    return ''
  }

  const handleRatingChange = (criteriaKey: string, value: number) => {
    setRatings(prev => {
      const newRatings = { ...prev, [criteriaKey]: value }
      
      // Calcular média para overall_rating
      const criteriaRatings = criteria.map(c => newRatings[c.key as keyof typeof newRatings]).filter(r => r > 0)
      const average = criteriaRatings.length > 0 
        ? Math.round(criteriaRatings.reduce((a, b) => a + b, 0) / criteriaRatings.length)
        : 0
      
      return { ...newRatings, overall_rating: average }
    })
  }

  const handleSubmit = async () => {
    // Verificar se todos os critérios foram avaliados
    const unratedCriteria = criteria.filter(c => ratings[c.key as keyof typeof ratings] === 0)
    if (unratedCriteria.length > 0) {
      setError(`Por favor, avalie: ${unratedCriteria.map(c => c.label).join(', ')}`)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const token = authCookies.getToken()
      if (!token) {
        throw new Error('Sessão expirada')
      }

      const response = await fetch(`/admin/agent/${agentId}/evaluate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          technical_skills: ratings.technical_skills,
          communication: ratings.communication,
          problem_solving: ratings.problem_solving,
          teamwork: ratings.teamwork,
          punctuality: ratings.punctuality,
          overall_rating: ratings.overall_rating,
          strengths: feedback.strengths.trim() || undefined,
          weaknesses: feedback.weaknesses.trim() || undefined,
          recommendations: feedback.recommendations.trim() || undefined,
          comments: feedback.comments.trim() || undefined,
          is_confidential: isConfidential
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao enviar avaliação')
      }

      // Sucesso
      onEvaluationSubmitted()
      onClose()
      
      // Reset form
      setRatings({
        technical_skills: 0,
        communication: 0,
        problem_solving: 0,
        teamwork: 0,
        punctuality: 0,
        overall_rating: 0
      })
      setFeedback({
        strengths: '',
        weaknesses: '',
        recommendations: '',
        comments: ''
      })
      setIsConfidential(false)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar avaliação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setRatings({
        technical_skills: 0,
        communication: 0,
        problem_solving: 0,
        teamwork: 0,
        punctuality: 0,
        overall_rating: 0
      })
      setFeedback({
        strengths: '',
        weaknesses: '',
        recommendations: '',
        comments: ''
      })
      setIsConfidential(false)
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div>
            <h2 className="text-xl font-bold">Avaliação de Performance</h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Avaliando: <span className="font-semibold">{agentName}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Rating Criteria */}
          <div className="space-y-6 mb-8">
            {criteria.map((criterion) => (
              <div key={criterion.key} className="border-b pb-4">
                <div className="mb-3">
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {criterion.label}
                  </label>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                    {criterion.description}
                  </p>
                </div>
                
                {/* Stars */}
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(criterion.key, star)}
                      onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [criterion.key]: star }))}
                      onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [criterion.key]: 0 }))}
                      disabled={isSubmitting}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                      }`}
                    >
                      <FaStar 
                        className={`w-6 h-6 ${
                          star <= (hoveredRating[criterion.key] || ratings[criterion.key as keyof typeof ratings])
                            ? 'text-yellow-400 fill-current'
                            : theme === 'dark' 
                              ? 'text-gray-600' 
                              : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                
                <div className="mt-2">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {getRatingDescription(ratings[criterion.key as keyof typeof ratings])}
                  </span>
                </div>
              </div>
            ))}

            {/* Overall Rating */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
              <div className="mb-3">
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Avaliação Geral (Média Automática)
                </label>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                  Calculada automaticamente com base nas avaliações individuais
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar 
                    key={star}
                    className={`w-8 h-8 ${
                      star <= ratings.overall_rating
                        ? 'text-yellow-400 fill-current'
                        : theme === 'dark' 
                          ? 'text-gray-600' 
                          : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-3 text-lg font-semibold">
                  {ratings.overall_rating}/5
                </span>
              </div>
              
              <div className="mt-2">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getRatingDescription(ratings.overall_rating)}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold">Feedback Detalhado</h3>
            
            {/* Strengths */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Pontos Fortes
              </label>
              <textarea
                value={feedback.strengths}
                onChange={(e) => setFeedback(prev => ({ ...prev, strengths: e.target.value }))}
                placeholder="Descreva os pontos fortes do técnico..."
                rows={3}
                className={`w-full p-3 rounded-lg border resize-none ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Weaknesses */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Pontos de Melhoria
              </label>
              <textarea
                value={feedback.weaknesses}
                onChange={(e) => setFeedback(prev => ({ ...prev, weaknesses: e.target.value }))}
                placeholder="Descreva os pontos que precisam de melhoria..."
                rows={3}
                className={`w-full p-3 rounded-lg border resize-none ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Recommendations */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Recomendações
              </label>
              <textarea
                value={feedback.recommendations}
                onChange={(e) => setFeedback(prev => ({ ...prev, recommendations: e.target.value }))}
                placeholder="Sugestões para desenvolvimento profissional..."
                rows={3}
                className={`w-full p-3 rounded-lg border resize-none ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* General Comments */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Comentários Gerais
              </label>
              <textarea
                value={feedback.comments}
                onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Comentários adicionais..."
                rows={3}
                className={`w-full p-3 rounded-lg border resize-none ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Confidential Toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="confidential"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="confidential" className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Avaliação confidencial (não será visível para o técnico)
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end space-x-3 p-6 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              isSubmitting
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
  )
}
