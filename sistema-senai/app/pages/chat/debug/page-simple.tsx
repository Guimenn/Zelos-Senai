'use client'

import React, { useState } from 'react'

export default function ChatDebugPageSimple() {
  const [ticketId, setTicketId] = useState('14')

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Debug do Chat - Versão Simples
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Teste de Tickets</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ticket ID:
            </label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
              placeholder="Digite o ID do ticket"
            />
          </div>
          
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setTicketId('14')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Ticket 14
            </button>
            <button
              onClick={() => setTicketId('15')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Ticket 15
            </button>
            <button
              onClick={() => setTicketId('16')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Ticket 16
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600">
              <strong>Ticket ID atual:</strong> {ticketId}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Teste de Chat</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">1. Teste Básico</h3>
              <button
                onClick={() => {
                  console.log('Testando chat para ticket:', ticketId)
                  // Aqui você pode testar o chat
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Testar Chat
              </button>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">2. Teste de API</h3>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/messages/list?ticket_id=${ticketId}`)
                    console.log('Resposta da API:', response.status)
                    if (response.ok) {
                      const data = await response.json()
                      console.log('Dados:', data)
                    }
                  } catch (error) {
                    console.error('Erro:', error)
                  }
                }}
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              >
                Testar API
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
