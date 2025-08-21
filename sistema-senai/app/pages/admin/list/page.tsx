'use client'

import React, { useEffect, useMemo, useState } from 'react'
import ResponsiveLayout from '../../../../components/responsive-layout'
import { useTheme } from '../../../../hooks/useTheme'
import { useI18n } from '../../../../contexts/I18nContext'
import { useRequireRole } from '../../../../hooks/useAuth'
import { authCookies } from '../../../../utils/cookies'
import { FaSearch, FaUserShield, FaEnvelope, FaPhone, FaClock, FaUserCheck, FaUserTimes } from 'react-icons/fa'
import Link from 'next/link'

export default function AdminListPage() {
  const { theme } = useTheme()
  const { t } = useI18n()
  const { user, isLoading: authLoading } = useRequireRole(['Admin'], '/pages/auth/unauthorized')

  const [admins, setAdmins] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          <div className="p-4 space-y-3">
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
                <div className="flex items-center gap-4 text-sm">
                  <span className={`px-2 py-1 rounded-full border ${a.is_active ? 'bg-green-500/20 text-green-600 border-green-500/30' : 'bg-red-500/20 text-red-600 border-red-500/30'}`}>
                    {a.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-1`}><FaClock /> {new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-center py-8`}>
                Nenhum administrador encontrado.
              </div>
            )}
          </div>
        </div>
      )}
    </ResponsiveLayout>
  )
}


