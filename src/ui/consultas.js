document.addEventListener('DOMContentLoaded', function() {
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
    const finishButton = document.getElementById('finish-button');

    let total = 0;

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
                <td>${quantity}</td>
                <td>$${price.toFixed(2)}</td>
                <td>$${(quantity * price).toFixed(2)}</td>
                <td><button class="delete-button">X</button></td>
            `;
            
            tableBody.appendChild(row);
            
            total += quantity * price;
            totalDisplay.textContent = `$${total.toFixed(2)}`;
            
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

    finishButton.addEventListener('click', function() {
        tableBody.innerHTML = '';
        total = 0;
        totalDisplay.textContent = '$0.00';
    });
});