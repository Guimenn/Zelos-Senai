'use client'

import { FaExclamationTriangle } from "react-icons/fa";
import { useTheme } from '../hooks/useTheme'
import VantaBackground from '../components/VantaBackground'

export default function NotFound() {
    const { theme } = useTheme()
    return (
        <>
        <VantaBackground />
        <div className="flex flex-col items-center justify-center h-screen ">
            <div className={`backdrop-blur-lg rounded-2xl shadow-2xl p-10 flex flex-col items-center border ${
                theme === 'dark' 
                    ? 'bg-gray-900/10 border-gray-700/20' 
                    : 'bg-white/10 border-white/20'
            }`}>
                <FaExclamationTriangle className="text-red-500 text-5xl mb-4 animate-bounce" />
                <h1 className={`text-4xl font-bold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>404</h1>
                <h2 className={`text-xl mb-4 ${
                    theme === 'dark' ? 'text-white/80' : 'text-gray-700'
                }`}>Página não encontrada</h2>
                <p className={`mb-6 text-center max-w-xs ${
                    theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                }`}>
                    Ops! A página que você está procurando não existe ou foi movida.
                </p>
                <a
                    href="/"
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 hover:from-red-700 hover:to-red-800 shadow-lg"
                >
                    Voltar para o início
                </a>
            </div>
        </div>
        </>
    );
}