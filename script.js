// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.enableClosingConfirmation();

// !!! ВПИШИ СЮДА СВОЙ TELEGRAM ID (узнай у @userinfobot) !!!
const ADMIN_TELEGRAM_ID = 6088315974; 

// Данные товаров (по умолчанию, если админка еще не заполнена)
const defaultProducts = [
    { id: 1, title: "El Salvador", category: "Зерно", price: 450, description: "Миндаль, финик, молочный шоколад.", image: "images/El_Salvador.jpg", origin: "Эль-Сальвадор", roast: "Светлая", flavor: "Миндаль, финик, шоколад", weight: "250 г" },
    { id: 2, title: "Peru", category: "Зерно", price: 450, description: "Вишневый ликер, темный виноград, какао.", image: "images/Peru.jpg", origin: "Перу", roast: "Средняя", flavor: "Вишня, виноград, какао", weight: "250 г" },
    { id: 3, title: "Ethiopia Shakisso Hadeso", category: "Зерно", price: 395, description: "Черный чай, черника, лимон, житный хлеб.", image: "images/Ethiopia_Shakisso_Hadeso.jpg", origin: "Эфиопия", roast: "Светлая", flavor: "Чай, черника, лимон", weight: "250 г" },
    { id: 4, title: "Ethiopia Daye Bensa", category: "Зерно", price: 345, description: "Черный чай, курага, лимон, бергамот.", image: "images/Ethiopia_Daye_Bensa.jpg", origin: "Эфиопия", roast: "Светлая", flavor: "Чай, курага, бергамот", weight: "250 г" },
    { id: 5, title: "Honduras La Paz", category: "Зерно", price: 395, description: "Красное яблоко, финик, карамель, миндаль.", image: "images/Honduras_La_Paz.jpg", origin: "Гондурас", roast: "Средняя", flavor: "Яблоко, финик, карамель", weight: "250 г" },
    { id: 6, title: "Timor-Leste", category: "Зерно", price: 400, description: "Сухофрукты, портвейн, овсяное печиво.", image: "images/Timor-Leste.jpg", origin: "Тимор-Лешти", roast: "Средняя", flavor: "Сухофрукты, портвейн", weight: "250 г" }
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
let currentUser = JSON.parse(localStorage.getItem('tg_user')) || null;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartBadge();
    setupSearch();
    setupCategories();
    checkAuthStatus();
});

// === ЛОГИКА ВХОДА И АДМИНКИ ===
function checkAuthStatus() {
    const guestView = document.getElementById('guestView');
    const userView = document.getElementById('userView');
    const adminBtn = document.getElementById('adminBtn');

    if (currentUser) {
        guestView.classList.add('hidden');
        userView.classList.remove('hidden');
        document.getElementById('userName').textContent = currentUser.first_name || "Пользователь";
        document.getElementById('userId').textContent = currentUser.id;
        
        // Если ID совпадает с админским — показываем кнопку
        if (parseInt(currentUser.id) === ADMIN_TELEGRAM_ID) {
            adminBtn.classList.remove('hidden');
        } else {
            adminBtn.classList.add('hidden');
        }
    } else {
        guestView.classList.remove('hidden');
        userView.classList.add('hidden');
    }
}

function loginWithTelegram() {
    const user = tg.initDataUnsafe?.user;
    
    if (user) {
        // Настоящий вход из Telegram
        currentUser = user;
    } else {
        // ТЕСТОВЫЙ ВХОД (если открыто в браузере, а не в Telegram)
        // Это нужно, чтобы ты мог прямо сейчас проверить работу админки
        currentUser = { id: ADMIN_TELEGRAM_ID, first_name: "Админ", last_name: "Тест" };
        alert("Тестовый вход выполнен! (В реальном Telegram это произойдет автоматически)");
    }
    
    localStorage.setItem('tg_user', JSON.stringify(currentUser));
    checkAuthStatus();
}

function logoutTelegram() {
    currentUser = null;
    localStorage.removeItem('tg_user');
    checkAuthStatus();
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

// === ДЕТАЛЬНАЯ СТРАНИЦА ===
function openProductDetail(product) {
    currentDetailProduct = product;
    detailQty = 1;
    document.getElementById('detailImage').src = product.image;
    document.getElementById('detailImage').onerror = function() { this.src='https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80'; };
    document.getElementById('detailCategory').textContent = product.category;
    document.getElementById('detailTitle').textContent = product.title;
    document.getElementById('detailPrice').textContent = product.price + ' ₴';
    document.getElementById('detailDescription').textContent = product.description;
    document.getElementById('detailOrigin').textContent = product.origin;
    document.getElementById('detailRoast').textContent = product.roast;
    document.getElementById('detailFlavor').textContent = product.flavor;
    document.getElementById('detailWeight').textContent = product.weight;
    document.getElementById('detailQty').textContent = detailQty;
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
    document.getElementById('successOrderNumber').textContent = '№ ' + orderNum;
    document.getElementById('successScreen').classList.remove('hidden');
    cart = []; saveCart(); updateCartBadge();
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
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