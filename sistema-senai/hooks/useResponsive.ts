import { useState, useEffect, useCallback } from 'react'

interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLandscape: boolean
  isPortrait: boolean
  screenWidth: number
  screenHeight: number
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLandscape: false,
    isPortrait: false,
    screenWidth: 0,
    screenHeight: 0
  })

  const updateState = useCallback(() => {
    // Verificar se estamos no lado do cliente
    if (typeof window === 'undefined') {
      return
    }

    const width = window.innerWidth
    const height = window.innerHeight
    
    setState({
      isMobile: width <= 768,
      isTablet: width > 768 && width <= 1024,
      isDesktop: width > 1024,
      isLandscape: width > height,
      isPortrait: height > width,
      screenWidth: width,
      screenHeight: height
    })
  }, [])

  useEffect(() => {
    // Set initial state
    updateState()
    
    // Add event listener
    window.addEventListener('resize', updateState)
    window.addEventListener('orientationchange', updateState)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateState)
      window.removeEventListener('orientationchange', updateState)
    }
  }, [updateState])

  return state
}

export function useBreakpoint(breakpoint: 'sm' | 'md' | 'lg' | 'xl'): boolean {
  const { screenWidth } = useResponsive()
  
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
  }
  
  return screenWidth >= breakpoints[breakpoint]
}

export function useOrientation(): 'landscape' | 'portrait' {
  const { isLandscape } = useResponsive()
  return isLandscape ? 'landscape' : 'portrait'
} 