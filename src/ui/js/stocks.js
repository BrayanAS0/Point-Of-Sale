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
                <td>${producto.codigo_producto}</td>
                <td>${producto.nombre}</td>
                <td>${producto.categoria}</td>
                <td>${producto.cantidad}</td>
                <td>${producto.cantidad_minima}</td>
                <td>${producto.precio_publico}</td>
                <td>${producto.precio_proveedor}</td>
            `;

            tableBody.appendChild(fila);
        });
    });
}
window.addEventListener('DOMContentLoaded', cargarDatos);
