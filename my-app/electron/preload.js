const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Auth
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  register: (userData) => ipcRenderer.invoke('register', userData),
  
  // Session Management
  startSession: () => ipcRenderer.invoke('session:start'),
  stopSession: () => ipcRenderer.invoke('session:stop'),
  getSessionStatus: () => ipcRenderer.invoke('session:status'),
  resumeSession: (params) => ipcRenderer.invoke('session:resume', params),
  getSessions: (params) => ipcRenderer.invoke('sessions:get', params),
  
  // Activity
  getCurrentActivity: () => ipcRenderer.invoke('activity:current'),
  
  // HR Dashboard
  getAllEmployees: () => ipcRenderer.invoke('employees:getAll'),
  getHRDashboard: (params) => ipcRenderer.invoke('hr:dashboard', params),
  
  // Screenshots - ✅ FIXED: Changed to match ScreenshotsViewer component expectations
  getScreenshots: (params) => ipcRenderer.invoke('screenshots:get', params),
  getScreenshotFile: (params) => ipcRenderer.invoke('screenshots:getFile', params), // ✅ Now accepts full params object
  
  // Attendance
  getAttendance: (params) => ipcRenderer.invoke('attendance:get', params),
  getAttendanceSummary: (params) => ipcRenderer.invoke('attendance:summary', params),
  getTodayAttendance: () => ipcRenderer.invoke('attendance:today'),
  
  // Mouse tracking
  trackMouseClick: () => ipcRenderer.send('mouse-click'),

  // Admin role
  getUsers: () => ipcRenderer.invoke('admin:getUsers'),
  updateUserRole: (data) => ipcRenderer.invoke('admin:updateUserRole', data),
  deleteUser: (data) => ipcRenderer.invoke('admin:deleteUser', data),
  editActivity: (data) => ipcRenderer.invoke('admin:editActivity', data),
  deleteActivity: (data) => ipcRenderer.invoke('admin:deleteActivity', data),
  addActivity: (data) => ipcRenderer.invoke('admin:addActivity', data),
  deleteScreenshot: (data) => ipcRenderer.invoke('admin:deleteScreenshot', data),
  getUserSettings: (data) => ipcRenderer.invoke('admin:getUserSettings', data),
  updateUserSettings: (data) => ipcRenderer.invoke('admin:updateUserSettings', data),

  // Screenshot export & share
  getScreenshotFile: (filename) => ipcRenderer.invoke('screenshots:getFile', { filename }),
  getAllScreenshots: (data) => ipcRenderer.invoke('screenshots:getAll', data),
  exportScreenshotsZip: (data) => ipcRenderer.invoke('screenshots:exportZip', data),
  exportDailyReport: () => ipcRenderer.invoke('screenshots:exportDaily'),
  openScreenshotsFolder: () => ipcRenderer.invoke('screenshots:openFolder'),
  shareViaEmail: (data) => ipcRenderer.invoke('screenshots:shareEmail', data),
});