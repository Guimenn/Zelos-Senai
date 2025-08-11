'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ResponsiveLayout from '../../../components/responsive-layout'
import { FaPlus, FaSync, FaTag, FaSearch, FaExclamationTriangle, FaPen } from 'react-icons/fa'

const API_BASE = ''

type CategoryCount = {
  tickets: number
  subcategories: number
}

type Category = {
  id: number
  name: string
  description?: string | null
  is_active?: boolean
  _count?: CategoryCount
}

export default function CategoriesPage() {
  const { theme } = useTheme()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [creating, setCreating] = useState<boolean>(false)
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState<boolean>(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editName, setEditName] = useState<string>('')
  const [editDescription, setEditDescription] = useState<string>('')
  const [confirm, setConfirm] = useState<
    | null
    | { mode: 'single'; category: Category }
    | { mode: 'bulk'; total: number }
  >(null)
  const [confirmBusy, setConfirmBusy] = useState<boolean>(false)
  const [confirmAck, setConfirmAck] = useState<boolean>(false)

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return categories
    return categories.filter(c =>
      c.name.toLowerCase().includes(term) || (c.description ?? '').toLowerCase().includes(term)
    )
  }, [categories, search])

  const isAbortError = (err: unknown) => {
    const anyErr = err as any
    const msg: string = (anyErr && (anyErr.message || '')) || ''
    return anyErr?.name === 'AbortError' || /aborted/i.test(msg) || anyErr?.code === 20
  }

  async function fetchCategories(signal?: AbortSignal) {
    try {
      setLoading(true)
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')

      const res = await fetch(`${API_BASE}/helpdesk/categories?include_inactive=true`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })

      if (!res.ok) {
        const msg = (await res.json().catch(() => ({} as any))).message || 'Falha ao carregar categorias'
        throw new Error(msg)
      }
      const data: Category[] = await res.json()
      setCategories(data)
    } catch (e) {
      if (isAbortError(e)) return
      const msg = e instanceof Error ? e.message : 'Erro ao carregar categorias'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchCategories(controller.signal)
    
    // Adicionar um evento para recarregar os dados quando a página receber foco
    const handleFocus = () => {
      const newController = new AbortController()
      fetchCategories(newController.signal)
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      try { controller.abort() } catch {}
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  function beginEdit(cat: Category) {
    setEditingCategoryId(cat.id)
    setEditName(cat.name)
    setEditDescription(cat.description ?? '')
    setError('')
  }

  function cancelEdit() {
    setEditingCategoryId(null)
    setEditName('')
    setEditDescription('')
  }

  async function saveEdit(categoryId: number) {
    if (!editName.trim()) {
      setError('Nome é obrigatório para editar a categoria')
      return
    }
    try {
      setActionLoadingId(categoryId)
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')

      const res = await fetch(`${API_BASE}/helpdesk/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || undefined })
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as any
        throw new Error(payload?.message || 'Falha ao atualizar categoria')
      }
      const updated: Category = await res.json()
      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c))
      cancelEdit()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao atualizar categoria'
      setError(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  async function deleteOne(category: Category) {
    const tickets = category._count?.tickets ?? 0
    const subs = category._count?.subcategories ?? 0
    const confirmed = window.confirm(
      `Excluir a categoria "${category.name}"?

Esta ação é permanente e não pode ser desfeita.

Observações:
- Não é possível excluir se houver tickets (${tickets}) ou subcategorias (${subs}).

Deseja continuar?`
    )
    if (!confirmed) return
    try {
      setActionLoadingId(category.id)
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')
      const res = await fetch(`${API_BASE}/helpdesk/categories/${category.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as any
        throw new Error(payload?.message || 'Não foi possível excluir a categoria')
      }
      setCategories(prev => prev.filter(c => c.id !== category.id))
      if (editingCategoryId === category.id) cancelEdit()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir categoria'
      setError(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  async function deleteAll() {
    if (categories.length === 0) return
    const total = categories.length
    const confirmed = window.confirm(
      `Excluir TODAS as ${total} categorias listadas?

Esta ação é permanente e não pode ser desfeita.

Observações:
- Categorias com tickets ou subcategorias não serão excluídas.
- A exclusão será tentada uma a uma e um resumo será exibido ao final.

Deseja continuar?`
    )
    if (!confirmed) return
    try {
      setBulkDeleting(true)
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')

      const failed: { id: number; name: string; message: string }[] = []
      for (const cat of categories) {
        try {
          const res = await fetch(`${API_BASE}/helpdesk/categories/${cat.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) {
            const payload = await res.json().catch(() => ({})) as any
            const msg = payload?.message || 'Falha ao excluir'
            failed.push({ id: cat.id, name: cat.name, message: msg })
          }
        } catch (e) {
          failed.push({ id: cat.id, name: cat.name, message: e instanceof Error ? e.message : 'Erro desconhecido' })
        }
      }
      await fetchCategories()
      if (failed.length > 0) {
        setError(`Algumas categorias não puderam ser excluídas (${failed.length}). Ex.: ${failed[0].name} - ${failed[0].message}`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir todas as categorias'
      setError(msg)
    } finally {
      setBulkDeleting(false)
    }
  }

  // Versões sem prompt para uso no modal de confirmação
  async function performDeleteOne(category: Category) {
    try {
      setActionLoadingId(category.id)
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')
      const res = await fetch(`${API_BASE}/helpdesk/categories/${category.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as any
        throw new Error(payload?.message || 'Não foi possível excluir a categoria')
      }
      setCategories(prev => prev.filter(c => c.id !== category.id))
      if (editingCategoryId === category.id) cancelEdit()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir categoria'
      setError(msg)
    } finally {
      setActionLoadingId(null)
    }
  }

  async function performDeleteAll() {
    if (categories.length === 0) return
    try {
      setBulkDeleting(true)
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')

      const failed: { id: number; name: string; message: string }[] = []
      for (const cat of categories) {
        try {
          const res = await fetch(`${API_BASE}/helpdesk/categories/${cat.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) {
            const payload = await res.json().catch(() => ({})) as any
            const msg = payload?.message || 'Falha ao excluir'
            failed.push({ id: cat.id, name: cat.name, message: msg })
          }
        } catch (e) {
          failed.push({ id: cat.id, name: cat.name, message: e instanceof Error ? e.message : 'Erro desconhecido' })
        }
      }
      await fetchCategories()
      if (failed.length > 0) {
        setError(`Algumas categorias não puderam ser excluídas (${failed.length}). Ex.: ${failed[0].name} - ${failed[0].message}`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao excluir todas as categorias'
      setError(msg)
    } finally {
      setBulkDeleting(false)
    }
  }

  function openConfirmDeleteOne(category: Category) {
    setConfirmAck(false)
    setConfirm({ mode: 'single', category })
  }

  function openConfirmDeleteAll() {
    if (categories.length === 0) return
    setConfirmAck(false)
    setConfirm({ mode: 'bulk', total: categories.length })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    try {
      setCreating(true)
      setError('')
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')

      const res = await fetch(`${API_BASE}/helpdesk/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as any
        const msg = payload?.message || 'Falha ao criar categoria'
        throw new Error(msg)
      }

      const created: Category = await res.json()
      setCategories((prev) => [created, ...prev])
      setName('')
      setDescription('')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar categoria'
      setError(msg)
    } finally {
      setCreating(false)
    }
  }

  const containerBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white'
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900'
  const textSecondary = theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
  const surface = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
  const borderColor = theme === 'dark' ? 'border-gray-600' : 'border-gray-200'

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Administrador SENAI"
      userEmail="admin@senai.com"
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}
    >
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>Categorias de Chamados</h1>
            <p className={`${textSecondary}`}>Crie e gerencie categorias utilizadas na abertura de chamados.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openConfirmDeleteAll}
              disabled={bulkDeleting || loading || categories.length === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'} ${bulkDeleting ? 'opacity-60 cursor-not-allowed' : ''}`}
              title="Excluir todas as categorias"
            >
              {bulkDeleting ? 'Excluindo…' : 'Excluir todas'}
            </button>
            <button
              onClick={() => fetchCategories()}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              title="Recarregar"
            >
              <FaSync className="w-4 h-4" />
              Recarregar
            </button>
          </div>
        </div>

        <div className={`rounded-2xl shadow ${containerBg} p-5`}>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Nome da categoria *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Suporte Técnico"
                className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-400'}`}
              />
            </div>
            <div className="md:col-span-1">
              <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Descrição (opcional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição"
                className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-400'}`}
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={creating}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${creating ? 'opacity-70 cursor-not-allowed' : ''} ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                <FaPlus className="w-4 h-4" />
                {creating ? 'Criando...' : 'Criar categoria'}
              </button>
            </div>
          </form>
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
              {loading ? 'Carregando...' : `${filteredCategories.length} categorias`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!loading && filteredCategories.map((cat) => (
              <div key={cat.id} className={`p-4 rounded-2xl border ${borderColor} ${surface} hover:shadow-lg transition-shadow` }>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FaTag className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`} />
                    {editingCategoryId === cat.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={`px-2 py-1 rounded border ${borderColor} ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                      />
                    ) : (
                      <h3 className={`text-lg font-semibold ${textPrimary}`}>{cat.name}</h3>
                    )}
                  </div>
                  {cat.is_active === false && (
                    <span className="text-xs px-2 py-1 rounded bg-gray-500 text-white">Inativa</span>
                  )}
                </div>
                <div className="mt-1">
                  {editingCategoryId === cat.id ? (
                    <input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Descrição (opcional)"
                      className={`w-full px-2 py-1 rounded border ${borderColor} ${theme === 'dark' ? 'bg-gray-800 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-400'}`}
                    />
                  ) : (
                    cat.description && <p className={`text-sm ${textSecondary}`}>{cat.description}</p>
                  )}
                </div>
                <div className={`mt-3 text-xs ${textSecondary} flex gap-3`}>
                  <span>Subcategorias: {cat._count?.subcategories ?? 0}</span>
                  <span>Tickets: {cat._count?.tickets ?? 0}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {editingCategoryId === cat.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(cat.id)}
                        disabled={actionLoadingId === cat.id}
                        className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white'} ${actionLoadingId === cat.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {actionLoadingId === cat.id ? 'Salvando…' : 'Salvar'}
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
                        onClick={() => beginEdit(cat)}
                        className={`px-3 py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => openConfirmDeleteOne(cat)}
                        disabled={actionLoadingId === cat.id}
                        className={`px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-500 text-white'} ${actionLoadingId === cat.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {actionLoadingId === cat.id ? 'Excluindo…' : 'Excluir'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className={`col-span-full text-center ${textSecondary}`}>Carregando categorias...</div>
            )}
            {!loading && filteredCategories.length === 0 && (
              <div className={`col-span-full text-center ${textSecondary}`}>Nenhuma categoria encontrada.</div>
            )}
          </div>
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
                    {confirm.mode === 'single' ? 'Excluir categoria' : 'Excluir todas as categorias'}
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
                      <span className={`font-medium ${textPrimary}`}>{confirm.category.name}</span>
                    </div>
                    {confirm.category.description && (
                      <p className={`mt-1 text-sm ${textSecondary}`}>{confirm.category.description}</p>
                    )}
                    <div className="mt-3 flex gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        Subcategorias: {confirm.category._count?.subcategories ?? 0}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        Tickets: {confirm.category._count?.tickets ?? 0}
                      </span>
                    </div>
                  </div>
                  <ul className={`list-disc pl-5 text-sm ${textSecondary}`}>
                    <li>Não é possível excluir se houver tickets ou subcategorias vinculadas.</li>
                    <li>Esta operação pode afetar relatórios e históricos.</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`p-3 rounded-xl border ${borderColor} ${surface}`}>
                    <p className={`${textPrimary}`}>
                      Você está prestes a excluir <strong>{(confirm as any).total}</strong> categorias listadas.
                    </p>
                  </div>
                  <ul className={`list-disc pl-5 text-sm ${textSecondary}`}>
                    <li>Categorias com tickets ou subcategorias não serão excluídas.</li>
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
                      await performDeleteOne(confirm.category)
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
    </ResponsiveLayout>
  )
}


