'use client'

import React, { useState } from 'react'
import { useTheme } from '../../../hooks/useTheme'
import ImagePreviewTest from '../../../components/chat/ImagePreviewTest'
import { FaImage, FaUpload } from 'react-icons/fa'

export default function TestImagePage() {
  const { theme } = useTheme()
  const [testImageUrl, setTestImageUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        setTestImageUrl(url)
      } else {
        alert('Por favor, selecione apenas arquivos de imagem.')
      }
    }
  }

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTestImageUrl(event.target.value)
  }

  return (
    <div className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <h1 className={`text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Teste de Exibição de Imagens no Chat
          </h1>
          
          <div className="space-y-6">
            {/* Seção de Upload */}
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Upload de Imagem
              </h2>
              
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-dashed transition-colors ${
                    theme === 'dark' 
                      ? 'border-gray-600 hover:border-gray-500 text-gray-300' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-600'
                  }`}>
                    <FaUpload className="text-lg" />
                    <span>Selecionar Imagem</span>
                  </div>
                </label>
                
                {selectedFile && (
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Arquivo: {selectedFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* Seção de URL */}
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Ou Cole uma URL de Imagem
              </h2>
              
              <input
                type="url"
                value={testImageUrl}
                onChange={handleUrlChange}
                placeholder="https://exemplo.com/imagem.jpg"
                className={`w-full px-4 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {/* Preview da Imagem */}
            {testImageUrl && (
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Preview da Imagem
                </h2>
                
                <div className="flex justify-center">
                  <ImagePreviewTest imageUrl={testImageUrl} />
                </div>
              </div>
            )}

            {/* Instruções */}
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
                Como Testar:
              </h3>
              <ul className={`space-y-2 text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                <li>• Faça upload de uma imagem ou cole uma URL de imagem</li>
                <li>• A imagem será exibida inline no chat</li>
                <li>• Clique na imagem para expandir em modal</li>
                <li>• Use o botão de expansão que aparece no hover</li>
                <li>• No modal, você pode baixar a imagem</li>
                <li>• Pressione ESC ou clique fora para fechar o modal</li>
              </ul>
            </div>

            {/* URLs de Teste */}
            <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                URLs de Teste:
              </h3>
              <div className="space-y-2">
                {[
                  'https://picsum.photos/400/300',
                  'https://picsum.photos/600/400',
                  'https://picsum.photos/800/600'
                ].map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setTestImageUrl(url)}
                    className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      theme === 'dark'
                        ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-600'
                        : 'text-blue-600 hover:text-blue-500 hover:bg-gray-100'
                    }`}
                  >
                    {url}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

