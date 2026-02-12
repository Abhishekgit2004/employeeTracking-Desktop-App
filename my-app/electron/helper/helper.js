/**
 * Categorize app activity based on app name, site, and usage time
 */
function categorize(appName, site, seconds) {
  const app = appName.toLowerCase();
  const url = site.toLowerCase();

  // Development tools
  if (
    app.includes('code') ||
    app.includes('visual studio') ||
    app.includes('sublime') ||
    app.includes('atom') ||
    app.includes('webstorm') ||
    app.includes('pycharm') ||
    app.includes('intellij') ||
    app.includes('eclipse') ||
    app.includes('terminal') ||
    app.includes('cmd') ||
    app.includes('powershell') ||
    app.includes('git') ||
    url.includes('github') ||
    url.includes('gitlab') ||
    url.includes('stackoverflow') ||
    url.includes('codepen')
  ) {
    return { category: 'Development', productive: true };
  }

  // Design tools
  if (
    app.includes('figma') ||
    app.includes('photoshop') ||
    app.includes('illustrator') ||
    app.includes('sketch') ||
    app.includes('canva') ||
    app.includes('xd') ||
    app.includes('blender')
  ) {
    return { category: 'Design', productive: true };
  }

  // Communication
  if (
    app.includes('slack') ||
    app.includes('teams') ||
    app.includes('zoom') ||
    app.includes('discord') ||
    app.includes('skype') ||
    app.includes('outlook') ||
    app.includes('gmail') ||
    app.includes('mail') ||
    url.includes('mail.google') ||
    url.includes('outlook')
  ) {
    return { category: 'Communication', productive: true };
  }

  // Documentation
  if (
    app.includes('word') ||
    app.includes('docs') ||
    app.includes('notion') ||
    app.includes('evernote') ||
    app.includes('onenote') ||
    app.includes('confluence') ||
    url.includes('docs.google') ||
    url.includes('notion')
  ) {
    return { category: 'Documentation', productive: true };
  }

  // Data & Analytics
  if (
    app.includes('excel') ||
    app.includes('sheets') ||
    app.includes('powerpoint') ||
    app.includes('slides') ||
    app.includes('tableau') ||
    url.includes('sheets.google') ||
    url.includes('slides.google')
  ) {
    return { category: 'Data & Analytics', productive: true };
  }

  // Project Management
  if (
    url.includes('jira') ||
    url.includes('trello') ||
    url.includes('asana') ||
    url.includes('monday') ||
    url.includes('clickup') ||
    url.includes('basecamp')
  ) {
    return { category: 'Project Management', productive: true };
  }

  // Learning & Research
  if (
    url.includes('udemy') ||
    url.includes('coursera') ||
    url.includes('linkedin.com/learning') ||
    url.includes('pluralsight') ||
    url.includes('youtube') && seconds > 600 || // Long YouTube sessions might be learning
    url.includes('wikipedia') ||
    url.includes('medium.com') ||
    url.includes('dev.to')
  ) {
    return { category: 'Learning', productive: true };
  }

  // Social Media (unproductive)
  if (
    url.includes('facebook') ||
    url.includes('instagram') ||
    url.includes('twitter') ||
    url.includes('tiktok') ||
    url.includes('reddit') ||
    url.includes('pinterest') ||
    url.includes('snapchat')
  ) {
    return { category: 'Social Media', productive: false };
  }

  // Entertainment (unproductive)
  if (
    url.includes('netflix') ||
    url.includes('hulu') ||
    url.includes('prime video') ||
    url.includes('disney') ||
    url.includes('twitch') ||
    url.includes('spotify') && seconds > 300 // Background music is OK, but long sessions
  ) {
    return { category: 'Entertainment', productive: false };
  }

  // Shopping (unproductive)
  if (
    url.includes('amazon') ||
    url.includes('ebay') ||
    url.includes('shop') ||
    url.includes('cart') ||
    url.includes('checkout')
  ) {
    return { category: 'Shopping', productive: false };
  }

  // Browser (neutral - could be anything)
  if (
    app.includes('chrome') ||
    app.includes('firefox') ||
    app.includes('edge') ||
    app.includes('safari') ||
    app.includes('brave')
  ) {
    return { category: 'Web Browsing', productive: null };
  }

  // Default - uncategorized
  return { category: 'Uncategorized', productive: null };
}

module.exports = categorize;