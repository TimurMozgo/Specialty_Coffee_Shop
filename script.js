// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.enableClosingConfirmation();

// !!! ТВОЙ TELEGRAM ID !!!
const ADMIN_TELEGRAM_ID = 6088315974; 

// Данные товаров (по умолчанию, если админка еще не заполнена)
const defaultProducts = [
    { 
        id: 1, title: "El Salvador", category: "Зерно", price: 450, 
        description: "Миндаль, финик, молочный шоколад. Натуральная обработка.", 
        image: "images/El_Salvador.jpg", origin: "Эль-Сальвадор", roast: "Светлая", 
        flavor: "Миндаль, финик, шоколад", weight: "250 г",
        acidity: 3, sweetness: 4, body: 4,
        brewing: ["espresso", "moka"]
    },
    { 
        id: 2, title: "Peru", category: "Зерно", price: 450, 
        description: "Вишневый ликер, темный виноград, какао. Натуральная обработка.", 
        image: "images/Peru.jpg", origin: "Перу", roast: "Средняя", 
        flavor: "Вишня, виноград, какао", weight: "250 г",
        acidity: 3, sweetness: 4, body: 4,
        brewing: ["espresso", "moka"]
    },
    { 
        id: 3, title: "Ethiopia Shakisso Hadeso", category: "Зерно", price: 395, 
        description: "Черный чай, черника, лимон, житный хлеб. Натуральная обработка.", 
        image: "images/Ethiopia_Shakisso_Hadeso.jpg", origin: "Эфиопия", roast: "Светлая", 
        flavor: "Чай, черника, лимон", weight: "250 г",
        acidity: 4, sweetness: 3, body: 3,
        brewing: ["espresso", "filter", "v60"]
    },
    { 
        id: 4, title: "Ethiopia Daye Bensa", category: "Зерно", price: 345, 
        description: "Черный чай, курага, лимон, бергамот. Мытая обработка.", 
        image: "images/Ethiopia_Daye_Bensa.jpg", origin: "Эфиопия", roast: "Светлая", 
        flavor: "Чай, курага, бергамот", weight: "250 г",
        acidity: 5, sweetness: 3, body: 2,
        brewing: ["filter", "v60", "aeropress"]
    },
    { 
        id: 5, title: "Honduras La Paz", category: "Зерно", price: 395, 
        description: "Красное яблоко, финик, карамель, миндаль. Натуральная обработка.", 
        image: "images/Honduras_La_Paz.jpg", origin: "Гондурас", roast: "Средняя", 
        flavor: "Яблоко, финик, карамель", weight: "250 г",
        acidity: 3, sweetness: 4, body: 4,
        brewing: ["espresso", "moka", "frenchpress"]
    },
    { 
        id: 6, title: "Timor-Leste", category: "Зерно", price: 400, 
        description: "Сухофрукты, портвейн, овсяное печиво. Мытая обработка.", 
        image: "images/Timor-Leste.jpg", origin: "Тимор-Лешти", roast: "Средняя", 
        flavor: "Сухофрукты, портвейн", weight: "250 г",
        acidity: 3, sweetness: 4, body: 4,
        brewing: ["espresso", "moka", "frenchpress"]
    }
];

// Загружаем товары: либо из админки, либо дефолтные
let products = JSON.parse(localStorage.getItem('coffee_products')) || defaultProducts;

// Состояние
let cart = JSON.parse(localStorage.getItem('coffee_cart')) || [];
let currentCategory = 'all';
let searchQuery = '';
let currentDetailProduct = null;
let detailQty = 1;
let checkoutStep = 1;
let selectedDelivery = null;
let currentUser = null; // Изначально null, заполним при загрузке

// === АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', () => {
    // 1. Пытаемся получить данные пользователя прямо из Telegram
    const tgUser = tg.initDataUnsafe?.user;
    
    if (tgUser) {
        // Если открыто в Telegram — берем реальные данные
        currentUser = tgUser;
    } else {
        // Если открыто в браузере — пробуем взять из localStorage
        const storedUser = localStorage.getItem('tg_user');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
        } else {
            // Если ничего нет (первый запуск в браузере) — создаем тестового админа
            currentUser = { 
                id: ADMIN_TELEGRAM_ID, 
                first_name: "Админ", 
                last_name: "Тест",
                photo_url: "https://ui-avatars.com/api/?name=Admin+Test&background=D4A373&color=fff"
            };
        }
    }
    
    // Сохраняем актуального пользователя, чтобы при обновлении страницы он не терялся
    localStorage.setItem('tg_user', JSON.stringify(currentUser));

    // Запускаем рендер интерфейса
    renderProducts();
    updateCartBadge();
    setupSearch();
    setupCategories();
    checkAuthStatus(); // Сразу покажет профиль с данными, без лишних кликов!
});

// === ЛОГИКА ПРОФИЛЯ И АДМИНКИ ===
function checkAuthStatus() {
    const guestView = document.getElementById('guestView');
    const userView = document.getElementById('userView');
    const adminBtn = document.getElementById('adminBtn');

    if (currentUser) {
        guestView.classList.add('hidden');
        userView.classList.remove('hidden');
        
        document.getElementById('userName').textContent = currentUser.first_name || "Пользователь";
        document.getElementById('userId').textContent = currentUser.id;
        
        // Обновляем аватарку (если Telegram её передал, иначе ставим заглушку с инициалами)
        const avatarImg = document.getElementById('userAvatar');
        if (avatarImg) {
            avatarImg.src = currentUser.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.first_name || 'User')}&background=D4A373&color=fff`;
        }
        
        // Если ID совпадает с админским — показываем кнопку
        if (parseInt(currentUser.id) === ADMIN_TELEGRAM_ID) {
            adminBtn.classList.remove('hidden');
        } else {
            adminBtn.classList.add('hidden');
        }
        
        // === САМОЕ ГЛАВНОЕ ДОБАВЛЕНИЕ ===
        // Эта строка запускает отрисовку 3-х последних заказов при открытии профиля
        renderRecentOrders(); 
        // ==================================
        
    } else {
        guestView.classList.remove('hidden');
        userView.classList.add('hidden');
    }
}

function openAdminPanel() {
    window.location.href = 'admin.html';
}

// === РЕНДЕР ТОВАРОВ ===
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    grid.innerHTML = '';

    const filtered = products.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.flavor.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        filtered.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card animate-fade';
            card.onclick = (e) => {
                if (!e.target.closest('.btn-add')) openProductDetail(product);
            };
            card.innerHTML = `
                <img src="${product.image}" class="product-image" alt="${product.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80'">
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <div class="product-title">${product.title}</div>
                    <div class="product-description">${product.description}</div>
                    <div class="product-footer">
                        <div class="product-price">${product.price} ₴</div>
                        <button class="btn-add" onclick="addToCart(${product.id}, 1)">+</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }
}

// === ПОИСК И КАТЕГОРИИ ===
function setupSearch() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    input.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        clearBtn.classList.toggle('hidden', searchQuery === '');
        renderProducts();
    });
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    searchQuery = '';
    document.getElementById('searchClear').classList.add('hidden');
    renderProducts();
}

function setupCategories() {
    const pills = document.querySelectorAll('.category-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.dataset.category;
            renderProducts();
        });
    });
}

// Словарь методов заваривания
const brewingMethods = {
    espresso: { 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>`, 
        name: 'Эспрессо' 
    },
    filter: { 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>`, 
        name: 'Фильтр' 
    },
    v60: { 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l-6 18Z"/><path d="M9 9h6"/></svg>`, 
        name: 'V60' 
    },
    aeropress: { 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="14" rx="2"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>`, 
        name: 'AeroPress' 
    },
    frenchpress: { 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8"/><path d="M8 2v18a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2"/><path d="M8 10h8"/><path d="M12 10v12"/></svg>`, 
        name: 'Френч-пресс' 
    },
    moka: { 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6v6H9z"/><path d="M7 8h10l-2 14H9z"/><path d="M12 8v14"/></svg>`, 
        name: 'Мока' 
    },
    turka: { 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8l-1 16H9z"/><path d="M12 4v16"/><path d="M8 8h8"/></svg>`, 
        name: 'Турка' 
    },
    coldbrew: { 
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8l-1 18H9z"/><path d="M12 6v8"/><path d="M9 10h6"/></svg>`, 
        name: 'Cold Brew' 
    }
};

