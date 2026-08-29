let parsedProducts = [];
// ВСТАВЬ СЮДА URL ИЗ N8N (Webhook URL)
const N8N_WEBHOOK_URL = 'https://твой-инстанс.n8n.cloud/webhook/parse-coffee-price'; 

document.addEventListener('DOMContentLoaded', () => {
    updateCurrentStats();
    renderCurrentProducts();
    setupFileUpload();
});

function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('priceText').value = event.target.result;
                showAlert('Файл загружен. Теперь нажми "Распарсить"', 'success');
            };
            reader.readAsText(file);
        });
    }
}

// Главная функция: отправка текста в n8n + AI
async function parsePriceList() {
    const text = document.getElementById('priceText').value.trim();
    const parseBtn = document.querySelector('button[onclick="parsePriceList()"]');
    
    if (!text) { showAlert('Вставьте текст прайса', 'error'); return; }

    parseBtn.disabled = true;
    parseBtn.innerHTML = '⏳ ИИ думает... (10-15 сек)';
    showAlert('Отправляем данные нейросети...', 'success');

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priceText: text })
        });

        if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);

        const rawData = await response.text();
        // Очищаем ответ от возможных markdown тегов ```json ... ```
        const cleanJson = rawData.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedProducts = JSON.parse(cleanJson);
        
        if (!Array.isArray(parsedProducts) || parsedProducts.length === 0) throw new Error('ИИ вернул пустой результат.');

        showPreview(parsedProducts);
        showAlert(`✅ ИИ нашел ${parsedProducts.length} товаров!`, 'success');
    } catch (error) {
        console.error(error);
        showAlert('❌ Ошибка: ' + error.message, 'error');
    } finally {
        parseBtn.disabled = false;
        parseBtn.innerHTML = '🔍 Распарсить прайс';
    }
}

function showPreview(products) {
    const preview = document.getElementById('productPreview');
    document.getElementById('productsCount').textContent = products.length;
    document.getElementById('previewTotal').textContent = products.length;
    
    const avg = Math.round(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length);
    document.getElementById('previewAvgPrice').textContent = avg + ' ';
    
    preview.innerHTML = products.map(p => `
        <div class="product-item">
            <div class="product-info">
                <div class="product-name">${p.title || 'Без названия'}</div>
                <div class="product-meta">
                    ${p.origin || ''} • ${p.processing || ''}<br>
                    ${p.flavor || ''}
                </div>
                <div class="product-tags">
                    ${(p.tags || []).map(t => `<span class="tag tag-${t}">${t}</span>`).join('')}
                </div>
            </div>
            <div class="product-price">${p.price || 0} ₴</div>
        </div>
    `).join('');
    document.getElementById('previewSection').classList.remove('hidden');
}

function saveToStore() {
    if (parsedProducts.length === 0) return;
    localStorage.setItem('coffee_products', JSON.stringify(parsedProducts));
    localStorage.removeItem('coffee_cart');
    showAlert(`✅ Сохранено ${parsedProducts.length} товаров!`, 'success');
    updateCurrentStats();
    renderCurrentProducts();
    setTimeout(() => { if(confirm('Открыть магазин?')) window.location.href = 'index.html'; }, 1000);
}

function exportJSON() {
    if (parsedProducts.length === 0) return;
    const blob = new Blob([JSON.stringify(parsedProducts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dam-products-${Date.now()}.json`; a.click();
}

function updateCurrentStats() {
    const current = JSON.parse(localStorage.getItem('coffee_products') || '[]');
    document.getElementById('statTotal').textContent = current.length;
    if (current.length > 0) {
        const avg = Math.round(current.reduce((sum, p) => sum + (p.price || 0), 0) / current.length);
        document.getElementById('statAvgPrice').textContent = avg + ' ₴';
    } else {
        document.getElementById('statAvgPrice').textContent = '0 ₴';
    }
}

function renderCurrentProducts() {
    const current = JSON.parse(localStorage.getItem('coffee_products') || '[]');
    const container = document.getElementById('currentProducts');
    if (current.length === 0) { container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary)">Магазин пуст</div>'; return; }
    container.innerHTML = current.map(p => `
        <div class="product-item">
            <div class="product-info">
                <div class="product-name">${p.title}</div>
                <div class="product-meta">${p.origin} • ${p.flavor}</div>
            </div>
            <div class="product-price">${p.price} ₴</div>
        </div>
    `).join('');
}

function clearStore() {
    if (confirm('Удалить все товары?')) {
        localStorage.removeItem('coffee_products');
        localStorage.removeItem('coffee_cart');
        updateCurrentStats(); renderCurrentProducts();
        showAlert('Магазин очищен', 'success');
    }
}

function clearAll() {
    document.getElementById('priceText').value = '';
    document.getElementById('previewSection').classList.add('hidden');
    parsedProducts = [];
}

function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.innerHTML = ''; container.appendChild(alert);
    setTimeout(() => alert.remove(), 4000);
}