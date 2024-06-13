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

function createPrintWindow(ticketContent) {
  const printWindow = new BrowserWindow({
    width: 400,
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
        <style>
          body {
            font-family: monospace;
            font-size: 12px;
            margin: 0;
            padding: 20px;
          }
          .ticket-content {
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 5px;
            text-align: left;
          }
          .total {
            margin-top: 20px;
            text-align: right;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="ticket-content">
          <h3>Nombre de la Tienda</h3>
          <p>Dirección</p>
          <p>Teléfono</p>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              ${ticketContent}
            </tbody>
          </table>
          <div class="total">
            <p>Total: $45.95</p>
          </div>
          <div class="footer">
            <p>¡Gracias por su compra!</p>
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

ipcMain.on('print-ticket', (event, ticketContent) => {
  createPrintWindow(ticketContent);
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
  win.loadFile('src//ui//index.html');
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