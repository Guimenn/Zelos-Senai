'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../../../hooks/useTheme'
import ResponsiveLayout from '../../../../components/responsive-layout'
import { useI18n } from '../../../../contexts/I18nContext'
import { authCookies } from '../../../../utils/cookies'
import { useRequireRole } from '../../../../hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaSave, FaShieldAlt, FaArrowLeft } from 'react-icons/fa'

export default function NewAdminPage() {
  const { theme } = useTheme()
  const { t } = useI18n()
  const { user, isLoading: authLoading } = useRequireRole(['Admin'], '/pages/auth/unauthorized')
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatar, setAvatar] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [cargo, setCargo] = useState('Administrador do Sistema')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isValid = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !cargo.trim()) return false
    if (password.length < 6) return false
    if (password !== confirmPassword) return false
    return true
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem')
        return
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB')
        return
      }
      
      setAvatarFile(file)
      setAvatar('') // Limpar URL se houver
      
      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null
    
    try {
      const token = authCookies.getToken()
      if (!token) throw new Error('Não autenticado')
      
      const formData = new FormData()
      formData.append('file', avatarFile)
      formData.append('isAvatar', 'true')
      
      const response = await fetch('/api/attachments/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao fazer upload da imagem')
      }
      
      const data = await response.json()
      return data.data.avatarUrl
    } catch (error: any) {
      console.error('Erro no upload:', error)
      setError(error.message || 'Erro ao fazer upload da imagem')
      return null
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
      
      // Fazer upload do avatar se houver arquivo
      let avatarUrl = avatar
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar()
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        } else {
          throw new Error('Erro ao fazer upload da imagem')
        }
      }
      
      const payload = {
        user: { name, email, phone: phone || undefined, password, avatar: avatarUrl || undefined, position: cargo }
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
      setSuccess('Administrador criado com sucesso! Redirecionando para a lista...')
      
      // Limpar formulário
      setName('')
      setEmail('')
      setPhone('')
      setPassword('')
      setConfirmPassword('')
      setAvatar('')
      setAvatarFile(null)
      setAvatarPreview('')
      
      // Redirecionar para a lista de administradores após 2 segundos
      setTimeout(() => {
        router.push('/pages/admin/list')
      }, 2000)
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
        <Link href="/pages/admin/list" className={`${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} flex items-center gap-2`}>
          <FaArrowLeft /> {t('admin.new.back')}
        </Link>
      </div>

      <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avatar */}
          <div className="md:col-span-2 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <FaShieldAlt />
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Adicione uma foto para o avatar
              </p>
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
            <input 
              value={phone}
              type="text"
              onChange={e => {
                // Permite apenas números e até 11 dígitos, e formata com parênteses nos dois primeiros dígitos
                let raw = e.target.value.replace(/\D/g, '').slice(0, 11)
                let formatted = ''
                if (raw.length > 0) {
                  formatted += '('
                  formatted += raw.slice(0, 2)
                  if (raw.length >= 2) formatted += ') '
                  if (raw.length > 2 && raw.length <= 6) {
                    formatted += raw.slice(2)
                  } else if (raw.length > 6) {
                    formatted += raw.slice(2, 7) + '-' + raw.slice(7)
                  }
                }
                setPhone(formatted)
              }} 
              placeholder="(00) 00000-0000"
              className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent`} 
              maxLength={15}
            />
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
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Foto do Avatar</label>
            <div className="space-y-3">
              {/* Upload de arquivo */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Enviar arquivo (JPG, PNG, GIF - máx. 5MB)
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100`}
                />
              </div>
              
              {/* Ou separador */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-2 ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>ou</span>
                </div>
              </div>
              
              {/* URL de imagem */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  URL da imagem
                </label>
                <input 
                  value={avatar} 
                  onChange={(e) => {
                    setAvatar(e.target.value)
                    setAvatarFile(null)
                    setAvatarPreview('')
                  }} 
                  placeholder="https://..." 
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-red-500 focus:border-transparent`} 
                />
              </div>
            </div>
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

          <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Link href="/pages/admin/list" className={`w-full sm:w-auto text-center ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} px-4 py-2 rounded-lg`}>
              {t('admin.new.cancel')}
            </Link>
            <button 
              disabled={isSubmitting || !isValid()} 
              className={`w-full sm:w-auto ${isSubmitting || !isValid() ? 'opacity-60 cursor-not-allowed' : ''} bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2`}
            >
              <FaSave /> {isSubmitting ? t('admin.new.saving') : t('admin.new.save')}
            </button>
          </div>
        </form>
      </div>
    </ResponsiveLayout>
  )
}


