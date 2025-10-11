// Конфигурация API Mistral
const API_KEY = '030Ujp7uvKCtTdrO8BreT1kj2vpFznGq';
const API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Доступные модели Mistral
const MODELS = {
    'mistral-tiny': 'mistral-tiny',
    'mistral-small': 'mistral-small', 
    'mistral-medium': 'mistral-medium'
};

// Используем mistral-small как модель по умолчанию
const MODEL = MODELS['mistral-small'];

// Переменные состояния
let chats = [];
let currentChatId = null;
let isSending = false;
const MAX_CHATS = 10;
const MAX_MESSAGE_LENGTH = 1000;

// Эмодзи для аватаров
const FRUIT_EMOJIS = ['🍓', '🍍', '🍇', '🍉', '🍊', '🍋', '🍌', '🍎', '🍑', '🍒', '🥭', '🫐', '🍐', '🥝'];

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    createFruitRain();
    
    // Загружаем чаты из локального хранилища
    loadChats();
    
    // Обновляем фруктовый дождь каждые 15 секунд
    setInterval(createFruitRain, 15000);
    
    setupEventListeners();
    setupAccessibility();
}

function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const newChatButton = document.getElementById('newChatButton');
    const menuButton = document.getElementById('menuButton');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const chatsSidebar = document.getElementById('chatsSidebar');
    const chatContainer = document.querySelector('.chat-container');
    
    // Обработка ввода сообщения
    messageInput.addEventListener('input', handleMessageInput);
    messageInput.addEventListener('keypress', handleMessageKeypress);
    messageInput.addEventListener('paste', handlePaste);
    
    // Кнопки
    sendButton.addEventListener('click', sendMessage);
    newChatButton.addEventListener('click', createNewChat);
    menuButton.addEventListener('click', openSidebar);
    closeSidebar.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // Предотвращаем закрытие боковой панели при клике внутри нее
    chatsSidebar.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Автофокус на поле ввода
    chatContainer.addEventListener('click', function() {
        messageInput.focus();
    });
    
    // Обработка свайпов для мобильных устройств
    setupSwipeGestures();
    
    // Обработка онлайн/офлайн статуса
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
}

function setupAccessibility() {
    // Устанавливаем ARIA-атрибуты
    document.getElementById('messageInput').setAttribute('aria-label', 'Введите сообщение для Фруктика');
    document.getElementById('sendButton').setAttribute('aria-label', 'Отправить сообщение');
}

function handleMessageInput(e) {
    const message = e.target.value.trim();
    const sendButton = document.getElementById('sendButton');
    
    // Активируем/деактивируем кнопку отправки
    sendButton.disabled = !message || message.length === 0;
    
    // Показываем количество символов
    updateCharacterCount(message.length);
}

function handleMessageKeypress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        
        // Проверяем, не пустое ли сообщение
        const message = document.getElementById('messageInput').value.trim();
        if (message && !isSending) {
            sendMessage();
        }
    }
}

function handlePaste(e) {
    // Обработка вставки текста - обрезаем если слишком длинный
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.length > MAX_MESSAGE_LENGTH) {
        e.preventDefault();
        const trimmedText = pastedText.substring(0, MAX_MESSAGE_LENGTH);
        document.getElementById('messageInput').value = trimmedText;
        showStatus('Текст обрезан до допустимой длины', 'info');
    }
}

function updateCharacterCount(length) {
    // Можно добавить отображение счетчика символов
    if (length > MAX_MESSAGE_LENGTH * 0.8) {
        showStatus(`Символов: ${length}/${MAX_MESSAGE_LENGTH}`, 'info');
    }
}

function handleOnlineStatus() {
    showStatus('Соединение восстановлено!', 'success');
}

function handleOfflineStatus() {
    showStatus('Отсутствует интернет-соединение', 'error');
}

