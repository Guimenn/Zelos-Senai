'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../../../hooks/useTheme'
import ResponsiveLayout from '../../../../components/responsive-layout'
import { useI18n } from '../../../../contexts/I18nContext'
import { authCookies } from '../../../../utils/cookies'
import { useRequireRole } from '../../../../hooks/useAuth'
import Link from 'next/link'
import { FaSave, FaShieldAlt, FaArrowLeft } from 'react-icons/fa'
import { useSupabase } from '../../../hooks/useSupabase'

export default function NewAdminPage() {
  const supabase = useSupabase()
  const { theme } = useTheme()
  const { t } = useI18n()
  const { user, isLoading: authLoading } = useRequireRole(['Admin'], '/pages/auth/unauthorized')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [cargo, setCargo] = useState('Administrador do Sistema')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isValid = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !cargo.trim()) return false
    if (password.length < 6) return false
    if (password !== confirmPassword) return false
    return true
  }

  const handleAvatarPick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsUploading(true)
      setError(null)
      const fileName = `admins/${Date.now()}_${file.name}`
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(data.path)
      if (!publicData?.publicUrl) throw new Error(t('admin.new.uploadError'))
      setAvatar(publicData.publicUrl)
    } catch (err: any) {
      setError(err?.message || t('admin.new.uploadError'))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!isValid()) {
      setError(t('admin.new.fillRequired'))
      return
    }
    setIsSubmitting(true)
    try {
      const token = authCookies.getToken()
      if (!token) throw new Error('Não autenticado')
      const payload = {
        user: { name, email, phone: phone || undefined, password, avatar: avatar || undefined, position: cargo }
      }
      const resp = await fetch('/admin/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        throw new Error(data?.message || t('admin.new.createError'))
      }
      setSuccess(t('admin.new.createSuccess'))
      setName('')
      setEmail('')
      setPhone('')
      setPassword('')
      setConfirmPassword('')
      setAvatar('')
    } catch (err: any) {
      setError(err?.message || t('admin.new.createError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ResponsiveLayout
      userType="admin"
      userName="Administrador SENAI"
      userEmail="admin@senai.com"
      notifications={0}
      className={theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('admin.new.title')}</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('admin.new.subtitle')}</p>
        </div>
        <Link href="/pages/config" className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} flex items-center gap-2`}>
          <FaArrowLeft /> {t('admin.new.back')}
        </Link>
      </div>

      <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avatar */}
          <div className="md:col-span-2 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <FaShieldAlt />
              )}
            </div>
            <div className="flex items-center gap-3">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              <button type="button" onClick={handleAvatarPick} disabled={isUploading} className={`${isUploading ? 'opacity-60 cursor-not-allowed' : ''} ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded-lg`}>
                {isUploading ? t('admin.new.uploading') : avatar ? t('admin.new.changePhoto') : t('admin.new.uploadPhoto')}
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('admin.new.name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder={t('admin.new.nameplaceholder')} className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent`} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('admin.new.email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t('admin.new.emailplaceholder')} className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent`} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('admin.new.phone')}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('admin.new.phoneplaceholder')} className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent`} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('admin.new.position')}</label>
            <select value={cargo} onChange={(e) => setCargo(e.target.value)} required className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent`}>
              <option>{t('admin.new.positions.systemAdmin')}</option>
              <option>{t('admin.new.positions.supervisor')}</option>
              <option>{t('admin.new.positions.coordinator')}</option>
              <option>{t('admin.new.positions.itManager')}</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('admin.new.password')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={t('admin.new.passwordplaceholder')} className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent`} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('admin.new.confirmPassword')}</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent`} />
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-red-500 mt-1">{t('admin.new.passwordMismatch')}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('admin.new.avatarUrl')}</label>
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent`} />
          </div>

          {error && (
            <div className={`md:col-span-2 p-3 rounded-lg border ${theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}
          {success && (
            <div className={`md:col-span-2 p-3 rounded-lg border ${theme === 'dark' ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-700'}`}>
              {success}
            </div>
          )}

          <div className="md:col-span-2 flex items-center justify-end gap-3">
            <Link href="/pages/config" className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded-lg`}>
              {t('admin.new.cancel')}
            </Link>
            <button disabled={isSubmitting || !isValid()} className={`${isSubmitting || !isValid() ? 'opacity-60 cursor-not-allowed' : ''} bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2`}>
              <FaSave /> {isSubmitting ? t('admin.new.saving') : t('admin.new.save')}
            </button>
          </div>
        </form>
      </div>
    </ResponsiveLayout>
  )
}


