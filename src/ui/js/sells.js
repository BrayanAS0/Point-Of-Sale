function cargarDatos() {
    const connection = global.dbConnection;
    connection.query(`
        SELECT * FROM ventas
        ORDER BY fecha
    `, (error, results) => {
        if (error) {
            console.error('Error al obtener los datos:', error);
            return;
        }

        console.log('Resultados de la consulta:', results);

        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = '';

        results.forEach(venta => {
            const fila = document.createElement('tr');

            fila.innerHTML = `
                <td>${venta.id_venta}</td>
                <td>${venta.fecha}</td>
                <td>${venta.total}</td>
                <td>${venta.ganancia}</td>
                <td>
                    <button class="delete-button" data-id="${venta.id_venta}">X</button>
                    <button class="ticket-button" data-id="${venta.id_venta}">Ticket</button>
                </td>
            `;

            // Agregar evento de clic al botón de eliminar
            const deleteButton = fila.querySelector('.delete-button');
            deleteButton.addEventListener('click', () => {
                const ventaId = deleteButton.dataset.id;
                eliminarVenta(ventaId);
            });

            // Agregar evento de clic al botón de ticket
            const ticketButton = fila.querySelector('.ticket-button');
            ticketButton.addEventListener('click', () => {
                const ventaId = ticketButton.dataset.id;
                showTicket(ventaId);
            });

            tableBody.appendChild(fila);
        });
    });
}

function eliminarVenta(ventaId) {
    const connection = global.dbConnection;
    const query = `
        DELETE FROM ventas
        WHERE id_venta = ?
    `;
    connection.query(query, [ventaId], (error, results) => {
        if (error) {
            console.error('Error al eliminar la venta:', error);
        } else {
            console.log('Venta eliminada correctamente.');
            cargarDatos(); // Recargar los datos después de eliminar la venta
        }
    });
}

function showTicket(ventaId) {
    const connection = global.dbConnection;
    const query = `
      SELECT * FROM ventas
      WHERE id_venta = ?
    `;
    connection.query(query, [ventaId], (error, results) => {
      if (error) {
        console.error('Error al obtener los datos de la venta:', error);
      } else {
        console.log('Datos de la venta:', results);

        const venta = results[0];
        const ticketContent = venta.ticket;
        const totalAmount = venta.total;
        const currentDate = venta.fecha;
        const currentTime = new Date().toLocaleTimeString();

        const ticketContainer = document.getElementById('ticket-container');
        const ticketBody = document.getElementById('ticket-body');
        const ticketTotal = document.getElementById('ticket-total');
        const ticketDate = document.getElementById('ticket-date');
        const ticketTime = document.getElementById('ticket-time');

        // Dividir el contenido del ticket en filas
        const ticketRows = ticketContent.trim().split('\n');

        // Generar las filas de la tabla dinámicamente
        ticketBody.innerHTML = ticketRows.map(row => {
          const [productCode, productName, category, quantity, price, subtotal] = row.split('|').map(item => item.trim());
          return `
            <tr>
              <td>${quantity}</td>
              <td>${productName}</td>
              <td>${price}</td>
              <td>${subtotal}</td>
            </tr>
          `;
        }).join('');

        // Verificar si totalAmount es un número válido antes de llamar a toFixed()
        if (typeof totalAmount === 'number' && !isNaN(totalAmount)) {
          ticketTotal.textContent = totalAmount.toFixed(2);
        } else {
          ticketTotal.textContent = '0.00'; // Valor predeterminado si totalAmount no es un número válido
        }

        ticketDate.textContent = currentDate;
        ticketTime.textContent = currentTime;

        ticketContainer.style.display = 'block';
      }
    });
}
// Llamar a la función cargarDatos() cuando se cargue la página
window.addEventListener('DOMContentLoaded', cargarDatos);

const closeButton = document.getElementById('close-button');
closeButton.addEventListener('click', () => {
  const ticketContainer = document.getElementById('ticket-container');
  ticketContainer.style.display = 'none';
});