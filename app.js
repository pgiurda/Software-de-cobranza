// Variables globales
let products = [];
let cart = [];

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    renderProductsList();
    focusBarcodeInput();
    
    // Listener para el input de código de barras
    document.getElementById('barcodeInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addToCart(this.value);
            this.value = '';
        }
    });

    // Listener para el input de búsqueda por nombre
    const nameSearchInput = document.getElementById('nameSearchInput');
    nameSearchInput.addEventListener('input', function() {
        showProductSuggestions(this.value);
    });

    nameSearchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const suggestions = document.getElementById('productSuggestions');
            if (suggestions.style.display === 'block') {
                // Si hay sugerencias visibles, seleccionar la primera
                const firstSuggestion = suggestions.querySelector('.suggestion-item');
                if (firstSuggestion) {
                    selectProduct(firstSuggestion.dataset.productId);
                }
            } else {
                // Si no hay sugerencias, mostrar mensaje
                if (this.value.trim()) {
                    alert('No se encontraron productos con ese nombre');
                }
            }
            this.value = '';
            hideSuggestions();
        }
    });

    // Ocultar sugerencias al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            hideSuggestions();
        }
    });
});

// Guardar productos en localStorage
function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}

// Cargar productos desde localStorage
function loadProducts() {
    const saved = localStorage.getItem('products');
    products = saved ? JSON.parse(saved) : [];
}

// Agregar nuevo producto
function addProduct() {
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const barcode = document.getElementById('productBarcode').value.trim();

    // Validaciones
    if (!name || !price || !barcode) {
        alert('Por favor completa todos los campos');
        return;
    }

    if (price <= 0) {
        alert('El precio debe ser mayor a 0');
        return;
    }

    // Verificar si el código de barras ya existe
    if (products.some(p => p.barcode === barcode)) {
        alert('Este código de barras ya está registrado');
        return;
    }

    // Agregar producto
    products.push({
        id: Date.now(),
        name: name,
        price: price,
        barcode: barcode
    });

    saveProducts();
    renderProductsList();

    // Limpiar formulario
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productBarcode').value = '';

    alert('Producto agregado exitosamente');
    focusBarcodeInput();
}

// Renderizar lista de productos
function renderProductsList() {
    const container = document.getElementById('productsList');
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No hay productos registrados</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-item">
            <div>
                <div class="product-item-name">${escapeHtml(product.name)}</div>
                <div class="product-item-barcode">BC: ${escapeHtml(product.barcode)}</div>
            </div>
            <div class="product-item-price">$${product.price.toFixed(2)}</div>
            <div style="text-align: center;">
                <button onclick="editProduct(${product.id})" class="btn" style="background: #3182ce; color: white; padding: 6px 10px; font-size: 0.85em; margin-right: 5px;">Editar</button>
            </div>
            <div style="text-align: center;">
                <button onclick="deleteProduct(${product.id})" class="btn btn-danger">Eliminar</button>
            </div>
        </div>
    `).join('');
}

// Editar producto
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const newName = prompt('Nuevo nombre:', product.name);
    if (newName === null) return;

    const newPrice = prompt('Nuevo precio:', product.price);
    if (newPrice === null) return;

    const newBarcode = prompt('Nuevo código de barras:', product.barcode);
    if (newBarcode === null) return;

    if (!newName.trim() || isNaN(newPrice) || !newBarcode.trim()) {
        alert('Datos inválidos');
        return;
    }

    if (parseFloat(newPrice) <= 0) {
        alert('El precio debe ser mayor a 0');
        return;
    }

    // Verificar si el nuevo barcode ya existe en otro producto
    if (products.some(p => p.id !== id && p.barcode === newBarcode)) {
        alert('Este código de barras ya está registrado');
        return;
    }

    product.name = newName.trim();
    product.price = parseFloat(newPrice);
    product.barcode = newBarcode.trim();

    saveProducts();
    renderProductsList();
    alert('Producto actualizado');
}

// Eliminar producto
function deleteProduct(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    products = products.filter(p => p.id !== id);
    saveProducts();
    renderProductsList();
}

// Agregar producto al carrito
function addToCart(barcode) {
    const product = products.find(p => p.barcode === barcode);

    if (!product) {
        alert('Código de barras no encontrado');
        focusBarcodeInput();
        return;
    }

    // Buscar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    renderCart();
    focusBarcodeInput();
}

// Mostrar sugerencias de productos
function showProductSuggestions(searchTerm) {
    const suggestionsContainer = document.getElementById('productSuggestions');
    
    if (!searchTerm.trim()) {
        hideSuggestions();
        return;
    }

    const term = searchTerm.trim().toLowerCase();
    const matchingProducts = products.filter(p => p.name.toLowerCase().includes(term));

    if (matchingProducts.length === 0) {
        hideSuggestions();
        return;
    }

    suggestionsContainer.innerHTML = matchingProducts.map(product => `
        <div class="suggestion-item" data-product-id="${product.id}" onclick="selectProduct(${product.id})">
            <div class="suggestion-name">${escapeHtml(product.name)}</div>
            <div class="suggestion-price">$${product.price.toFixed(2)}</div>
        </div>
    `).join('');

    suggestionsContainer.style.display = 'block';
}

// Ocultar sugerencias
function hideSuggestions() {
    const suggestionsContainer = document.getElementById('productSuggestions');
    suggestionsContainer.style.display = 'none';
}

// Seleccionar producto de las sugerencias
function selectProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Buscar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    renderCart();
    document.getElementById('nameSearchInput').value = '';
    hideSuggestions();
    focusBarcodeInput();
}

// Renderizar carrito
function renderCart() {
    const container = document.getElementById('cartItems');

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart"><div class="empty-cart-icon">🛒</div><p>El carrito está vacío</p></div>';
        updateCartSummary();
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-name">${escapeHtml(item.name)}</div>
            <div style="display: flex; gap: 5px; align-items: center;">
                <button onclick="decrementQuantity(${item.id})" class="btn" style="background: #f0f0f0; color: #333; padding: 4px 8px; font-size: 0.85em;">-</button>
                <span class="cart-item-qty">${item.quantity}</span>
                <button onclick="incrementQuantity(${item.id})" class="btn" style="background: #f0f0f0; color: #333; padding: 4px 8px; font-size: 0.85em;">+</button>
            </div>
            <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            <button onclick="removeFromCart(${item.id})" class="btn btn-danger">X</button>
        </div>
    `).join('');

    updateCartSummary();
}

