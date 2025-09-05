// Script para debugar comparação de tipos
// Digite no console

console.log('🔧 Debugando comparação de tipos...');

// Simular diferentes cenários de tipos
const scenarios = [
    { currentUserId: 7, technicianId: 7, currentUserRole: 'Agent' },
    { currentUserId: '7', technicianId: 7, currentUserRole: 'Agent' },
    { currentUserId: 7, technicianId: '7', currentUserRole: 'Agent' },
    { currentUserId: '7', technicianId: '7', currentUserRole: 'Agent' }
];

scenarios.forEach((scenario, index) => {
    console.log(`\n📋 Cenário ${index + 1}:`);
    console.log('Current User ID:', scenario.currentUserId, '(tipo:', typeof scenario.currentUserId, ')');
    console.log('Technician ID:', scenario.technicianId, '(tipo:', typeof scenario.technicianId, ')');
    console.log('Current User Role:', scenario.currentUserRole);
    
    // Verificar se é técnico
    const isCurrentUserTechnician = scenario.currentUserRole === 'Agent' && scenario.technicianId === scenario.currentUserId;
    console.log('É técnico?', isCurrentUserTechnician);
    console.log('Comparação exata:', scenario.technicianId === scenario.currentUserId);
    console.log('Comparação com ==:', scenario.technicianId == scenario.currentUserId);
    
    if (isCurrentUserTechnician) {
        console.log('✅ TÉCNICO identificado corretamente!');
    } else {
        console.log('❌ TÉCNICO NÃO identificado');
    }
});

console.log('\n💡 Se algum cenário falhar, o problema é a comparação de tipos!');
