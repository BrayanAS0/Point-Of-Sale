document.addEventListener('DOMContentLoaded', function() {
    const connection = global.dbConnection;

    const form = document.getElementById('search-form');
    const codeInput = document.getElementById('code-input');
    const nameInput = document.getElementById('name-input');
    const tableBody = document.getElementById('table-body');
    const totalDisplay = document.getElementById('total-display');
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

    let selectedSuggestionIndex = -1;

    function showSuggestions(searchTerm, inputElement) {
        const suggestionsContainer = inputElement === codeInput ? 'code-suggestions' : 'name-suggestions';
        const suggestionsList = document.getElementById(suggestionsContainer);

        // Realizar consulta a la base de datos MySQL
        const query = `SELECT * FROM productos WHERE ${inputElement === codeInput ? 'codigo_producto' : 'nombre'} LIKE ? LIMIT 5`;
        connection.query(query, [`%${searchTerm}%`], (error, results) => {
            if (error) {
                console.error('Error al obtener sugerencias:', error);
                return;
            }

            // Limpiar sugerencias anteriores
            suggestionsList.innerHTML = '';

            // Mostrar nuevas sugerencias, suggestion para y dar el click
            results.forEach((result, index) => {
                const suggestion = document.createElement('div');
                suggestion.textContent = inputElement === codeInput ? result.codigo_producto : result.nombre;
                suggestion.classList.add('suggestion');
                suggestion.dataset.codigo = result.codigo_producto;
                suggestion.dataset.nombre = result.nombre;
                suggestion.dataset.categoria = result.categoria;
                suggestion.dataset.precio = result.precio_publico;
                suggestion.addEventListener('click', function() {
                    selectSuggestion(result);
                });
                suggestion.addEventListener('mouseenter', function() {
                    selectedSuggestionIndex = Array.from(suggestionsList.children).indexOf(this);
                    highlightSuggestion();
                });
                suggestionsList.appendChild(suggestion);
            });

            selectedSuggestionIndex = -1;

            // Mostrar el contenedor de sugerencias y ajustar su posición
            suggestionsList.style.display = 'block';
            const inputRect = inputElement.getBoundingClientRect();
            suggestionsList.style.top = inputRect.bottom + 'px';
            suggestionsList.style.left = inputRect.left + 'px';
            suggestionsList.style.width = inputRect.width + 'px';
        });
    }

    function selectSuggestion(result) {
        const code = result.codigo_producto;
        const name = result.nombre;
        const category = result.categoria;
        const price = parseFloat(result.precio_publico);
        const quantity = 1;

        // Buscar si ya existe una fila con el mismo código de producto
        const existingRow = Array.from(tableBody.rows).find(row => row.cells[0].textContent === code);

        if (existingRow) {
            // Si ya existe una fila con el mismo código, incrementar la cantidad
            const quantityCell = existingRow.cells[3];
            const currentQuantity = parseInt(quantityCell.textContent);
            quantityCell.textContent = currentQuantity + 1;
        } else {
            // Si no existe una fila con el mismo código, crear una nueva fila
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
        }

        updateTotal();

        // Limpiar los campos de entrada después de agregar la fila
        codeInput.value = '';
        nameInput.value = '';

        hideSuggestions();
    }

    function hideSuggestions() {
        const suggestionsList = document.querySelectorAll('.suggestions-container');
        suggestionsList.forEach(list => {
            list.style.display = 'none';
        });
    }

    codeInput.addEventListener('input', function() {
        showSuggestions(this.value, this);
    });

    codeInput.addEventListener('focus', function() {
        showSuggestions(this.value, this);
        const namesuggestionsList = document.getElementById('name-suggestions');
        namesuggestionsList.style.display = 'none';
    });

    codeInput.addEventListener('blur', function() {
        setTimeout(() => {
            const codesuggestionsList = document.getElementById('code-suggestions');
            if (!codesuggestionsList.contains(document.activeElement)) {
                hideSuggestions();
            }
        }, 100);
    });

    nameInput.addEventListener('input', function() {
        showSuggestions(this.value, this);
    });

    nameInput.addEventListener('focus', function() {
        showSuggestions(this.value, this);
        const codesuggestionsList = document.getElementById('code-suggestions');
        codesuggestionsList.style.display = 'none';
    });

    nameInput.addEventListener('blur', function() {
        setTimeout(() => {
            const namesuggestionsList = document.getElementById('name-suggestions');
            if (!namesuggestionsList.contains(document.activeElement)) {
                hideSuggestions();
            }
        }, 100);
    });

    codeInput.addEventListener('keydown', function(event) {
        handleKeyboardNavigation(event, this);
    });

    nameInput.addEventListener('keydown', function(event) {
        handleKeyboardNavigation(event, this);
    });

    function handleKeyboardNavigation(event, inputElement) {
        const suggestionsContainer = inputElement === codeInput ? 'code-suggestions' : 'name-suggestions';
        const suggestionsList = document.getElementById(suggestionsContainer);
        const suggestions = suggestionsList.getElementsByClassName('suggestion');

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            selectedSuggestionIndex = (selectedSuggestionIndex - 1 + suggestions.length) % suggestions.length;
            highlightSuggestion();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            selectedSuggestionIndex = (selectedSuggestionIndex + 1) % suggestions.length;
            highlightSuggestion();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (selectedSuggestionIndex !== -1) {
                const selectedSuggestion = suggestions[selectedSuggestionIndex];
                const result = {
                    codigo_producto: selectedSuggestion.dataset.codigo,
                    nombre: selectedSuggestion.dataset.nombre,
                    categoria: selectedSuggestion.dataset.categoria,
                    precio_publico: selectedSuggestion.dataset.precio
                };
                selectSuggestion(result);
            }
        }
    }

    function highlightSuggestion() {
        const suggestions = document.getElementsByClassName('suggestion');
        for (let i = 0; i < suggestions.length; i++) {
            suggestions[i].classList.remove('selected');
        }
        if (selectedSuggestionIndex !== -1) {
            suggestions[selectedSuggestionIndex].classList.add('selected');
        }
    }

    document.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            const scannedCode = event.target.value;
            if (scannedCode) {
                // Realizar consulta a la base de datos MySQL para obtener el producto escaneado
                const query = 'SELECT * FROM productos WHERE codigo_producto = ?';
                connection.query(query, [scannedCode], (error, results) => {
                    if (error) {
                        console.error('Error al obtener el producto escaneado:', error);
                        return;
                    }

                    if (results.length > 0) {
                        const result = results[0];
                        selectSuggestion(result);
                        event.target.value = ''; // Limpiar el valor del campo de entrada después de escanear
                    }
                });
            }
        }
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

    tableBody.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-button')) {
            const row = e.target.parentElement.parentElement;
            const subtotal = parseFloat(row.children[5].textContent.slice(1));

            total -= subtotal;
            totalDisplay.textContent = `$${total.toFixed(2)}`;

            row.remove();
        }
    });

    finishSaleButton.addEventListener('click', function() {
        // Lógica para imprimir el ticket (si es necesario)
        // Últimas cosas por hacer, recuerda pedir rollo o checar con impresora dimensionarlo

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

    // Cerrar la conexión cuando la aplicación se cierre, verificar si se apaga la compu se guarden los datos
    window.addEventListener('beforeunload', function() {
        connection.end((err) => {
            if (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        });
    });
});