// main/parts/handlers/laravelAuthHandler/auth/logout.js

const { clearLaravelAuthentication, formatError } = require("./utils");

const handler = async () => {
  try {
    await clearLaravelAuthentication();

    console.log("✅ [Laravel Auth] logout DONE");

    return {
      success: true,
      connected: false,
      message: "Laravelからログアウトしました。",
      data: null,
      meta: { authenticated: false },
      error: null,
    };
  } catch (error) {
    console.error("❌ [Laravel Auth] logout error:", error);
    return formatError(error, "Laravelからのログアウトに失敗しました。");
  }
};

module.exports = { handler };