'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Language = 'pt-BR' | 'en-US'

type Messages = Record<string, string>

interface I18nContextType {
	language: Language
	setLanguage: (lng: Language) => void
	t: (key: string) => string
}

const ptBR: Messages = {
	// Header
	'settings.title': 'Configurações',
	'settings.subtitle': 'Gerencie as configurações do sistema e seu perfil',

	// Buttons
	'buttons.save': 'Salvar Alterações',
	'buttons.saving': 'Salvando...',
	'buttons.restoreDefaults': 'Restaurar Padrões',

	// Messages / Toasts
	'messages.savedSuccess': 'Configurações salvas com sucesso!'
	,'toasts.saved': 'Configurações salvas!'
	,'toasts.saveFailed': 'Falha ao salvar configurações'
	,'toasts.restoredDefaults': 'Configurações restauradas para o padrão'

	// Tabs
	,'tabs.creations': 'Criações'
	,'tabs.appearance': 'Aparência'

	// Appearance
	,'appearance.title': 'Personalização da Interface'
	,'appearance.fontSize.label': 'Tamanho da Fonte'
	,'appearance.fontSize.small': 'Pequeno'
	,'appearance.fontSize.medium': 'Médio'
	,'appearance.fontSize.large': 'Grande'
	,'appearance.interfaceDensity.label': 'Densidade da Interface'
	,'appearance.interfaceDensity.compact': 'Compacto'
	,'appearance.interfaceDensity.comfortable': 'Confortável'
	,'appearance.interfaceDensity.spacious': 'Espaçoso'
	,'appearance.language.label': 'Idioma'

	// Behavior
	,'behavior.title': 'Comportamento'
	,'behavior.animations': 'Habilitar animações'
	,'behavior.compactMode': 'Modo compacto'

	// Creations section
	,'creations.title': 'Atalhos de Criação'
	,'creations.subtitle': 'Acesse rapidamente as páginas para criar novos registros no sistema.'
	,'creations.newTicket.title': 'Novo Chamado'
	,'creations.newTicket.subtitle': 'Abrir um chamado de manutenção'
	,'creations.newTechnician.title': 'Novo Técnico'
	,'creations.newTechnician.subtitle': 'Cadastrar um técnico de manutenção'
	,'creations.newEmployee.title': 'Novo Colaborador'
	,'creations.newEmployee.subtitle': 'Adicionar um colaborador/cliente'
	,'creations.categories.title': 'Categorias de Chamados'
	,'creations.categories.subtitle': 'Criar e gerenciar categorias'
	,'creations.subcategories.title': 'Subcategorias'
	,'creations.subcategories.subtitle': 'Criar e gerenciar subcategorias'

	// Navigation
	,'nav.home': 'Início'
	,'nav.tickets': 'Chamados'
	,'nav.history': 'Histórico'
	,'nav.newTickets': 'Novos Chamados'
	,'nav.technicians': 'Técnicos'
	,'nav.employees': 'Colaboradores'
	,'nav.reports': 'Relatórios'
	,'nav.settings': 'Configurações'
	,'nav.notifications': 'Notificações'
	,'nav.security': 'Segurança'
	,'nav.logout': 'Sair'

	// App
	,'app.name': 'Sistema de Chamados'

	// Common
	,'common.loading': 'Carregando...'
	,'common.update': 'Atualizar'
	,'common.viewAll': 'Ver Todos'
	,'common.view': 'Visualizar'
	,'common.edit': 'Editar'
	,'common.delete': 'Excluir'
	,'common.cancel': 'Cancelar'
	,'common.close': 'Fechar'
	,'common.download': 'Baixar'
	,'common.file': 'Arquivo'
	,'common.save': 'Salvar'
	,'common.saving': 'Salvando...'
	,'common.clear': 'Limpar'
	,'common.clearFilters': 'Limpar filtros'

	// Home
	,'home.title': 'Dashboard'
	,'home.welcome': 'Bem-vindo de volta,'
	,'home.refresh': 'Atualizar'
	,'home.stats.active': 'Chamados Ativos'
	,'home.stats.inProgress': 'Em Andamento'
	,'home.stats.completed': 'Concluídos'
	,'home.stats.urgent': 'Urgentes'
	,'home.recent.title': 'Chamados Recentes'
	,'home.recent.viewAll': 'Ver Todos'
	,'home.recent.emptyTitle': 'Nenhum chamado encontrado'
	,'home.recent.emptySubtitle': 'Quando houver chamados, eles aparecerão aqui.'
	,'home.quickActions': 'Ações Rápidas'
	,'home.systemInfo': 'Informações do Sistema'
	,'home.systemInfo.status': 'Status do Sistema'
	,'home.systemInfo.online': 'Online'
	,'home.systemInfo.lastUpdate': 'Última Atualização'
	,'home.systemInfo.activeUsers': 'Usuários Ativos'
	,'home.systemInfo.version': 'Versão'
	,'home.seeTickets': 'Ver Tickets Disponíveis'

	// Called (Tickets)
	,'called.title.agent': 'Tickets Disponíveis'
	,'called.title.admin': 'Chamados de Manutenção'
	,'called.subtitle.agent': 'Tickets disponíveis para aceitar e atender'
	,'called.subtitle.admin': 'Gerencie e acompanhe todos os chamados de manutenção'
	,'called.viewHistory': 'Ver Histórico'
	,'called.newTicket': 'Novo Chamado'
	,'called.stats.total': 'Total'
	,'called.stats.pending': 'Pendentes'
	,'called.stats.inProgress': 'Em Andamento'
	,'called.search.placeholder': 'Buscar chamados...'
	,'called.clear': 'Limpar'
	,'called.list.title': 'Chamados'
	,'called.modal.confirmDelete': 'Confirmar exclusão'
	,'called.modal.areYouSure': 'Tem certeza que deseja excluir o chamado'
	,'called.modal.cancel': 'Cancelar'
	,'called.modal.delete': 'Excluir'
	,'called.modal.deleting': 'Excluindo...'
	,'called.labels.requester': 'Solicitante:'
	,'called.labels.technician': 'Técnico:'
	,'called.labels.location': 'Local:'
	,'called.labels.time': 'Tempo:'
	,'called.labels.createdAt': 'Criado:'
	,'called.labels.updatedAt': 'Atualizado:'
	,'called.labels.number': 'Nº'
	,'called.attachments': 'Anexos'
	,'called.comments': 'Comentários'
	,'called.history': 'Histórico'
	,'called.labels.resolutionTime': 'Tempo de resolução:'
	,'called.labels.customerSatisfaction': 'Satisfação do cliente:'
	,'called.labels.deadline': 'Prazo:'
	,'status.pending': 'Pendente'
	,'status.inProgress': 'Em Andamento'
	,'status.resolved': 'Concluído'
	,'status.cancelled': 'Cancelado'
	,'priority.low': 'Baixa'
	,'priority.medium': 'Média'
	,'priority.high': 'Alta'
	,'priority.critical': 'Crítica'

	// Reports
	,'reports.title.admin': 'Relatórios e Estatísticas'
	,'reports.title.agent': 'Relatórios e Estatísticas Pessoais'
	,'reports.subtitle.admin': 'Análise detalhada de chamados, performance e métricas do sistema'
	,'reports.subtitle.agent': 'Visualização dos seus chamados, performance e métricas pessoais'
	,'reports.export': 'Exportar'
	,'reports.print': 'Imprimir'
	,'reports.overview.totalTickets': 'Total de Chamados'
	,'reports.overview.resolutionRate': 'Taxa de Resolução'
	,'reports.overview.avgTime': 'Tempo Médio'
	,'reports.overview.satisfaction': 'Satisfação'
	,'reports.overview.noChange': 'Sem variação'
	,'reports.departmentDistribution': 'Distribuição por Departamento'
	,'reports.priorityDistribution': 'Distribuição por Prioridade'
	,'reports.topTechnicians': 'Melhores Técnicos'
	,'reports.recentActivity': 'Atividade Recente'
	,'reports.labels.tickets': 'Chamados:'
	,'reports.labels.avgTime': 'Tempo Médio:'
	,'reports.labels.satisfaction': 'Satisfação:'

	// Employees
	,'employees.title': 'Colaboradores'
	,'employees.subtitle.admin': 'Gerencie a equipe de colaboradores e acompanhe o desempenho dos profissionais'
	,'employees.subtitle.agent': 'Visualize a equipe de colaboradores e acompanhe o desempenho dos profissionais'
	,'employees.new': 'Novo Colaborador'
	,'employees.search.placeholder': 'Buscar colaboradores...'
	,'employees.stats.total': 'Total de Colaboradores'
	,'employees.stats.active': 'Ativos'
	,'employees.stats.projects': 'Total de Projetos'
	,'employees.profile.title': 'Perfil do Colaborador'
	,'employees.modal.deleteTitle': 'Excluir colaborador'
	,'employees.modal.deleteDesc': 'Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.'

	// Maintenance
	,'maintenance.title': 'Equipe de Manutenção'
	,'maintenance.subtitle': 'Gerencie a equipe técnica e acompanhe o desempenho dos profissionais'
	,'maintenance.new': 'Novo Técnico'
	,'maintenance.viewAvailable': 'Ver Tickets Disponíveis'
	,'maintenance.search.placeholder': 'Buscar técnicos...'
	,'maintenance.stats.totalTechs': 'Total de Técnicos'
	,'maintenance.stats.available': 'Disponíveis'
	,'maintenance.stats.onJob': 'Em Trabalho'
	,'maintenance.stats.totalJobs': 'Total de Serviços'

	// Agent Home
	,'agent.home.title': 'Central do Técnico'
	,'agent.home.welcome': 'Bem-vindo de volta,'
	,'agent.home.stats.assigned': 'Tickets Atribuídos'
	,'agent.home.stats.completedToday': 'Concluídos Hoje'
	,'agent.home.stats.inProgress': 'Em Andamento'
	,'agent.home.stats.waiting': 'Aguardando Cliente'
	,'agent.home.stats.avgTime': 'Tempo Médio'
	,'agent.home.stats.rating': 'Avaliação'
	,'agent.home.quickActions': 'Ações Rápidas'
	,'agent.home.myActiveTickets': 'Meus Tickets Ativos'
	,'agent.home.filters.all': 'Todos'
	,'agent.home.filters.open': 'Abertos'
	,'agent.home.filters.inProgress': 'Em Andamento'
	,'agent.home.filters.waiting': 'Aguardando'
	,'agent.home.viewAll': 'Ver Todos'
	,'agent.home.empty.title': 'Nenhum ticket encontrado'
	,'agent.home.empty.subtitle': 'Quando novos tickets forem atribuídos a você, eles aparecerão aqui.'
	,'agent.home.quick.accept.title': 'Aceitar Ticket'
	,'agent.home.quick.accept.subtitle': 'Aceitar novos tickets disponíveis'
	,'agent.home.quick.myTickets.title': 'Meus Tickets'
	,'agent.home.quick.myTickets.subtitle': 'Ver todos os meus tickets'
	,'agent.home.quick.reports.title': 'Relatórios'
	,'agent.home.quick.reports.subtitle': 'Ver relatórios de performance'

	// Client Home
	,'client.home.dashboard': 'Painel'
	,'client.home.welcome': 'Bem-vindo,'
	,'client.home.newTicket': 'Novo Chamado'
	,'client.home.viewAll': 'Ver Todos'
	,'client.home.stats.total': 'Total'
	,'client.home.stats.pending': 'Pendentes'
	,'client.home.stats.inProgress': 'Em Andamento'
	,'client.home.stats.completed': 'Concluídos'
	,'client.home.stats.cancelled': 'Cancelados'
	,'client.home.recent': 'Chamados Recentes'
	,'client.home.empty.title': 'Nenhum chamado encontrado'
	,'client.home.empty.subtitle': 'Comece criando seu primeiro chamado de manutenção'
	,'client.home.quick.new.title': 'Novo Chamado'
	,'client.home.quick.new.subtitle': 'Solicitar manutenção'
	,'client.home.quick.history.title': 'Histórico'
	,'client.home.quick.history.subtitle': 'Ver chamados anteriores'
	,'client.home.quick.notifications.title': 'Notificações'
	,'client.home.quick.notifications.subtitle': 'Ver atualizações'
	,'client.home.quick.profile.title': 'Meu Perfil'
	,'client.home.quick.profile.subtitle': 'Gerenciar conta'

	// Filters Common
	,'filters.all': 'All'
	,'filters.open': 'Open'
	,'filters.inProgress': 'In Progress'
	,'filters.waiting': 'Waiting'
	,'filters.status': 'Status'
	,'filters.priority': 'Priority'
	,'filters.department.all': 'All Departments'
	,'filters.period.week': 'Last Week'
	,'filters.period.month': 'Last Month'
	,'filters.period.quarter': 'Last Quarter'
	,'filters.period.year': 'Last Year'

	// Notifications
	,'notifications.now': 'Agora'
	,'notifications.minutesAgoSuffix': 'm atrás'
	,'notifications.hoursAgoSuffix': 'h atrás'
	,'notifications.daysAgoSuffix': 'd atrás'
	,'notifications.empty': 'Nenhuma notificação'
	,'notifications.markAllRead': 'Marcar todas como lidas'
	,'notifications.title': 'Notificações'
	,'notifications.search.placeholder': 'Pesquisar notificações...'
	,'notifications.filters.all': 'Todas'
	,'notifications.filters.unread': 'Não lidas'
	,'notifications.filters.info': 'Info'
	,'notifications.filters.success': 'Sucesso'
	,'notifications.filters.warning': 'Alerta'
	,'notifications.filters.error': 'Erro'
	,'notifications.totalSuffix': 'total'
	,'notifications.unreadSuffix': 'não lidas'
	,'notifications.actions.clearAll': 'Limpar todas'
	,'notifications.actions.clear': 'Limpar'
	,'notifications.emptyFound': 'Nenhuma notificação encontrada'
	,'notifications.empty.adjustFilters': 'Tente ajustar seus filtros ou termos de pesquisa para encontrar o que procura.'
	,'notifications.empty.noPending': 'Você está em dia! Não há notificações pendentes no momento.'
	,'notifications.empty.clearFilters': 'Limpar filtros'

	// Profile
	,'profile.title': 'Meu Perfil'
	,'profile.subtitle': 'Gerencie suas informações pessoais e profissionais'
	,'profile.tabs.profile': 'Perfil'
	,'profile.tabs.activities': 'Atividades'
	,'profile.success': 'Perfil atualizado com sucesso!'
	,'profile.buttons.cancel': 'Cancelar'
	,'profile.buttons.save': 'Salvar'
	,'profile.buttons.saving': 'Salvando...'
	,'profile.buttons.edit': 'Editar Perfil'
	,'profile.section.personalInfo': 'Informações Pessoais'
	,'profile.labels.fullName': 'Nome Completo'
	,'profile.labels.email': 'Email'
	,'profile.labels.phone': 'Telefone'
	,'profile.labels.addPhone': 'Adicione seu telefone aqui'
	,'profile.labels.role': 'Cargo'
	,'profile.labels.department': 'Departamento'
	,'profile.labels.address': 'Endereço'
	,'profile.labels.bio': 'Biografia'
	,'profile.labels.skills': 'Habilidades'
	,'profile.badge.registration': 'Matrícula'
	,'profile.badge.hireDate': 'Admissão'
	,'profile.activities.assignedTitle': 'Chamados Atribuídos a Você'
	,'profile.activities.createdTitle': 'Chamados Criados por Você'
	,'profile.activities.loading': 'Carregando chamados...'
	,'profile.activities.empty.assignedTitle': 'Nenhum chamado atribuído a você ainda'
	,'profile.activities.empty.createdTitle': 'Você ainda não criou nenhum chamado'
	,'profile.activities.empty.assignedSubtitle': 'Os chamados aparecerão aqui quando forem atribuídos a você'
	,'profile.activities.empty.createdSubtitle': 'Seus chamados aparecerão aqui quando você os criar'
}

