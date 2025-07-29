
import { useState } from 'react';
import './assets/main.css';

function App() {
  const [likes, setLikes] = useState(0);
  const [color, setColor] = useState('blue');

  const colors = [
    { name: 'blue', bg: 'bg-blue-500', hover: 'hover:bg-blue-600' },
    { name: 'red', bg: 'bg-red-500', hover: 'hover:bg-red-600' },
    { name: 'green', bg: 'bg-green-500', hover: 'hover:bg-green-600' },
    { name: 'purple', bg: 'bg-purple-500', hover: 'hover:bg-purple-600' },
  ];

  const currentColor = colors.find(c => c.name === color);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          🎨 Tailwind CSS Test
        </h1>
        <p className="text-xl text-gray-600">
          Se você está vendo cores e animações, está funcionando!
        </p>
      </div>

      {/* Cards Container */}
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        
        {/* Card 1: Botão de Like */}
        <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-6 text-center">👍 Contador de Likes</h2>
          
          <div className="text-center">
            <div className="text-6xl font-bold text-pink-500 mb-6">
              {likes}
            </div>
            
            <button
              onClick={() => setLikes(likes + 1)}
              className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
            >
              ❤️ Curtir
            </button>
            
            {likes > 0 && (
              <button
                onClick={() => setLikes(0)}
                className="ml-4 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-full transition-all duration-300"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Seletor de Cores */}
        <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-all duration-300">
          <h2 className="text-2xl font-bold mb-6 text-center">🌈 Troca de Cores</h2>
          
          <div className="space-y-4">
            {colors.map((colorOption) => (
              <button
                key={colorOption.name}
                onClick={() => setColor(colorOption.name)}
                className={`w-full p-4 rounded-lg text-white font-bold transition-all duration-300 transform hover:scale-105 ${colorOption.bg} ${colorOption.hover} ${
                  color === colorOption.name ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                Cor {colorOption.name.charAt(0).toUpperCase() + colorOption.name.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="max-w-4xl mx-auto mt-12">
        <div className={`rounded-2xl shadow-2xl p-8 text-white transform transition-all duration-500`}>
          <h2 className="text-3xl font-bold mb-6 text-center">
            🚀 Demonstração Dinâmica
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Responsive Cards */}
            {[1, 2, 3].map((num) => (
              <div 
                key={num}
                className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6 transform hover:scale-110 transition-all duration-300 hover:bg-opacity-30"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">
                    {num === 1 ? '⚡' : num === 2 ? '🎯' : '🔥'}
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    Feature {num}
                  </h3>
                  <p className="text-sm opacity-90">
                    Tailwind torna tudo mais fácil e bonito!
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12">
        <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-3 shadow-lg">
          <span className="text-2xl">✅</span>
          <span className="font-bold text-gray-700">
            React + Tailwind funcionando perfeitamente!
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;