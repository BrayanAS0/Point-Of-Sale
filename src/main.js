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


const createWindow = () => {
  const win = new BrowserWindow({
    width: 10000,
    height: 1000,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
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
/*
ipcMain.on('consultar-estudiantes', (event) => {
  console.log('Evento "consultar-estudiantes" recibido en el proceso principal');
  connection.query('SELECT * FROM estudiantes', (error, results) => {
    if (error) {
      console.error('Error al obtener los estudiantes:', error);
      event.reply('estudiantes-consultados', []);
      return;
    }
    console.log('Resultados de la consulta:', results);
    event.reply('estudiantes-consultados', results);
  });
});

*/
///