const enUS: Messages = {
	// Header
	'settings.title': 'Settings',
	'settings.subtitle': 'Manage system settings and your profile',

	// Buttons
	'buttons.save': 'Save Changes',
	'buttons.saving': 'Saving...',
	'buttons.restoreDefaults': 'Restore Defaults',

	// Messages / Toasts
	'messages.savedSuccess': 'Settings saved successfully!'
	,'toasts.saved': 'Settings saved!'
	,'toasts.saveFailed': 'Failed to save settings'
	,'toasts.restoredDefaults': 'Settings restored to defaults'

	// Tabs
	,'tabs.creations': 'Creations'
	,'tabs.appearance': 'Appearance'

	// Appearance
	,'appearance.title': 'Interface Customization'
	,'appearance.fontSize.label': 'Font Size'
	,'appearance.fontSize.small': 'Small'
	,'appearance.fontSize.medium': 'Medium'
	,'appearance.fontSize.large': 'Large'
	,'appearance.interfaceDensity.label': 'Interface Density'
	,'appearance.interfaceDensity.compact': 'Compact'
	,'appearance.interfaceDensity.comfortable': 'Comfortable'
	,'appearance.interfaceDensity.spacious': 'Spacious'
	,'appearance.language.label': 'Language'

	// Behavior
	,'behavior.title': 'Behavior'
	,'behavior.animations': 'Enable animations'
	,'behavior.compactMode': 'Compact mode'

	// Creations section
	,'creations.title': 'Creation Shortcuts'
	,'creations.subtitle': 'Quickly access pages to create new records in the system.'
	,'creations.newTicket.title': 'New Ticket'
	,'creations.newTicket.subtitle': 'Open a maintenance ticket'
	,'creations.newTechnician.title': 'New Technician'
	,'creations.newTechnician.subtitle': 'Register a maintenance technician'
	,'creations.newEmployee.title': 'New Employee'
	,'creations.newEmployee.subtitle': 'Add an employee/client'
	,'creations.categories.title': 'Ticket Categories'
	,'creations.categories.subtitle': 'Create and manage categories'
	,'creations.subcategories.title': 'Subcategories'
	,'creations.subcategories.subtitle': 'Create and manage subcategories'

	// Navigation
	,'nav.home': 'Home'
	,'nav.tickets': 'Tickets'
	,'nav.history': 'History'
	,'nav.newTickets': 'New Tickets'
	,'nav.technicians': 'Technicians'
	,'nav.employees': 'Employees'
	,'nav.reports': 'Reports'
	,'nav.settings': 'Settings'
	,'nav.notifications': 'Notifications'
	,'nav.security': 'Security'
	,'nav.logout': 'Sign out'

	// App
	,'app.name': 'Ticketing System'

	// Common
	,'common.loading': 'Loading...'
	,'common.update': 'Update'
	,'common.viewAll': 'View All'
	,'common.view': 'View'
	,'common.edit': 'Edit'
	,'common.delete': 'Delete'
	,'common.cancel': 'Cancel'
	,'common.close': 'Close'
	,'common.download': 'Download'
	,'common.file': 'File'
	,'common.save': 'Save'
	,'common.saving': 'Saving...'
	,'common.clear': 'Clear'
	,'common.clearFilters': 'Clear filters'

	// Home
	,'home.title': 'Dashboard'
	,'home.welcome': 'Welcome back,'
	,'home.refresh': 'Refresh'
	,'home.stats.active': 'Active Tickets'
	,'home.stats.inProgress': 'In Progress'
	,'home.stats.completed': 'Completed'
	,'home.stats.urgent': 'Urgent'
	,'home.recent.title': 'Recent Tickets'
	,'home.recent.viewAll': 'View All'
	,'home.recent.emptyTitle': 'No tickets found'
	,'home.recent.emptySubtitle': 'When there are tickets, they will appear here.'
	,'home.quickActions': 'Quick Actions'
	,'home.systemInfo': 'System Information'
	,'home.systemInfo.status': 'System Status'
	,'home.systemInfo.online': 'Online'
	,'home.systemInfo.lastUpdate': 'Last Update'
	,'home.systemInfo.activeUsers': 'Active Users'
	,'home.systemInfo.version': 'Version'
	,'home.seeTickets': 'See Available Tickets'

	// Called (Tickets)
	,'called.title.agent': 'Available Tickets'
	,'called.title.admin': 'Maintenance Tickets'
	,'called.subtitle.agent': 'Tickets available to accept and work on'
	,'called.subtitle.admin': 'Manage and track all maintenance tickets'
	,'called.viewHistory': 'View History'
	,'called.newTicket': 'New Ticket'
	,'called.stats.total': 'Total'
	,'called.stats.pending': 'Pending'
	,'called.stats.inProgress': 'In Progress'
	,'called.search.placeholder': 'Search tickets...'
	,'called.clear': 'Clear'
	,'called.list.title': 'Tickets'
	,'called.modal.confirmDelete': 'Confirm deletion'
	,'called.modal.areYouSure': 'Are you sure you want to delete ticket'
	,'called.modal.cancel': 'Cancel'
	,'called.modal.delete': 'Delete'
	,'called.modal.deleting': 'Deleting...'
	,'called.labels.requester': 'Requester:'
	,'called.labels.technician': 'Technician:'
	,'called.labels.location': 'Location:'
	,'called.labels.time': 'Time:'
	,'called.labels.createdAt': 'Created:'
	,'called.labels.updatedAt': 'Updated:'
	,'called.labels.number': 'No.'
	,'called.attachments': 'Attachments'
	,'called.comments': 'Comments'
	,'called.history': 'History'
	,'called.labels.resolutionTime': 'Resolution time:'
	,'called.labels.customerSatisfaction': 'Customer satisfaction:'
	,'called.labels.deadline': 'Deadline:'
	,'status.pending': 'Pending'
	,'status.inProgress': 'In Progress'
	,'status.resolved': 'Resolved'
	,'status.cancelled': 'Cancelled'
	,'priority.low': 'Low'
	,'priority.medium': 'Medium'
	,'priority.high': 'High'
	,'priority.critical': 'Critical'

	// Reports
	,'reports.title.admin': 'Reports and Statistics'
	,'reports.title.agent': 'Personal Reports and Statistics'
	,'reports.subtitle.admin': 'Detailed analysis of tickets, performance and system metrics'
	,'reports.subtitle.agent': 'View your tickets, performance and personal metrics'
	,'reports.export': 'Export'
	,'reports.print': 'Print'
	,'reports.overview.totalTickets': 'Total Tickets'
	,'reports.overview.resolutionRate': 'Resolution Rate'
	,'reports.overview.avgTime': 'Average Time'
	,'reports.overview.satisfaction': 'Satisfaction'
	,'reports.overview.noChange': 'No change'
	,'reports.departmentDistribution': 'Department Distribution'
	,'reports.priorityDistribution': 'Priority Distribution'
	,'reports.topTechnicians': 'Top Technicians'
	,'reports.recentActivity': 'Recent Activity'
	,'reports.labels.tickets': 'Tickets:'
	,'reports.labels.avgTime': 'Average Time:'
	,'reports.labels.satisfaction': 'Satisfaction:'

	// Employees
	,'employees.title': 'Employees'
	,'employees.subtitle.admin': 'Manage the team and track professional performance'
	,'employees.subtitle.agent': 'View the team and track professional performance'
	,'employees.new': 'New Employee'
	,'employees.search.placeholder': 'Search employees...'
	,'employees.stats.total': 'Total Employees'
	,'employees.stats.active': 'Active'
	,'employees.stats.projects': 'Total Projects'
	,'employees.profile.title': 'Employee Profile'
	,'employees.modal.deleteTitle': 'Delete employee'
	,'employees.modal.deleteDesc': 'Are you sure you want to delete this employee? This action cannot be undone.'

	// Maintenance
	,'maintenance.title': 'Maintenance Team'
	,'maintenance.subtitle': 'Manage the technical team and track professional performance'
	,'maintenance.new': 'New Technician'
	,'maintenance.viewAvailable': 'See Available Tickets'
	,'maintenance.search.placeholder': 'Search technicians...'
	,'maintenance.stats.totalTechs': 'Total Technicians'
	,'maintenance.stats.available': 'Available'
	,'maintenance.stats.onJob': 'On Job'
	,'maintenance.stats.totalJobs': 'Total Jobs'

	// Agent Home
	,'agent.home.title': 'Technician Hub'
	,'agent.home.welcome': 'Welcome back,'
	,'agent.home.stats.assigned': 'Assigned Tickets'
	,'agent.home.stats.completedToday': 'Completed Today'
	,'agent.home.stats.inProgress': 'In Progress'
	,'agent.home.stats.waiting': 'Waiting for Client'
	,'agent.home.stats.avgTime': 'Average Time'
	,'agent.home.stats.rating': 'Rating'
	,'agent.home.quickActions': 'Quick Actions'
	,'agent.home.myActiveTickets': 'My Active Tickets'
	,'agent.home.filters.all': 'All'
	,'agent.home.filters.open': 'Open'
	,'agent.home.filters.inProgress': 'In Progress'
	,'agent.home.filters.waiting': 'Waiting'
	,'agent.home.viewAll': 'View All'
	,'agent.home.empty.title': 'No tickets found'
	,'agent.home.empty.subtitle': 'When new tickets are assigned to you, they will appear here.'
	,'agent.home.quick.accept.title': 'Accept Ticket'
	,'agent.home.quick.accept.subtitle': 'Accept new available tickets'
	,'agent.home.quick.myTickets.title': 'My Tickets'
	,'agent.home.quick.myTickets.subtitle': 'See all my tickets'
	,'agent.home.quick.reports.title': 'Reports'
	,'agent.home.quick.reports.subtitle': 'View performance reports'

	// Client Home
	,'client.home.dashboard': 'Dashboard'
	,'client.home.welcome': 'Welcome,'
	,'client.home.newTicket': 'New Ticket'
	,'client.home.viewAll': 'View All'
	,'client.home.stats.total': 'Total'
	,'client.home.stats.pending': 'Pending'
	,'client.home.stats.inProgress': 'In Progress'
	,'client.home.stats.completed': 'Completed'
	,'client.home.stats.cancelled': 'Cancelled'
	,'client.home.recent': 'Recent Tickets'
	,'client.home.empty.title': 'No tickets found'
	,'client.home.empty.subtitle': 'Start by creating your first maintenance ticket'
	,'client.home.quick.new.title': 'New Ticket'
	,'client.home.quick.new.subtitle': 'Request maintenance'
	,'client.home.quick.history.title': 'History'
	,'client.home.quick.history.subtitle': 'View previous tickets'
	,'client.home.quick.notifications.title': 'Notifications'
	,'client.home.quick.notifications.subtitle': 'View updates'
	,'client.home.quick.profile.title': 'My Profile'
	,'client.home.quick.profile.subtitle': 'Manage account'

	// Filters Common
	,'filters.all': 'All'
	,'filters.open': 'Open'
	,'filters.inProgress': 'In Progress'
	,'filters.waiting': 'Waiting'
	,'filters.status': 'Status'
	,'filters.priority': 'Priority'
	,'filters.department.all': 'All Departments'
	,'filters.period.week': 'Last Week'
	,'filters.period.month': 'Last Month'
	,'filters.period.quarter': 'Last Quarter'
	,'filters.period.year': 'Last Year'

	// Notifications
	,'notifications.now': 'Now'
	,'notifications.minutesAgoSuffix': 'm ago'
	,'notifications.hoursAgoSuffix': 'h ago'
	,'notifications.daysAgoSuffix': 'd ago'
	,'notifications.empty': 'No notifications'
	,'notifications.markAllRead': 'Mark all as read'
	,'notifications.title': 'Notifications'
	,'notifications.search.placeholder': 'Search notifications...'
	,'notifications.filters.all': 'All'
	,'notifications.filters.unread': 'Unread'
	,'notifications.filters.info': 'Info'
	,'notifications.filters.success': 'Success'
	,'notifications.filters.warning': 'Warning'
	,'notifications.filters.error': 'Error'
	,'notifications.totalSuffix': 'total'
	,'notifications.unreadSuffix': 'unread'
	,'notifications.actions.clearAll': 'Clear all'
	,'notifications.actions.clear': 'Clear'
	,'notifications.emptyFound': 'No notifications found'
	,'notifications.empty.adjustFilters': 'Try adjusting your filters or search terms to find what you need.'
	,'notifications.empty.noPending': 'You’re all caught up! There are no pending notifications right now.'
	,'notifications.empty.clearFilters': 'Clear filters'

	// Profile
	,'profile.title': 'My Profile'
	,'profile.subtitle': 'Manage your personal and professional information'
	,'profile.tabs.profile': 'Profile'
	,'profile.tabs.activities': 'Activities'
	,'profile.success': 'Profile updated successfully!'
	,'profile.buttons.cancel': 'Cancel'
	,'profile.buttons.save': 'Save'
	,'profile.buttons.saving': 'Saving...'
	,'profile.buttons.edit': 'Edit Profile'
	,'profile.section.personalInfo': 'Personal Information'
	,'profile.labels.fullName': 'Full Name'
	,'profile.labels.email': 'Email'
	,'profile.labels.phone': 'Phone'
	,'profile.labels.addPhone': 'Add your phone here'
	,'profile.labels.role': 'Role'
	,'profile.labels.department': 'Department'
	,'profile.labels.address': 'Address'
	,'profile.labels.bio': 'Bio'
	,'profile.labels.skills': 'Skills'
	,'profile.badge.registration': 'Registration'
	,'profile.badge.hireDate': 'Hire Date'
	,'profile.activities.assignedTitle': 'Tickets Assigned to You'
	,'profile.activities.createdTitle': 'Tickets Created by You'
	,'profile.activities.loading': 'Loading tickets...'
	,'profile.activities.empty.assignedTitle': 'No tickets assigned to you yet'
	,'profile.activities.empty.createdTitle': 'You haven’t created any tickets yet'
	,'profile.activities.empty.assignedSubtitle': 'Tickets will appear here when assigned to you'
	,'profile.activities.empty.createdSubtitle': 'Your tickets will appear here when you create them'
}