function openProductDetail(product) {
    currentDetailProduct = product;
    detailQty = 1;
    
    // Основные данные
    document.getElementById('detailImage').src = product.image;
    document.getElementById('detailImage').onerror = function() { 
        this.src='https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80'; 
    };
    document.getElementById('detailCategory').textContent = product.category;
    document.getElementById('detailTitle').textContent = product.title;
    document.getElementById('detailOrigin').textContent = '📍 ' + (product.origin || 'Не указано');
    document.getElementById('detailPrice').textContent = product.price + ' ₴';
    document.getElementById('detailDescription').textContent = product.description;
    document.getElementById('detailRoast').textContent = product.roast || 'Не указана';
    document.getElementById('detailWeight').textContent = product.weight || '250 г';
    document.getElementById('detailCategorySpec').textContent = product.category || 'Зерно';
    document.getElementById('detailProcessing').textContent = product.processing || 'Натуральная';
    document.getElementById('detailQty').textContent = detailQty;
    
    // === БЕЙДЖИ ===
    const badgesContainer = document.getElementById('detailBadges');
    let badgesHtml = '';
    if (product.processing) {
        badgesHtml += `<span class="detail-badge badge-processing">${product.processing}</span>`;
    }
    if (product.tags) {
        if (product.tags.includes('specialty')) badgesHtml += `<span class="detail-badge badge-specialty">Specialty</span>`;
        if (product.tags.includes('new')) badgesHtml += `<span class="detail-badge badge-new">New</span>`;
        if (product.tags.includes('decaf')) badgesHtml += `<span class="detail-badge badge-decaf">Decaf</span>`;
    }
    badgesContainer.innerHTML = badgesHtml;
    
    // === ВКУСОВЫЕ ШКАЛЫ (с анимацией) ===
    const acidity = product.acidity || 3;
    const sweetness = product.sweetness || 3;
    const body = product.body || 3;
    
    document.getElementById('acidityValue').textContent = acidity + '/5';
    document.getElementById('sweetnessValue').textContent = sweetness + '/5';
    document.getElementById('bodyValue').textContent = body + '/5';
    
    // Сбрасываем ширину перед анимацией
    document.getElementById('acidityBar').style.width = '0%';
    document.getElementById('sweetnessBar').style.width = '0%';
    document.getElementById('bodyBar').style.width = '0%';
    
    // Запускаем анимацию через небольшой таймаут
    setTimeout(() => {
        document.getElementById('acidityBar').style.width = (acidity / 5 * 100) + '%';
        document.getElementById('sweetnessBar').style.width = (sweetness / 5 * 100) + '%';
        document.getElementById('bodyBar').style.width = (body / 5 * 100) + '%';
    }, 100);
    
    // === ВКУСОВЫЕ НОТЫ (теги) ===
    const flavorContainer = document.getElementById('detailFlavorTags');
    if (product.flavor) {
        const notes = product.flavor.split(',').map(n => n.trim()).filter(n => n);
        flavorContainer.innerHTML = notes.map(note => 
            `<span class="flavor-tag">${note}</span>`
        ).join('');
    } else {
        flavorContainer.innerHTML = '<span class="text-secondary">Не указаны</span>';
    }
    
    // === МЕТОДЫ ЗАВАРИВАНИЯ ===
    const brewingContainer = document.getElementById('detailBrewing');
    const productBrewing = product.brewing || ['espresso', 'filter'];
    
    brewingContainer.innerHTML = Object.entries(brewingMethods).map(([key, method]) => {
        const isRecommended = productBrewing.includes(key);
        return `
            <div class="brewing-method ${isRecommended ? 'recommended' : ''}">
                <div class="brewing-method-icon">${method.icon}</div>
                <div class="brewing-method-name">${method.name}</div>
            </div>
        `;
    }).join('');
    
    // Показываем модалку
    document.getElementById('productDetail').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function closeProductDetail() {
    document.getElementById('productDetail').classList.add('hidden');
    document.body.style.overflow = '';
}

function changeDetailQty(delta) {
    detailQty = Math.max(1, detailQty + delta);
    document.getElementById('detailQty').textContent = detailQty;
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function addDetailToCart() {
    if (currentDetailProduct) {
        addToCart(currentDetailProduct.id, detailQty);
        closeProductDetail();
    }
}

// === КОРЗИНА ===
function addToCart(productId, qty) {
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.qty += qty;
    else cart.push({ id: productId, qty: qty });
    saveCart();
    updateCartBadge();
    showToast('Товар добавлен в корзину');
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) { removeFromCart(productId); return; }
        saveCart();
        renderCart();
        updateCartBadge();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    renderCart();
    updateCartBadge();
}

function saveCart() { localStorage.setItem('coffee_cart', JSON.stringify(cart)); }

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    if (totalQty > 0) { badge.textContent = totalQty; badge.classList.remove('hidden'); } 
    else { badge.classList.add('hidden'); }
}

