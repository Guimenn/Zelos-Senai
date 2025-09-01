// Configuração da API base URL
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://zelos-senai.onrender.com/'

// Configuração do ambiente
export const IS_PRODUCTION = process.env.NODE_ENV === 'production'
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'
