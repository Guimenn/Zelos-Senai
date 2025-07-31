import { FaExclamationTriangle } from "react-icons/fa";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-screen ">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-10 flex flex-col items-center border border-white/20">
                <FaExclamationTriangle className="text-red-500 text-5xl mb-4 animate-bounce" />
                <h1 className="text-4xl font-bold text-white mb-2">404</h1>
                <h2 className="text-xl text-white/80 mb-4">Página não encontrada</h2>
                <p className="text-white/60 mb-6 text-center max-w-xs">
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
    );
}