function setupSwipeGestures() {
    let startX = 0;
    let startY = 0;
    
    document.querySelector('.chat-container').addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });
    
    document.querySelector('.chat-container').addEventListener('touchend', function(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = startX - endX;
        const diffY = startY - endY;
        
        // Проверяем, что это горизонтальный свайп (не вертикальный)
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            // Если свайп вправо более 50px, открываем боковую панель
            if (diffX < -50) {
                openSidebar();
            }
            
            // Если свайп влево более 50px, закрываем боковую панель
            if (diffX > 50) {
                closeSidebar();
            }
        }
    });
}

// Функции для работы с боковой панелью
function openSidebar() {
    const sidebar = document.getElementById('chatsSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.add('active');
    sidebar.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    
    // Блокируем скролл основного контента
    document.body.style.overflow = 'hidden';
    
    renderChatsList();
}

function closeSidebar() {
    const sidebar = document.getElementById('chatsSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('active');
    sidebar.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('active');
    
    // Разблокируем скролл
    document.body.style.overflow = '';
    
    // Фокус на поле ввода после закрытия
    document.getElementById('messageInput').focus();
}

// Функции для работы с чатами
function loadChats() {
    try {
        const savedChats = localStorage.getItem('fruitChats');
        if (savedChats) {
            chats = JSON.parse(savedChats);
            
            if (chats.length > 0) {
                // Загружаем последний активный чат или самый новый
                const lastActiveChat = chats.find(chat => chat.id === currentChatId) || chats[chats.length - 1];
                currentChatId = lastActiveChat.id;
                loadChat(currentChatId);
            } else {
                createNewChat();
            }
        } else {
            createNewChat();
        }
    } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
        showStatus('Ошибка загрузки чатов', 'error');
        createNewChat();
    }
}

function saveChats() {
    try {
        // Ограничиваем количество чатов
        if (chats.length > MAX_CHATS) {
            const chatsToRemove = chats.length - MAX_CHATS;
            chats = chats.slice(chatsToRemove);
            showStatus(`Удалены старые чаты (сохранено ${MAX_CHATS})`, 'info');
        }
        
        localStorage.setItem('fruitChats', JSON.stringify(chats));
    } catch (error) {
        console.error('Ошибка сохранения чатов:', error);
        showStatus('Ошибка сохранения чатов', 'error');
    }
}

function createNewChat() {
    const newChat = {
        id: generateChatId(),
        title: 'Новый чат',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    chats.push(newChat);
    currentChatId = newChat.id;
    saveChats();
    renderChat();
    renderChatsList();
    closeSidebar();
    
    // Фокус на поле ввода
    const messageInput = document.getElementById('messageInput');
    messageInput.focus();
    
    showStatus('Новый чат создан!', 'success');
}

function generateChatId() {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function loadChat(chatId) {
    currentChatId = chatId;
    renderChat();
    closeSidebar();
    
    // Фокус на поле ввода
    document.getElementById('messageInput').focus();
    
    showStatus('Чат загружен', 'success');
}

function deleteChat(chatId, event) {
    if (event) event.stopPropagation();
    
    if (chats.length <= 1) {
        showStatus('Нельзя удалить единственный чат!', 'error');
        return;
    }
    
    // Используем более красивое подтверждение
    if (window.confirm('Вы уверены, что хотите удалить этот чат? Все сообщения будут потеряны.')) {
        const chatIndex = chats.findIndex(chat => chat.id === chatId);
        const chatToDelete = chats[chatIndex];
        
        chats = chats.filter(chat => chat.id !== chatId);
        
        if (currentChatId === chatId) {
            // Переключаемся на соседний чат
            const newIndex = chatIndex >= chats.length ? chats.length - 1 : chatIndex;
            currentChatId = chats.length > 0 ? chats[newIndex].id : null;
        }
        
        saveChats();
        renderChat();
        renderChatsList();
        showStatus('Чат удален!', 'success');
    }
}

function updateChatTitle(chatId, newTitle) {
    const chat = chats.find(c => c.id === chatId);
    if (chat && chat.title !== newTitle) {
        chat.title = newTitle.substring(0, 50); // Ограничиваем длину заголовка
        chat.updatedAt = new Date().toISOString();
        saveChats();
        renderChatsList();
    }
}

function renderChatsList() {
    const chatsList = document.getElementById('chatsList');
    
    if (chats.length === 0) {
        chatsList.innerHTML = '<p class="text-center text-gray-500 py-4">Нет сохраненных чатов</p>';
        return;
    }
    
    // Сортируем чаты по дате обновления (новые сверху)
    const sortedChats = [...chats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    chatsList.innerHTML = sortedChats.map(chat => `
        <div class="chat-item ${chat.id === currentChatId ? 'active' : ''}" role="listitem">
            <div class="flex-1" onclick="loadChat('${chat.id}')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') loadChat('${chat.id}')">
                <div class="chat-title">${escapeHtml(chat.title)}</div>
                <div class="chat-preview">${getChatPreview(chat)}</div>
                <div class="chat-date">${formatDate(chat.updatedAt)}</div>
            </div>
            <button class="delete-chat-btn" onclick="deleteChat('${chat.id}', event)" aria-label="Удалить чат">
                <i class="fas fa-trash" aria-hidden="true"></i>
            </button>
        </div>
    `).join('');
}

function getChatPreview(chat) {
    if (chat.messages.length === 0) return 'Пока нет сообщений';
    
    const lastMessage = chat.messages[chat.messages.length - 1];
    const content = lastMessage.content.substring(0, 30);
    return lastMessage.role === 'user' ? `Вы: ${content}...` : `Фруктик: ${content}...`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) {
        return 'Только что';
    } else if (diffMins < 60) {
        return `${diffMins} мин назад`;
    } else if (diffHours < 24) {
        return `${diffHours} ч назад`;
    } else if (diffDays === 1) {
        return 'Вчера';
    } else if (diffDays < 7) {
        return `${diffDays} дн назад`;
    } else {
        return date.toLocaleDateString('ru-RU');
    }
}

function renderChat() {
    const chatMessages = document.getElementById('chatMessages');
    
    if (!currentChatId || chats.length === 0) {
        chatMessages.innerHTML = getEmptyChatHTML();
        return;
    }
    
    const currentChat = chats.find(chat => chat.id === currentChatId);
    if (!currentChat) {
        chatMessages.innerHTML = getEmptyChatHTML();
        return;
    }
    
    chatMessages.innerHTML = '';
    
    if (currentChat.messages.length === 0) {
        chatMessages.innerHTML = getEmptyChatHTML();
        return;
    }
    
    currentChat.messages.forEach(message => {
        addMessageToChat(message.role, message.content, false);
    });
    
    scrollToBottom();
}

function getEmptyChatHTML() {
    return `
        <div class="empty-chat" id="emptyChat">
            <div class="empty-chat-icon">🍓</div>
            <h2 class="text-2xl font-bold mb-2">Начни новый разговор!</h2>
            <p class="text-lg">Напиши что-нибудь Фруктику, чтобы начать общение.</p>
            <div class="mt-4 text-sm text-gray-600">
                <p>✨ Фруктик поможет с:</p>
                <ul class="list-disc list-inside mt-2 text-left">
                    <li>Домашними заданиями</li>
                    <li>Объяснением сложных тем</li>
                    <li>Подготовкой к урокам</li>
                </ul>
            </div>
        </div>
    `;
}

// Создаем фруктовый дождь
function createFruitRain() {
    const rainContainer = document.getElementById('fruitRain');
    
    // Очищаем контейнер перед созданием новых фруктов
    rainContainer.innerHTML = '';
    
    const fruitCount = window.innerWidth < 768 ? 10 : 20;
    
    for (let i = 0; i < fruitCount; i++) {
        setTimeout(() => {
            const fruit = document.createElement('div');
            fruit.className = 'fruit';
            fruit.textContent = getRandomFruit();
            fruit.style.left = Math.random() * 100 + 'vw';
            fruit.style.animationDuration = (Math.random() * 5 + 3) + 's';
            fruit.style.animationDelay = Math.random() * 2 + 's';
            fruit.style.opacity = Math.random() * 0.4 + 0.2;
            fruit.style.fontSize = (Math.random() * 10 + 20) + 'px';
            fruit.style.zIndex = '-1';
            rainContainer.appendChild(fruit);
            
            // Удаляем фрукт после завершения анимации
            setTimeout(() => {
                if (fruit.parentNode === rainContainer) {
                    rainContainer.removeChild(fruit);
                }
            }, parseFloat(fruit.style.animationDuration) * 1000 + 1000);
        }, i * 200);
    }
}

// Показ статусного сообщения
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = 'status-message';
    
    switch (type) {
        case 'success':
            statusEl.classList.add('status-success');
            break;
        case 'error':
            statusEl.classList.add('status-error');
            break;
        case 'warning':
            statusEl.classList.add('status-warning');
            break;
        default:
            statusEl.classList.add('status-info');
    }
    
    statusEl.style.display = 'block';
    
    // Автоматическое скрытие
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, duration);
}

function showTypingIndicator() {
    document.getElementById('typingIndicator').classList.remove('hidden');
    document.getElementById('typingIndicator').setAttribute('aria-hidden', 'false');
    scrollToBottom();
}

function hideTypingIndicator() {
    document.getElementById('typingIndicator').classList.add('hidden');
    document.getElementById('typingIndicator').setAttribute('aria-hidden', 'true');
}

function scrollToBottom() {
    const container = document.getElementById('chatMessages');
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// Экранирование HTML для безопасности
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function sendMessage() {
    if (isSending) {
        showStatus('Подождите, сообщение отправляется...', 'warning');
        return;
    }
    
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    let message = messageInput.value.trim();
    
    // Проверка сообщения
    if (!message) {
        showStatus('Введите сообщение', 'error');
        messageInput.focus();
        return;
    }
    
    if (message.length > MAX_MESSAGE_LENGTH) {
        showStatus(`Сообщение слишком длинное (максимум ${MAX_MESSAGE_LENGTH} символов)`, 'error');
        return;
    }
    
    // Проверка интернет-соединения
    if (!navigator.onLine) {
        showStatus('Отсутствует интернет-соединение', 'error');
        return;
    }
    
    // Блокируем кнопку отправки
    isSending = true;
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    sendButton.setAttribute('aria-label', 'Отправка сообщения...');
    
    // Убираем пустой чат, если он есть
    const emptyChat = document.getElementById('emptyChat');
    if (emptyChat) {
        emptyChat.remove();
    }
    
    // Добавляем сообщение пользователя
    addMessageToChat('user', message);
    messageInput.value = '';
    
    // Сбрасываем состояние кнопки отправки
    const sendButtonInput = document.getElementById('sendButton');
    sendButtonInput.disabled = true;
    
    // Сохраняем сообщение в текущий чат
    const currentChat = chats.find(chat => chat.id === currentChatId);
    if (currentChat) {
        currentChat.messages.push({ role: 'user', content: message });
        
        // Обновляем заголовок чата, если это первое сообщение
        if (currentChat.messages.length === 1) {
            const title = message.length > 20 ? message.substring(0, 20) + '...' : message;
            updateChatTitle(currentChatId, title);
        }
        
        currentChat.updatedAt = new Date().toISOString();
        saveChats();
    }
    
    // Показываем индикатор набора
    showTypingIndicator();
    showStatus('Фруктик думает...', 'info');
    
    try {
        const response = await callMistralAPI(currentChat);
        const aiResponse = response.choices[0].message.content;
        
        // Добавляем ответ в историю и чат
        if (currentChat) {
            currentChat.messages.push({ role: 'assistant', content: aiResponse });
            currentChat.updatedAt = new Date().toISOString();
            saveChats();
        }
        
        hideTypingIndicator();
        addMessageToChat('assistant', aiResponse);
        showStatus('Фруктик ответил!', 'success');
        
    } catch (error) {
        handleAPIError(error);
    } finally {
        // Разблокируем кнопку отправки
        isSending = false;
        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendButton.setAttribute('aria-label', 'Отправить сообщение');
        messageInput.focus();
    }
}

async function callMistralAPI(currentChat) {
    const messagesForAPI = [
        { 
            role: 'system', 
            content: `Ты - Фруктик, дружелюбный помощник для детей младшего школьного возраста. Твоя главная задача - помогать в учебе, соблюдая абсолютно правильную грамматику русского языка.

ОСОБЫЕ ПРАВИЛА:
1. Всегда отвечай грамотно, без ошибок - ты образец для ребенка
2. Используй простые, понятные предложения
3. Объясняй сложные темы доступным языком
4. Будь терпеливым и поддерживающим
5. Используй 1-2 эмодзи в ответе для дружелюбия
6. Не давай готовых ответов на домашние задания, а объясняй как решать
7. Поощряй curiosity и задавание вопросов

ПРИМЕРЫ ПРАВИЛЬНЫХ ОТВЕТОВ:
"Привет! Я Фруктик 🍎 Помогу тебе с уроками. Что ты хочешь узнать?"
"Молодец, что спросил! Давай разберем эту задачу по шагам 🧩"
"Запомни: 'жи-ши' пиши с буквой 'и'. Это правило русского языка ✏️"` 
        },
        ...currentChat.messages.slice(-8) // Берем последние 8 сообщений для контекста
    ];
    
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: MODEL,
            messages: messagesForAPI,
            max_tokens: 800,
            temperature: 0.3,
            top_p: 0.9,
            stream: false
        })
    });
    
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorData.error?.code || errorMessage;
        } catch (e) {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Неверный формат ответа от API');
    }
    
    return data;
}

