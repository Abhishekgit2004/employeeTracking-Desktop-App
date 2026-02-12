const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Auth
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  register: (userData) => ipcRenderer.invoke('register', userData),
  
  // Session Management (replaces attendance)
  startSession: () => ipcRenderer.invoke('session:start'),
  stopSession: () => ipcRenderer.invoke('session:stop'),
  getSessionStatus: () => ipcRenderer.invoke('session:status'),
  resumeSession: (sessionId) => ipcRenderer.invoke('session:resume', sessionId),
  getSessions: (params) => ipcRenderer.invoke('sessions:get', params),
  
  // Activity
  getCurrentActivity: () => ipcRenderer.invoke('activity:current'),
  
  // HR Dashboard
  getAllEmployees: () => ipcRenderer.invoke('employees:getAll'),
  getHRDashboard: (params) => ipcRenderer.invoke('hr:dashboard', params),
  
  // Mouse tracking
  trackMouseClick: () => ipcRenderer.send('mouse-click')
});