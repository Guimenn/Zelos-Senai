import { redirect } from 'next/navigation'

export default function Home() {
  // Redirecionar automaticamente para a página de login
  redirect('/pages/auth/login')
}

