function cargarDatos() {
    const connection = global.dbConnection;
    connection.query(`
        SELECT * FROM productos
        ORDER BY CASE WHEN cantidad < cantidad_minima THEN 0 ELSE 1 END, nombre
    `, (error, results) => {
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

window.addEventListener('DOMContentLoaded', cargarDatos);