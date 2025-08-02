import * as React from "react";
import Image from "next/image"

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showBackground?: boolean
  className?: string
}

export default function Logo({ size = 'lg', showBackground = true, className = '' }: LogoProps) {
  const sizeConfig = {
    sm: {
      container: 'w-20 h-8',
      image: { width: 60, height: 35 },
      background: 'rounded-lg'
    },
    md: {
      container: 'w-32 h-10',
      image: { width: 100, height: 60 },
      background: 'rounded-xl'
    },
    lg: {
      container: 'w-48 h-16',
      image: { width: 170, height: 100 },
      background: 'rounded-2xl'
    },
    xl: {
      container: 'w-64 h-20',
      image: { width: 220, height: 130 },
      background: 'rounded-3xl'
    }
  }

  const config = sizeConfig[size]

  if (!showBackground) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Image 
          src="/senai-logo.png" 
          alt="Logo SENAI" 
          width={config.image.width} 
          height={config.image.height}
          className="object-contain"
        />
      </div>
    )
  }

  return (
    <div className={`${config.container} bg-gradient-to-br from-red-500 to-red-600 ${config.background} flex items-center justify-center shadow-lg ${className}`}>
      <Image 
        src="/senai-logo-preto.png" 
        alt="Logo SENAI" 
        width={config.image.width} 
        height={config.image.height}
        className="object-contain"
      />
    </div>
  )
}
