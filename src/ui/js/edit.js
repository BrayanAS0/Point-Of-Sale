// Cargar los datos iniciales al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
});


function cargarDatos(codigo = '', nombre = '') {
    const connection = global.dbConnection;
    let query = `
        SELECT * FROM productos
    `;
    let values = [];

    if (codigo !== '') {
        query += ' WHERE codigo_producto = ?';
        values = [codigo];
    } else if (nombre !== '') {
        query += ' WHERE nombre = ?';
        values = [nombre];
    } else {
        query += ' ORDER BY CASE WHEN cantidad < cantidad_minima THEN 0 ELSE 1 END, nombre';
    }

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error al obtener los datos:', error);
            return;
        }

        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = '';

        results.forEach(producto => {
            const fila = document.createElement('tr');

            // Verificar si la cantidad es menor que la cantidad mínima
            if (producto.cantidad < producto.cantidad_minima) {
                fila.classList.add('fila-resaltada');
            }

            fila.innerHTML = `
                <td data-campo="codigo_producto">${producto.codigo_producto}</td>
                <td data-campo="nombre">${producto.nombre}</td>
                <td data-campo="categoria">${producto.categoria}</td>
                <td data-campo="cantidad">${producto.cantidad}</td>
                <td data-campo="cantidad_minima">${producto.cantidad_minima}</td>
                <td data-campo="precio_publico">${producto.precio_publico}</td>
                <td data-campo="precio_proveedor">${producto.precio_proveedor}</td>
            `;

            // Agregar evento de clic a cada celda de la fila
            fila.querySelectorAll('td').forEach(celda => {
                celda.addEventListener('click', () => {
                    if (!celda.classList.contains('editando')) {
                        const valorAnterior = celda.textContent;
                        const campo = celda.dataset.campo;

                        celda.classList.add('editando');
                        celda.innerHTML = `<input type="text" value="${valorAnterior}">`;

                        const input = celda.querySelector('input');
                        input.focus();

                        const actualizarValor = () => {
                            const nuevoValor = input.value;

                            // Actualizar el valor en la base de datos
                            const query = `
                                UPDATE productos
                                SET ${campo} = ?
                                WHERE codigo_producto = ?
                            `;
                            const values = [nuevoValor, producto.codigo_producto];

                            connection.query(query, values, (error, results) => {
                                if (error) {
                                    console.error('Error al actualizar el valor:', error);
                                } else {
                                    console.log('Valor actualizado correctamente.');
                                    celda.textContent = nuevoValor;
                                    celda.classList.remove('editando');
                                }
                            });
                        };

                        input.addEventListener('blur', actualizarValor);
                        input.addEventListener('keydown', (event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                actualizarValor();
                            }
                        });
                    }
                });
            });

            tableBody.appendChild(fila);
        });
    });
}
function buscarProductos() {
    const codigoInput = document.getElementById('search-codigo');
    const nombreInput = document.getElementById('search-nombre');
    const searchResults = document.getElementById('search-results');

    const codigo = codigoInput.value.trim();
    const nombre = nombreInput.value.trim();

    if (codigo === '' && nombre === '') {
        searchResults.innerHTML = '';
        cargarDatos();
        return;
    }

    const connection = global.dbConnection;
    let query = '';
    let values = [];

    if (codigo !== '') {
        query = `
            SELECT codigo_producto, nombre
            FROM productos
            WHERE codigo_producto LIKE ?
            LIMIT 5
        `;
        values = [`%${codigo}%`];
    } else if (nombre !== '') {
        query = `
            SELECT codigo_producto, nombre
            FROM productos
            WHERE nombre LIKE ?
            LIMIT 5
        `;
        values = [`%${nombre}%`];
    }

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error al buscar productos:', error);
            return;
        }

        searchResults.innerHTML = '';

        results.forEach(producto => {
            const li = document.createElement('li');
            li.textContent = `${producto.codigo_producto} - ${producto.nombre}`;
            li.addEventListener('click', () => {
                if (codigo !== '') {
                    codigoInput.value = producto.codigo_producto;
                    nombreInput.value = '';
                    cargarDatos(producto.codigo_producto);
                } else if (nombre !== '') {
                    codigoInput.value = '';
                    nombreInput.value = producto.nombre;
                    cargarDatos('', producto.nombre);
                }
                searchResults.innerHTML = '';
            });
            searchResults.appendChild(li);
        });

        // Seleccionar la primera opción por defecto
        if (searchResults.children.length > 0) {
            searchResults.children[0].classList.add('selected');
        }
    });
}

// Función para manejar la navegación con las flechas y el Enter
function handleKeyNavigation(event) {
    const searchResults = document.getElementById('search-results');
    const selectedOption = searchResults.querySelector('.selected');

    if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (selectedOption && selectedOption.previousElementSibling) {
            selectedOption.classList.remove('selected');
            selectedOption.previousElementSibling.classList.add('selected');
        }
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (selectedOption) {
            if (selectedOption.nextElementSibling) {
                selectedOption.classList.remove('selected');
                selectedOption.nextElementSibling.classList.add('selected');
            }
        } else if (searchResults.children.length > 0) {
            searchResults.children[0].classList.add('selected');
        }
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (selectedOption) {
            selectedOption.click();
        }
    }
}


// Escuchar los eventos de teclado en los campos de búsqueda
// Escuchar los eventos de entrada y teclado en los campos de búsqueda
document.getElementById('search-codigo').addEventListener('input', buscarProductos);
document.getElementById('search-nombre').addEventListener('input', buscarProductos);
document.getElementById('search-codigo').addEventListener('keydown', handleKeyNavigation);
document.getElementById('search-nombre').addEventListener('keydown', handleKeyNavigation);