// Función para cargar los datos de la tabla
function cargarDatos() {
  const connection = global.dbConnection;
  connection.query(`
    SELECT * FROM ventas
    ORDER BY id_venta
  `, (error, results) => {
    if (error) {
      console.error('Error al obtener los datos:', error);
      return;
    }

    console.log('Resultados de la consulta:', results);
    mostrarDatos(results);
  });
}

// Función para mostrar los datos en la tabla
function mostrarDatos(results) {
  const tableBody = document.getElementById('table-body');
  tableBody.innerHTML = '';

  results.forEach(venta => {
    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td>${venta.id_venta}</td>
      <td>${venta.fecha}</td>
      <td>${venta.hora}</td>
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
}

// Función para realizar la búsqueda por folio
function buscarPorFolio() {
  const folioInput = document.getElementById('search-Folio');
  const folio = folioInput.value.trim();

  if (folio === '') {
    // Si el campo de búsqueda está vacío, cargar todos los datos
    cargarDatos();
  } else {
    const connection = global.dbConnection;
    connection.query(`
      SELECT * FROM ventas
      WHERE id_venta LIKE ?
      ORDER BY id_venta
    `, [`%${folio}%`], (error, results) => {
      if (error) {
        console.error('Error al realizar la búsqueda:', error);
        return;
      }

      console.log('Resultados de la búsqueda:', results);
      mostrarDatos(results);
    });
  }
}

// Agregar evento de input al campo de búsqueda por folio
const folioInput = document.getElementById('search-Folio');
folioInput.addEventListener('input', buscarPorFolio);

// Llamar a la función cargarDatos() cuando se cargue la página
window.addEventListener('DOMContentLoaded', cargarDatos);
function eliminarVenta(ventaId) {
  getVentaDetails(ventaId, (error, venta) => {
    if (error) {
      console.error('Error al obtener los detalles de la venta:', error);
      return;
    }

    const connection = global.dbConnection;
    const ticketContent = venta.ticket;

    // Dividir el contenido del ticket en filas
    const ticketRows = ticketContent.trim().split('\n');

    // Construir la consulta de actualización de productos
    const updateProductQuery = `
      UPDATE productos
      SET cantidad = CASE codigo_producto
        ${ticketRows.map(row => {
          const [productCode, productName, category, quantity, price, subtotal] = row.split('|').map(item => item.trim());
          return `WHEN '${productCode}' THEN cantidad + ${parseFloat(quantity)}`;
        }).join('\n        ')}
        ELSE cantidad
      END
      WHERE codigo_producto IN (${ticketRows.map(row => {
        const [productCode] = row.split('|').map(item => item.trim());
        return `'${productCode}'`;
      }).join(', ')});
    `;

    // Eliminar la venta de la tabla ventas
    const deleteVentaQuery = `
      DELETE FROM ventas
      WHERE id_venta = ?;
    `;

    // Ejecutar las consultas de actualización de productos y eliminación de venta
    connection.query(updateProductQuery, (error, results) => {
      if (error) {
        console.error('Error al actualizar las cantidades de los productos:', error);
        return;
      }

      connection.query(deleteVentaQuery, [ventaId], (error, results) => {
        if (error) {
          console.error('Error al eliminar la venta:', error);
          return;
        }

        console.log('Venta eliminada y cantidades de productos actualizadas.');
        // Aquí puedes realizar alguna acción adicional después de eliminar la venta
        cargarDatos(); // Volver a cargar los datos después de eliminar la venta
      });
    });
  });
}
function getVentaDetails(ventaId, callback) {
  const connection = global.dbConnection;
  const query = `
    SELECT * FROM ventas
    WHERE id_venta = ?
  `;
  connection.query(query, [ventaId], (error, results) => {
    if (error) {
      console.error('Error al obtener los datos de la venta:', error);
      callback(error, null);
    } else {
      const venta = results[0];
      callback(null, venta);
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
      const totalAmount = parseFloat(venta.total);
      const currentDate = venta.fecha;
      const currentTime = venta.hora;

      const ticketContainer = document.getElementById('ticket-container');
      const ticketBody = document.getElementById('ticket-body');
      const ticketTotal = document.getElementById('ticket-total');
      const ticketDate = document.getElementById('ticket-date');
      const ticketTime = document.getElementById('ticket-time');

      // Agregar el folio al título del ticket
      const ticketTitle = document.querySelector('.ticket-content h3');
      ticketTitle.textContent = `Ferretera - Folio: ${ventaId}`;

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

      // Verificar si totalAmount es un número válido
      if (!isNaN(totalAmount)) {
        ticketTotal.textContent = totalAmount.toFixed(2);
      } else {
        ticketTotal.textContent = '0.00';
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