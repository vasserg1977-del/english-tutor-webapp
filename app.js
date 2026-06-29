// ============================================
//  Telegram Mini App
//  English Tutor - Client Logic
// ============================================

const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user || { 
    id: Date.now(), 
    first_name: 'User',
    username: 'user'
};

// ============================================
//  Глобальное состояние
// ============================================

let state = {
    streak: 0,
    totalMessages: 0,
    savedWords: [],
    dailyLimit: 10,
    isPremium: false,
    level: 'B1',
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    streakDays: [],
    activeTab: 'profile',
    dataLoaded: false
};

// ============================================
//  DOM элементы
// ============================================

const $ = id => document.getElementById(id);
const username = $('username');
const userLevel = $('userLevel');
const streakDays = $('streakDays');
const totalMessages = $('totalMessages');
const savedWords = $('savedWords');
const dailyLimit = $('dailyLimit');
const subscriptionStatus = $('subscriptionStatus');
const wordsList = $('wordsList');
const wordCount = $('wordCount');
const calendarGrid = $('calendarGrid');
const calendarTitle = $('calendarTitle');
const premiumPromo = $('premiumPromo');
const currentLevel = $('currentLevel');

// ============================================
//  Загрузка данных через Telegram WebApp
// ============================================

function loadData() {
    console.log('🔄 Loading data from bot...');
    
    // Проверяем, что WebApp инициализирован
    if (!tg) {
        console.error('❌ WebApp not initialized');
        return;
    }
    
    // Отправляем запрос к боту
    tg.sendData(JSON.stringify({
        action: 'get_stats',
        user_id: user.id
    }));
    
    // Показываем индикатор загрузки
    document.getElementById('streakDays').textContent = '...';
    document.getElementById('totalMessages').textContent = '...';
    document.getElementById('savedWords').textContent = '...';
}

// Обработчик ответов от бота (через WebApp)
tg.onEvent('message', function(message) {
    console.log('📨 Received from bot:', message);
    
    try {
        const data = JSON.parse(message);
        
        if (data.streak !== undefined) {
            // Это ответ на get_stats
            state.streak = data.streak || 0;
            state.totalMessages = data.total_messages || 0;
            state.savedWords = data.saved_words || [];
            state.dailyLimit = data.remaining || 10;
            state.isPremium = data.is_subscribed || false;
            state.level = data.level || 'B1';
            state.streakDays = data.streak_days || [];
            state.dataLoaded = true;
            
            console.log('✅ Data loaded:', state.savedWords.length, 'words');
            updateUI();
        } else if (data.success === true) {
            // Успешное удаление слова
            console.log('🗑️ Word deleted, reloading...');
            loadData();
        } else if (data.error) {
            console.error('❌ Error from bot:', data.error);
        }
    } catch (e) {
        console.log('Not a JSON message:', message);
    }
});

// ============================================
//  Обновление UI
// ============================================

function updateUI() {
    username.textContent = user.first_name || 'User';
    userLevel.textContent = `${state.level} · ${getLevelLabel(state.level)}`;
    
    streakDays.textContent = state.streak;
    totalMessages.textContent = state.totalMessages;
    savedWords.textContent = state.savedWords.length;
    dailyLimit.textContent = state.isPremium ? '∞' : state.dailyLimit;
    subscriptionStatus.textContent = state.isPremium ? 'Premium' : 'Free';
    currentLevel.textContent = state.level;
    
    if (state.isPremium) {
        premiumPromo.classList.add('hidden');
    } else {
        premiumPromo.classList.remove('hidden');
    }
    
    renderWords(state.savedWords);
    renderCalendar(state.streakDays);
}

// ============================================
//  Календарь
// ============================================

