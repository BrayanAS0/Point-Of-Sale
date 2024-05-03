const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado');

  document.getElementById('consultarBtn').addEventListener('click', () => {
    console.log('Botón de consulta clickeado');
    ipcRenderer.send('consultar-estudiantes');
  });
});

ipcRenderer.on('estudiantes-consultados', (event, estudiantes) => {
  console.log('Resultados recibidos en el proceso de renderizado:', estudiantes);

  const resultadosDiv = document.getElementById('resultados');
  resultadosDiv.innerHTML = '';

  if (estudiantes.length === 0) {
    resultadosDiv.textContent = 'No se encontraron estudiantes.';
  } else {
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    ['Matrícula', 'Nombre', 'Correo', 'Teléfono', 'Edad'].forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    estudiantes.forEach(estudiante => {
      const row = document.createElement('tr');
      ['matricula', 'nombre', 'correo', 'telefono', 'edad'].forEach(key => {
        const td = document.createElement('td');
        td.textContent = estudiante[key];
        row.appendChild(td);
      });
      table.appendChild(row);
    });

    resultadosDiv.appendChild(table);
  }
});