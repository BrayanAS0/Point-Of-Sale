const { app, BrowserWindow, ipcMain } = require('electron');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'pos'
});

global.dbConnection = connection;

function createPrintTicket(ticketContent, totalAmount, currentDate, currentTime) {
  const tempDir = path.join(__dirname, 'temp');
  const iniFilePath = path.join(tempDir, 'ticket.ini');

  // Asegurarse de que el directorio temporal existe
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Crear el contenido del archivo .ini
  let iniContent = '[Ticket]\n';
  iniContent += 'Tienda=Ferretera\n';
  iniContent += 'Direccion=Dirección\n\n';
  iniContent += '[Productos]\n';

  // Agregar los productos al contenido
  ticketContent.forEach((item, index) => {
    iniContent += `Producto${index + 1}=${item.quantity},${item.product},${item.price},${item.amount}\n`;
  });

  iniContent += '\n[Total]\n';
  iniContent += `Monto=${totalAmount.toFixed(2)}\n\n`;
  iniContent += '[Footer]\n';
  iniContent += 'Mensaje=¡Gracias por su compra!\n';
  iniContent += `Fecha=${currentDate}\n`;
  iniContent += `Hora=${currentTime}\n`;

  // Escribir el contenido en el archivo .ini
  fs.writeFileSync(iniFilePath, iniContent);

  // Imprimir el archivo .ini
  exec(`notepad /p "${iniFilePath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al imprimir: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error de impresión: ${stderr}`);
      return;
    }
    console.log('Ticket impreso correctamente');

    // Eliminar el archivo .ini después de imprimir
    fs.unlinkSync(iniFilePath);
  });
}

ipcMain.on('print-ticket', (event, { ticketContent, totalAmount, currentDate, currentTime }) => {
  const formattedTicketContent = ticketContent.map(item => ({
    quantity: item.quantity,
    product: item.productName,
    price: item.price,
    amount: item.subtotal
  }));

  createPrintTicket(formattedTicketContent, totalAmount, currentDate, currentTime);
});

const createWindow = () => {
  const win = new BrowserWindow({
    width: 10000,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  });

  console.log('Cargando archivo HTML...');
  win.loadFile('src/ui/html/index.html');
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