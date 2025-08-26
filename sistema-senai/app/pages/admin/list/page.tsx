'use client'

import React, { useEffect, useMemo, useState } from 'react'
import ResponsiveLayout from '../../../../components/responsive-layout'
import { useTheme } from '../../../../hooks/useTheme'
import { useI18n } from '../../../../contexts/I18nContext'
import { useRequireRole } from '../../../../hooks/useAuth'
import { authCookies } from '../../../../utils/cookies'
import { FaSearch, FaUserShield, FaEnvelope, FaPhone, FaClock, FaUserCheck, FaUserTimes, FaEye, FaTrash, FaDownload, FaPrint, FaList, FaTh, FaEdit } from 'react-icons/fa'
import Link from 'next/link'
import ConfirmDeleteModal from '../../../../components/modals/ConfirmDeleteModal'
import AdminViewModal from '../../../../components/modals/AdminViewModal'

export default function AdminListPage() {
  const { theme } = useTheme()
  const { t } = useI18n()
  const { user, isLoading: authLoading } = useRequireRole(['Admin'], '/pages/auth/unauthorized')

  const [admins, setAdmins] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  
  // Estados para os modais
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
  const [adminDetails, setAdminDetails] = useState<any>(null)

  // Função auxiliar para verificar se é admin master
  const isAdminMaster = user?.email === 'admin@helpdesk.com'

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return admins.filter(a => {
      const matches = !s || [a.name, a.email, a.phone, a.position].some((v: string) => (v || '').toLowerCase().includes(s))
      const statusOk = status === 'all' || (status === 'active' ? a.is_active : !a.is_active)
      return matches && statusOk
    })
  }, [admins, search, status])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = authCookies.getToken()
        const params = new URLSearchParams()
        if (search.trim()) params.set('search', search.trim())
        if (status !== 'all') params.set('is_active', String(status === 'active'))
        const res = await fetch(`/admin/admins?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setAdmins(Array.isArray(data?.admins) ? data.admins : [])
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar administradores')
      } finally {
        setLoading(false)
      }
    }
    if (!authLoading) load()
  }, [authLoading, search, status])

  const handleViewAdmin = async (admin: any) => {
    try {
      const token = authCookies.getToken()
      const res = await fetch(`/admin/admin/${admin.id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Erro na resposta:', res.status, errorText)
        throw new Error(`Erro ${res.status}: ${errorText}`)
      }
      
      const data = await res.json()
      setAdminDetails(data.admin)
      setViewModalOpen(true)
    } catch (e: any) {
      console.error('Erro ao carregar detalhes do administrador:', e)
      // Se falhar, usar os dados básicos
      setAdminDetails(admin)
      setViewModalOpen(true)
    }
  }

  const handleDeleteAdmin = (admin: any) => {
    if (!isAdminMaster) {
      alert('Apenas o administrador master pode excluir outros administradores')
      return
    }
    setSelectedAdmin(admin)
    setDeleteModalOpen(true)
  }

  // Função para exportar para Excel
  const exportToExcel = () => {
    // Criar dados para exportação
    const data = filtered.map(admin => ({
      'ID': admin.id,
      'Nome': admin.name,
      'Email': admin.email,
      'Telefone': admin.phone || '-',
      'Cargo': admin.position || 'Administrador',
      'Status': admin.is_active ? 'Ativo' : 'Inativo',
      'Data de Criação': admin.created_at ? new Date(admin.created_at).toLocaleDateString('pt-BR') : '-',
      'Data de Atualização': admin.updated_at ? new Date(admin.updated_at).toLocaleDateString('pt-BR') : '-'
    }))

    // Criar cabeçalho
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
    ].join('\n')

    // Criar e baixar arquivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `administradores_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Função para exportar para PDF
  const exportToPDF = () => {
    // Criar conteúdo HTML para o PDF
    const content = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .date { color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Administradores</h1>
            <div class="date">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Cargo</th>
                <th>Status</th>
                <th>Data de Criação</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(admin => `
                <tr>
                  <td>${admin.id}</td>
                  <td>${admin.name}</td>
                  <td>${admin.email}</td>
                  <td>${admin.phone || '-'}</td>
                  <td>${admin.position || 'Administrador'}</td>
                  <td>${admin.is_active ? 'Ativo' : 'Inativo'}</td>
                  <td>${admin.created_at ? new Date(admin.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    // Abrir em nova janela para impressão
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(content)
      newWindow.document.close()
      newWindow.print()
    }
  }

  const confirmDelete = async () => {
    if (!selectedAdmin) return
    
    try {
      setDeleting(true)
      const token = authCookies.getToken()
      const res = await fetch(`/admin/admin/${selectedAdmin.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        if (res.status === 403) {
          throw new Error('Apenas o administrador master pode excluir outros administradores')
        }
        throw new Error(errorData.message || 'Erro ao excluir administrador')
      }
      
      // Remover da lista local
      setAdmins(prev => prev.filter(admin => admin.id !== selectedAdmin.id))
      setDeleteModalOpen(false)
      setSelectedAdmin(null)
    } catch (e: any) {
      console.error('Erro ao excluir administrador:', e)
      alert(e.message || 'Erro ao excluir administrador')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <ResponsiveLayout userType="admin" userName="Administrador SENAI" userEmail="admin@senai.com" notifications={0} className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}>
      <div className={`mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('admin.title')}</h1>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{t('admin.subtitle')}</p>
            
          </div>
          <Link href="/pages/admin/new" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">
            + {t('admin.new.button')}
          </Link>
        </div>
      </div>

      <div className={`rounded-xl p-4 mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            <div className="relative">
              <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.search.placeholder')} className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent`} />
            </div>
            <div>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent`}>
                <option value="all">{t('admin.filters.all')}</option>
                <option value="active">{t('admin.filters.active')}</option>
                <option value="inactive">{t('admin.filters.inactive')}</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            <button 
              onClick={exportToExcel}
              className={`p-2 rounded-lg ${theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}
              title="Exportar para Excel"
            >
              <FaDownload />
            </button>
            <button 
              onClick={exportToPDF}
              className={`p-2 rounded-lg ${theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}
              title="Exportar para PDF"
            >
              <FaPrint />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' 
                ? (theme === 'dark' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600')
                : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
              } transition-colors`}
              title="Visualização em lista"
            >
              <FaList />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' 
                ? (theme === 'dark' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-600')
                : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
              } transition-colors`}
              title="Visualização em grid"
            >
              <FaTh />
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          Carregando administradores...
        </div>
      )}
      {!loading && error && (
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-700'} border ${theme === 'dark' ? 'border-red-800' : 'border-red-200'}`}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className={`rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('admin.list.count').replace('{count}', filtered.length.toString())}</h2>
          </div>
          
          <div className="p-4 sm:p-6 w-full max-w-full overflow-hidden">
            {viewMode === 'list' ? (
              <div className="space-y-4 w-full">
                {filtered.map((a) => (
                  <div key={a.id} className={`rounded-lg p-4 flex items-center justify-between ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center">
                        {a.avatar ? <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" /> : <FaUserShield />}
                      </div>
                      <div>
                        <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{a.name}</div>
                        <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-sm`}>{a.position || 'Administrador'}</div>
                        <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-xs flex items-center gap-3`}>
                          <span className="flex items-center gap-1"><FaEnvelope /> {a.email}</span>
                          {a.phone && <span className="flex items-center gap-1"><FaPhone /> {a.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`px-2 py-1 rounded-full border ${a.is_active ? 'bg-green-500/20 text-green-600 border-green-500/30' : 'bg-red-500/20 text-red-600 border-red-500/30'}`}>
                          {a.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-1`}><FaClock /> {new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewAdmin(a)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark' 
                              ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10' 
                              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                          }`}
                          title="Visualizar detalhes"
                        >
                          <FaEye />
                        </button>
                        {a.id !== user?.id && isAdminMaster && (
                          <button
                            onClick={() => handleDeleteAdmin(a)}
                            className={`p-2 rounded-lg transition-colors ${
                              theme === 'dark' 
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title="Excluir administrador"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                {filtered.map((a) => (
                  <div key={a.id} className={`rounded-xl p-4 border transition-all duration-300 hover:shadow-lg w-full max-w-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-50'}`}>
                    {/* Header do Card Grid */}
                    <div className="flex items-center justify-between mb-3 w-full">
                      <span className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} break-words flex-1 min-w-0`}>
                        #{a.id}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleViewAdmin(a)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            theme === 'dark' 
                              ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10' 
                              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                          }`}
                          title="Visualizar"
                        >
                          <FaEye className="text-xs" />
                        </button>
                        {a.id !== user?.id && isAdminMaster && (
                          <button
                            onClick={() => handleDeleteAdmin(a)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              theme === 'dark' 
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title="Excluir"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Avatar e Informações */}
                    <div className="flex flex-col items-center text-center mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center mb-3">
                        {a.avatar ? <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" /> : <FaUserShield className="text-xl" />}
                      </div>
                      <h3 className={`font-semibold text-sm mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} break-words`}>
                        {a.name.length > 20 ? `${a.name.substring(0, 20)}...` : a.name}
                      </h3>
                      <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-words`}>
                        {a.position || 'Administrador'}
                      </p>
                    </div>

                    {/* Status e Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${a.is_active ? 'bg-green-500/20 text-green-600 border-green-500/30' : 'bg-red-500/20 text-red-600 border-red-500/30'}`}>
                        {a.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    {/* Informações de Contato */}
                    <div className="space-y-2 text-xs">
                      <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <FaEnvelope className="flex-shrink-0" />
                        <span className="truncate">{a.email.length > 25 ? `${a.email.substring(0, 25)}...` : a.email}</span>
                      </div>
                      {a.phone && (
                        <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <FaPhone className="flex-shrink-0" />
                          <span className="truncate">{a.phone.length > 15 ? `${a.phone.substring(0, 15)}...` : a.phone}</span>
                        </div>
                      )}
                      <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <FaClock className="flex-shrink-0" />
                        <span className="truncate">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {filtered.length === 0 && (
              <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>
                Nenhum administrador encontrado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de visualização */}
      <AdminViewModal
        isOpen={viewModalOpen}
        admin={adminDetails}
        onClose={() => {
          setViewModalOpen(false)
          setAdminDetails(null)
        }}
      />

      {/* Modal de confirmação de exclusão */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Excluir Administrador"
        description={`Tem certeza que deseja excluir o administrador "${selectedAdmin?.name}"? Esta ação não pode ser desfeita.${isAdminMaster ? ' Como administrador master, você tem permissão para realizar esta ação.' : ''}`}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirming={deleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false)
          setSelectedAdmin(null)
        }}
      />
    </ResponsiveLayout>
  )
}


