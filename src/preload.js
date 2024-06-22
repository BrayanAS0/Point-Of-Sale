const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendPrintTicket: (data) => ipcRenderer.send('print-ticket', data)
});