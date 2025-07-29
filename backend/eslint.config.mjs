import js from '@eslint/js';
import globals from 'globals';
import json from '@eslint/json';
import { defineConfig } from 'eslint/config';

export default defineConfig([
	{
		files: ['**/*.{js,mjs,cjs}'],
		plugins: { js },
		extends: ['js/recommended', 'prettier'],
		rules: {
			'require-await': 'warn',
			'no-unused-vars': 'warn',
			'no-undef': 'error',
			'consistent-return': 'warn',
		},
	},
	{
		files: ['**/*.{js,mjs,cjs}'],
		languageOptions: { globals: globals.node },
	},
	{
		files: ['**/*.json'],
		plugins: { json },
		language: 'json/json',
		extends: ['json/recommended', 'prettier'],
	},
]);
