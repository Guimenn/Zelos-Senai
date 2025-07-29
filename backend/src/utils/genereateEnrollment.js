/**
 * Utilitário para geração de números de matrícula (arquivo duplicado)
 * Gera códigos únicos de matrícula baseados no ID do usuário
 * NOTA: Este arquivo parece ser uma duplicata de generateEnrollment.js
 */
function generateEnrollment(id) {
	const BASE = 100000;
	const suffix = id.toString().padStart(2, '0').slice(-2);
	const prefixNumber = BASE + Math.floor(id / 100);
	const prefix = prefixNumber.toString().padStart(6, '0');
	return `${prefix}-${suffix}`;
}

export { generateEnrollment };
