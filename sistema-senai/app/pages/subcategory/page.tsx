'use client'

import React, { useEffect, useMemo, useState } from 'react'
import ResponsiveLayout from '../../../components/responsive-layout'
import { useTheme } from '../../../hooks/useTheme'
import { FaPlus, FaSync, FaSearch, FaTag, FaExclamationTriangle } from 'react-icons/fa'

const API_BASE = ''

type Category = {
  id: number
  name: string
}

type SubcategoryCount = {
  tickets: number
}

type Subcategory = {
  id: number
  name: string
  description?: string | null
  category_id: number
  is_active?: boolean
  _count?: SubcategoryCount
}

export default function SubcategoriesPage() {
  const { theme } = useTheme()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [creating, setCreating] = useState<boolean>(false)
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState<string>('')
  const [editDescription, setEditDescription] = useState<string>('')
  const [confirm, setConfirm] = useState<
    | null
    | { mode: 'single'; subcategory: Subcategory }
    | { mode: 'bulk'; total: number }
  >(null)
  const [confirmBusy, setConfirmBusy] = useState<boolean>(false)
  const [confirmAck, setConfirmAck] = useState<boolean>(false)

  const containerBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white'
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900'
  const textSecondary = theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
  const surface = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
  const borderColor = theme === 'dark' ? 'border-gray-600' : 'border-gray-200'

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return subcategories
    return subcategories.filter(s =>
      s.name.toLowerCase().includes(term) || (s.description ?? '').toLowerCase().includes(term)
    )
  }, [subcategories, search])

  async function fetchCategories(signal?: AbortSignal) {
    try {
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')
      const res = await fetch(`${API_BASE}/helpdesk/categories?include_inactive=true`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
      if (!res.ok) throw new Error('Falha ao carregar categorias')
      const data = await res.json()
      setCategories(data)
      if (data.length > 0 && selectedCategoryId == null) {
        setSelectedCategoryId(data[0].id)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar categorias'
      setError(msg)
    }
  }

  async function fetchSubcategories(categoryId: number, signal?: AbortSignal) {
    try {
      setLoading(true)
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')
      const res = await fetch(`${API_BASE}/helpdesk/categories/${categoryId}/subcategories?include_inactive=true`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
      if (!res.ok) throw new Error('Falha ao carregar subcategorias')
      const data: Subcategory[] = await res.json()
      setSubcategories(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao carregar subcategorias'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchCategories(controller.signal).then(() => {
      const id = selectedCategoryId
      if (id) fetchSubcategories(id, controller.signal)
    })
    
    // Adicionar um evento para recarregar os dados quando a página receber foco
    const handleFocus = () => {
      const newController = new AbortController()
      fetchCategories(newController.signal).then(() => {
        const id = selectedCategoryId
        if (id) fetchSubcategories(id, newController.signal)
      })
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      controller.abort()
      window.removeEventListener('focus', handleFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedCategoryId) {
      const controller = new AbortController()
      fetchSubcategories(selectedCategoryId, controller.signal)
      return () => controller.abort()
    }
  }, [selectedCategoryId])

  function beginEdit(s: Subcategory) {
    setEditingId(s.id)
    setEditName(s.name)
    setEditDescription(s.description ?? '')
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditDescription('')
  }

  async function saveEdit(subcategoryId: number) {
    if (!editName.trim()) {
      setError('Nome é obrigatório para editar a subcategoria')
      return
    }
    try {
      setActionLoadingId(subcategoryId)
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')
      const res = await fetch(`${API_BASE}/helpdesk/subcategories/${subcategoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || undefined })
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as any
        throw new Error(payload?.message || 'Falha ao atualizar subcategoria')
      }
      const updated: Subcategory = await res.json()
      setSubcategories(prev => prev.map(s => s.id === updated.id ? updated : s))
      cancelEdit()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar subcategoria'
      setError(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    if (!selectedCategoryId) {
      setError('Selecione uma categoria')
      return
    }
    try {
      setCreating(true)
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')
      const res = await fetch(`${API_BASE}/helpdesk/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, category_id: selectedCategoryId })
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as any
        const msg = payload?.message || 'Falha ao criar subcategoria'
        throw new Error(msg)
      }
      const created: Subcategory = await res.json()
      setSubcategories(prev => [created, ...prev])
      setName('')
      setDescription('')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar subcategoria'
      setError(msg)
    } finally {
      setCreating(false)
    }
  }

  async function performDeleteOne(s: Subcategory) {
    try {
      setActionLoadingId(s.id)
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')
      const res = await fetch(`${API_BASE}/helpdesk/subcategories/${s.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as any
        throw new Error(payload?.message || 'Não foi possível excluir a subcategoria')
      }
      setSubcategories(prev => prev.filter(x => x.id !== s.id))
      if (editingId === s.id) cancelEdit()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir subcategoria'
      setError(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  async function performDeleteAll() {
    if (!selectedCategoryId || subcategories.length === 0) return
    try {
      setBulkDeleting(true)
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')
      const failed: { id: number; name: string; message: string }[] = []
      for (const s of subcategories) {
        try {
          const res = await fetch(`${API_BASE}/helpdesk/subcategories/${s.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) {
            const payload = await res.json().catch(() => ({})) as any
            const msg = payload?.message || 'Falha ao excluir'
            failed.push({ id: s.id, name: s.name, message: msg })
          }
        } catch (e) {
          failed.push({ id: s.id, name: s.name, message: e instanceof Error ? e.message : 'Erro desconhecido' })
        }
      }
      await fetchSubcategories(selectedCategoryId)
      if (failed.length > 0) {
        setError(`Algumas subcategorias não puderam ser excluídas (${failed.length}). Ex.: ${failed[0].name} - ${failed[0].message}`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir todas as subcategorias'
      setError(msg)
    } finally {
      setBulkDeleting(false)
    }
  }

  function openConfirmDeleteOne(s: Subcategory) {
    setConfirmAck(false)
    setConfirm({ mode: 'single', subcategory: s })
  }

  function openConfirmDeleteAll() {
    setConfirmAck(false)
    setConfirm({ mode: 'bulk', total: filtered.length })
  }

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Administrador SENAI"
      userEmail="admin@senai.com"
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}
    >
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <h1 className={`text-2xl font-bold ${textPrimary}`}>Subcategorias</h1>
            <p className={`${textSecondary}`}>Gerencie as subcategorias por categoria de chamados.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openConfirmDeleteAll}
              disabled={bulkDeleting || loading || filtered.length === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'} ${bulkDeleting ? 'opacity-60 cursor-not-allowed' : ''}`}
              title="Excluir todas as subcategorias listadas"
            >
              {bulkDeleting ? 'Excluindo…' : 'Excluir todas'}
            </button>
            <button
              onClick={() => selectedCategoryId && fetchSubcategories(selectedCategoryId)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              title="Recarregar"
            >
              <FaSync className="w-4 h-4" />
              Recarregar
            </button>
          </div>
        </div>

        {/* Seleção de categoria */}
        <div className={`rounded-2xl shadow ${containerBg} p-5`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Categoria</label>
              <select
                value={selectedCategoryId ?? ''}
                onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
              >
                {categories.length === 0 && <option value="">Carregando...</option>}
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <form onSubmit={handleCreate} className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Nome da subcategoria *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Impressoras"
                  className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Descrição (opcional)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrição"
                  className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-400'}`}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating || !selectedCategoryId}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${creating ? 'opacity-70 cursor-not-allowed' : ''} ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                  <FaPlus className="w-4 h-4" />
                  {creating ? 'Criando...' : 'Criar subcategoria'}
                </button>
              </div>
            </form>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-500">{error}</p>
          )}
        </div>

        <div className={`rounded-2xl shadow ${containerBg} p-5 space-y-4`}>
          <div className="flex items-center justify-between gap-3">
            <div className={`relative flex items-center w-full max-w-md`}>
              <FaSearch className={`absolute left-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou descrição"
                className={`w-full pl-10 pr-3 py-2 rounded-xl border ${borderColor} ${theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-400'}`}
              />
            </div>
            <div className={`${textSecondary} text-sm`}>
              {loading ? 'Carregando...' : `${filtered.length} subcategorias`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading && (
              <>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border ${borderColor} ${surface} animate-pulse`}>
                    <div className="h-5 w-1/3 rounded bg-gray-400/30 mb-2" />
                    <div className="h-4 w-2/3 rounded bg-gray-400/20 mb-4" />
                    <div className="flex gap-2">
                      <div className="h-6 w-20 rounded bg-gray-400/20" />
                      <div className="h-6 w-20 rounded bg-gray-400/20" />
                    </div>
                  </div>
                ))}
              </>
            )}
            {!loading && filtered.map((s) => (
              <div key={s.id} className={`p-4 rounded-2xl border ${borderColor} ${surface} hover:shadow-lg transition-shadow`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FaTag className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`} />
                    {editingId === s.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={`px-2 py-1 rounded border ${borderColor} ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                      />
                    ) : (
                      <h3 className={`text-lg font-semibold ${textPrimary}`}>{s.name}</h3>
                    )}
                  </div>
                  {s.is_active === false && (
                    <span className="text-xs px-2 py-1 rounded bg-gray-500 text-white">Inativa</span>
                  )}
                </div>
                <div className="mt-1">
                  {editingId === s.id ? (
                    <input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Descrição (opcional)"
                      className={`w-full px-2 py-1 rounded border ${borderColor} ${theme === 'dark' ? 'bg-gray-800 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-400'}`}
                    />
                  ) : (
                    s.description && <p className={`text-sm ${textSecondary}`}>{s.description}</p>
                  )}
                </div>
                <div className={`mt-3 text-xs ${textSecondary} flex gap-3 items-center`}>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    Tickets: {s._count?.tickets ?? 0}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {editingId === s.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(s.id)}
                        disabled={actionLoadingId === s.id}
                        className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white'} ${actionLoadingId === s.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {actionLoadingId === s.id ? 'Salvando…' : 'Salvar'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className={`px-3 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => beginEdit(s)}
                        className={`px-3 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openConfirmDeleteOne(s)}
                        disabled={actionLoadingId === s.id}
                        className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-500 text-white'} ${actionLoadingId === s.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {actionLoadingId === s.id ? 'Excluindo…' : 'Excluir'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div className={`col-span-full text-center ${textSecondary}`}>Nenhuma subcategoria encontrada.</div>
            )}
          </div>
        </div>

        {/* Modal de confirmação estilizado */}
        {confirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !confirmBusy && setConfirm(null)} />
            <div className={`relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border ${borderColor} ${containerBg}`}>
              {/* Header */}
              <div className={`px-5 py-4 ${theme === 'dark' ? 'bg-gradient-to-r from-red-900 to-red-700' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-700'}`}>
                    <FaExclamationTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {confirm.mode === 'single' ? 'Excluir subcategoria' : 'Excluir todas as subcategorias'}
                    </h3>
                    <p className="text-red-100 text-sm">Esta ação é permanente e não pode ser desfeita.</p>
                  </div>
                </div>
              </div>
              {/* Body */}
              <div className="p-5 space-y-4">
                {confirm.mode === 'single' ? (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl border ${borderColor} ${surface}`}>
                      <div className="flex items-center gap-2">
                        <FaTag className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`} />
                        <span className={`font-medium ${textPrimary}`}>{confirm.subcategory.name}</span>
                      </div>
                      {confirm.subcategory.description && (
                        <p className={`mt-1 text-sm ${textSecondary}`}>{confirm.subcategory.description}</p>
                      )}
                      <div className="mt-3 flex gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          Tickets: {confirm.subcategory._count?.tickets ?? 0}
                        </span>
                      </div>
                    </div>
                    <ul className={`list-disc pl-5 text-sm ${textSecondary}`}>
                      <li>Não é possível excluir se houver tickets vinculados.</li>
                      <li>Esta operação pode afetar relatórios e históricos.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl border ${borderColor} ${surface}`}>
                      <p className={`${textPrimary}`}>
                        Você está prestes a excluir <strong>{(confirm as any).total}</strong> subcategorias listadas.
                      </p>
                    </div>
                    <ul className={`list-disc pl-5 text-sm ${textSecondary}`}>
                      <li>Subcategorias com tickets não serão excluídas.</li>
                      <li>Um resumo será apresentado após a tentativa.</li>
                    </ul>
                  </div>
                )}
                <label className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                  <input
                    type="checkbox"
                    checked={confirmAck}
                    onChange={(e) => setConfirmAck(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Eu entendo as consequências desta ação
                </label>
              </div>
              {/* Footer */}
              <div className={`px-5 py-4 flex items-center justify-end gap-2 border-t ${borderColor}`}>
                <button
                  onClick={() => !confirmBusy && setConfirm(null)}
                  className={`px-4 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  disabled={confirmBusy}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!confirmAck) return
                    try {
                      setConfirmBusy(true)
                      if (confirm.mode === 'single') {
                        await performDeleteOne(confirm.subcategory)
                      } else {
                        await performDeleteAll()
                      }
                      setConfirm(null)
                    } finally {
                      setConfirmBusy(false)
                    }
                  }}
                  className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-500 text-white'} ${(!confirmAck || confirmBusy) ? 'opacity-60 cursor-not-allowed' : ''}`}
                  disabled={!confirmAck || confirmBusy}
                >
                  {confirmBusy ? 'Excluindo…' : (confirm.mode === 'single' ? 'Excluir' : 'Excluir todas')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  )
}


