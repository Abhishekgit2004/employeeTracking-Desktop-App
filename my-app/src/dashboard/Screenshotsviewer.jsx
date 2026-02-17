import React, { useState } from 'react';

const ScreenshotsViewer = ({ session, adminMode = false, onDeleteScreenshot }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFilename, setSelectedFilename] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);

  // Don't render if no screenshots
  if (!session?.screenshots || session.screenshots.length === 0) {
    return null;
  }

  const viewScreenshot = async (filename) => {
    try {
      setLoadingImage(true);
      setImageError(null);
      setSelectedFilename(filename);

      const result = await window.electron.getScreenshotFile(filename);

      if (result.success) {
        setSelectedImage(result.data);
      } else {
        setImageError(result.message || 'Failed to load screenshot');
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Failed to load screenshot:', err);
      setImageError('Failed to load screenshot');
      setSelectedImage(null);
    } finally {
      setLoadingImage(false);
    }
  };

  const closeModal = () => {
    setSelectedImage(null);
    setSelectedFilename(null);
    setImageError(null);
  };

  const handleDelete = (e, filename) => {
    e.stopPropagation();
    if (onDeleteScreenshot) {
      onDeleteScreenshot(filename);
    }
  };
console.log(adminMode,"adminmodel")
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div style={S.container}>
      <h4 style={S.title}>
        📸 Screenshots ({session.screenshots.length})
        {adminMode && (
          <span style={S.adminBadge}>⚙️ Admin Mode</span>
        )}
      </h4>

      {/* Screenshot Grid */}
      <div style={S.grid}>
        {session.screenshots.map((screenshot, i) => (
          <div key={i} style={S.card}>
            {/* Thumbnail / Preview Button */}
            <div
              style={S.thumbnail}
              onClick={() => viewScreenshot(screenshot.filename)}
            >
              <div style={S.thumbnailIcon}>📸</div>
              <div style={S.thumbnailInfo}>
                <div style={S.thumbnailTime}>
                  {formatTime(screenshot.timestamp)}
                </div>
                <div style={S.thumbnailHint}>Click to view</div>
              </div>
            </div>

            {/* Admin Delete Button */}
            {adminMode && (
              <button
                style={S.deleteBtn}
                onClick={(e) => handleDelete(e, screenshot.filename)}
                title="Delete screenshot"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {(selectedImage || loadingImage || imageError) && (
        <div style={S.modalOverlay} onClick={closeModal}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={S.modalHeader}>
              <span style={S.modalTitle}>
                📸 {selectedFilename
                  ? new Date(
                      parseInt(selectedFilename.split('_').pop()?.replace('.png', '') || 0)
                    ).toLocaleString()
                  : 'Screenshot'
                }
              </span>
              <div style={S.modalHeaderActions}>
                {/* Admin delete from modal */}
                {adminMode && selectedFilename && (
                  <button
                    style={S.modalDeleteBtn}
                    onClick={(e) => {
                      handleDelete(e, selectedFilename);
                      closeModal();
                    }}
                  >
                    🗑️ Delete
                  </button>
                )}
                <button style={S.closeBtn} onClick={closeModal}>✕ Close</button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={S.modalContent}>
              {loadingImage && (
                <div style={S.loadingState}>
                  <div style={S.spinner} />
                  <p>Loading screenshot...</p>
                </div>
              )}

              {imageError && !loadingImage && (
                <div style={S.errorState}>
                  <p>❌ {imageError}</p>
                  <small>The screenshot file may not be available on this computer.</small>
                </div>
              )}

              {selectedImage && !loadingImage && (
                <img
                  src={selectedImage}
                  alt="Screenshot"
                  style={S.image}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Styles ─── */
const S = {
  container: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid var(--border)',
  },

  title: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  adminBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    background: 'rgba(124, 58, 237, 0.1)',
    color: '#7c3aed',
    borderRadius: 6,
    border: '1px solid rgba(124, 58, 237, 0.2)',
  },

  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },

  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: 140,
  },

  thumbnail: {
    background: 'var(--input-bg)',
    border: '2px solid var(--border)',
    borderRadius: 8,
    padding: '12px 10px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    ':hover': {
      borderColor: '#4f46e5',
      transform: 'translateY(-2px)',
    }
  },

  thumbnailIcon: {
    fontSize: 28,
  },

  thumbnailInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },

  thumbnailTime: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
  },

  thumbnailHint: {
    fontSize: 10,
    color: 'var(--text-secondary)',
  },

  deleteBtn: {
    width: '100%',
    padding: '6px 0',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 20,
  },

  modal: {
    background: 'var(--surface)',
    borderRadius: 16,
    border: '1px solid var(--border)',
    width: '90vw',
    maxWidth: 1000,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },

  modalTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },

  modalHeaderActions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },

  modalDeleteBtn: {
    padding: '6px 14px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },

  closeBtn: {
    padding: '6px 14px',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },

  modalContent: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },

  image: {
    maxWidth: '100%',
    maxHeight: '75vh',
    borderRadius: 8,
    objectFit: 'contain',
  },

  loadingState: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },

  errorState: {
    textAlign: 'center',
    color: '#ef4444',
    padding: 20,
  },

  spinner: {
    width: 36,
    height: 36,
    border: '3px solid var(--border)',
    borderTopColor: '#4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

export default ScreenshotsViewer;