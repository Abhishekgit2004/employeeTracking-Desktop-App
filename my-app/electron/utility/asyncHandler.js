const asyncHandler = (fn) => async (event, payload) => {
  try {
    return await fn(event, payload);
  } catch (error) {
    console.error("❌ IPC Error:", error);
    return {
      success: false,
      message: error.message || "Something went wrong",
    };
  }
};

module.exports = asyncHandler;