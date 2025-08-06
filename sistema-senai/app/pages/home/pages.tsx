'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import { FaClipboardList, FaClock, FaCheckCircle, FaExclamationTriangle, FaUsers, FaHeadset, FaHourglassHalf, FaStar } from 'react-icons/fa'

// --- TYPE DEFINITIONS ---
interface DecodedToken {
  userId: number
  userRole: string
  name: string
  email: string
}

interface Stat {
  title: string;
  value: string | number;
}

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
}

interface AdminData {
  stats: Stat[];
  tickets: { recent_tickets: Ticket[] };
  categories: { total_categories: number; total_subcategories: number };
  system: { last_updated: string };
}

interface AgentData {
  stats: Stat[];
  recent_tickets: Ticket[];
}

interface ClientData {
  stats: Stat[];
  recent_tickets: Ticket[];
}

type DashboardData = AdminData | AgentData | ClientData;

// --- DASHBOARD COMPONENTS ---

const AdminDashboard: React.FC<{ data?: AdminData }> = ({ 
  data = {
    stats: [],
    tickets: { recent_tickets: [] },
    categories: { total_categories: 0, total_subcategories: 0 },
    system: { last_updated: new Date().toISOString() }
  } as AdminData 
}) => {
  const { theme } = useTheme();
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Adaptar statIcons e outros elementos do design de page.tsx
  const statIcons: { [key: string]: React.ReactNode } = {
    'Tickets Abertos': <FaClipboardList className="text-blue-500" />,
    'Tickets em Andamento': <FaClock className="text-yellow-500" />,
    'Tickets Concluídos': <FaCheckCircle className="text-green-500" />,
    'Total de Usuários': <FaUsers className="text-purple-500" />,
  };

  // Funções de cores do design
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Em Andamento':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Pendente':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-500/20 text-red-400';
      case 'Média':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Baixa':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards adaptados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {data.stats.map((stat, index) => (
          <div
            key={index}
            className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold mt-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.value}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                {statIcons[stat.title] || <FaClipboardList className="text-white" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tickets adaptados */}
      <div className={`lg:col-span-2 rounded-xl shadow-sm border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className={`p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Tickets Recentes
            </h2>
            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
              Ver Todos
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {data.tickets.recent_tickets.map((ticket, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 transition-colors border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        #{ticket.id}
                      </span>
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium border
                        ${getStatusColor(ticket.status)}
                      `}>
                        {ticket.status}
                      </span>
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${getPriorityColor(ticket.priority)}
                      `}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className={`font-medium mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {ticket.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Informações do Sistema mantidas, mas com estilo atualizado se necessário */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Informações do Sistema</h2>
        <div className="space-y-4">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Total de Categorias</span><span className="font-semibold text-gray-900 dark:text-white">{data?.categories?.total_categories || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Total de Subcategorias</span><span className="font-semibold text-gray-900 dark:text-white">{data?.categories?.total_subcategories || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Última Atualização</span><span className="font-semibold text-gray-900 dark:text-white">{formatDate(data?.system?.last_updated || '')}</span></div>
        </div>
      </div>
    </div>
  );
};

const UserDashboard: React.FC<{ stats: Stat[]; tickets: Ticket[] }> = ({ stats, tickets }) => {
  const { theme } = useTheme();
  const statIcons: { [key: string]: React.ReactNode } = {
    'Chamados Abertos': <FaClipboardList className="text-blue-500" />,
    'Chamados em Andamento': <FaClock className="text-yellow-500" />,
    'Chamados Concluídos': <FaCheckCircle className="text-green-500" />,
    'Chamados Urgentes': <FaExclamationTriangle className="text-red-500" />,
  };

  // Funções de cores do design
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Em Andamento':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Pendente':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-500/20 text-red-400';
      case 'Média':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Baixa':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards adaptados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold mt-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.value}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                {statIcons[stat.title] || <FaClipboardList className="text-white" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tickets adaptados */}
      <div className={`rounded-xl shadow-sm border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className={`p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Tickets Recentes
            </h2>
            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
              Ver Todos
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`rounded-lg p-4 transition-colors border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          #{ticket.id}
                        </span>
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium border
                          ${getStatusColor(ticket.status)}
                        `}>
                          {ticket.status}
                        </span>
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${getPriorityColor(ticket.priority)}
                        `}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className={`font-medium mb-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {ticket.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Nenhum ticket recente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentDashboard: React.FC<{ data: AgentData }> = ({ data }) => {
  const { theme } = useTheme();
  const stats = data.stats;
  const tickets = data.recent_tickets;
  const statIcons: { [key: string]: React.ReactNode } = {
    'Chamados Atendidos': <FaHeadset className="text-blue-500" />,
    'Chamados Pendentes': <FaHourglassHalf className="text-yellow-500" />,
    'Chamados Resolvidos': <FaCheckCircle className="text-green-500" />,
    'Avaliação Média': <FaStar className="text-purple-500" />,
  };

  // Funções de cores do design
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Em Andamento':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Pendente':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-500/20 text-red-400';
      case 'Média':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Baixa':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards adaptados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold mt-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.value}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                {statIcons[stat.title] || <FaHeadset className="text-white" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tickets adaptados */}
      <div className={`rounded-xl shadow-sm border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className={`p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Chamados Recentes
            </h2>
            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
              Ver Todos
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`rounded-lg p-4 transition-colors border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          #{ticket.id}
                        </span>
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium border
                          ${getStatusColor(ticket.status)}
                        `}>
                          {ticket.status}
                        </span>
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${getPriorityColor(ticket.priority)}
                        `}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className={`font-medium mb-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {ticket.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Nenhum chamado recente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientDashboard: React.FC<{ data: ClientData }> = ({ data }) => {
  const { theme } = useTheme();
  const stats = data.stats;
  const tickets = data.recent_tickets;
  const statIcons: { [key: string]: React.ReactNode } = {
    'Meus Tickets': <FaClipboardList className="text-blue-500" />,
    'Tickets em Andamento': <FaClock className="text-yellow-500" />,
    'Tickets Concluídos': <FaCheckCircle className="text-green-500" />,
    'Tickets Urgentes': <FaExclamationTriangle className="text-red-500" />,
  };

  // Funções de cores do design
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Em Andamento':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Pendente':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-500/20 text-red-400';
      case 'Média':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Baixa':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards adaptados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold mt-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {stat.value}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                {statIcons[stat.title] || <FaClipboardList className="text-white" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tickets adaptados */}
      <div className={`rounded-xl shadow-sm border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className={`p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Meus Tickets
            </h2>
            <button className="text-red-600 hover:text-red-700 text-sm font-medium">
              Ver Todos
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`rounded-lg p-4 transition-colors border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          #{ticket.id}
                        </span>
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium border
                          ${getStatusColor(ticket.status)}
                        `}>
                          {ticket.status}
                        </span>
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${getPriorityColor(ticket.priority)}
                        `}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className={`font-medium mb-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {ticket.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Nenhum ticket recente.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function DashboardPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [userName, setUserName] = useState('Usuário')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token)
        // Verifica se o token tem o formato antigo (com userRole) ou novo (com role)
        const role = (decodedToken as any).role || decodedToken.userRole
        
        setUserName(decodedToken.name || 'Usuário')
        setUserEmail(decodedToken.email || '')
        setUserRole(role || 'user')

        const fetchDashboardData = async () => {
          try {
            const response = await fetch('http://localhost:3001/user/home', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: 'Resposta sem JSON.' }));
              throw new Error(`Falha ao buscar dados do dashboard: ${response.status} ${response.statusText} - ${errorData.message}`);
            }
            const data = await response.json();
            setDashboardData(data);
          } catch (error) {
            console.error(error);
          } finally {
            setLoading(false)
          }
        }

        fetchDashboardData()
      } catch (error) {
        console.error('Failed to decode token:', error)
        router.push('/pages/auth/login')
      }
    } else {
      router.push('/pages/auth/login')
    }
  }, [router])

  const renderDashboard = () => {
    if (!dashboardData) return <p>Não foi possível carregar os dados do dashboard.</p>;

    switch (userRole?.toLowerCase()) {
      case 'admin':
        return <AdminDashboard data={dashboardData as AdminData} />;
      case 'agent':
        return <AgentDashboard data={dashboardData as AgentData} />;
      case 'client':
        return <ClientDashboard data={dashboardData as ClientData} />;
      default:
        return <p>Perfil de usuário não reconhecido.</p>;
    }
  };

  if (loading) {
    return (
      <ResponsiveLayout>
        <div className="flex justify-center items-center h-screen"><p>Carregando...</p></div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout
      userName={userName}
      userEmail={userEmail}
      userType={userRole && typeof userRole === 'string' ? userRole.toLowerCase() : 'user'} 
      notifications={5} // Exemplo
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Bem-vindo, {userName}!
        </h1>
        {renderDashboard()}
      </div>
    </ResponsiveLayout>
  );
}
