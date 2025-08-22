import { Notification } from '../types'

/**
 * Função para redirecionar baseada no tipo de notificação
 * @param notification - A notificação clicada
 * @param onClose - Função para fechar o popup de notificações (opcional)
 */
export const redirectToNotificationTarget = (notification: Notification, onClose?: () => void) => {
  const { category, metadata } = notification
  
  // Debug: log para verificar os dados
  console.log('Redirecting notification:', { category, metadata, notification })
  
  // Fechar o popup de notificações se fornecido
  if (onClose) {
    onClose()
  }
  
  // Verificar se estamos no browser
  if (typeof window === 'undefined') {
    console.log('Not in browser, skipping redirect')
    return false
  }
  
  // Redirecionar baseado no tipo de notificação
  switch (category) {
    case 'TICKET_CREATED':
    case 'TICKET_UPDATED':
    case 'TICKET_ASSIGNED':
    case 'TICKET_ACCEPTED':
    case 'TICKET_COMPLETED':
    case 'TICKET_ON_HOLD':
    case 'TICKET_REJECTED':
    case 'TICKET_REOPENED':
    case 'TICKET_EXPIRED':
    case 'COMMENT_ADDED':
      if (metadata?.ticketId) {
        // Redirecionar para a página de chamados e abrir o modal de visualização
        const url = `/pages/called?ticketId=${metadata.ticketId}`
        console.log('Redirecting to ticket:', url)
        window.location.href = url
        return true
      }
      break
      
    case 'ASSIGNMENT_REQUEST':
    case 'ASSIGNMENT_ACCEPTED':
    case 'ASSIGNMENT_REJECTED':
      if (metadata?.ticketId) {
        // Redirecionar para a página de chamados e abrir o modal de visualização
        const url = `/pages/called?ticketId=${metadata.ticketId}`
        console.log('Redirecting to ticket:', url)
        window.location.href = url
        return true
      }
      break
      
    case 'USER_CREATED':
    case 'USER_DELETED':
    case 'USER_STATUS_CHANGED':
    case 'USER_ROLE_CHANGED':
      if (metadata?.userId) {
        // Redirecionar para a página de funcionários
        const url = `/pages/employees/${metadata.userId}`
        console.log('Redirecting to user:', url)
        window.location.href = url
        return true
      }
      break
      
    case 'TEAM_MEMBER_ADDED':
    case 'TEAM_MEMBER_REMOVED':
      // Redirecionar para a página de técnicos/agentes
      const agentsUrl = '/pages/maintenance'
      console.log('Redirecting to agents:', agentsUrl)
      window.location.href = agentsUrl
      return true
      
    case 'AGENT_EVALUATION':
      // Redirecionar para a página de avaliações ou perfil
      const profileUrl = '/pages/perfil'
      console.log('Redirecting to profile:', profileUrl)
      window.location.href = profileUrl
      return true
      
    case 'UNASSIGNED_TICKETS_ALERT':
      // Redirecionar para a página de chamados (tickets não atribuídos)
      const calledUrl = '/pages/called'
      console.log('Redirecting to called:', calledUrl)
      window.location.href = calledUrl
      return true

    case 'HIGH_VOLUME_ALERT':
      // Redirecionar para a página de relatórios (alerta de alto volume)
      const reportsUrl = '/pages/reports'
      console.log('Redirecting to reports:', reportsUrl)
      window.location.href = reportsUrl
      return true
      
    default:
      // Para outros tipos, não redirecionar
      console.log('No redirection for category:', category)
      return false
  }
  
  return false
}
