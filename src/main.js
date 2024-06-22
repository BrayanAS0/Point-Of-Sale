const { app, BrowserWindow, ipcMain } = require('electron');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'pos'
});

global.dbConnection = connection;

async function printOrGenerateTicket(ticketContent, totalAmount, currentDate, currentTime) {
  try {
    // Intenta encontrar una impresora USB
    const device = new escpos.USB();
    const options = { encoding: "GB18030" /* o el que corresponda a tu región */ }
    const printer = new escpos.Printer(device, options);

    device.open(function(error){
      if(error){
        console.error('No se pudo conectar a la impresora USB:', error);
        generateTextTicket(ticketContent, totalAmount, currentDate, currentTime);
        return;
      }

      printer
      .font('a')
      .align('ct')
      .style('bu')
      .size(1, 1)
      .text('Ferretera')
      .text('Dirección')
      .text('---------------------------')
      .align('lt')
      .text('Productos:')
      
      ticketContent.forEach((item) => {
        printer.text(`${item.quantity} ${item.product} ${item.price} ${item.amount}`);
      });

      printer
      .text('---------------------------')
      .align('rt')
      .text(`Total: ${totalAmount.toFixed(2)}`)
      .align('ct')
      .text('¡Gracias por su compra!')
      .text(`Fecha: ${currentDate}`)
      .text(`Hora: ${currentTime}`)
      .cut()
      .close();
    });

  } catch (error) {
    console.error('Error al intentar imprimir:', error);
    generateTextTicket(ticketContent, totalAmount, currentDate, currentTime);
  }
}

function generateTextTicket(ticketContent, totalAmount, currentDate, currentTime) {
  let ticketText = 'Ferretera\n';
  ticketText += 'Dirección\n';
  ticketText += '---------------------------\n';
  ticketText += 'Productos:\n';

  ticketContent.forEach((item) => {
    ticketText += `${item.quantity} ${item.product} ${item.price} ${item.amount}\n`;
  });

  ticketText += '---------------------------\n';
  ticketText += `Total: ${totalAmount.toFixed(2)}\n`;
  ticketText += '¡Gracias por su compra!\n';
  ticketText += `Fecha: ${currentDate}\n`;
  ticketText += `Hora: ${currentTime}\n`;

  const ticketFilePath = path.join(__dirname, 'ticket.txt');
  fs.writeFileSync(ticketFilePath, ticketText);
  console.log(`Ticket generado en: ${ticketFilePath}`);
}

ipcMain.on('print-ticket', async (event, { ticketContent, totalAmount, currentDate, currentTime }) => {
  const formattedTicketContent = ticketContent.map(item => ({
    quantity: item.quantity,
    product: item.productName,
    price: item.price,
    amount: item.subtotal
  }));

  await printOrGenerateTicket(formattedTicketContent, totalAmount, currentDate, currentTime);
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