const dictionaries: Record<Language, Messages> = {
	'pt-BR': ptBR,
	'en-US': enUS,
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
	const [language, setLanguageState] = useState<Language>('pt-BR')

	useEffect(() => {
		try {
			const savedConfig = localStorage.getItem('appConfig')
			if (savedConfig) {
				const parsed = JSON.parse(savedConfig)
				if (parsed?.idioma === 'pt-BR' || parsed?.idioma === 'en-US') {
					setLanguageState(parsed.idioma)
					return
				}
			}
			// Fallback adicional: compatibilidade com versões antigas que usavam 'appLang'
			const legacy = localStorage.getItem('appLang') as Language | null
			if (legacy === 'pt-BR' || legacy === 'en-US') {
				setLanguageState(legacy)
				return
			}
			// Fallback: usa idioma do navegador preferindo PT
			const browserLang = (typeof navigator !== 'undefined' ? navigator.language : 'pt-BR').toLowerCase()
			const preferred: Language = browserLang.startsWith('pt') ? 'pt-BR' : 'en-US'
			setLanguageState(preferred)
		} catch {}
	}, [])

	const setLanguage = (lng: Language) => {
		setLanguageState(lng)
		try {
			const savedConfig = localStorage.getItem('appConfig')
			if (savedConfig) {
				const parsed = JSON.parse(savedConfig)
				localStorage.setItem('appConfig', JSON.stringify({ ...parsed, idioma: lng }))
			} else {
				localStorage.setItem('appConfig', JSON.stringify({ idioma: lng }))
			}
			// Sincroniza também legado
			localStorage.setItem('appLang', lng)
		} catch {}
	}

	// Atualiza atributo lang do HTML
	useEffect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('lang', language)
		}
	}, [language])

	const messages = useMemo(() => dictionaries[language] ?? ptBR, [language])

	const t = (key: string) => messages[key] ?? key

	const value = useMemo<I18nContextType>(() => ({ language, setLanguage, t }), [language])

	return (
		<I18nContext.Provider value={value}>
			{children}
		</I18nContext.Provider>
	)
}

export function useI18n() {
	const ctx = useContext(I18nContext)
	if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
	return ctx
}