function handleAPIError(error) {
    console.error('API Error:', error);
    hideTypingIndicator();
    
    let errorMessage = 'Ой, что-то пошло не так! 🍇';
    let details = '';
    
    if (error.message.includes('401')) {
        errorMessage = 'Ошибка авторизации API';
        details = 'Проверьте API ключ';
    } else if (error.message.includes('400')) {
        errorMessage = 'Неверный запрос к API';
        details = 'Возможно, проблема с форматом данных';
    } else if (error.message.includes('429')) {
        errorMessage = 'Слишком много запросов';
        details = 'Попробуйте позже';
    } else if (error.message.includes('500')) {
        errorMessage = 'Ошибка на сервере API';
        details = 'Попробуйте позже';
    } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Проблемы с интернет-соединением';
        details = 'Проверьте подключение к интернету';
    } else {
        details = error.message;
    }
    
    showStatus(errorMessage, 'error');
    addMessageToChat('assistant', `${errorMessage} 😊\n\n${details ? `Детали: ${escapeHtml(details)}` : 'Попробуйте еще раз.'}`);
}

function addMessageToChat(role, content, scroll = true) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-fade-in';
    
    if (role === 'user') {
        messageDiv.className = 'flex items-start justify-end message-fade-in';
        messageDiv.innerHTML = `
            <div class="chat-bubble user-bubble" role="text" aria-label="Ваше сообщение">
                <div class="message-content">${escapeHtml(content)}</div>
                <div class="message-time">${getCurrentTime()}</div>
            </div>
            <div class="fruit-avatar" style="background: linear-gradient(135deg, #a8edea, #fed6e3);" aria-hidden="true">😊</div>
        `;
    } else {
        messageDiv.className = 'flex items-start message-fade-in';
        messageDiv.innerHTML = `
            <div class="fruit-avatar" style="background: linear-gradient(135deg, #ffd93d, #ff6b6b);" aria-hidden="true">${getRandomFruit()}</div>
            <div class="chat-bubble bot-bubble" role="text" aria-label="Ответ Фруктика">
                <div class="font-bold text-purple-600 mb-1">Фруктик</div>
                <div class="message-content">${content}</div>
                <div class="message-time">${getCurrentTime()}</div>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    if (scroll) scrollToBottom();
}

function getRandomFruit() {
    return FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)];
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Экспорт функций для глобального использования
window.loadChat = loadChat;
window.deleteChat = deleteChat;
