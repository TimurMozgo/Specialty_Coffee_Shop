let parsedProducts = [];
const N8N_WEBHOOK_URL = 'https://твой-инстанс.n8n.cloud/webhook/parse-coffee-price';

document.addEventListener('DOMContentLoaded', () => {
    updateCurrentStats();
    renderCurrentProducts();
    setupDragAndDrop();
});

// Drag & Drop
function setupDragAndDrop() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    uploadZone.addEventListener('click', () => fileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--accent)';
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = 'var(--glass-border)';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--glass-border)';
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('priceText').value = e.target.result;
        showAlert('✅ Файл загружен! Нажмите "Распарсить"', 'success');
    };
    reader.readAsText(file);
}

// Загрузка изображения
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        document.getElementById('mImageBase64').value = base64;
        
        const preview = document.getElementById('imagePreview');
        preview.innerHTML = `<img src="${base64}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
}

// Рендер списка товаров
function renderCurrentProducts() {
    const current = JSON.parse(localStorage.getItem('coffee_products') || '[]');
    const container = document.getElementById('currentProducts');
    
    if (current.length === 0) { 
        container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary)">Магазин пуст</div>'; 
        return; 
    }
    
    container.innerHTML = current.map(p => `
        <div class="product-admin-item">
            <img src="${p.image || 'https://via.placeholder.com/60'}" class="product-admin-img" alt="${p.title}" onerror="this.src='https://via.placeholder.com/60'">
            <div class="product-admin-info">
                <div class="product-admin-title">${p.title}</div>
                <div class="product-admin-meta">${p.origin} • ${p.processing || 'Не указана'}</div>
            </div>
            <div class="product-admin-price">${p.price} ₴</div>
            <div class="product-admin-actions">
                <button class="btn-icon" onclick="openEditModal(${p.id})">✏️</button>
                <button class="btn-icon delete" onclick="deleteProduct(${p.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Модальное окно
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Добавить товар';
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('mImageBase64').value = '';
    document.getElementById('imagePreview').innerHTML = `
        <div class="upload-placeholder">
            <div class="upload-icon-large">️</div>
            <div>Нажмите для загрузки фото</div>
        </div>
    `;
    document.getElementById('productModal').classList.remove('hidden');
}

