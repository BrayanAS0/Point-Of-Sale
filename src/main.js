const { app, BrowserWindow, ipcMain } = require('electron');
const mysql = require('mysql2');

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'pos'
});
global.dbConnection = connection;

function createPrintWindow(ticketContent, totalAmount, currentDate, currentTime) {
  const printWindow = new BrowserWindow({
    width: 300, // Ancho ajustado para un ticket de 80mm
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  printWindow.loadURL(`data:text/html,${encodeURIComponent(`
<html>
    <head>
        <meta charset="UTF-8">

      <style>
        body {
          font-family: monospace;
          font-size: 10px;
          margin: 0;
          padding: 10px;
          min-width: 70mm;
          max-width: 70mm;

          box-sizing: border-box;
        }
        .ticket-content {
          text-align: center;
        }
        table {
          width: 100%;


          margin-top: 10px;
        }
        th, td {
          padding: 5px;
          text-align: center;
          font-size: 11px;
        }
        th{
          border-bottom: 1px solid #000000;
          border-top: 1px solid #000000;
        }
        .total {
          margin-top: 10px;
          text-align: right;
        }
        .footer {
          margin-top: 10px;
          text-align: center;
        }
        .date-time {
          margin-top: 10px;
          text-align: center;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="ticket-content">
        <h3>Ferretera</h3>
        <p>Dirección</p>
        <table>
          <thead>
            <tr>
              <th>Cantidad</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>

            ${ticketContent}
          </tbody>
        </table>
        <div class="total">
          <p style="font-weight: bold;">Total: $${totalAmount.toFixed(2)}</p>
        </div>
        <div class="footer">
          <p>¡Gracias por su compra!</p>
        </div>
        <div class="date-time">
          <p style="font-weight: bold;">${currentDate} ${currentTime}</p>
        </div>
      </div>
    </body>
  </html>
  `)}`);

  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.print({ silent: true, printBackground: false }, (success, failureReason) => {
      if (!success) {
        console.error('Error al imprimir el ticket:', failureReason);
      }
      printWindow.close();
    });
  });
}

ipcMain.on('print-ticket', (event, { ticketContent, totalAmount, currentDate, currentTime }) => {
  createPrintWindow(ticketContent, totalAmount, currentDate, currentTime);
});

const createWindow = () => {
  const win = new BrowserWindow({
    width: 10000,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true, // Habilitar el módulo 'remote'
    }
  });

  console.log('Cargando archivo HTML...');
  win.loadFile('src//ui//html/index.html');
};

app.whenReady().then(() => {
  createWindow();

  // Conectarse a la base de datos
  connection.connect((error) => {
    if (error) {
      console.error('Error al conectarse a la base de datos:', error);
      return;
    }
    console.log('Conexión exitosa a la base de datos');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Cerrar la conexión a la base de datos al cerrar la aplicación
    connection.end((error) => {
      if (error) {
        console.error('Error al cerrar la conexión:', error);
        return;
      }
      console.log('Conexión cerrada correctamente');
      app.quit();
    });
  }
});