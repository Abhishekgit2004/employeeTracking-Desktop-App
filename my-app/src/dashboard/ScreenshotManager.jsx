import React, { useState, useEffect } from 'react';
import './ScreenshotManager.css';

export default function ScreenshotManager({ session }) {
  const [screenshots, setScreenshots] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (session) loadScreenshots();
  }, [session]);

  const loadScreenshots = async () => {
    setLoading(true);
    try {
      const result = await window.electron.getAllScreenshots({ 
        sessionId: session._id 
      });
      
      if (result.success) {
        setScreenshots(result.screenshots);
      }
    } catch (err) {
      console.error('Failed to load screenshots:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewScreenshot = async (filename) => {
    const result = await window.electron.getScreenshotFile(filename);
    if (result.success) {
      setViewingImage({ filename, data: result.data });
    }
  };

  const toggleSelect = (filename) => {
    setSelectedFiles(prev => 
      prev.includes(filename)
        ? prev.filter(f => f !== filename)
        : [...prev, filename]
    );
  };

  const selectAll = () => {
    setSelectedFiles(screenshots.map(s => s.filename));
  };

  const deselectAll = () => {
    setSelectedFiles([]);
  };

  const handleExportSelected = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one screenshot');
      return;
    }

    setExporting(true);
    try {
      const result = await window.electron.exportScreenshotsZip({
        filenames: selectedFiles,
        sessionDate: session.date
      });

      if (result.success) {
        alert(`✅ Exported ${selectedFiles.length} screenshots!\n\nFile: ${result.zipFilename}\nSize: ${formatBytes(result.size)}\n\nThe file is ready to share.`);
        
        // Show in folder
        const folderResult = await window.electron.openScreenshotsFolder();
      } else {
        alert('❌ ' + result.message);
      }
    } catch (err) {
      alert('Failed to export: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportDaily = async () => {
    setExporting(true);
    try {
      const result = await window.electron.exportDailyReport();

      if (result.success) {
        const shareChoice = window.confirm(
          `✅ Daily report created!\n\n${result.count} screenshots\nSize: ${formatBytes(result.size)}\n\nWould you like to share via email?`
        );

        if (shareChoice) {
          await window.electron.shareViaEmail({ zipPath: result.zipPath });
        }
      } else {
        alert('❌ ' + result.message);
      }
    } catch (err) {
      alert('Failed to export: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!session) return null;

  return (
    <div className="screenshot-manager">
      {/* Header */}
      <div className="sm-header">
        <h3>📸 My Screenshots ({screenshots.length})</h3>
        <div className="sm-actions">
          <button 
            className="sm-btn sm-btn-secondary"
            onClick={handleExportDaily}
            disabled={exporting}
          >
            {exporting ? '⏳ Exporting...' : '📦 Export Today\'s Report'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="sm-loading">
          <div className="sm-spinner" />
          <p>Loading screenshots...</p>
        </div>
      )}

      {!loading && screenshots.length === 0 && (
        <div className="sm-empty">
          <p>📭 No screenshots captured yet</p>
          <small>Screenshots are captured every 10 minutes during tracking</small>
        </div>
      )}

      {!loading && screenshots.length > 0 && (
        <>
          {/* Selection Controls */}
          <div className="sm-selection-bar">
            <div className="sm-selection-info">
              <span>{selectedFiles.length} selected</span>
            </div>
            <div className="sm-selection-actions">
              <button className="sm-link" onClick={selectAll}>
                Select All
              </button>
              <button className="sm-link" onClick={deselectAll}>
                Deselect All
              </button>
              <button 
                className="sm-btn sm-btn-primary"
                onClick={handleExportSelected}
                disabled={selectedFiles.length === 0 || exporting}
              >
                {exporting ? '⏳ Creating ZIP...' : `📤 Export ${selectedFiles.length} Selected`}
              </button>
            </div>
          </div>

          {/* Screenshot Grid */}
          <div className="sm-grid">
            {screenshots.map((screenshot, i) => {
              const isSelected = selectedFiles.includes(screenshot.filename);
              
              return (
                <div 
                  key={i} 
                  className={`sm-card ${isSelected ? 'selected' : ''}`}
                >
                  {/* Selection Checkbox */}
                  <div className="sm-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(screenshot.filename)}
                      className="sm-checkbox"
                    />
                  </div>

                  {/* Thumbnail */}
                  <div 
                    className="sm-thumbnail"
                    onClick={() => viewScreenshot(screenshot.filename)}
                  >
                    <div className="sm-thumbnail-icon">📸</div>
                    <div className="sm-thumbnail-info">
                      <div className="sm-time">{formatTime(screenshot.timestamp)}</div>
                      <div className="sm-size">{formatBytes(screenshot.size)}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="sm-card-footer">
                    <button 
                      className="sm-btn-small"
                      onClick={() => viewScreenshot(screenshot.filename)}
                    >
                      👁️ View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="sm-modal-overlay" onClick={() => setViewingImage(null)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <span className="sm-modal-title">
                📸 {new Date(
                  parseInt(viewingImage.filename.split('_').pop()?.replace('.png', '') || 0)
                ).toLocaleString()}
              </span>
              <button 
                className="sm-modal-close"
                onClick={() => setViewingImage(null)}
              >
                ✕
              </button>
            </div>
            <div className="sm-modal-content">
              <img 
                src={viewingImage.data} 
                alt="Screenshot" 
                className="sm-modal-image"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}