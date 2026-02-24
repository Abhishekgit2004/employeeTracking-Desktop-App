const asyncHandler = require("../utility/asyncHandler");
const User = require("../model/user.model.js");
const bcrypt = require("bcrypt");
const Session = require("../model/Session.js");
const { USER_ROLE } = require("../enum.js");
const { calculateProductivity, today } = require("../helper/userService.js");





const Register = asyncHandler(async (event, payload) => {
  try {
    const { name, username, email, password, role } = payload;

    if (!name || !username || !email || !password) {
      return { success: false, message: "Required fields missing" };
    }

    const existing = await User.findOne({ username }).lean();
    if (existing) {
      return { success: false, message: "Username already exists" };
    }

    const emailTaken = await User.findOne({ email }).lean();
    if (emailTaken) {
      return { success: false, message: "Email is already registered" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role: (role || USER_ROLE.EMPLOYEE).toUpperCase(),
    });

    return {
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  } catch (err) {
    console.error("Register error:", err);
    return { success: false, message: "Registration failed" };
  }
});

// const asyncHandler = require("../utility/asyncHandler");

const Login = asyncHandler(async (event, payload) => {
  const { username, password } = payload;

  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const user = await User.findOne({ username });
  if (!user) {
    throw new Error("User not found");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error("Invalid password");
  }

  global.CURRENT_USER_ID = user._id.toString();

  const incompleteSession = await Session.findOne({
    userId: user._id,
    status: "active",
  }).lean();

  const safeUser = {
    _id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return {
    success: true,
    message: "Login successful",
    user: safeUser,
    hasIncompleteSession: !!incompleteSession,
    incompleteSessionId: incompleteSession?._id?.toString(),
  };
});

// module.exports = { Login };
const hrDashBord = 
  asyncHandler(async (_, { date }) => {
    try {
      const targetDate = date || today();

      console.log("📅 HR Dashboard - Target Date:", targetDate);

      const sessions = await Session.find({ date: targetDate })
        .populate("userId", "name username email")
        .sort({ startTime: 1 })
        .lean();

      console.log(`📊 HR Dashboard - Found ${sessions.length} sessions`);

      const userMap = {};

      sessions.forEach((session) => {
        if (!session.userId) {
          console.warn("⚠️ Session without userId:", session._id);
          return;
        }

        const userId = session.userId._id.toString();

        if (!userMap[userId]) {
          userMap[userId] = {
            employee: {
              _id: userId,
              name: session.userId.name,
              username: session.userId.username,
            },
            sessions: [],
            totalSeconds: 0,
            totalActivities: [],
          };
        }

        userMap[userId].sessions.push({
          _id: session._id.toString(),
          startTime: session.startTime,
          endTime: session.endTime,
          durationSeconds: session.durationSeconds,
          status: session.status,
          activitiesCount: session.activities?.length || 0,
        });

        userMap[userId].totalSeconds += session.durationSeconds || 0;

        if (session.activities) {
          userMap[userId].totalActivities.push(...session.activities);
        }
      });

      const dashboard = Object.values(userMap).map((user) => ({
        ...user,
        productivity: calculateProductivity(user.totalActivities),
      }));

      console.log(`✅ HR Dashboard - Returning ${dashboard.length} employees`);

      return { success: true, data: dashboard };
    } catch (err) {
      console.error("HR dashboard error:", err);
      return { success: false, message: "Failed to load dashboard" };
    }
  });


const getAllEmployee =
  asyncHandler(async () => {
    try {
      const employees = await User.find({ role: USER_ROLE.EMPLOYEE })
        .select("name username email")
        .lean();

      return {
        success: true,
        data: employees.map((emp) => ({
          ...emp,
          _id: emp._id.toString(),
        })),
      };
    } catch (err) {
      console.error("Get employees error:", err);
      return { success: false, message: "Failed to fetch employees" };
    }
  });


module.exports = {
  Register,
  Login,
  hrDashBord,
  getAllEmployee,
};
