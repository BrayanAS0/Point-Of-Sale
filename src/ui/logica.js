document.addEventListener('DOMContentLoaded', function() {
    const connection = global.dbConnection;

    const form = document.getElementById('search-form');
    const codeInput = document.getElementById('code-input');
    const nameInput = document.getElementById('name-input');
    const categoryInput = document.getElementById('category-input');
    const quantityInput = document.getElementById('quantity-input');
    const priceInput = document.getElementById('price-input');
    const addButton = document.getElementById('Button-For-Input');
    const tableBody = document.getElementById('table-body');
    const totalDisplay = document.getElementById('total-display');
    const printButton = document.getElementById('print-button');
    const finishButton = document.getElementById('finished-button');
    const modalReceivedAmount = document.getElementById('modal-received-amount');
    const receivedAmountInput = document.getElementById('received-amount-input');
    const confirmReceivedAmountButton = document.getElementById('confirm-received-amount');
    const cancelModalReceivedAmountButton = document.getElementById('cancel-modal-received-amount');
    const modalChange = document.getElementById('modal-change');
    const changeInput = document.getElementById('change-input');
    const finishSaleButton = document.getElementById('finish-sale');
    const finishSaleWithTicketButton = document.getElementById('finish-sale-with-ticket');
    const finishSaleWithouthTicketButton = document.getElementById('finish-sale-withouth-ticket');
    const cancelModalChangeButton = document.getElementById('cancel-modal-change');
    let total = 0;

    function showSuggestions(searchTerm, inputElement) {
        const suggestionsContainer = inputElement === codeInput ? 'code-suggestions' : 'name-suggestions';
        const suggestionsList = document.getElementById(suggestionsContainer);
    
        // Realizar consulta a la base de datos MySQL
        const query = `SELECT * FROM productos WHERE ${inputElement === codeInput ? 'codigo_producto' : 'nombre'} LIKE ?`;
        connection.query(query, [`%${searchTerm}%`], (error, results) => {
            if (error) {
                console.error('Error al obtener sugerencias:', error);
                return;
            }
    
            // Limpiar sugerencias anteriores
            suggestionsList.innerHTML = '';
    
            // Mostrar nuevas sugerencias
            results.forEach(result => {
                const suggestion = document.createElement('div');
                suggestion.textContent = inputElement === codeInput ? result.codigo : result.nombre;
                suggestion.classList.add('suggestion');
                suggestion.addEventListener('click', function() {
                    inputElement.value = inputElement === codeInput ? result.codigo : result.nombre;
                    suggestionsList.innerHTML = '';
                });
                suggestionsList.appendChild(suggestion);
            });
        });
    }
    
    codeInput.addEventListener('input', function() {
        showSuggestions(this.value, this);
    });
    
    nameInput.addEventListener('input', function() {
        showSuggestions(this.value, this);
    });
    codeInput.addEventListener('input', function() {
        showSuggestions(this.value, this);
    });

    nameInput.addEventListener('input', function() {
        showSuggestions(this.value, this);
    });

    // Ocultar las sugerencias cuando se hace clic fuera de los campos de entrada
    document.addEventListener('click', function(event) {
        const suggestionsLists = document.querySelectorAll('.suggestions-list');
        suggestionsLists.forEach(list => {
            if (!list.parentNode.contains(event.target)) {
                list.innerHTML = '';
            }
        });
    });

    confirmReceivedAmountButton.addEventListener('click', function() {
        console.log('Botón "Confirmar" clickeado');
        const receivedAmount = parseFloat(receivedAmountInput.value);
        const totalAmount = total.toFixed(2);

        if (!isNaN(receivedAmount)) {
            const change = receivedAmount - totalAmount;

            if (change >= 0) {
                changeInput.value = change.toFixed(2);
                modalReceivedAmount.hidden = true;
                modalChange.hidden = false;
            } else {
                alert(`Falta dinero por pagar: $${Math.abs(change).toFixed(2)}`);
            }
        } else {
            alert('Por favor, ingrese un número válido.');
        }
    });

    cancelModalReceivedAmountButton.addEventListener('click', function() {
        receivedAmountInput.value = '';
        modalReceivedAmount.hidden = true;
    });

    finishButton.addEventListener('click', function() {
        console.log('Botón "Terminar" clickeado');
        modalReceivedAmount.hidden = false;
    });

    cancelModalReceivedAmountButton.addEventListener('click', function() {
        modalReceivedAmount.hidden = true;
    });

    cancelModalChangeButton.addEventListener('click', function() {
        modalChange.hidden = true;
    });

    addButton.addEventListener('click', function() {
        const code = codeInput.value.trim();
        const name = nameInput.value.trim();
        const category = categoryInput.value.trim();
        const quantity = parseInt(quantityInput.value);
        const price = parseFloat(priceInput.value);

        if (code && name && category && quantity && price) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${code}</td>
                <td>${name}</td>
                <td>${category}</td>
                <td class="editable">${quantity}</td>
                <td class="editable">$${price.toFixed(2)}</td>
                <td>$${(quantity * price).toFixed(2)}</td>
                <td class="td-delete"><button class="delete-button">X</button></td>
            `;

            row.querySelectorAll('td.editable').forEach(cell => {
                cell.addEventListener('click', function() {
                    const input = document.createElement('input');
                    input.value = cell.textContent.replace('$', '');
                    cell.textContent = '';
                    cell.appendChild(input);
                    input.focus();

                    input.addEventListener('input', function() {
                        input.value = input.value.replace(/[^0-9.]/g, '');
                    });

                    input.addEventListener('blur', updateCellValue);
                    input.addEventListener('keypress', function(event) {
                        if (event.key === 'Enter') {
                            updateCellValue();
                        }
                    });

                    function updateCellValue() {
                        const newValue = input.value.trim();
                        cell.textContent = cell.classList.contains('price') ? `$${newValue}` : newValue;
                        updateTotal();
                    }
                });
            });

            tableBody.appendChild(row);

            updateTotal();

            codeInput.value = '';
            nameInput.value = '';
            categoryInput.value = '';
            quantityInput.value = '';
            priceInput.value = '';
        }
    });

    tableBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-button')) {
            const row = e.target.parentElement.parentElement;
            const subtotal = parseFloat(row.children[5].textContent.slice(1));

            total -= subtotal;
            totalDisplay.textContent = `$${total.toFixed(2)}`;

            row.remove();
        }
    });

    printButton.addEventListener('click', function() {
        window.print();
    });

    finishSaleButton.addEventListener('click', function() {
        // Lógica para imprimir el ticket (si es necesario)
        // ...

        tableBody.innerHTML = '';
        total = 0;
        totalDisplay.textContent = '$0.00';
        modalChange.hidden = true;
    });

    cancelModalChangeButton.addEventListener('click', function() {
        modalChange.hidden = true;
    });

    function updateTotal() {
        total = 0;
        tableBody.querySelectorAll('tr').forEach(row => {
            const quantity = parseInt(row.cells[3].textContent);
            const price = parseFloat(row.cells[4].textContent.replace('$', ''));
            const subtotal = quantity * price;
            row.cells[5].textContent = `$${subtotal.toFixed(2)}`;
            total += subtotal;
        });
        totalDisplay.textContent = `$${total.toFixed(2)}`;
    }

    // Cerrar la conexión cuando la aplicación se cierre
    window.addEventListener('beforeunload', function() {
        connection.end((err) => {
            if (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        });
    });
});