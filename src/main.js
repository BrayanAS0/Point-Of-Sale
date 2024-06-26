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
    
    const { ventaId, totalAmount, receivedAmount, change, isCopy } = ticketData;
    
    const command = `python "${pythonScript}" ${ventaId} ${totalAmount} ${receivedAmount} ${change} ${isCopy}`;
    console.log('Executing command:', command);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error.message}`);
        event.reply('print-ticket-response', { success: false, error: error.message });
        return;
      }
      if (stderr) {
        console.error(`Python script stderr: ${stderr}`);
        event.reply('print-ticket-response', { success: false, error: stderr });
        return;
      }
      console.log(`Python script stdout: ${stdout}`);
      event.reply('print-ticket-response', { success: true });
    });
  } catch (error) {
    console.error('Error in print-ticket handler:', error);
    event.reply('print-ticket-response', { success: false, error: error.message });
  }
});



function getDailySales() {
  return new Promise((resolve, reject) => {
      const query = `
          SELECT fecha, SUM(total) as total_ventas, SUM(ganancia) as total_ganancias
          FROM ventas
          GROUP BY fecha
          ORDER BY STR_TO_DATE(fecha, '%d/%m/%Y') DESC
          LIMIT 30
      `;
      connection.query(query, (error, results) => {
          if (error) {
              console.error('Error en la consulta de ventas diarias:', error);
              reject(error);
          } else {
              console.log('Datos de ventas diarias obtenidos:', results);
              resolve(results);
          }
      });
  });
}

// Función para obtener datos de ventas por mes
function getMonthlySales() {
  return new Promise((resolve, reject) => {
      const query = `
          SELECT 
              DATE_FORMAT(STR_TO_DATE(fecha, '%d/%m/%Y'), '%Y-%m') as mes,
              SUM(total) as total_ventas,
              SUM(ganancia) as total_ganancias
          FROM ventas
          GROUP BY mes
          ORDER BY mes DESC
          LIMIT 12
      `;
      connection.query(query, (error, results) => {
          if (error) {
              console.error('Error en la consulta de ventas mensuales:', error);
              reject(error);
          } else {
              console.log('Datos de ventas mensuales obtenidos:', results);
              resolve(results);
          }
      });
  });
}

// Manejar la solicitud de datos de ventas
ipcMain.on('get-sales-data', async (event) => {
  try {
      const dailyData = await getDailySales();
      const monthlyData = await getMonthlySales();
      event.reply('sales-data-response', { dailyData, monthlyData });
  } catch (error) {
      console.error('Error al obtener datos de ventas:', error);
      event.reply('sales-data-response', { error: 'Error al obtener datos' });
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