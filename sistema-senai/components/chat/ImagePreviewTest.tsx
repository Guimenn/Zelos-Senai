'use client'

import React, { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { FaExpand, FaDownload, FaTimes } from 'react-icons/fa'

interface ImagePreviewTestProps {
  imageUrl: string
  className?: string
}

export default function ImagePreviewTest({ imageUrl, className = '' }: ImagePreviewTestProps) {
  const { theme } = useTheme()
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  const isImageFile = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')
  }

  if (!isImageFile(imageUrl)) {
    return (
      <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          URL não é uma imagem válida
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Preview da imagem */}
      <div className="relative group">
        <img
          src={imageUrl}
          alt="Imagem de teste"
          className="max-w-full h-auto rounded-lg cursor-pointer transition-all duration-200 hover:opacity-90 shadow-sm"
          style={{ maxHeight: '300px', maxWidth: '250px' }}
          onClick={() => setExpandedImage(imageUrl)}
          onError={(e) => {
            console.error('Erro ao carregar imagem:', imageUrl)
            e.currentTarget.style.display = 'none'
          }}
        />
        {/* Overlay com botão de expansão */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={() => setExpandedImage(imageUrl)}
            className="p-2 bg-white bg-opacity-90 rounded-full text-gray-700 hover:bg-opacity-100 transition-all duration-200"
            title="Expandir imagem"
          >
            <FaExpand className="text-sm" />
          </button>
        </div>
      </div>

      {/* Modal de Expansão de Imagem */}
      {expandedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm"
            onClick={() => setExpandedImage(null)}
          />
          
          {/* Modal da Imagem */}
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            {/* Botão de fechar */}
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
              title="Fechar"
            >
              <FaTimes className="text-xl" />
            </button>
            
            {/* Imagem expandida */}
            <img
              src={expandedImage}
              alt="Imagem expandida"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                console.error('Erro ao carregar imagem expandida:', expandedImage)
                e.currentTarget.style.display = 'none'
              }}
            />
            
            {/* Botão de download */}
            <a
              href={expandedImage}
              download
              className="absolute bottom-4 right-4 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
              title="Baixar imagem"
              onClick={(e) => e.stopPropagation()}
            >
              <FaDownload className="text-xl" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

