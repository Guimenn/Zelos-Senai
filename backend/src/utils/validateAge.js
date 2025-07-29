/**
 * Utilitário para validação de idade
 * Verifica se uma pessoa tem pelo menos 6 anos de idade
 */

/**
 * Verifica se a pessoa tem mais de 6 anos
 * @param {Date} date - Data de nascimento
 * @returns {boolean} - True se tem 6 anos ou mais, false caso contrário
 */
function isOlderThanSixYears(date) {
	const today = new Date();

	let age = today.getFullYear() - date.getFullYear();
	const monthDiff = today.getMonth() - date.getMonth();
	const dayDiff = today.getDate() - date.getDate();

	if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
		age--;
	}

	return age >= 6;
}

export { isOlderThanSixYears };
