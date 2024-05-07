// Obtener todas las celdas editables
const editableCells = document.querySelectorAll('.editable');

// Agregar eventos a cada celda editable
editableCells.forEach(cell => {
    // Agregar evento de clic
    cell.addEventListener('click', () => {
        makeEditable(cell);
    });

    // Agregar evento de pasar el mouse
    cell.addEventListener('mouseover', () => {
        cell.style.backgroundColor = '#f0f0f0';
    });

    // Agregar evento de quitar el mouse
    cell.addEventListener('mouseout', () => {
        cell.style.backgroundColor = '';
    });
});

// Función para hacer una celda editable
function makeEditable(cell) {
  const originalValue = cell.textContent;
  cell.innerHTML = `<input type="text" value="${originalValue}">`;
  const input = cell.querySelector('input');
  input.focus();

  // Seleccionar todo el texto del campo de entrada
  input.select();

  // Guardar el valor editado al perder el foco
  input.addEventListener('blur', () => {
      const newValue = input.value;
      cell.textContent = newValue;
  });

  // Guardar el valor editado al presionar Enter
  input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
          const newValue = input.value;
          cell.textContent = newValue;
      }
  });
}

function deleteRow(button) {
  const row = button.closest('tr');
  row.remove();
}