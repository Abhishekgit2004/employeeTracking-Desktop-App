import React, { useState, useEffect } from 'react';
import './ScreenshotsViewer.css';

const ScreenshotsViewer = ({ session }) => {
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [screenshotImages, setScreenshotImages] = useState({});

  useEffect(() => {
    if (session && session._id) {
      fetchScreenshots();
    }
  }, [session]);

  const fetchScreenshots = async () => {
    try {
      setLoading(true);
      const result = await window.electron.getScreenshots({ sessionId: session._id });
      
      if (result.success) {
        setScreenshots(result.screenshots || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching screenshots:', err);
      setLoading(false);
    }
  };

  const loadScreenshot = async (screenshot) => {
    if (screenshotImages[screenshot.filename]) {
      // Already loaded
      setSelectedScreenshot({
        ...screenshot,
        data: screenshotImages[screenshot.filename]
      });
      return;
    }

    try {
      const result = await window.electron.getScreenshotFile({ filepath: screenshot.filepath });
      
      if (result.success) {
        setScreenshotImages(prev => ({
          ...prev,
          [screenshot.filename]: result.data
        }));
        setSelectedScreenshot({
          ...screenshot,
          data: result.data
        });
      }
    } catch (err) {
      console.error('Error loading screenshot:', err);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="screenshots-loading">
        <div className="spinner-small"></div>
        <p>Loading screenshots...</p>
      </div>
    );
  }

  if (screenshots.length === 0) {
    return (
      <div className="screenshots-empty">
        <p>📸 No screenshots available for this session</p>
      </div>
    );
  }

  return (
    <div className="screenshots-viewer">
      <div className="screenshots-header">
        <h4>📸 Screenshots ({screenshots.length})</h4>
        <p className="screenshots-info">Captured every 10 minutes during tracking</p>
      </div>

      <div className="screenshots-grid">
        {screenshots.map((screenshot, idx) => (
          <div 
            key={idx} 
            className="screenshot-thumbnail"
            onClick={() => loadScreenshot(screenshot)}
          >
            <div className="screenshot-placeholder">
              <span className="screenshot-icon">📸</span>
              <span className="screenshot-number">#{idx + 1}</span>
            </div>
            <div className="screenshot-time">
              {formatTime(screenshot.timestamp)}
            </div>
          </div>
        ))}
      </div>

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <div className="screenshot-modal" onClick={() => setSelectedScreenshot(null)}>
          <div className="screenshot-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="screenshot-modal-header">
              <div>
                <h3>Screenshot</h3>
                <p>{formatDateTime(selectedScreenshot.timestamp)}</p>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setSelectedScreenshot(null)}
              >
                ✕
              </button>
            </div>
            <div className="screenshot-modal-body">
              {selectedScreenshot.data ? (
                <img 
                  src={selectedScreenshot.data} 
                  alt="Screenshot"
                  className="screenshot-image"
                />
              ) : (
                <div className="screenshot-loading-modal">
                  <div className="spinner-small"></div>
                  <p>Loading screenshot...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenshotsViewer;