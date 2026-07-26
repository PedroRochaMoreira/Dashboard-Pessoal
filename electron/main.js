import { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0b0b0f',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Minimiza pra bandeja em vez de fechar o app
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, '../public/icon.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Painel PP');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Abrir Painel PP', click: () => mainWindow.show() },
      { type: 'separator' },
      { label: 'Sair', click: () => { app.isQuitting = true; app.quit(); } },
    ])
  );
  tray.on('click', () => mainWindow.show());
}

// Recebe pedido do app (renderer) pra mostrar uma notificação nativa
ipcMain.handle('show-notification', (_event, { title, body }) => {
  new Notification({ title, body }).show();
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Auto-início com o sistema (nativo do Electron, sem pacote extra)
  app.setLoginItemSettings({ openAtLogin: true, openAsHidden: true });
});

app.on('window-all-closed', () => {
  // não fecha o app — ele fica na bandeja
});