
const helperVars = require("../Variable/HelperVaribles.js");


function aggregateActivity(appName, site, seconds, clicks) {
  const browsers = ["chrome", "edge", "brave", "firefox", "safari", "opera"];
  const isBrowser = browsers.some((b) => appName.toLowerCase().includes(b));

  if (isBrowser && site && site !== "-") {
    // For browsers, track BOTH the browser AND the individual website

    // 1. Track the browser itself (parent)
    const browserKey = appName;
    if (!helperVars.helperVars.activityData[browserKey]) {
      helperVars.helperVars.activityData[browserKey] = {
        app: appName,
        site: "-",
        seconds: 0,
        clicks: 0,
        isBrowser: true,
        websites: {}, // Store individual websites here
      };
    }
    helperVars.helperVars.activityData[browserKey].seconds += seconds;
    helperVars.helperVars.activityData[browserKey].clicks += clicks;

    // 2. Track the individual website (child)
    if (!helperVars.helperVars.activityData[browserKey].websites[site]) {
      helperVars.helperVars.activityData[browserKey].websites[site] = {
        site: site,
        seconds: 0,
        clicks: 0,
      };
    }
    helperVars.helperVars.activityData[browserKey].websites[site].seconds += seconds;
    helperVars.helperVars.activityData[browserKey].websites[site].clicks += clicks;

    console.log(`🌐 ${appName} → ${site} (${seconds}s)`);
  } else {
    // For non-browser apps, track normally
    const key = appName;
    if (!helperVars.helperVars.activityData[key]) {
      helperVars.helperVars.activityData[key] = {
        app: appName,
        site: site,
        seconds: 0,
        clicks: 0,
        isBrowser: false,
      };
    }
    helperVars.helperVars.activityData[key].seconds += seconds;
    helperVars.helperVars.activityData[key].clicks += clicks;
  }
}

function extractWebsite(title) {
  if (!title) return "-";

  // Remove common browser names from the end
  let cleaned = title
    .replace(
      / - (Google Chrome|Microsoft Edge|Brave Browser|Brave|Firefox|Safari|Opera)$/i,
      "",
    )
    .trim();

  // If the title is empty after cleaning, return original
  if (!cleaned) return title;

  // Split by common separators
  const separators = [" - ", " | ", ": ", " – ", " — "];

  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep);

      // Check last part first (most common pattern: "Page Title - Site Name")
      const lastPart = parts[parts.length - 1].trim();
      if (lastPart.length > 0 && lastPart.length < 40) {
        // Prefer parts that look like site names (short, might contain dots)
        if (
          lastPart.includes(".") ||
          /^[A-Z]/.test(lastPart) ||
          lastPart.length < 20
        ) {
          return lastPart;
        }
      }

      // Check first part (for patterns like "Site: Page Title")
      const firstPart = parts[0].trim();
      if (firstPart.length > 0 && firstPart.length < 40) {
        if (
          firstPart.includes(".") ||
          /^[A-Z]/.test(firstPart) ||
          firstPart.length < 20
        ) {
          return firstPart;
        }
      }
    }
  }

  // If no separator found, just return the cleaned title (truncated)
  return cleaned.length > 40 ? cleaned.substring(0, 40) + "..." : cleaned;
}

module.exports = { aggregateActivity, extractWebsite };