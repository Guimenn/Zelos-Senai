/**
 * Função para validação de CPF
 * Valida CPF brasileiro usando algoritmo oficial e retorna resultado formatado
 */
function validateCPF(rawCPF) {
	if (!rawCPF) {
		return { valid: false };
	}

	const digits = String(rawCPF).replace(/\D/g, '');

	if (!/^\d{11}$/.test(digits)) return { valid: false };

	if (/^(\d)\1{10}$/.test(digits)) return { valid: false };

	/**
	 * Calcula dígito verificador do CPF
	 */
	const calcCheckDigit = (base, factor) => {
		const total = base
			.split('')
			.reduce((sum, num, i) => sum + Number(num) * (factor - i), 0);
		const remainder = total % 11;
		return remainder < 2 ? 0 : 11 - remainder;
	};

	const baseNine = digits.slice(0, 9);
	const digit1 = calcCheckDigit(baseNine, 10);
	const digit2 = calcCheckDigit(baseNine + digit1, 11);
	const isValid = digits === baseNine + digit1 + digit2;

	return {
		valid: isValid,
		formatted: isValid
			? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
			: undefined,
	};
}

export { validateCPF };
