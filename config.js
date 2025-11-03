// config.js
// Полностью прописанная конфигурация с ускоренными настройками
(function() {
    'use strict';
    
    window.API_KEYS = window.API_KEYS || {
        huggingface: null
    };

    window.APP_CONFIG = {
        version: '1.3.0',
        maxMessageLength: 1000,
        maxChats: 15,
        theme: 'light',
        responseTimeout: 12000, // Уменьшен таймаут до 12 секунд
        typingSpeed: 30, // Ускоренная скорость "печатания"
        animations: {
            enabled: true,
            duration: 0.2, // Укорочена длительность анимаций
            messageSlideIn: 0.15,
            bubbleAppear: 0.2
        },
        fruitRain: {
            enabled: true,
            density: 18, // Уменьшена плотность для производительности
            spawnInterval: 120, // Ускорено появление фруктов
            speed: { min: 5, max: 10 }, // Ускорено падение
            size: { min: 22, max: 36 },
            opacity: { min: 0.6, max: 0.9 }
        },
        performance: {
            useWebGL: false,
            optimizeAnimations: true,
            reduceMotion: false
        }
    };
    
    console.log('🎯 Ускоренная конфигурация Фруктик Чата загружена');
})();