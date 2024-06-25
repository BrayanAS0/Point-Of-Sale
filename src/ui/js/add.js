// Obtener referencias a los elementos del formulario
const searchForm = document.getElementById('search-form');
const codeInput = document.getElementById('code-input');
const nameInput = document.getElementById('name-input');
const categoryInput = document.getElementById('category-input');
const inventoryInput = document.getElementById('inventory-input');
const minQuantityInput = document.getElementById('min-quantity-input');
const publicPriceInput = document.getElementById('public-price-input');
const providerPriceInput = document.getElementById('provider-price-input');
const tagElement = document.getElementById('tag');

// El resto de tu código JavaScript permanece igual
// Función para manejar el envío del formulario
function handleFormSubmit(event) {
    event.preventDefault(); // Evitar el envío del formulario por defecto

    // Obtener los valores de los campos del formulario
    const code = codeInput.value;
    const name = nameInput.value;
    const category = categoryInput.value;
    const inventory = inventoryInput.value;
    const minQuantity = minQuantityInput.value;
    const publicPrice = publicPriceInput.value;
    const providerPrice = providerPriceInput.value;

    // Realizar la inserción en la base de datos
    const connection = global.dbConnection;
    const query = `
        INSERT INTO productos (codigo_producto, nombre, categoria, cantidad, cantidad_minima, precio_publico, precio_proveedor)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [code, name, category, inventory, minQuantity, publicPrice, providerPrice];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error al insertar el producto:', error);
            tagElement.textContent = 'Error al agregar el producto.';
        } else {
            console.log('Producto insertado correctamente.');
            tagElement.textContent = `Producto agregado con codigo: ${code} 
            y nombre ${name}`;
            // Limpiar los campos del formulario
            searchForm.reset();
        }
    });
}

// Manejar el evento de envío del formulario
searchForm.addEventListener('submit', handleFormSubmit);

// Manejar el evento de presionar Enter en los campos de entrada
searchForm.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Evitar el envío del formulario por defecto
        const inputs = searchForm.getElementsByTagName('input');
        const currentInput = event.target;
        const currentIndex = Array.from(inputs).indexOf(currentInput);

        if (currentIndex === inputs.length - 1) {
            // Si es el último campo, enviar el formulario
            handleFormSubmit(event);
        } else {
            // Mover el foco al siguiente campo
            inputs[currentIndex + 1].focus();
        }
    }
});