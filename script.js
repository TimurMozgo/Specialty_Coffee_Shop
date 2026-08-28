// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.enableClosingConfirmation();

const products = [
    {
        id: 1,
        title: "El Salvador",
        category: "Зерно",
        price: 450,
        description: "Яркий кофе с нотами миндаля, финика и молочного шоколада. Натуральная обработка.",
        image: "images/El_Salvador.jpg",
        origin: "Эль-Сальвадор",
        roast: "Светлая",
        flavor: "Миндаль, финик, молочный шоколад",
        weight: "250 г",
        acidity: 5,
        sweetness: 6,
        bitterness: 5
    },
    {
        id: 2,
        title: "Peru",
        category: "Зерно",
        price: 450,
        description: "Сбалансированный вкус с оттенками вишневого ликера, темного винограда и какао.",
        image: "images/Peru.jpg",
        origin: "Перу",
        roast: "Средняя",
        flavor: "Вишневый ликер, темный виноград, какао",
        weight: "250 г",
        acidity: 5,
        sweetness: 6,
        bitterness: 5
    },
    {
        id: 3,
        title: "Timor-Leste АЗОВ.ONE&DAM",
        category: "Зерно",
        price: 400,
        description: "Насыщенный кофе с нотами сухофруктов, портвейна, овсяного печенья и какао.",
        image: "images/Timor-Leste АЗОВ.ONE&DAM.jpg",
        origin: "Тимор-Лешти",
        roast: "Средняя",
        flavor: "Сухофрукты, портвейн, овсяное печиво, какао",
        weight: "250 г",
        acidity: 5,
        sweetness: 5,
        bitterness: 5
    },
    {
        id: 4,
        title: "Ethiopia Shakisso Hadeso",
        category: "Зерно",
        price: 395,
        description: "Яркий эфиопский кофе с нотами черного чая, черники, лимона и житного хлеба.",
        image: "images/Ethiopia_Shakisso_Hadeso.jpg",
        origin: "Эфиопия",
        roast: "Светлая",
        flavor: "Черный чай, черника, лимон, житный хлеб",
        weight: "250 г",
        acidity: 5,
        sweetness: 4,
        bitterness: 5
    },
    {
        id: 5,
        title: "Ethiopia Daye Bensa",
        category: "Зерно",
        price: 345,
        description: "Деликатный кофе с нотами черного чая, кураги, лимона и бергамота. Мытая обработка.",
        image: "images/Ethiopia_Daye_Bensa.jpg",
        origin: "Эфиопия",
        roast: "Светлая",
        flavor: "Черный чай, курага, лимон, бергамот",
        weight: "250 г",
        acidity: 6,
        sweetness: 3,
        bitterness: 5
    },
    {
        id: 6,
        title: "Honduras La Paz",
        category: "Зерно",
        price: 395,
        description: "Сбалансированный кофе с нотами красного яблока, финика, карамели и миндаля.",
        image: "images/Honduras_La_Paz.jpg",
        origin: "Гондурас",
        roast: "Средняя",
        flavor: "Красное яблоко, финик, карамель, миндаль",
        weight: "250 г",
        acidity: 5,
        sweetness: 4,
        bitterness: 5
    }
];

// Состояние приложения
let cart = JSON.parse(localStorage.getItem('coffee_cart')) || [];
let currentCategory = 'all';
let searchQuery = '';
let currentDetailProduct = null;
let detailQty = 1;
let checkoutStep = 1;
let selectedDelivery = null;

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartBadge();
    setupSearch();
    setupCategories();
});