function getTotal() {
    return cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);
        return sum + (product ? product.price * item.qty : 0);
    }, 0);
}

function renderCart() {
    const content = document.getElementById('cartContent');
    const empty = document.getElementById('cartEmpty');
    const existingSummary = document.querySelector('.cart-summary');
    if (existingSummary) existingSummary.remove();
    
    if (cart.length === 0) {
        content.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    
    empty.classList.add('hidden');
    content.innerHTML = '';
    
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${product.image}" class="cart-item-image" alt="${product.title}" onerror="this.src='https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80'">
            <div class="cart-item-info">
                <div class="cart-item-header">
                    <div style="flex: 1; min-width: 0;">
                        <div class="cart-item-title">${product.title}</div>
                        <div class="cart-item-category">${product.category}</div>
                    </div>
                    <div class="cart-item-price">${product.price * item.qty} ₴</div>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-qty">
                        <button class="cart-qty-btn" onclick="updateQuantity(${product.id}, -1)">−</button>
                        <span class="cart-qty-value">${item.qty}</span>
                        <button class="cart-qty-btn" onclick="updateQuantity(${product.id}, 1)">+</button>
                    </div>
                    <button class="cart-remove" onclick="removeFromCart(${product.id})">Удалить</button>
                </div>
            </div>
        `;
        content.appendChild(div);
    });
    
    const summaryDiv = document.createElement('div');
    summaryDiv.style.height = '100px';
    content.appendChild(summaryDiv);
    
    const summary = document.createElement('div');
    summary.className = 'cart-summary animate-slide';
    summary.innerHTML = `
        <div class="cart-total">
            <span class="cart-total-label">Итого:</span>
            <span class="cart-total-amount">${getTotal()} ₴</span>
        </div>
        <button class="btn btn-primary" onclick="startCheckout()">Оформить заказ</button>
    `;
    document.body.appendChild(summary);
}

// === НАВИГАЦИЯ ===
function showView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    if (viewName === 'home' || viewName === 'catalog') {
        document.getElementById('view-home').classList.remove('hidden');
        document.querySelector('[data-view="home"]').classList.add('active');
        renderProducts();
    } else if (viewName === 'cart') {
        document.getElementById('view-cart').classList.remove('hidden');
        document.querySelector('[data-view="cart"]').classList.add('active');
        renderCart();
    } else if (viewName === 'profile') {
        document.getElementById('view-profile').classList.remove('hidden');
        document.querySelector('[data-view="profile"]').classList.add('active');
        checkAuthStatus(); // Проверяем статус при входе в профиль
    } else if (viewName === 'checkout') {
        document.getElementById('view-checkout').classList.remove('hidden');
    }
    
    if (viewName !== 'cart') {
        const existingSummary = document.querySelector('.cart-summary');
        if (existingSummary) existingSummary.remove();
    }
    window.scrollTo(0, 0);
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

// === ОФОРМЛЕНИЕ ЗАКАЗА ===
function startCheckout() {
    if (cart.length === 0) return;
    checkoutStep = 1;
    selectedDelivery = null;
    updateCheckoutSteps();
    showView('checkout');
}

function updateCheckoutSteps() {
    document.getElementById('step1-indicator').classList.toggle('active', checkoutStep >= 1);
    document.getElementById('step2-indicator').classList.toggle('active', checkoutStep >= 2);
    document.getElementById('step3-indicator').classList.toggle('active', checkoutStep >= 3);
    document.getElementById('checkout-step-1').classList.toggle('hidden', checkoutStep !== 1);
    document.getElementById('checkout-step-2').classList.toggle('hidden', checkoutStep !== 2);
    document.getElementById('checkout-step-3').classList.toggle('hidden', checkoutStep !== 3);
}

function nextCheckoutStep(step) {
    if (step === 2) {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        if (!name || !phone) { showToast('Заполните все поля'); return; }
    }
    if (step === 3) {
        if (!selectedDelivery) { showToast('Выберите доставку'); return; }
        if (selectedDelivery !== 'pickup') {
            const address = document.getElementById('deliveryAddress').value.trim();
            if (!address) { showToast('Укажите адрес'); return; }
        }
        renderCheckoutSummary();
    }
    checkoutStep = step;
    updateCheckoutSteps();
    window.scrollTo(0, 0);
}

function prevCheckoutStep(step) { checkoutStep = step; updateCheckoutSteps(); window.scrollTo(0, 0); }

function selectDelivery(type, element) {
    selectedDelivery = type;
    document.querySelectorAll('.delivery-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    const details = document.getElementById('deliveryDetails');
    const label = document.getElementById('deliveryLabel');
    const input = document.getElementById('deliveryAddress');
    if (type === 'pickup') { details.classList.add('hidden'); input.value = 'г. Киев, ул. Кофейная, 12'; } 
    else {
        details.classList.remove('hidden');
        label.textContent = type === 'newpost' ? 'Город и номер отделения' : 'Адрес доставки';
        input.placeholder = type === 'newpost' ? 'Киев, отделение №15' : 'Улица, дом, квартира';
        if (input.value.includes('Кофейная')) input.value = '';
    }
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function renderCheckoutSummary() {
    const container = document.getElementById('checkoutSummary');
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    let deliveryText = selectedDelivery === 'newpost' ? 'Новая Почта' : (selectedDelivery === 'courier' ? 'Курьер' : 'Самовывоз');
    let itemsHtml = cart.map(item => {
        const p = products.find(prod => prod.id === item.id);
        return `<div class="summary-row"><span>${p.title} × ${item.qty}</span><span>${p.price * item.qty} ₴</span></div>`;
    }).join('');
    container.innerHTML = `
        <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border);">
            <div class="summary-row"><span>Получатель:</span><span style="font-weight: 600;">${name}</span></div>
            <div class="summary-row"><span>Телефон:</span><span style="font-weight: 600;">${phone}</span></div>
            <div class="summary-row"><span>Доставка:</span><span style="font-weight: 600;">${deliveryText}</span></div>
        </div>
        ${itemsHtml}
        <div class="summary-row total"><span>Итого:</span><span>${getTotal()} ₴</span></div>
    `;
}

function submitOrder() {
    const orderNum = 'COFFEE-' + Math.floor(1000 + Math.random() * 9000);
    const totalAmount = getTotal();
    const itemsCount = cart.reduce((sum, item) => sum + item.qty, 0);
    
    // Сохраняем состав заказа (названия товаров)
    const orderItems = cart.map(item => {
        const product = products.find(p => p.id === item.id);
        return {
            id: item.id,
            title: product ? product.title : 'Товар',
            qty: item.qty,
            price: product ? product.price : 0
        };
    });
    
    const date = new Date().toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Сохраняем заказ с полным составом
    const orders = JSON.parse(localStorage.getItem('coffee_orders') || '[]');
    orders.unshift({ 
        id: orderNum,
        date: date,
        total: totalAmount,
        itemsCount: itemsCount,
        items: orderItems, // <-- Сохраняем список товаров
        status: 'В обработке'
    });
    localStorage.setItem('coffee_orders', JSON.stringify(orders));

    document.getElementById('successOrderNumber').textContent = '№ ' + orderNum;
    document.getElementById('successScreen').classList.remove('hidden');
    
    cart = [];
    saveCart();
    updateCartBadge();
    
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

// Отображение 3-х последних заказов в профиле
function renderRecentOrders() {
    const orders = JSON.parse(localStorage.getItem('coffee_orders') || '[]');
    const container = document.getElementById('recentOrdersList');
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="text-secondary" style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 12px;">Заказов пока нет. Самое время выбрать кофе! ☕</p>';
        return;
    }

    // Берем только первые 3 заказа
    const recent = orders.slice(0, 3);
    
    container.innerHTML = recent.map(order => `
        <div style="background: var(--bg-secondary); padding: 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border);">
            <div>
                <div style="font-weight: 600; font-size: 15px; color: var(--text-primary);">${order.id}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${order.date}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 700; font-size: 16px; color: var(--accent);">${order.total} ₴</div>
                <div style="font-size: 11px; color: var(--success); font-weight: 600; margin-top: 2px;">${order.status}</div>
            </div>
        </div>
    `).join('');
}

// Кнопка "Все заказы" (пока заглушка, можно будет расширить)

function showAllOrders() {
    document.getElementById('view-profile').classList.add('hidden');
    document.getElementById('view-all-orders').classList.remove('hidden');
    renderAllOrdersList();
    window.scrollTo(0, 0);
}

// Вернуться в профиль из экрана заказов
function showProfileFromOrders() {
    document.getElementById('view-all-orders').classList.add('hidden');
    document.getElementById('view-profile').classList.remove('hidden');
}

// Отрисовка полного списка заказов
function renderAllOrdersList() {
    const orders = JSON.parse(localStorage.getItem('coffee_orders') || '[]');
    const listContainer = document.getElementById('allOrdersList');
    const emptyState = document.getElementById('emptyOrdersState');

    if (orders.length === 0) {
        listContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    
    listContainer.innerHTML = orders.map(order => {
        const hasItems = order.items && order.items.length > 0;
        
        return `
        <div class="order-item">
            <!-- Шапка карточки -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                    <div style="font-weight: 700; font-size: 18px; color: var(--text-primary);">${order.id}</div>
                    <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${order.date}</div>
                </div>
                <span class="order-status">${order.status}</span>
            </div>
            
            <!-- Состав заказа -->
            ${hasItems ? `
                <div style="background: var(--bg-secondary); padding: 14px; border-radius: 12px; margin-bottom: 16px;">
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Состав заказа</div>
                    ${order.items.map(item => `
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid var(--border);">
                            <span style="color: var(--text-primary);">${item.title} <span style="color: var(--text-secondary);">× ${item.qty}</span></span>
                            <span style="color: var(--accent); font-weight: 600;">${item.price * item.qty} ₴</span>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div style="background: var(--bg-secondary); padding: 14px; border-radius: 12px; margin-bottom: 16px; text-align: center;">
                    <div style="font-size: 13px; color: var(--text-secondary);">Состав заказа недоступен</div>
                </div>
            `}
            
            <!-- Итого -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border);">
                <span style="font-size: 14px; color: var(--text-secondary); font-weight: 500;">Итого:</span>
                <span style="font-weight: 700; font-size: 20px; color: var(--accent);">${order.total} ₴</span>
            </div>
        </div>
        `;
    }).join('');
}

function resetAndGoHome() {
    document.getElementById('successScreen').classList.add('hidden');
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('deliveryAddress').value = '';
    document.querySelectorAll('.delivery-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('deliveryDetails').classList.add('hidden');
    showView('home');
}

// === УВЕДОМЛЕНИЯ ===
let isToastVisible = false;
function showToast(message) {
    if (isToastVisible) return;
    isToastVisible = true;
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0'; toast.style.transform = 'translateY(-10px)';
        setTimeout(() => { toast.remove(); isToastVisible = false; }, 300);
    }, 2000);
}

// Свайп назад
let xDown = null, yDown = null;
document.addEventListener('touchstart', e => { xDown = e.touches[0].clientX; yDown = e.touches[0].clientY; }, false);
document.addEventListener('touchmove', e => {
    if (!xDown || !yDown) return;
    let xDiff = xDown - e.touches[0].clientX;
    if (xDiff > 50 && !document.getElementById('productDetail').classList.contains('hidden')) closeProductDetail();
    xDown = null; yDown = null;
}, false);