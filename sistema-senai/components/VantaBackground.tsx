'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    VANTA: {
      BIRDS: (config: any) => any
    }
  }
}

export default function VantaBackground() {
  const vantaRef = useRef<any>(null)

  useEffect(() => {
    if (!vantaRef.current) {
      // Carregar os scripts dinamicamente
      const loadScript = (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = src
          script.onload = () => resolve()
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      const initVanta = async () => {
        try {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js')
          await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js')
          
          if (window.VANTA) {
            vantaRef.current = window.VANTA.BIRDS({
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
          }
        } catch (error) {
          console.error('Erro ao carregar Vanta.js:', error)
        }
      }

      initVanta()
    }

    return () => {
      if (vantaRef.current && vantaRef.current.destroy) {
        vantaRef.current.destroy()
      }
    }
  }, [])

  return null
} 