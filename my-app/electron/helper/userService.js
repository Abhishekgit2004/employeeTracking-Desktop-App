


function calculateProductivity(activities) {
  let workSeconds = 0;
  let totalSeconds = 0;

  activities.forEach((act) => {
    totalSeconds += act.seconds;
    const productiveCategories = [
      "Development",
      "Design",
      "Communication",
      "Documentation",
    ];
    if (productiveCategories.includes(act.category)) {
      workSeconds += act.seconds;
    }
  });

  return totalSeconds > 0 ? Math.round((workSeconds / totalSeconds) * 100) : 0;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

module.exports = { calculateProductivity, today };