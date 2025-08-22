// Teste da exportação Excel
const testData = {
  departments: [
    {
      name: "TI",
      chamados: 25,
      percentual: 50,
      tempoMedio: "2h 30min",
      satisfacao: 4.2
    },
    {
      name: "RH",
      chamados: 15,
      percentual: 30,
      tempoMedio: "1h 45min",
      satisfacao: 3.8
    }
  ],
  priorities: [
    {
      name: "Alta",
      count: 10,
      percentual: 20,
      color: "red"
    },
    {
      name: "Média",
      count: 25,
      percentual: 50,
      color: "yellow"
    }
  ],
  technicians: [
    {
      name: "João Silva",
      chamados: 15,
      satisfacao: 4.5,
      tempoMedio: "2h 15min",
      departamento: "TI"
    },
    {
      name: "Maria Santos",
      chamados: 12,
      satisfacao: 4.2,
      tempoMedio: "1h 50min",
      departamento: "RH"
    }
  ],
  overview: {
    totalChamados: 50,
    chamadosAbertos: 10,
    chamadosConcluidos: 40,
    tempoTotalResolucao: "2h 15min",
    satisfacaoMedia: 4.1,
    percentualResolucao: 80
  },
  recentActivity: [
    {
      id: "#123",
      title: "Problema com impressora",
      status: "Resolvido",
      technician: "João Silva",
      time: "1h 30min",
      rating: 5
    }
  ],
  statusBreakdown: {
    "Open": 5,
    "InProgress": 3,
    "Resolved": 35,
    "Closed": 7
  }
};

console.log('Dados de teste criados:', testData);

// Simular a exportação
console.log('Testando exportação com dados mock...');
console.log('Departments length:', testData.departments.length);
console.log('Priorities length:', testData.priorities.length);
console.log('Technicians length:', testData.technicians.length);
