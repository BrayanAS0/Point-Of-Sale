const { app, BrowserWindow, ipcMain } = require('electron');
const mysql = require('mysql2');
const { exec } = require('child_process');
const path = require('path');

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'pos'
});

global.dbConnection = connection;

function printTicket(ticketData) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'print_ticket.py');
    const ventaId = ticketData.ventaId;
    
    console.log(`Ejecutando script de Python con ventaId: ${ventaId}`);
    
    exec(`python "${pythonScript}" ${ventaId}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar el script de Python: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Error en el script de Python: ${stderr}`);
        reject(new Error(stderr));
        return;
      }
      console.log(`Salida del script de Python: ${stdout}`);
      resolve({ success: true, message: stdout });
    });
  });
}

ipcMain.on('print-ticket', async (event, ticketData) => {
  try {
    const pythonScript = path.join(__dirname, 'print_ticket.py');
    
    const { ventaId, totalAmount, receivedAmount, change } = ticketData;
    
    exec(`python "${pythonScript}" ${ventaId} ${totalAmount} ${receivedAmount} ${change}`, (error, stdout, stderr) => {
      if (error || stderr) {
        event.reply('print-ticket-response', { success: false, error: error ? error.message : stderr });
      } else {
        event.reply('print-ticket-response', { success: true });
      }
    });
  } catch (error) {
    event.reply('print-ticket-response', { success: false, error: error.message });
  }
});
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
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
      } else {
        console.log('Conexión cerrada correctamente');
      }
      app.quit();
    });
  }
});