/**
 * Sistema de cache em memória para otimização de performance
 * Armazena dados frequentemente acessados para reduzir consultas ao banco
 */

class MemoryCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutos
    }

    /**
     * Armazena um valor no cache
     * @param {string} key - Chave do cache
     * @param {any} value - Valor a ser armazenado
     * @param {number} ttl - Tempo de vida em milissegundos
     */
    set(key, value, ttl = this.defaultTTL) {
        // Limpar timer existente se houver
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });

        // Configurar timer para limpeza automática
        const timer = setTimeout(() => {
            this.delete(key);
        }, ttl);

        this.timers.set(key, timer);
    }

    /**
     * Obtém um valor do cache
     * @param {string} key - Chave do cache
     * @returns {any|null} - Valor armazenado ou null se não existir/expirado
     */
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        // Verificar se expirou
        if (Date.now() - item.timestamp > item.ttl) {
            this.delete(key);
            return null;
        }

        return item.value;
    }

    /**
     * Remove um item do cache
     * @param {string} key - Chave do cache
     */
    delete(key) {
        this.cache.delete(key);
        
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
    }

    /**
     * Limpa todo o cache
     */
    clear() {
        this.cache.clear();
        
        // Limpar todos os timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();
    }

    /**
     * Verifica se uma chave existe no cache
     * @param {string} key - Chave do cache
     * @returns {boolean} - True se existe e não expirou
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Obtém estatísticas do cache
     * @returns {Object} - Estatísticas do cache
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Instância singleton do cache
const cache = new MemoryCache();

// Chaves de cache comuns
const CACHE_KEYS = {
    STATISTICS: 'statistics',
    CATEGORIES: 'categories',
    USER_PROFILE: 'user_profile',
    TICKET_LIST: 'ticket_list',
    NOTIFICATIONS: 'notifications'
};

// Função helper para gerar chaves de cache
function generateCacheKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join('|');
    
    return sortedParams ? `${prefix}:${sortedParams}` : prefix;
}

// Função helper para invalidar cache por padrão
function invalidateCacheByPattern(pattern) {
    const keys = Array.from(cache.cache.keys());
    keys.forEach(key => {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    });
}

export { cache, CACHE_KEYS, generateCacheKey, invalidateCacheByPattern };
