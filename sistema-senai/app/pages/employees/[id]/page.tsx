'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTheme } from '../../../../hooks/useTheme'

import Logo from '../../../../components/logo'
import Input from '../../../../components/ui/input'
import Link from 'next/link'
import { FaUserTie, FaCalendarAlt, FaIdBadge, FaGraduationCap, FaUserGraduate, FaBuilding, FaBriefcase, FaMapPin, FaCheck, FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import { authCookies } from '../../../../utils/cookies'

export default function EditEmployeePage() {
  const { theme } = useTheme()
  const params = useParams()
  const clientId = params?.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  const cargos = [
    'Analista','Assistente','Auxiliar','Coordenador','Diretor','Estagiário','Gerente','Operador','Supervisor','Técnico','Outros'
  ]
  const departamentos = [
    'Administrativo','Comercial','Financeiro','Gestão de Pessoas','Informática','Manutenção','Marketing','Operacional','Produção','Qualidade','Recursos Humanos','Segurança do Trabalho','Suprimentos','Vendas','Outros'
  ]
  const niveisEducacao = [
    'Ensino Fundamental Incompleto','Ensino Fundamental Completo','Ensino Médio Incompleto','Ensino Médio Completo','Ensino Superior Incompleto','Ensino Superior Completo','Pós-graduação','Mestrado','Doutorado'
  ]
  const tiposContrato = [
    { value: 'clt', label: 'CLT' },
    { value: 'pj', label: 'PJ' },
    { value: 'estagiario', label: 'Estagiário' },
    { value: 'temporario', label: 'Temporário' }
  ]
  const jornadasTrabalho = [
    { value: 'integral', label: 'Tempo Integral' },
    { value: 'parcial', label: 'Tempo Parcial' },
    { value: 'flexivel', label: 'Flexível' },
    { value: 'noturno', label: 'Noturno' }
  ]
  const generos = ['Masculino','Feminino','Não binário','Prefiro não informar']

  const formatCPF = (value: string) => {
    const cpf = value.replace(/\D/g, '')
    let formatted = ''
    for (let i = 0; i < cpf.length && i < 11; i++) {
      if (i === 3 || i === 6) formatted += '.'
      else if (i === 9) formatted += '-'
      formatted += cpf[i]
    }
    return formatted
  }

  const [form, setForm] = useState<any>({
    matricu_id: '',
    department: '',
    position: '',
    admission_date: '',
    birth_date: '',
    address: '',
    gender: '',
    education_level: '',
    education_field: '',
    contract_type: 'clt',
    work_schedule: 'integral',
    cpf: '',
    notes: '',
    company: '',
    client_type: 'Individual',
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!clientId) return
      setIsLoading(true)
      setLoadError('')
      try {
        const token = authCookies.getToken()
        if (!token) throw new Error('Não autenticado')
        const resp = await fetch(`/admin/client/${encodeURIComponent(clientId)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!resp.ok) {
          const t = await resp.text()
          throw new Error(t || 'Falha ao carregar colaborador')
        }
        const c = await resp.json()
        setForm({
          matricu_id: c.matricu_id || '',
          department: c.department || '',
          position: c.position || '',
          admission_date: c.admission_date ? new Date(c.admission_date).toISOString().slice(0, 10) : '',
          birth_date: c.birth_date ? new Date(c.birth_date).toISOString().slice(0, 10) : '',
          address: c.address || '',
          gender: c.gender || '',
          education_level: c.education_level || '',
          education_field: c.education_field || '',
          contract_type: c.contract_type || 'clt',
          work_schedule: c.work_schedule || 'integral',
          cpf: c.cpf ? formatCPF(c.cpf) : '',
          notes: c.notes || '',
          company: c.company || '',
          client_type: c.client_type || 'Individual',
        })
      } catch (e: any) {
        setLoadError(e.message || 'Erro ao carregar colaborador')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [clientId])

  const handleInputChange = (field: string) => (e: any) => {
    let value = e.target.value
    if (field === 'cpf') value = formatCPF(value)
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    setSaveError('')
    setSaved(false)
    try {
      const token = authCookies.getToken()
      if (!token) throw new Error('Não autenticado')
      const payload: any = {
        matricu_id: form.matricu_id || undefined,
        department: form.department || undefined,
        position: form.position || undefined,
        admission_date: form.admission_date || undefined,
        birth_date: form.birth_date || undefined,
        address: form.address || undefined,
        gender: form.gender || undefined,
        education_level: form.education_level || undefined,
        education_field: form.education_field || undefined,
        contract_type: form.contract_type || undefined,
        work_schedule: form.work_schedule || undefined,
        cpf: form.cpf ? form.cpf.replace(/\D/g, '') : undefined,
        notes: form.notes || undefined,
        company: form.company || undefined,
        client_type: form.client_type || undefined,
      }
      const resp = await fetch(`/admin/client/${encodeURIComponent(clientId)}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await resp.json()
      if (!resp.ok) {
        const details = Array.isArray(data?.errors) ? data.errors.map((e: any) => `${e.path}: ${e.message || e.error}`).join('; ') : ''
        throw new Error(details || data?.message || 'Erro ao salvar')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setSaveError(e.message || 'Erro ao salvar')
    } finally {
      setIsLoading(false)
    }
  }

    return (
    <>
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8">
        <div className="max-w-5xl w-full relative z-10">
          <div className={`backdrop-blur-xl rounded-2xl shadow-2xl border p-8 ${
            theme === 'dark' ? 'bg-gray-900/5 border-gray-700/10' : 'bg-gray-50/5 border-white/10'
          }`}>
            <div className="text-center mb-8">
              <Logo />
              <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Editar Colaborador</h1>
              <p className={`${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>Atualize os dados do colaborador</p>
            </div>

            {loadError && (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/30 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">{loadError}</div>
            )}
            {saveError && (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-400/30 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">{saveError}</div>
            )}
            {saved && (
              <div className="bg-green-500/10 backdrop-blur-sm border border-green-400/30 text-green-200 px-4 py-3 rounded-lg text-sm mb-6">Alterações salvas com sucesso</div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              {/* Informações Pessoais */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <FaUserTie className="text-red-400" />
                  Informações Pessoais
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input value={form.cpf} onChange={handleInputChange('cpf')} placeholder="CPF 000.000.000-00" disabled={isLoading} icon={<FaIdBadge className="text-white/50 text-sm" />} maxLength={14} />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUserTie className="text-white/50 text-sm" />
                    </div>
                    <select value={form.gender} onChange={handleInputChange('gender')} disabled={isLoading} className="w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none">
                      <option value="">Selecione o gênero</option>
                      {generos.map(g => (
                        <option key={g} value={g} className="bg-gray-800 text-white">{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="text-white/50 text-sm" />
                    </div>
                    <input type="date" value={form.birth_date} onChange={handleInputChange('birth_date')} disabled={isLoading} className="w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm" />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Input value={form.address} onChange={handleInputChange('address')} placeholder="Endereço completo" disabled={isLoading} icon={<FaMapPin className="text-white/50 text-sm" />} />
                  </div>
                </div>
              </div>

              {/* Informações Profissionais */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <FaBriefcase className="text-red-400" />
                  Informações Profissionais
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUserTie className="text-white/50 text-sm" />
                    </div>
                    <select value={form.position} onChange={handleInputChange('position')} disabled={isLoading} className="w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none">
                      <option value="">Selecione o cargo</option>
                      {cargos.map(c => (
                        <option key={c} value={c} className="bg-gray-800 text-white">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBuilding className="text-white/50 text-sm" />
                    </div>
                    <select value={form.department} onChange={handleInputChange('department')} disabled={isLoading} className="w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none">
                      <option value="">Selecione o departamento</option>
                      {departamentos.map(d => (
                        <option key={d} value={d} className="bg-gray-800 text-white">{d}</option>
                      ))}
                    </select>
                  </div>
                  <Input value={form.matricu_id} onChange={handleInputChange('matricu_id')} placeholder="Número da matrícula" disabled={isLoading} icon={<FaIdBadge className="text-white/50 text-sm" />} />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="text-white/50 text-sm" />
                    </div>
                    <input type="date" value={form.admission_date} onChange={handleInputChange('admission_date')} disabled={isLoading} className="w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm" />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaGraduationCap className="text-white/50 text-sm" />
                    </div>
                    <select value={form.education_level} onChange={handleInputChange('education_level')} disabled={isLoading} className="w-full px-4 py-3 pl-10 bg-gray-50/5 backdrop-blur-sm border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-all duration-200 text-sm appearance-none">
                      <option value="">Nível de educação</option>
                      {niveisEducacao.map(n => (
                        <option key={n} value={n} className="bg-gray-800 text-white">{n}</option>
                      ))}
                    </select>
                  </div>
                  <Input value={form.education_field} onChange={handleInputChange('education_field')} placeholder="Curso/Formação (opcional)" disabled={isLoading} icon={<FaUserGraduate className="text-white/50 text-sm" />} />
                </div>
              </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 transform hover:scale-[1.02] flex items-center justify-center gap-2">
                    <FaCheck className="text-sm" />
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <Link href="/pages/employees" className="w-full">
                    <button type="button" className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2">
                      <FaArrowLeft className="text-sm" />
                      Voltar
                    </button>
                  </Link>
                </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}



