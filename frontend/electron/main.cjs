const { app, BrowserWindow, net, protocol } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);

const distDirectory = path.resolve(__dirname, '..', 'dist');

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'AMC / DM',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.loadURL('app://desktop/index.html');
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    let requestedPath;
    try {
      requestedPath = decodeURIComponent(new URL(request.url).pathname).replace(/^\/+/, '');
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    const filePath = path.resolve(distDirectory, requestedPath || 'index.html');
    if (filePath !== distDirectory && !filePath.startsWith(`${distDirectory}${path.sep}`)) {
      return new Response('Not found', { status: 404 });
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});