// ============================================
//  Telegram Mini App
//  English Tutor - Client Logic
// ============================================

const tg = window.Telegram.WebApp;
tg.expand(); // Растягиваем на весь экран

// Получаем данные пользователя
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
    activeTab: 'profile'
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
//  Загрузка данных с бота
// ============================================

async function loadData() {
    try {
        // Запрос к боту через WebApp
        const response = await fetch('/api/user-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.id,
                action: 'get_stats'
            })
        });

        const data = await response.json();

        // Обновляем состояние
        state.streak = data.streak || 0;
        state.totalMessages = data.total_messages || 0;
        state.savedWords = data.saved_words || [];
        state.dailyLimit = data.remaining || 10;
        state.isPremium = data.is_subscribed || false;
        state.level = data.level || 'B1';
        state.streakDays = data.streak_days || [];

        // Обновляем UI
        updateUI();

    } catch (error) {
        console.error('Error loading data:', error);
        // Показываем демо-данные для теста
        loadDemoData();
    }
}

// ============================================
//  Демо-данные (для тестирования)
// ============================================

function loadDemoData() {
    username.textContent = user.first_name || 'User';
    userLevel.textContent = 'B1 · Intermediate';
    streakDays.textContent = '5';
    totalMessages.textContent = '23';
    savedWords.textContent = '12';
    dailyLimit.textContent = '7';
    subscriptionStatus.textContent = 'Free';
    currentLevel.textContent = 'B1';

    // Демо-слова
    const demoWords = ['Hello', 'Beautiful', 'Understand', 'Practice', 'Improve'];
    renderWords(demoWords);

    // Демо-календарь
    const demoStreak = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17];
    renderCalendar(demoStreak);
}

// ============================================
//  Обновление UI
// ============================================

function updateUI() {
    // Информация о пользователе
    username.textContent = user.first_name || 'User';
    userLevel.textContent = `${state.level} · ${getLevelLabel(state.level)}`;

    // Статистика
    streakDays.textContent = state.streak;
    totalMessages.textContent = state.totalMessages;
    savedWords.textContent = state.savedWords.length;
    dailyLimit.textContent = state.isPremium ? '∞' : state.dailyLimit;
    subscriptionStatus.textContent = state.isPremium ? 'Premium' : 'Free';
    currentLevel.textContent = state.level;

    // Скрываем/показываем Premium промо
    if (state.isPremium) {
        premiumPromo.classList.add('hidden');
    } else {
        premiumPromo.classList.remove('hidden');
    }

    // Слова
    renderWords(state.savedWords);

    // Календарь
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

    // Корректируем для понедельника как первого дня
    let startOffset = firstDay === 0 ? 6 : firstDay - 1;

    calendarGrid.innerHTML = '';

    // Пустые ячейки
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calendarGrid.appendChild(empty);
    }

    // Дни месяца
    const today = new Date().getDate();
    const todayMonth = new Date().getMonth();
    const todayYear = new Date().getFullYear();

    for (let day = 1; day <= daysInMonth; day++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.textContent = day;

        // Сегодня
        if (day === today && month === todayMonth && year === todayYear) {
            div.classList.add('active');
        }

        // Дни со стриком
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

    // Показываем последние 20 слов
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

async function deleteWord(word) {
    try {
        const response = await fetch('/api/delete-word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.id,
                word: word
            })
        });

        if (response.ok) {
            // Удаляем из локального состояния
            state.savedWords = state.savedWords.filter(w => w !== word);
            renderWords(state.savedWords);
            savedWords.textContent = state.savedWords.length;
        }
    } catch (error) {
        console.error('Error deleting word:', error);
    }
}

// ============================================
//  Навигация по вкладкам
// ============================================

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        // Убираем активный класс у всех
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        this.classList.add('active');

        const tab = this.dataset.tab;
        state.activeTab = tab;

        // Прокручиваем к соответствующей секции
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
//  Настройки
// ============================================

function changeLevel() {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(state.level);
    const nextIndex = (currentIndex + 1) % levels.length;
    state.level = levels[nextIndex];

    // Отправляем на сервер
    fetch('/api/update-level', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: user.id,
            level: state.level
        })
    });

    currentLevel.textContent = state.level;
    userLevel.textContent = `${state.level} · ${getLevelLabel(state.level)}`;
    tg.showPopup({
        title: 'Level Updated',
        message: `Your level is now ${state.level} (${getLevelLabel(state.level)})`,
        buttons: [{ type: 'ok' }]
    });
}

function changeVoice() {
    tg.showPopup({
        title: 'Voice Settings',
        message: 'Choose a voice for your tutor:',
        buttons: [
            { type: 'button', text: 'Jenny 🇺🇸' },
            { type: 'button', text: 'James 🇬🇧' },
            { type: 'button', text: 'Sophie 🇦🇺' }
        ]
    });
}

function changeTopics() {
    tg.showPopup({
        title: 'Choose Topics',
        message: 'What do you want to learn about?',
        buttons: [
            { type: 'button', text: 'General' },
            { type: 'button', text: 'Business' },
            { type: 'button', text: 'Travel' },
            { type: 'button', text: 'Technology' }
        ]
    });
}

function inviteFriend() {
    tg.showPopup({
        title: 'Invite Friends',
        message: 'Share this bot with your friends and get rewards!',
        buttons: [{ type: 'ok' }]
    });
}

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
                'Price: $5.99/month',
        buttons: [
            { type: 'button', text: 'Subscribe Now' },
            { type: 'cancel' }
        ]
    }, (buttonId) => {
        if (buttonId === '0') {
            // Отправляем запрос на оплату
            tg.sendData(JSON.stringify({
                action: 'buy_premium',
                user_id: user.id
            }));
        }
    });
}

// ============================================
//  Инициализация
// ============================================

// Загружаем данные
loadData();

// Обновляем данные каждые 60 секунд
setInterval(loadData, 60000);

// Сообщаем Telegram, что приложение готово
tg.ready();

console.log('🚀 English Tutor App initialized!');
console.log('👤 User:', user);