// Incrementar cantidad
function incrementQuantity(id) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity++;
        renderCart();
    }
}

// Decrementar cantidad
function decrementQuantity(id) {
    const item = cart.find(i => i.id === id);
    if (item) {
        if (item.quantity > 1) {
            item.quantity--;
        } else {
            removeFromCart(id);
            return;
        }
        renderCart();
    }
}

// Eliminar del carrito
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
}

// Limpiar carrito
function clearCart() {
    if (cart.length === 0) {
        alert('El carrito ya está vacío');
        return;
    }

    if (!confirm('¿Deseas vaciar el carrito?')) return;

    cart = [];
    renderCart();
    focusBarcodeInput();
}

// Actualizar resumen del carrito
function updateCartSummary() {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    document.getElementById('itemCount').textContent = itemCount;
    document.getElementById('total').textContent = '$' + total.toFixed(2);
}

// Procesar pago
function processPayment() {
    if (cart.length === 0) {
        alert('El carrito está vacío');
        return;
    }

    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);

    if (!paymentAmount || paymentAmount <= 0) {
        alert('Por favor ingresa un monto válido');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (paymentAmount < total) {
        alert(`El monto es insuficiente. Total: $${total.toFixed(2)}`);
        return;
    }

    const change = paymentAmount - total;

    // Mostrar modal con el cambio
    document.getElementById('modalTotal').textContent = total.toFixed(2);
    document.getElementById('modalPaid').textContent = paymentAmount.toFixed(2);
    document.getElementById('modalChange').textContent = change.toFixed(2);

    document.getElementById('changeModal').style.display = 'block';
}

// Finalizar transacción
function finishTransaction() {
    // Limpiar formulario y carrito
    document.getElementById('paymentAmount').value = '';
    cart = [];
    renderCart();
    closeModal();
    focusBarcodeInput();

    alert('¡Transacción completada exitosamente!');
}

// Cerrar modal
function closeModal() {
    document.getElementById('changeModal').style.display = 'none';
}

// Cerrar modal si se hace clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('changeModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Enfocar input de código de barras
function focusBarcodeInput() {
    const barcodeInput = document.getElementById('barcodeInput');
    setTimeout(() => barcodeInput.focus(), 100);
}

// Escape HTML para evitar inyecciones
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Exportar productos a Excel
function exportToExcel() {
    if (products.length === 0) {
        alert('No hay productos para exportar');
        return;
    }

    // Preparar datos para Excel
    const excelData = products.map(p => ({
        'Nombre': p.name,
        'Precio': p.price,
        'Código de Barras': p.barcode
    }));

    // Crear workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Ajustar ancho de columnas
    const colWidths = [
        { wch: 25 },  // Nombre
        { wch: 12 },  // Precio
        { wch: 20 }   // Código de Barras
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    // Descargar archivo
    const fileName = `Productos_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    alert('Archivo descargado exitosamente');
}

// Importar productos desde Excel
function importFromExcel(event) {
    const file = event.target.files[0];
    
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Leer la primera hoja
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convertir a JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                alert('El archivo Excel está vacío');
                return;
            }

            // Validar y procesar datos
            let importedCount = 0;
            let skippedCount = 0;

            jsonData.forEach(row => {
                // Validar que tenga los campos requeridos
                const name = row['Nombre'] ? row['Nombre'].toString().trim() : '';
                const price = parseFloat(row['Precio']);
                const barcode = row['Código de Barras'] ? row['Código de Barras'].toString().trim() : '';

                // Validaciones
                if (!name || !price || !barcode) {
                    skippedCount++;
                    return;
                }

                if (price <= 0) {
                    skippedCount++;
                    return;
                }

                // Verificar si ya existe un producto con ese código de barras
                if (products.some(p => p.barcode === barcode)) {
                    skippedCount++;
                    return;
                }

                // Agregar producto
                products.push({
                    id: Date.now() + importedCount,
                    name: name,
                    price: price,
                    barcode: barcode
                });

                importedCount++;
            });

            if (importedCount > 0) {
                saveProducts();
                renderProductsList();
                alert(`✓ ${importedCount} producto(s) importado(s) exitosamente${skippedCount > 0 ? `\n⚠ ${skippedCount} fila(s) fueron omitidas (datos inválidos o duplicados)` : ''}`);
            } else {
                alert('No se importó ningún producto. Verifica que el archivo tenga el formato correcto:\n- Columnas: Nombre, Precio, Código de Barras');
            }

        } catch (error) {
            alert('Error al leer el archivo: ' + error.message);
        }
    };

    reader.readAsArrayBuffer(file);
    
    // Limpiar input para permitir cargar el mismo archivo nuevamente
    event.target.value = '';
}
