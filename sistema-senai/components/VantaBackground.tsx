'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    VANTA: {
      BIRDS: (config: any) => any
    }
  }
}

// Variável global para controlar se o Vanta já foi inicializado
let globalVantaInstance: any = null
let globalScriptsLoaded = false

export default function VantaBackground() {
  const vantaRef = useRef<any>(null)
  const pathname = usePathname()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Aplicar fundo escuro imediatamente para evitar tela preta
    document.body.style.backgroundColor = '#000000'
    document.body.style.backgroundImage = 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)'
    
    // Desabilitar Vanta nas páginas de chamados e destruir instância existente
    if (pathname?.startsWith('/pages/called')) {
      if (globalVantaInstance && globalVantaInstance.destroy) {
        try { 
          globalVantaInstance.destroy() 
          globalVantaInstance = null
        } catch {} 
      }
      if (vantaRef.current && vantaRef.current.destroy) {
        try { 
          vantaRef.current.destroy() 
          vantaRef.current = null
        } catch {} 
      }
      return
    }

    // Se já existe uma instância global, usar ela
    if (globalVantaInstance && !vantaRef.current) {
      vantaRef.current = globalVantaInstance
      setIsInitialized(true)
      return
    }

    // Carregar os scripts dinamicamente apenas uma vez
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Verificar se o script já foi carregado
        const existingScript = document.querySelector(`script[src="${src}"]`)
        if (existingScript) {
          resolve()
          return
        }
        
        const script = document.createElement('script')
        script.src = src
        script.onload = () => resolve()
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    const initVanta = async () => {
      try {
        // Verificar se os scripts já foram carregados
        if (!globalScriptsLoaded && !window.VANTA) {
          console.log('🔄 Carregando scripts do Vanta...')
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js')
          await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js')
          globalScriptsLoaded = true
          console.log('✅ Scripts do Vanta carregados com sucesso')
        }
        
        // Aguardar um pouco para garantir que o DOM está pronto
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (window.VANTA && !globalVantaInstance && !vantaRef.current) {
          console.log('🎨 Inicializando Vanta Background...')
          globalVantaInstance = window.VANTA.BIRDS({
            el: "body",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 500.00,
            minWidth: 50.00,
            scale: 1.00,
            scaleMobile: 1.00,
            backgroundColor: 0x0,
            color2: 0xff0000,
            birdSize: 0.50,
            wingSpan: 40.00,
            speedLimit: 3.00,
            separation: 100.00
          })
          
          vantaRef.current = globalVantaInstance
          setIsInitialized(true)
          console.log('✅ Vanta Background inicializado com sucesso')
          
          // Garante que o canvas não capture cliques
          try {
            const canvases = document.querySelectorAll('canvas.vanta-canvas')
            canvases.forEach((c: any) => {
              c.style.pointerEvents = 'none'
              c.style.zIndex = '-1'
              c.style.position = 'fixed'
              c.style.inset = '0'
            })
          } catch (error) {
            console.warn('⚠️ Erro ao configurar canvas:', error)
          }
        } else if (globalVantaInstance && !vantaRef.current) {
          // Se já existe uma instância global mas não local, usar a global
          vantaRef.current = globalVantaInstance
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('❌ Erro ao carregar Vanta.js:', error)
        // Em caso de erro, manter o fundo escuro
        document.body.style.backgroundColor = '#000000'
        document.body.style.backgroundImage = 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)'
      }
    }

    // Inicializar apenas se não houver instância
    if (!globalVantaInstance && !vantaRef.current) {
      initVanta()
    } else if (globalVantaInstance && !vantaRef.current) {
      vantaRef.current = globalVantaInstance
      setIsInitialized(true)
    }

    return () => {
      // Não destruir a instância global aqui, apenas a local
      if (vantaRef.current && vantaRef.current !== globalVantaInstance && vantaRef.current.destroy) {
        try {
          vantaRef.current.destroy()
        } catch {}
        vantaRef.current = null
      }
    }
  }, [pathname])

  return null
} 
