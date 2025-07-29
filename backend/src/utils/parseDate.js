/**
 * Utilitários para formatação e conversão de datas
 * Converte entre formatos brasileiro (DD/MM/YYYY) e ISO (YYYY-MM-DD)
 */

/**
 * Converte data do formato brasileiro para ISO
 * @param {string} rawDate - Data no formato DD/MM/YYYY
 * @returns {Date|null} - Objeto Date válido ou null se inválida
 */
function formatDateISO(rawDate) {
	const [day, month, year] = rawDate.split('/');
	if (!day || !month || !year) return null;

	const isoString = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	const date = new Date(isoString);

	// Verifica se a data é válida
	if (isNaN(date.getTime())) return null;

	return date;
}

/**
 * Converte data para formato brasileiro
 * @param {Date} date - Objeto Date
 * @returns {string} - Data formatada como DD/MM/YYYY
 */
function formatDateBR(date) {
	if (!date) return '';
	const d = new Date(date);
	return d.toLocaleDateString('pt-BR');
}

export { formatDateISO, formatDateBR };