// Рендер товаров
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    grid.innerHTML = '';

    const filtered = products.filter(p => {
        const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                if (!e.target.closest('.btn-add')) {
                    openProductDetail(product);
                }
            };
            card.innerHTML = `
                <img src="${product.image}" class="product-image" alt="${product.title}" loading="lazy">
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

// Поиск
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

// Категории
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

// Детальная страница товара
function openProductDetail(product) {
    currentDetailProduct = product;
    detailQty = 1;
    
    document.getElementById('detailImage').src = product.image;
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

// Корзина
function addToCart(productId, qty) {
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ id: productId, qty: qty });
    }
    saveCart();
    updateCartBadge();
    showToast('Товар добавлен в корзину');
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            removeFromCart(productId);
            return;
        }
        saveCart();
        renderCart();
        updateCartBadge();
        showToast('Количество обновлено');
    }
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    renderCart();
    updateCartBadge();
    showToast('Товар удалён из корзины');
}

function saveCart() {
    localStorage.setItem('coffee_cart', JSON.stringify(cart));
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    if (totalQty > 0) {
        badge.textContent = totalQty;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
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
    
    // Сначала удаляем старую панель итогов, если она есть
    const existingSummary = document.querySelector('.cart-summary');
    if (existingSummary) existingSummary.remove();
    
    // Если корзина пуста — показываем пустое состояние и выходим
    if (cart.length === 0) {
        content.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    
    // Корзина не пуста — скрываем пустое состояние
    empty.classList.add('hidden');
    content.innerHTML = '';
    
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return;
        
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${product.image}" class="cart-item-image" alt="${product.title}">
            <div class="cart-item-info">
                <div class="cart-item-header">
                    <div style="flex: 1; min-width: 0;">
                        <div class="cart-item-title">${product.title}</div>
                        <div class="cart-item-category">${product.category}</div>
                    </div>
                    <div class="cart-item-price">${product.price * item.qty}&nbsp;₴</div>
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
    
    // Отступ для фиксированной панели итогов
    const summaryDiv = document.createElement('div');
    summaryDiv.style.height = '100px';
    content.appendChild(summaryDiv);
    
    // Создаём панель итогов ТОЛЬКО если корзина не пуста
    const summary = document.createElement('div');
    summary.className = 'cart-summary animate-slide';
    summary.innerHTML = `
        <div class="cart-total">
            <span>Итого:</span>
            <span style="white-space: nowrap;">${getTotal()}&nbsp;₴</span>
        </div>
        <button class="btn btn-primary" onclick="startCheckout()">Оформить заказ</button>
    `;
    document.body.appendChild(summary);
}

// Навигация
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
    }
    
    if (viewName !== 'cart') {
        const existingSummary = document.querySelector('.cart-summary');
        if (existingSummary) existingSummary.remove();
    }
    
    window.scrollTo(0, 0);
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

// Оформление заказа
function startCheckout() {
    if (cart.length === 0) return;
    checkoutStep = 1;
    selectedDelivery = null;
    updateCheckoutSteps();
    showView('checkout');
    document.getElementById('view-checkout').classList.remove('hidden');
    document.querySelectorAll('.view-section').forEach(el => {
        if (el.id !== 'view-checkout') el.classList.add('hidden');
    });
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
        if (!name || !phone) {
            showToast('Пожалуйста, заполните все поля');
            return;
        }
    }
    if (step === 3) {
        if (!selectedDelivery) {
            showToast('Выберите способ доставки');
            return;
        }
        if (selectedDelivery !== 'pickup') {
            const address = document.getElementById('deliveryAddress').value.trim();
            if (!address) {
                showToast('Укажите адрес доставки');
                return;
            }
        }
        renderCheckoutSummary();
    }
    checkoutStep = step;
    updateCheckoutSteps();
    window.scrollTo(0, 0);
}

function prevCheckoutStep(step) {
    checkoutStep = step;
    updateCheckoutSteps();
    window.scrollTo(0, 0);
}

function selectDelivery(type, element) {
    selectedDelivery = type;
    document.querySelectorAll('.delivery-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    
    const details = document.getElementById('deliveryDetails');
    const label = document.getElementById('deliveryLabel');
    const input = document.getElementById('deliveryAddress');
    
    if (type === 'pickup') {
        details.classList.add('hidden');
        input.value = 'г. Киев, ул. Кофейная, 12';
    } else {
        details.classList.remove('hidden');
        label.textContent = type === 'newpost' ? 'Город и номер отделения Новой Почты' : 'Адрес доставки (улица, дом, квартира)';
        input.placeholder = type === 'newpost' ? 'Например: Киев, отделение №15' : 'Введите полный адрес';
        if (input.value === 'г. Киев, ул. Кофейная, 12') input.value = '';
    }
    if (tg.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function renderCheckoutSummary() {
    const container = document.getElementById('checkoutSummary');
    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    
    let deliveryText = '';
    if (selectedDelivery === 'newpost') deliveryText = 'Новая Почта';
    else if (selectedDelivery === 'courier') deliveryText = 'Курьерская доставка';
    else deliveryText = 'Самовывоз';
    
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
        <div class="summary-row total">
            <span>Итого к оплате:</span>
            <span>${getTotal()} ₴</span>
        </div>
    `;
}

function submitOrder() {
    const orderNum = 'COFFEE-' + Math.floor(1000 + Math.random() * 9000);
    document.getElementById('successOrderNumber').textContent = '№ ' + orderNum;
    document.getElementById('successScreen').classList.remove('hidden');
    
    cart = [];
    saveCart();
    updateCartBadge();
    
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    
    if (tg.MainButton) {
        tg.MainButton.setText('Заказ оформлен');
        tg.MainButton.show();
        setTimeout(() => tg.MainButton.hide(), 3000);
    }
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

// Toast уведомления
// 1. Обновляем функцию уведомлений (добавляем защиту от спама)
let isToastVisible = false;

function showToast(message) {
    if (isToastVisible) return; // Если уведомление уже висит, новое не создаем
    
    isToastVisible = true;
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            toast.remove();
            isToastVisible = false; // Разрешаем показ следующего уведомления
        }, 300);
    }, 2000); // Уведомление висит 2 секунды
}

// 2. Убираем showToast из изменения количества
function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            removeFromCart(productId);
            return;
        }
        saveCart();
        renderCart();
        updateCartBadge();
        // showToast('Количество обновлено') — УДАЛЕНО
    }
}

// 3. Убираем showToast из удаления товара
function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    renderCart();
    updateCartBadge();
    // showToast('Товар удалён из корзины') — УДАЛЕНО
}

// Обработка свайпа назад для закрытия деталей (опционально для мобильных)
let xDown = null;
let yDown = null;

document.addEventListener('touchstart', function handleTouchStart(evt) {
    xDown = evt.touches[0].clientX;
    yDown = evt.touches[0].clientY;
}, false);

document.addEventListener('touchmove', function handleTouchMove(evt) {
    if (!xDown || !yDown) return;
    let xUp = evt.touches[0].clientX;
    let yUp = evt.touches[0].clientY;
    let xDiff = xDown - xUp;

    if (xDiff > 50 && !document.getElementById('productDetail').classList.contains('hidden')) {
        closeProductDetail();
    }
    xDown = null;
    yDown = null;
}, false);