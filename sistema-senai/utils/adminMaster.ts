/**
 * Utilitário para verificar se um usuário é Admin Master
 * Centraliza a lógica de verificação de admin master para facilitar manutenção
 */

// Lista de emails que têm permissões de Admin Master
const ADMIN_MASTER_EMAILS = [
  'renan.queiroz08sr@gmail.com'
];

/**
 * Verifica se um usuário é Admin Master baseado no email
 * @param email - Email do usuário
 * @returns true se for admin master, false caso contrário
 */
export function isAdminMaster(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_MASTER_EMAILS.includes(email);
}

/**
 * Verifica se um usuário é Admin Master baseado no objeto user
 * @param user - Objeto do usuário (pode ter email ou userEmail)
 * @returns true se for admin master, false caso contrário
 */
export function isUserAdminMaster(user: any): boolean {
  if (!user) return false;
  const email = user.email || user.userEmail;
  return isAdminMaster(email);
}

/**
 * Retorna a lista de emails de admin master
 * @returns Array com os emails de admin master
 */
export function getAdminMasterEmails(): string[] {
  return [...ADMIN_MASTER_EMAILS];
}

/**
 * Adiciona um novo email à lista de admin master
 * @param email - Email a ser adicionado
 */
export function addAdminMasterEmail(email: string): void {
  if (!ADMIN_MASTER_EMAILS.includes(email)) {
    ADMIN_MASTER_EMAILS.push(email);
  }
}

/**
 * Remove um email da lista de admin master
 * @param email - Email a ser removido
 */
export function removeAdminMasterEmail(email: string): void {
  const index = ADMIN_MASTER_EMAILS.indexOf(email);
  if (index > -1) {
    ADMIN_MASTER_EMAILS.splice(index, 1);
  }
}
