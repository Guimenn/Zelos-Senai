'use client'

import React, { useState } from 'react'
import { FaStar, FaTimes, FaCheck, FaUser, FaTools, FaComments, FaLightbulb, FaUsers, FaClock } from 'react-icons/fa'
import { useTheme } from '../hooks/useTheme'
import { authCookies } from '../utils/cookies'

interface AgentEvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: number
  agentName: string
  onEvaluationSubmitted: () => void
}

interface EvaluationCriteria {
  technical_skills: number
  communication: number
  problem_solving: number
  teamwork: number
  punctuality: number
  overall_rating: number
}

export default function AgentEvaluationModal({ 
  isOpen, 
  onClose, 
  agentId, 
  agentName, 
  onEvaluationSubmitted 
}: AgentEvaluationModalProps) {
  const { theme } = useTheme()
  const [evaluation, setEvaluation] = useState<EvaluationCriteria>({
    technical_skills: 0,
    communication: 0,
    problem_solving: 0,
    teamwork: 0,
    punctuality: 0,
    overall_rating: 0
  })
  const [hoveredRatings, setHoveredRatings] = useState<EvaluationCriteria>({
    technical_skills: 0,
    communication: 0,
    problem_solving: 0,
    teamwork: 0,
    punctuality: 0,
    overall_rating: 0
  })
  const [feedback, setFeedback] = useState({
    strengths: '',
    weaknesses: '',
    recommendations: '',
    comments: ''
  })
  const [isConfidential, setIsConfidential] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const criteriaLabels = {
    technical_skills: 'Habilidades Técnicas',
    communication: 'Comunicação',
    problem_solving: 'Resolução de Problemas',
    teamwork: 'Trabalho em Equipe',
    punctuality: 'Pontualidade',
    overall_rating: 'Avaliação Geral'
  }

  const criteriaIcons = {
    technical_skills: FaTools,
    communication: FaComments,
    problem_solving: FaLightbulb,
    teamwork: FaUsers,
    punctuality: FaClock,
    overall_rating: FaUser
  }

  const criteriaDescriptions = {
    technical_skills: 'Conhecimento técnico e capacidade de resolver problemas complexos',
    communication: 'Clareza na comunicação com clientes e colegas',
    problem_solving: 'Capacidade de analisar e resolver problemas de forma eficaz',
    teamwork: 'Colaboração e trabalho em equipe',
    punctuality: 'Cumprimento de prazos e horários',
    overall_rating: 'Avaliação geral do desempenho'
  }

  const handleRatingChange = (criteria: keyof EvaluationCriteria, rating: number) => {
    setEvaluation(prev => ({ ...prev, [criteria]: rating }))
    
    // Calcular avaliação geral automaticamente (média dos outros critérios)
    if (criteria !== 'overall_rating') {
      const newEvaluation = { ...evaluation, [criteria]: rating }
      const otherRatings = Object.keys(newEvaluation)
        .filter(key => key !== 'overall_rating')
        .map(key => newEvaluation[key as keyof EvaluationCriteria])
        .filter(rating => rating > 0)
      
      if (otherRatings.length > 0) {
        const average = Math.round(otherRatings.reduce((sum, r) => sum + r, 0) / otherRatings.length)
        setEvaluation(prev => ({ ...prev, [criteria]: rating, overall_rating: average }))
      }
    }
  }

  const handleRatingHover = (criteria: keyof EvaluationCriteria, rating: number) => {
    setHoveredRatings(prev => ({ ...prev, [criteria]: rating }))
  }

  const handleRatingLeave = (criteria: keyof EvaluationCriteria) => {
    setHoveredRatings(prev => ({ ...prev, [criteria]: 0 }))
  }

  const getRatingDescription = (rating: number) => {
    if (rating === 0) return 'Selecione uma avaliação'
    if (rating === 1) return 'Muito insatisfatório'
    if (rating === 2) return 'Insatisfatório'
    if (rating === 3) return 'Regular'
    if (rating === 4) return 'Bom'
    if (rating === 5) return 'Excelente'
    return ''
  }

  const handleSubmit = async () => {
    // Validar se todos os critérios foram avaliados
    const requiredFields: (keyof EvaluationCriteria)[] = ['technical_skills', 'communication', 'problem_solving', 'teamwork', 'punctuality', 'overall_rating']
    const missingFields = requiredFields.filter(field => evaluation[field] === 0)
    
    if (missingFields.length > 0) {
      setError('Por favor, avalie todos os critérios')
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
          ...evaluation,
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
      setEvaluation({
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
      setEvaluation({
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
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Evaluation Criteria */}
          <div className="space-y-6 mb-8">
            {Object.entries(criteriaLabels).map(([key, label]) => {
              const criteriaKey = key as keyof EvaluationCriteria
              const Icon = criteriaIcons[criteriaKey]
              const description = criteriaDescriptions[criteriaKey]
              const rating = evaluation[criteriaKey]
              const hoveredRating = hoveredRatings[criteriaKey]

              return (
                <div key={key} className={`p-4 rounded-lg border ${
                  theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-start space-x-3 mb-3">
                    <Icon className={`w-5 h-5 mt-1 ${
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{label}</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(criteriaKey, star)}
                        onMouseEnter={() => handleRatingHover(criteriaKey, star)}
                        onMouseLeave={() => handleRatingLeave(criteriaKey)}
                        disabled={isSubmitting}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                        }`}
                      >
                        <FaStar 
                          className={`w-6 h-6 ${
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
                  
                  {/* Rating Description */}
                  <div className="text-center">
                    <span className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {getRatingDescription(rating)}
                    </span>
                  </div>
                </div>
              )
            })}
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
