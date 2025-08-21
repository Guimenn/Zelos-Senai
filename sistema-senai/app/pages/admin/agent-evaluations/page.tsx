'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../../../hooks/useTheme'
import { useRequireRole } from '../../../../hooks/useAuth'
import { useI18n } from '../../../../contexts/I18nContext'
import ResponsiveLayout from '../../../../components/responsive-layout'
import { authCookies } from '../../../../utils/cookies'
import AgentEvaluationModal from '../../../../components/agent-evaluation-modal'
import StarRating from '../../../../components/star-rating'
import {
  FaStar,
  FaUser,
  FaTools,
  FaComments,
  FaLightbulb,
  FaUsers,
  FaClock,
  FaPlus,
  FaEye,
  FaFilter,
  FaSearch,
  FaSort,
  FaChartLine,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaArrowUp,
  FaArrowDown,
  FaEyeSlash
} from 'react-icons/fa'

interface Agent {
  id: number
  employee_id: string
  department: string
  user: {
    id: number
    name: string
    email: string
    is_active: boolean
  }
  evaluationStats: {
    totalEvaluations: number
    averageRating: number
    lastEvaluationDate: string | null
  }
}

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

export default function AgentEvaluationsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { t } = useI18n()
  const { user, isLoading: authLoading } = useRequireRole(['Admin'], '/pages/auth/unauthorized')
  
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [evaluationStats, setEvaluationStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false)
  const [selectedAgentForEvaluation, setSelectedAgentForEvaluation] = useState<Agent | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [sortBy, setSortBy] = useState('averageRating')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showConfidential, setShowConfidential] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      loadAgents()
    }
  }, [authLoading, user])

  const loadAgents = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = authCookies.getToken()
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const response = await fetch('/admin/agents/evaluations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar agentes')
      }

      const data = await response.json()
      setAgents(data.agents || [])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar agentes')
    } finally {
      setLoading(false)
    }
  }

  const loadAgentEvaluations = async (agentId: number) => {
    try {
      const token = authCookies.getToken()
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const response = await fetch(`/admin/agent/${agentId}/evaluations?confidential=${showConfidential}`, {
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
      console.error('Erro ao carregar avaliações:', err)
    }
  }

  const loadAgentStats = async (agentId: number) => {
    try {
      const token = authCookies.getToken()
      if (!token) {
        throw new Error('Token não encontrado')
      }

      const response = await fetch(`/admin/agent/${agentId}/evaluation-stats`, {
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

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent)
    loadAgentEvaluations(agent.id)
    loadAgentStats(agent.id)
  }

  const handleOpenEvaluationModal = (agent: Agent) => {
    setSelectedAgentForEvaluation(agent)
    setEvaluationModalOpen(true)
  }

  const handleEvaluationSubmitted = () => {
    loadAgents()
    if (selectedAgent) {
      loadAgentEvaluations(selectedAgent.id)
      loadAgentStats(selectedAgent.id)
    }
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = departmentFilter === 'all' || agent.department === departmentFilter
    
    return matchesSearch && matchesDepartment
  })

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    const aValue = a.evaluationStats[sortBy as keyof typeof a.evaluationStats] || 0
    const bValue = b.evaluationStats[sortBy as keyof typeof b.evaluationStats] || 0
    
    if (sortOrder === 'desc') {
      return bValue - aValue
    } else {
      return aValue - bValue
    }
  })

  const departments = Array.from(new Set(agents.map(agent => agent.department).filter(Boolean)))

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-500'
    if (rating >= 4.0) return 'text-blue-500'
    if (rating >= 3.0) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <FaArrowUp className="text-green-500" />
      case 'declining':
        return <FaArrowDown className="text-red-500" />
      default:
        return <FaTimesCircle className="text-gray-500" />
    }
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
            Avaliações de Técnicos
          </h1>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Gerencie e visualize as avaliações de performance dos técnicos
          </p>
        </div>

        {/* Filters */}
        <div className={`mb-6 p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Buscar técnico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="all">Todos os Departamentos</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="averageRating">Avaliação Média</option>
              <option value="totalEvaluations">Total de Avaliações</option>
              <option value="lastEvaluationDate">Última Avaliação</option>
            </select>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className={`px-4 py-2 rounded-lg border flex items-center justify-center space-x-2 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <FaSort />
              <span>{sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agents List */}
          <div className="lg:col-span-1">
            <div className={`rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`p-4 border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h2 className="text-lg font-semibold">Técnicos ({sortedAgents.length})</h2>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-red-600">{error}</div>
                ) : sortedAgents.length === 0 ? (
                  <div className={`p-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Nenhum técnico encontrado
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedAgents.map((agent) => (
                      <div
                        key={agent.id}
                        onClick={() => handleAgentSelect(agent)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedAgent?.id === agent.id
                            ? theme === 'dark' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-blue-50 border-l-4 border-blue-500'
                            : theme === 'dark'
                              ? 'hover:bg-gray-700'
                              : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{agent.user.name}</h3>
                          <div className="flex items-center space-x-2">
                            <StarRating 
                              rating={agent.evaluationStats.averageRating} 
                              size="sm" 
                              showValue 
                            />
                            {agent.evaluationStats.averageRating === 0 && (
                              <span className="text-xs text-gray-500">Sem avaliações</span>
                            )}
                          </div>
                        </div>
                        
                        <div className={`text-sm ${selectedAgent?.id === agent.id ? 'text-blue-100' : 'text-gray-500'}`}>
                          <p>{agent.employee_id}</p>
                          <p>{agent.department}</p>
                          <p>{agent.evaluationStats.totalEvaluations} avaliações</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Agent Details */}
          <div className="lg:col-span-2">
            {selectedAgent ? (
              <div className="space-y-6">
                {/* Agent Header */}
                <div className={`rounded-lg border p-6 ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedAgent.user.name}</h2>
                      <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedAgent.employee_id} • {selectedAgent.department}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenEvaluationModal(selectedAgent)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <FaPlus className="w-4 h-4" />
                      <span>Avaliar</span>
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg border ${
                      theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <FaStar className="text-yellow-500" />
                        <span className="font-semibold">Avaliação Média</span>
                      </div>
                      <p className={`text-2xl font-bold ${getRatingColor(selectedAgent.evaluationStats.averageRating)}`}>
                        {selectedAgent.evaluationStats.averageRating.toFixed(1)}/5
                      </p>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${
                      theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <FaChartLine className="text-blue-500" />
                        <span className="font-semibold">Total Avaliações</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedAgent.evaluationStats.totalEvaluations}</p>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${
                      theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <FaCalendarAlt className="text-green-500" />
                        <span className="font-semibold">Última Avaliação</span>
                      </div>
                      <p className="text-sm">
                        {selectedAgent.evaluationStats.lastEvaluationDate 
                          ? new Date(selectedAgent.evaluationStats.lastEvaluationDate).toLocaleDateString('pt-BR')
                          : 'Nunca avaliado'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Evaluation Stats */}
                {evaluationStats && (
                  <div className={`rounded-lg border p-6 ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h3 className="text-lg font-semibold mb-4">Estatísticas Detalhadas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Average Ratings by Criteria */}
                      <div>
                        <h4 className="font-medium mb-3">Médias por Critério</h4>
                        <div className="space-y-3">
                          {Object.entries(evaluationStats.averageRatings || {}).map(([criteria, rating]) => (
                            <div key={criteria} className="flex items-center justify-between">
                              <span className="capitalize">{criteria.replace('_', ' ')}</span>
                              <div className="flex items-center space-x-2">
                                <StarRating rating={rating as number} size="sm" showValue />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Improvement Trend */}
                      <div>
                        <h4 className="font-medium mb-3">Tendência de Melhoria</h4>
                        {evaluationStats.improvementTrend ? (
                          <div className={`p-4 rounded-lg border ${
                            theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="flex items-center space-x-2 mb-2">
                              {getTrendIcon(evaluationStats.improvementTrend.trend)}
                              <span className="font-semibold capitalize">
                                {evaluationStats.improvementTrend.trend === 'improving' ? 'Melhorando' :
                                 evaluationStats.improvementTrend.trend === 'declining' ? 'Declinando' : 'Estável'}
                              </span>
                            </div>
                            <p className="text-sm">
                              {evaluationStats.improvementTrend.change > 0 ? '+' : ''}
                              {evaluationStats.improvementTrend.change} pontos 
                              ({evaluationStats.improvementTrend.percentage > 0 ? '+' : ''}
                              {evaluationStats.improvementTrend.percentage}%)
                            </p>
                          </div>
                        ) : (
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Dados insuficientes para calcular tendência
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Evaluations List */}
                <div className={`rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className={`p-4 border-b ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Histórico de Avaliações</h3>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={showConfidential}
                          onChange={(e) => setShowConfidential(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">Mostrar confidenciais</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {evaluations.length === 0 ? (
                      <div className={`p-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Nenhuma avaliação encontrada
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {evaluations.map((evaluation) => (
                          <div key={evaluation.id} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold">
                                    Avaliação #{evaluation.id}
                                  </span>
                                  {evaluation.is_confidential && (
                                    <FaEyeSlash className="text-red-500" title="Avaliação confidencial" />
                                  )}
                                </div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Por {evaluation.evaluator.name} • {new Date(evaluation.evaluation_date).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <StarRating rating={evaluation.overall_rating} size="sm" showValue />
                              </div>
                            </div>
                            
                            {/* Criteria Ratings */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Técnico</p>
                                <StarRating rating={evaluation.technical_skills} size="xs" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Comunicação</p>
                                <StarRating rating={evaluation.communication} size="xs" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Problemas</p>
                                <StarRating rating={evaluation.problem_solving} size="xs" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Equipe</p>
                                <StarRating rating={evaluation.teamwork} size="xs" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Pontualidade</p>
                                <StarRating rating={evaluation.punctuality} size="xs" />
                              </div>
                            </div>

                            {/* Feedback */}
                            {(evaluation.strengths || evaluation.weaknesses || evaluation.recommendations || evaluation.comments) && (
                              <div className={`p-3 rounded-lg ${
                                theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'
                              }`}>
                                {evaluation.strengths && (
                                  <div className="mb-2">
                                    <p className="text-sm font-medium text-green-600">Pontos Fortes:</p>
                                    <p className="text-sm">{evaluation.strengths}</p>
                                  </div>
                                )}
                                {evaluation.weaknesses && (
                                  <div className="mb-2">
                                    <p className="text-sm font-medium text-red-600">Pontos de Melhoria:</p>
                                    <p className="text-sm">{evaluation.weaknesses}</p>
                                  </div>
                                )}
                                {evaluation.recommendations && (
                                  <div className="mb-2">
                                    <p className="text-sm font-medium text-blue-600">Recomendações:</p>
                                    <p className="text-sm">{evaluation.recommendations}</p>
                                  </div>
                                )}
                                {evaluation.comments && (
                                  <div>
                                    <p className="text-sm font-medium text-gray-600">Comentários:</p>
                                    <p className="text-sm">{evaluation.comments}</p>
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
            ) : (
              <div className={`rounded-lg border p-8 text-center ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <FaUser className={`w-16 h-16 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className="text-lg font-semibold mb-2">Selecione um Técnico</h3>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Escolha um técnico da lista para visualizar suas avaliações e estatísticas
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Evaluation Modal */}
      {selectedAgentForEvaluation && (
        <AgentEvaluationModal
          isOpen={evaluationModalOpen}
          onClose={() => {
            setEvaluationModalOpen(false)
            setSelectedAgentForEvaluation(null)
          }}
          agentId={selectedAgentForEvaluation.id}
          agentName={selectedAgentForEvaluation.user.name}
          onEvaluationSubmitted={handleEvaluationSubmitted}
        />
      )}
    </ResponsiveLayout>
  )
}
