import React, { useState } from 'react';

/**
 * ActivityCard - Shows app usage with expandable website breakdown for browsers
 */
const ActivityCard = ({ activity, totalSeconds }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDuration = (seconds) => {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const getAppIcon = (appName) => {
    const name = appName.toLowerCase();
    if (name.includes('chrome') || name.includes('edge') || name.includes('firefox') || name.includes('brave')) return '🌐';
    if (name.includes('code') || name.includes('visual studio')) return '💻';
    if (name.includes('slack')) return '💬';
    if (name.includes('excel')) return '📊';
    if (name.includes('word')) return '📝';
    if (name.includes('outlook')) return '📧';
    if (name.includes('teams')) return '👥';
    if (name.includes('zoom')) return '📹';
    if (name.includes('terminal')) return '⌨️';
    return '📱';
  };

  const hasWebsites = activity.isBrowser && activity.websites && activity.websites.length > 0;

  return (
    <div className="app-card">
      <div 
        className="app-header"
        onClick={() => hasWebsites && setIsExpanded(!isExpanded)}
        style={{ cursor: hasWebsites ? 'pointer' : 'default' }}
      >
        <span className="app-icon">{getAppIcon(activity.app)}</span>
        <h3>
          {activity.app}
          {hasWebsites && (
            <span style={{ marginLeft: '8px', fontSize: '0.875rem', color: '#a1a1aa' }}>
              ({activity.websites.length} sites)
            </span>
          )}
        </h3>
        {hasWebsites && (
          <span className="expand-icon" style={{ marginLeft: 'auto' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
      </div>

      <div className="app-stats">
        <p className="app-duration">{formatDuration(activity.seconds)}</p>
        <p className="app-category">{activity.category}</p>
        {activity.clicks > 0 && (
          <p className="app-clicks">🖱️ {activity.clicks} clicks</p>
        )}
        {!hasWebsites && activity.site && activity.site !== '-' && (
          <p className="app-site">🌐 {activity.site}</p>
        )}
      </div>

      <div className="app-progress-bar">
        <div
          className="app-progress-fill"
          style={{
            width: `${Math.min(100, (activity.seconds / totalSeconds) * 100)}%`,
          }}
        ></div>
      </div>

      {/* Expandable websites list */}
      {hasWebsites && isExpanded && (
        <div className="websites-list">
          <div className="websites-header">Websites visited:</div>
          {activity.websites
            .sort((a, b) => b.seconds - a.seconds)
            .map((website, idx) => (
              <div key={idx} className="website-item">
                <span className="website-icon">🔗</span>
                <div className="website-info">
                  <span className="website-name">{website.site}</span>
                  <span className="website-time">{formatDuration(website.seconds)}</span>
                </div>
                <span className="website-category">{website.category}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ActivityCard;