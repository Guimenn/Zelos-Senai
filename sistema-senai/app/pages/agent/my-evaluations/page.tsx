'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../../../hooks/useTheme'
import { useRequireRole } from '../../../../hooks/useAuth'
import { useI18n } from '../../../../contexts/I18nContext'
import ResponsiveLayout from '../../../../components/responsive-layout'
import { authCookies } from '../../../../utils/cookies'
import StarRating from '../../../../components/star-rating'
import {
  FaStar,
  FaUser,
  FaTools,
  FaComments,
  FaLightbulb,
  FaUsers,
  FaClock,
  FaChartLine,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaTimesCircle,
  FaTrophy,
  FaMedal,
  FaAward,
  FaTrendingUp,
  FaTrendingDown,
  FaMinus,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa'

interface Evaluation {
  id: number
  evaluation_date: string
  technical_skills: number
  communication: number
  problem_solving: number
  teamwork: number
  punctuality: number
  overall_rating: number
  strengths: string | null
  weaknesses: string | null
  recommendations: string | null
  comments: string | null
  is_confidential: boolean
  evaluator: {
    id: number
    name: string
    email: string
  }
}

interface EvaluationStats {
  totalEvaluations: number
  averageRatings: {
    technical_skills: number
    communication: number
    problem_solving: number
    teamwork: number
    punctuality: number
    overall_rating: number
  }
  lastEvaluation: Evaluation | null
  improvementTrend: {
    change: number
    percentage: number
    trend: 'improving' | 'declining' | 'stable'
  } | null
}

export default function MyEvaluationsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useI18n()
  const { user, isLoading: authLoading } = useRequireRole(['Agent'], '/pages/auth/unauthorized')
  
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [evaluationStats, setEvaluationStats] = useState<EvaluationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      loadMyEvaluations()
      loadMyEvaluationStats()
    }
  }, [authLoading, user])

  const loadMyEvaluations = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = authCookies.getToken()
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const response = await fetch('/agent/my-evaluations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar avaliações')
      }

      const data = await response.json()
      setEvaluations(data.evaluations || [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar avaliações')
    } finally {
      setLoading(false)
    }
  }

  const loadMyEvaluationStats = async () => {
    try {
      const token = authCookies.getToken()
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const response = await fetch('/agent/my-evaluation-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas')
      }

      const data = await response.json()
      setEvaluationStats(data)
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas:', err)
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-500'
    if (rating >= 4.0) return 'text-blue-500'
    if (rating >= 3.0) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getRatingDescription = (rating: number) => {
    if (rating >= 4.5) return 'Excelente'
    if (rating >= 4.0) return 'Muito Bom'
    if (rating >= 3.0) return 'Bom'
    if (rating >= 2.0) return 'Regular'
    return 'Precisa Melhorar'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <FaArrowUp className="text-green-500" />
      case 'declining':
        return <FaArrowDown className="text-red-500" />
      default:
        return <FaMinus className="text-gray-500" />
    }
  }

  const getAchievementIcon = (rating: number) => {
    if (rating >= 4.8) return <FaTrophy className="text-yellow-500" />
    if (rating >= 4.5) return <FaMedal className="text-blue-500" />
    if (rating >= 4.0) return <FaAward className="text-green-500" />
    return null
  }

  if (authLoading) {
    return (
      <ResponsiveLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Minhas Avaliações
          </h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Visualize suas avaliações de performance e acompanhe seu desenvolvimento
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className={`p-6 rounded-lg border ${
            theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
          }`}>
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Stats */}
            {evaluationStats && (
              <div className={`rounded-lg border p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Resumo Geral</h2>
                  {evaluationStats.averageRatings.overall_rating > 0 && (
                    <div className="flex items-center space-x-2">
                      {getAchievementIcon(evaluationStats.averageRatings.overall_rating)}
                      <span className={`text-lg font-semibold ${getRatingColor(evaluationStats.averageRatings.overall_rating)}`}>
                        {getRatingDescription(evaluationStats.averageRatings.overall_rating)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Overall Rating */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-3">
                      <FaStar className="text-yellow-500" />
                      <span className="font-semibold">Avaliação Geral</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <p className={`text-3xl font-bold ${getRatingColor(evaluationStats.averageRatings.overall_rating)}`}>
                        {evaluationStats.averageRatings.overall_rating.toFixed(1)}
                      </p>
                      <div>
                        <StarRating rating={evaluationStats.averageRatings.overall_rating} size="lg" />
                        <p className="text-sm text-gray-500">/ 5.0</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Evaluations */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-3">
                      <FaChartLine className="text-blue-500" />
                      <span className="font-semibold">Total Avaliações</span>
                    </div>
                    <p className="text-3xl font-bold">{evaluationStats.totalEvaluations}</p>
                    <p className="text-sm text-gray-500">avaliações recebidas</p>
                  </div>

                  {/* Last Evaluation */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-3">
                      <FaCalendarAlt className="text-green-500" />
                      <span className="font-semibold">Última Avaliação</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {evaluationStats.lastEvaluation 
                        ? new Date(evaluationStats.lastEvaluation.evaluation_date).toLocaleDateString('pt-BR')
                        : 'Nunca avaliado'
                      }
                    </p>
                    {evaluationStats.lastEvaluation && (
                      <div className="flex items-center space-x-2 mt-2">
                        <StarRating rating={evaluationStats.lastEvaluation.overall_rating} size="sm" />
                        <span className="text-sm text-gray-500">
                          {evaluationStats.lastEvaluation.overall_rating}/5
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Improvement Trend */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-3">
                      {evaluationStats.improvementTrend ? (
                        evaluationStats.improvementTrend.trend === 'improving' ? (
                          <FaTrendingUp className="text-green-500" />
                        ) : evaluationStats.improvementTrend.trend === 'declining' ? (
                          <FaTrendingDown className="text-red-500" />
                        ) : (
                          <FaMinus className="text-gray-500" />
                        )
                      ) : (
                        <FaMinus className="text-gray-500" />
                      )}
                      <span className="font-semibold">Tendência</span>
                    </div>
                    {evaluationStats.improvementTrend ? (
                      <div>
                        <p className="text-lg font-semibold capitalize">
                          {evaluationStats.improvementTrend.trend === 'improving' ? 'Melhorando' :
                           evaluationStats.improvementTrend.trend === 'declining' ? 'Declinando' : 'Estável'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {evaluationStats.improvementTrend.change > 0 ? '+' : ''}
                          {evaluationStats.improvementTrend.change} pontos
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Dados insuficientes</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Ratings */}
            {evaluationStats && (
              <div className={`rounded-lg border p-6 ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className="text-xl font-semibold mb-6">Avaliações por Critério</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(evaluationStats.averageRatings).map(([criteria, rating]) => {
                    if (criteria === 'overall_rating') return null
                    
                    const criteriaLabels = {
                      technical_skills: 'Habilidades Técnicas',
                      communication: 'Comunicação',
                      problem_solving: 'Resolução de Problemas',
                      teamwork: 'Trabalho em Equipe',
                      punctuality: 'Pontualidade'
                    }
                    
                    const criteriaIcons = {
                      technical_skills: FaTools,
                      communication: FaComments,
                      problem_solving: FaLightbulb,
                      teamwork: FaUsers,
                      punctuality: FaClock
                    }
                    
                    const Icon = criteriaIcons[criteria as keyof typeof criteriaIcons]
                    const label = criteriaLabels[criteria as keyof typeof criteriaLabels]
                    
                    return (
                      <div key={criteria} className={`p-4 rounded-lg border ${
                        theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-2 mb-3">
                          <Icon className="text-blue-500" />
                          <span className="font-semibold">{label}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <p className={`text-2xl font-bold ${getRatingColor(rating)}`}>
                            {rating.toFixed(1)}
                          </p>
                          <div>
                            <StarRating rating={rating} size="md" />
                            <p className="text-sm text-gray-500">/ 5.0</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Evaluations History */}
            <div className={`rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`p-6 border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className="text-xl font-semibold">Histórico de Avaliações</h3>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {evaluations.length} avaliação{evaluations.length !== 1 ? 'ões' : ''} recebida{evaluations.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {evaluations.length === 0 ? (
                  <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <FaUser className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h4 className="text-lg font-semibold mb-2">Nenhuma Avaliação</h4>
                    <p>Você ainda não recebeu nenhuma avaliação de performance.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {evaluations.map((evaluation) => (
                      <div key={evaluation.id} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-lg">
                                Avaliação #{evaluation.id}
                              </span>
                              {evaluation.is_confidential && (
                                <FaEyeSlash className="text-red-500" title="Avaliação confidencial" />
                              )}
                            </div>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Avaliado por {evaluation.evaluator.name} • {new Date(evaluation.evaluation_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${getRatingColor(evaluation.overall_rating)}`}>
                                {evaluation.overall_rating}/5
                              </p>
                              <p className="text-sm text-gray-500">
                                {getRatingDescription(evaluation.overall_rating)}
                              </p>
                            </div>
                            <StarRating rating={evaluation.overall_rating} size="lg" />
                          </div>
                        </div>
                        
                        {/* Criteria Ratings */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Habilidades Técnicas</p>
                            <StarRating rating={evaluation.technical_skills} size="sm" />
                            <p className="text-xs text-gray-500 mt-1">{evaluation.technical_skills}/5</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Comunicação</p>
                            <StarRating rating={evaluation.communication} size="sm" />
                            <p className="text-xs text-gray-500 mt-1">{evaluation.communication}/5</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Resolução de Problemas</p>
                            <StarRating rating={evaluation.problem_solving} size="sm" />
                            <p className="text-xs text-gray-500 mt-1">{evaluation.problem_solving}/5</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Trabalho em Equipe</p>
                            <StarRating rating={evaluation.teamwork} size="sm" />
                            <p className="text-xs text-gray-500 mt-1">{evaluation.teamwork}/5</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Pontualidade</p>
                            <StarRating rating={evaluation.punctuality} size="sm" />
                            <p className="text-xs text-gray-500 mt-1">{evaluation.punctuality}/5</p>
                          </div>
                        </div>

                        {/* Feedback */}
                        {(evaluation.strengths || evaluation.weaknesses || evaluation.recommendations || evaluation.comments) && (
                          <div className={`p-4 rounded-lg ${
                            theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'
                          }`}>
                            {evaluation.strengths && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-green-600 flex items-center space-x-2">
                                  <FaTrendingUp />
                                  <span>Pontos Fortes</span>
                                </p>
                                <p className="text-sm mt-1">{evaluation.strengths}</p>
                              </div>
                            )}
                            {evaluation.weaknesses && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-red-600 flex items-center space-x-2">
                                  <FaTrendingDown />
                                  <span>Pontos de Melhoria</span>
                                </p>
                                <p className="text-sm mt-1">{evaluation.weaknesses}</p>
                              </div>
                            )}
                            {evaluation.recommendations && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-blue-600 flex items-center space-x-2">
                                  <FaLightbulb />
                                  <span>Recomendações</span>
                                </p>
                                <p className="text-sm mt-1">{evaluation.recommendations}</p>
                              </div>
                            )}
                            {evaluation.comments && (
                              <div>
                                <p className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                                  <FaComments />
                                  <span>Comentários Gerais</span>
                                </p>
                                <p className="text-sm mt-1">{evaluation.comments}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  )
}