function openEditModal(id) {
    const current = JSON.parse(localStorage.getItem('coffee_products') || '[]');
    const product = current.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modalTitle').textContent = 'Редактировать товар';
    document.getElementById('editProductId').value = product.id;
    document.getElementById('mTitle').value = product.title || '';
    document.getElementById('mOrigin').value = product.origin || '';
    document.getElementById('mPrice').value = product.price || '';
    document.getElementById('mWeight').value = product.weight || '250 г';
    document.getElementById('mImageBase64').value = product.image || '';
    document.getElementById('mDescription').value = product.description || '';
    document.getElementById('mFlavor').value = product.flavor || '';
    document.getElementById('mProcessing').value = product.processing || 'Натуральная';
    document.getElementById('mRoast').value = product.roast || 'Светлая';
    document.getElementById('mAcidity').value = product.acidity || 3;
    document.getElementById('mSweetness').value = product.sweetness || 3;
    document.getElementById('mBody').value = product.body || 3;
    
    const tagsArray = product.tags || [];
    document.getElementById('mTags').value = tagsArray.join(', ');

    const brewingArray = product.brewing || [];
    document.querySelectorAll('#productForm input[type="checkbox"]').forEach(cb => {
        cb.checked = brewingArray.includes(cb.value);
    });

    // Показываем превью картинки
    if (product.image) {
        document.getElementById('imagePreview').innerHTML = `<img src="${product.image}" alt="Preview">`;
    } else {
        document.getElementById('imagePreview').innerHTML = `
            <div class="upload-placeholder">
                <div class="upload-icon-large">🖼️</div>
                <div>Нажмите для загрузки фото</div>
            </div>
        `;
    }

    document.getElementById('productModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('productModal').classList.add('hidden');
}

function saveProductFromModal(event) {
    event.preventDefault();
    
    const id = document.getElementById('editProductId').value;
    const isEdit = id !== '';
    
    const tagsRaw = document.getElementById('mTags').value;
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(t => t) : [];
    
    const brewing = [];
    document.querySelectorAll('#productForm input[type="checkbox"]:checked').forEach(cb => {
        brewing.push(cb.value);
    });

    const newProduct = {
        id: isEdit ? parseInt(id) : Date.now(),
        title: document.getElementById('mTitle').value.trim(),
        origin: document.getElementById('mOrigin').value.trim(),
        price: parseInt(document.getElementById('mPrice').value),
        weight: document.getElementById('mWeight').value.trim(),
        image: document.getElementById('mImageBase64').value,
        description: document.getElementById('mDescription').value.trim(),
        flavor: document.getElementById('mFlavor').value.trim(),
        processing: document.getElementById('mProcessing').value,
        roast: document.getElementById('mRoast').value,
        acidity: parseInt(document.getElementById('mAcidity').value),
        sweetness: parseInt(document.getElementById('mSweetness').value),
        body: parseInt(document.getElementById('mBody').value),
        category: "Зерно",
        tags: tags,
        brewing: brewing
    };

    const current = JSON.parse(localStorage.getItem('coffee_products') || '[]');
    
    if (isEdit) {
        const index = current.findIndex(p => p.id === parseInt(id));
        if (index !== -1) current[index] = newProduct;
    } else {
        current.push(newProduct);
    }

    localStorage.setItem('coffee_products', JSON.stringify(current));
    closeModal();
    updateCurrentStats();
    renderCurrentProducts();
    showAlert(isEdit ? '✅ Товар обновлен!' : '✅ Товар добавлен!', 'success');
}

function deleteProduct(id) {
    if (!confirm('Удалить этот товар?')) return;
    
    let current = JSON.parse(localStorage.getItem('coffee_products') || '[]');
    current = current.filter(p => p.id !== id);
    localStorage.setItem('coffee_products', JSON.stringify(current));
    
    updateCurrentStats();
    renderCurrentProducts();
    showAlert('️ Товар удален', 'success');
}

// Импорт через ИИ
async function parsePriceList() {
    const text = document.getElementById('priceText').value.trim();
    const parseBtn = document.querySelector('button[onclick="parsePriceList()"]');
    
    if (!text) { showAlert('Вставьте текст прайса', 'error'); return; }

    parseBtn.disabled = true;
    parseBtn.innerHTML = '⏳ ИИ думает...';
    showAlert('Отправляем данные нейросети...', 'success');

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priceText: text })
        });

        if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);

        const rawData = await response.text();
        const cleanJson = rawData.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedProducts = JSON.parse(cleanJson);
        
        if (!Array.isArray(parsedProducts) || parsedProducts.length === 0) throw new Error('ИИ вернул пустой результат.');

        parsedProducts = parsedProducts.map((p, idx) => ({ ...p, id: Date.now() + idx }));
        
        const current = JSON.parse(localStorage.getItem('coffee_products') || '[]');
        const updated = [...current, ...parsedProducts];
        localStorage.setItem('coffee_products', JSON.stringify(updated));
        
        showAlert(`✅ ИИ добавил ${parsedProducts.length} товаров!`, 'success');
        updateCurrentStats();
        renderCurrentProducts();
        document.getElementById('priceText').value = '';
        
    } catch (error) {
        console.error(error);
        showAlert('❌ Ошибка: ' + error.message, 'error');
    } finally {
        parseBtn.disabled = false;
        parseBtn.innerHTML = '✨ Распарсить через ИИ';
    }
}

function updateCurrentStats() {
    const current = JSON.parse(localStorage.getItem('coffee_products') || '[]');
    document.getElementById('statTotal').textContent = current.length;
    if (current.length > 0) {
        const avg = Math.round(current.reduce((sum, p) => sum + (p.price || 0), 0) / current.length);
        const total = current.reduce((sum, p) => sum + (p.price || 0), 0);
        document.getElementById('statAvgPrice').textContent = avg + ' ₴';
        document.getElementById('statRevenue').textContent = total + ' ₴';
    } else {
        document.getElementById('statAvgPrice').textContent = '0 ₴';
        document.getElementById('statRevenue').textContent = '0 ₴';
    }
}

function clearStore() {
    if (confirm('ВНИМАНИЕ: Это удалит ВСЕ товары. Продолжить?')) {
        localStorage.removeItem('coffee_products');
        localStorage.removeItem('coffee_cart');
        updateCurrentStats(); 
        renderCurrentProducts();
        showAlert('🗑️ Магазин очищен', 'success');
    }
}

function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.innerHTML = ''; 
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 4000);
}