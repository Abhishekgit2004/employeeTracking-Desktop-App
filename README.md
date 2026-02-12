# Employee Tracking System

A production-ready Electron + React desktop application for tracking employee work hours, activity, and productivity with real-time monitoring and HR dashboard capabilities.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [Bug Fixes Applied](#-bug-fixes-applied)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Security Notes](#-security-notes)

---

## ✨ Features

### Employee Features
- ✅ Secure login/registration with bcrypt password hashing
- ✅ Automatic activity tracking (apps, websites, clicks)
- ✅ Real-time session timer
- ✅ View daily/weekly productivity stats
- ✅ In-memory data aggregation (no file I/O overhead)

### HR Features
- ✅ Dashboard with all employees' activity
- ✅ Attendance reports (login/logout times)
- ✅ Productivity scoring by category
- ✅ Export capabilities (future enhancement)

### System Features
- ✅ Auto-save on logout/window close/crash
- ✅ MongoDB persistence
- ✅ Role-based access control (Employee/HR/Admin)
- ✅ Mouse click tracking
- ✅ Website categorization

---

## 🛠 Tech Stack

**Frontend:**
- React 18
- Vite (dev server + bundler)
- Custom CSS (no framework bloat)

**Backend:**
- Electron 28+
- Node.js
- MongoDB + Mongoose
- bcrypt for password hashing
- active-win for window tracking

**Key Libraries:**
- `contextBridge` / `ipcRenderer` for secure IPC
- Custom hooks architecture

---

## 📦 Installation

### Prerequisites

```bash
node >= 18.0.0
npm  >= 9.0.0
MongoDB >= 6.0 (running locally or cloud)
```

### 1. Clone / Download Project

```bash
git clone <your-repo>
cd employee-tracking
```

### 2. Install Dependencies

```bash
npm install
```

Required packages (check `package.json`):
```json
{
  "dependencies": {
    "electron": "^28.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "mongoose": "^8.0.0",
    "bcrypt": "^5.1.1",
    "active-win": "^8.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

### 3. Configure MongoDB

Create `config/db.js`:

```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/employee-tracking", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**For MongoDB Atlas (cloud):**
Replace the connection string with your Atlas URI:
```javascript
mongoose.connect("mongodb+srv://<user>:<pass>@cluster.mongodb.net/employee-tracking")
```

### 4. Run the App

**Development mode:**
```bash
# Terminal 1 - Start Vite dev server
npm run dev

# Terminal 2 - Start Electron
npm run electron:dev
```

**Production build:**
```bash
npm run build
npm run electron:start
```

---

## 📁 Project Structure

```
employee-tracking/
├── src/                          # React frontend
│   ├── assets/
│   │   └── global.css            # CSS variables, reset, keyframes
│   ├── components/
│   │   ├── InputField.jsx        # Reusable form input with validation
│   │   ├── SubmitButton.jsx      # Gradient button with loading state
│   │   ├── StrengthMeter.jsx     # Password strength indicator
│   │   └── Shared.jsx            # Brand, TabBar, SwitchLink, Ambient
│   ├── context/
│   │   ├── AuthContext.jsx       # Global auth state + login/register/logout
│   │   └── ToastContext.jsx      # Global toast notifications
│   ├── hooks/
│   │   └── useElectronApi.jsx    # IPC bridge with channel mapping
│   ├── pages/
│   │   ├── AuthLayout.jsx        # Root auth wrapper (login/signup/success)
│   │   ├── LoginPage.jsx         # Login screen
│   │   ├── SignupPage.jsx        # Registration screen
│   │   └── SuccessPage.jsx       # Post-registration success
│   └── main.jsx                  # React entry point
│
├── model/                        # Mongoose schemas
│   ├── user.model.js             # User schema (EMPLOYEE/HR/ADMIN roles)
│   ├── Attendance.js             # Daily attendance records
│   └── Activity.js               # Aggregated app/site activity
│
├── config/
│   └── db.js                     # MongoDB connection
│
├── helper/
│   └── helper.js                 # Categorization logic (you provide)
│
├── main.js                       # Electron main process (FIXED)
├── preload.js                    # IPC bridge (FIXED)
├── enum.js                       # Constants (USER_ROLE, USER_STATUS)
├── package.json
└── README.md                     # This file
```

---

## 📖 Usage Guide

### First-Time Setup

1. **Start MongoDB:**
   ```bash
   mongod --dbpath=/path/to/data
   ```

2. **Launch the app:**
   ```bash
   npm run dev          # in terminal 1
   npm run electron:dev # in terminal 2
   ```

3. **Create an account:**
   - Click "Sign Up"
   - Enter: Full Name, Username, Email, Password
   - Select Role: Employee or HR
   - Click "Create Account"

4. **Login:**
   - Enter Username + Password
   - Click "Sign In"

### Employee Workflow

```
Login → Start Tracking → Work → Stop Tracking / Close App
```

**What gets tracked:**
- Login/logout times
- Active application names
- Websites visited (if browser detected)
- Mouse clicks
- Time spent per app (aggregated)

**Data storage:**
- Aggregated in memory every 5 seconds
- Saved to MongoDB only on logout or window close
- Zero file I/O overhead during tracking

### HR Dashboard (Future)

HR users can:
- View all employees' attendance
- See productivity scores
- Export reports

---

## 🐛 Bug Fixes Applied

### Frontend Fixes

#### **SignupPage.jsx**
- ❌ **Before:** ROLES sent `"Employee"` (mixed case)
- ✅ **After:** ROLES send `"EMPLOYEE"` (uppercase) to match `enum.js`
- Default state changed from `useState("Employee")` → `useState("EMPLOYEE")`

#### **AuthContext.jsx**
- Updated role comment to reflect correct enum values

#### **Shared.jsx**
- Removed orphan `var_radius_sm` const
- Inlined literal `10` directly in style object

#### **useElectronApi.jsx** ⚠️ **CRITICAL FIX**
- ❌ **Before:** Generic `invoke("auth:login")` sent to main → **No handler found**
- ✅ **After:** Added `CHANNEL_MAP` to translate:
  - `"auth:login"` → `"login"`
  - `"auth:register"` → `"register"`
  - All other channels pass through unchanged

### Backend Fixes

#### **main.js**

1. **Removed dead code:**
   - Deleted unused `const fs = require("fs")`

2. **Fixed window close handler:**
   - ❌ **Before:** `mainWindow.on("close")` called `autoLogout()` but Electron destroyed window before async finished
   - ✅ **After:** Removed close handler — `app.on("before-quit")` already handles it safely

3. **Fixed attendance tracking:**
   - ❌ **Before:** `attendance:start` did nothing → if app crashed, entire session lost
   - ✅ **After:** Writes initial Attendance doc immediately with `loginTime` only
   - `autoLogout()` only updates `logoutTime` + `totalSeconds` via `$set`

4. **Added email duplicate check:**
   - ❌ **Before:** Only checked username → two users could share an email
   - ✅ **After:** Checks both `username` AND `email` for duplicates

5. **Added bcrypt password hashing:**
   - ❌ **Before:** Passwords saved in plain text
   - ✅ **After:** `bcrypt.hash(password, 10)` before `User.create()`
   - Login uses `bcrypt.compare(password, user.password)`

6. **Added role normalization:**
   - ✅ `role: (role || USER_ROLE.EMPLOYEE).toUpperCase()`
   - Works even if frontend sends wrong casing due to cache

#### **preload.js**

- ❌ **Before:** `exposeInMainWorld` called TWICE (`window.api` + `window.electron`)
- ✅ **After:** Removed entire `window.api` block — React uses `window.electron` exclusively
- Single source of truth, cleaner namespace

#### **Attendance.js (Mongoose schema)**

- ❌ **Before:** `logoutTime: { required: true }`
  - Doc created on login → logoutTime doesn't exist yet → Mongoose rejects insert
- ✅ **After:**
  ```javascript
  logoutTime: { type: Date, default: null }
  totalSeconds: { type: Number, default: 0 }
  ```

---

## 🔌 API Reference

### IPC Channels (Frontend ↔ Main Process)

#### Authentication

```javascript
// Register new user
window.electron.auth.register({
  name: "John Doe",
  username: "johndoe",
  email: "john@company.com",
  password: "securepass",
  role: "EMPLOYEE"  // or "HR" or "ADMIN"
})
// → { success: true, user: { _id, name, username, email, role } }

// Login
window.electron.auth.login({
  username: "johndoe",
  password: "securepass"
})
// → { success: true, user: { ... }, message: "Login successful" }
```

#### Attendance

```javascript
// Start tracking
window.electron.attendance.start()
// → { success: true }

// Stop tracking (saves data)
window.electron.attendance.stop()
// → { success: true }

// Get status
window.electron.attendance.status()
// → { active: true, loginTime: "2026-02-03T10:00:00Z" }

// Get attendance records
window.electron.attendance.get({
  userId: "507f1f77bcf86cd799439011",
  startDate: "2026-02-01",
  endDate: "2026-02-28"
})
// → { success: true, data: [...] }
```

#### Activity

```javascript
// Get activity data
window.electron.activity.get({
  userId: "507f1f77bcf86cd799439011",
  date: "2026-02-03"
})
// → { success: true, data: [{ activities: [...], date, userId }] }
```

#### HR Dashboard

```javascript
// Get all employees
window.electron.hr.getAllEmployees()
// → { success: true, data: [{ _id, name, username, email }] }

// Get dashboard
window.electron.hr.getDashboard({ date: "2026-02-03" })
// → { success: true, data: [{ employee, attendance, activities, productivity }] }
```

---

## 🔧 Troubleshooting

### "No handler registered for 'auth:login'"

**Cause:** Old `useElectronApi.jsx` without channel mapping  
**Fix:** Replace with the latest version from `auth-fixed.zip`

### "ValidationError: role: `Employee` is not a valid enum"

**Cause:** Vite cache serving old build  
**Fix:**
```bash
npx vite --clearCache
npm run dev
```

### Passwords not working after update

**Cause:** Existing users have plain-text passwords, new code uses bcrypt  
**Fix:** Delete old users from MongoDB and re-register:
```javascript
db.users.deleteMany({})
```

### Activity data not saving

**Cause:** `global.CURRENT_USER_ID` not set  
**Fix:** Verify `main.js` login handler has:
```javascript
global.CURRENT_USER_ID = user._id.toString();
```

### MongoDB connection failed

**Check:**
1. MongoDB is running: `mongod --version`
2. Connection string in `config/db.js` is correct
3. Network allows connection to Atlas (if using cloud)

### App crashes on close

**Cause:** `mainWindow.on("close")` autoLogout race condition  
**Fix:** Already removed in `electron-fixed.zip` — only `before-quit` handles logout now

---

## 🔐 Security Notes

### ✅ Implemented

- **Password hashing:** bcrypt with 10 salt rounds
- **Context isolation:** `contextIsolation: true` in Electron
- **No node integration:** `nodeIntegration: false`
- **IPC validation:** All inputs validated before DB queries
- **Unique constraints:** Username + email enforced at schema level

### ⚠️ Production Recommendations

1. **HTTPS only** for any network requests
2. **Environment variables** for MongoDB URI (don't commit `.env`)
3. **Rate limiting** on login attempts
4. **Session tokens** with expiry (not implemented)
5. **RBAC middleware** to verify HR role before dashboard access
6. **Input sanitization** on all user-provided data
7. **Audit logs** for HR actions

---

## 📝 Environment Variables

Create `.env` in root:

```bash
# MongoDB
MONGO_URI=mongodb://localhost:27017/employee-tracking

# JWT (future enhancement)
JWT_SECRET=your-secret-key-here

# Electron
NODE_ENV=development
```

Load in `config/db.js`:
```javascript
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI)
```

---

## 🚀 Build for Production

```bash
npm run build
npm run electron:build
```

This creates a distributable `.exe` (Windows), `.app` (Mac), or `.AppImage` (Linux) in the `dist/` folder.

**Recommended:** Use `electron-builder` or `electron-forge` for packaging.

---

## 📄 License

MIT License - feel free to use in commercial projects.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📧 Support

For bugs or questions:
- Open an issue on GitHub
- Email: support@yourcompany.com

---

## 🎯 Roadmap

- [ ] Dashboard UI (HR)
- [ ] Charts & graphs (productivity trends)
- [ ] Export to CSV/PDF
- [ ] Idle time detection
- [ ] Screenshot capture (privacy-aware)
- [ ] Break time tracking
- [ ] Project-based time tracking
- [ ] Multi-language support

---

**Built with ❤️ using Electron + React + MongoDB**