function renderCalendar(streakDays) {
    const month = state.currentMonth;
    const year = state.currentYear;
    
    calendarTitle.textContent = `${getMonthName(month)} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startOffset = firstDay === 0 ? 6 : firstDay - 1;
    
    calendarGrid.innerHTML = '';
    
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calendarGrid.appendChild(empty);
    }
    
    const today = new Date().getDate();
    const todayMonth = new Date().getMonth();
    const todayYear = new Date().getFullYear();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.textContent = day;
        
        if (day === today && month === todayMonth && year === todayYear) {
            div.classList.add('active');
        }
        
        if (streakDays && streakDays.includes(day)) {
            div.classList.add('has-streak');
        }
        
        calendarGrid.appendChild(div);
    }
}

function getMonthName(month) {
    const names = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return names[month];
}

function getLevelLabel(level) {
    const labels = {
        'A1': 'Beginner',
        'A2': 'Elementary',
        'B1': 'Intermediate',
        'B2': 'Upper Intermediate',
        'C1': 'Advanced',
        'C2': 'Proficient'
    };
    return labels[level] || 'Intermediate';
}

// ============================================
//  Сохраненные слова
// ============================================

function renderWords(words) {
    wordsList.innerHTML = '';
    wordCount.textContent = words.length;
    
    if (!words || words.length === 0) {
        wordsList.innerHTML = '<p class="empty">No words saved yet</p>';
        return;
    }
    
    const displayWords = words.slice(-20);
    
    displayWords.forEach(word => {
        const item = document.createElement('div');
        item.className = 'word-item';
        item.innerHTML = `
            <span class="word">${word}</span>
            <span class="delete-btn" onclick="deleteWord('${word}')">✕</span>
        `;
        wordsList.appendChild(item);
    });
}

function deleteWord(word) {
    console.log('🗑️ Deleting word:', word);
    tg.sendData(JSON.stringify({
        action: 'delete_word',
        user_id: user.id,
        word: word
    }));
    
    state.savedWords = state.savedWords.filter(w => w !== word);
    renderWords(state.savedWords);
    savedWords.textContent = state.savedWords.length;
}

// ============================================
//  Навигация по вкладкам
// ============================================

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        
        const tab = this.dataset.tab;
        state.activeTab = tab;
        
        const sections = {
            'profile': 0,
            'saved': document.querySelector('.saved-words-section'),
            'premium': document.querySelector('.premium-promo'),
            'settings': document.querySelector('.settings-section')
        };
        
        if (tab === 'profile') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (sections[tab]) {
            sections[tab].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
});

// ============================================
//  Навигация по месяцам
// ============================================

document.getElementById('prevMonth').addEventListener('click', () => {
    state.currentMonth--;
    if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
    }
    renderCalendar(state.streakDays);
});

document.getElementById('nextMonth').addEventListener('click', () => {
    state.currentMonth++;
    if (state.currentMonth > 11) {
        state.currentMonth = 0;
        state.currentYear++;
    }
    renderCalendar(state.streakDays);
});

// ============================================
//  Покупка Premium
// ============================================

function buyPremium() {
    tg.showPopup({
        title: '💎 Premium Subscription',
        message: 'Get unlimited access to all features!\n\n' +
                '✅ Unlimited messages\n' +
                '✅ Voice responses\n' +
                '✅ Save unlimited words\n' +
                '✅ Priority support\n\n' +
                'Price: 150 Stars (~$5)/month',
        buttons: [
            { type: 'button', text: 'Subscribe Now' },
            { type: 'cancel' }
        ]
    }, (buttonId) => {
        if (buttonId === '0') {
            tg.sendData(JSON.stringify({
                action: 'buy_premium',
                user_id: user.id
            }));
        }
    });
}

// ============================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================

// Сначала показываем демо-данные (чтобы не было пусто)
function loadDemoData() {
    username.textContent = user.first_name || 'User';
    userLevel.textContent = 'B1 · Intermediate';
    streakDays.textContent = '0';
    totalMessages.textContent = '0';
    savedWords.textContent = '0';
    dailyLimit.textContent = '10';
    subscriptionStatus.textContent = 'Free';
    currentLevel.textContent = 'B1';
    renderWords([]);
    renderCalendar([]);
}

loadDemoData();

// Через 1 секунду пытаемся загрузить реальные данные
setTimeout(() => {
    loadData();
}, 1000);

// Обновляем каждые 30 секунд
setInterval(loadData, 30000);

tg.ready();

console.log('🚀 English Tutor App initialized!');
console.log('👤 User:', user);
