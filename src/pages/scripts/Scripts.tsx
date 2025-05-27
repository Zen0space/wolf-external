import type { FC, CSSProperties } from 'react';
import { useState, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import '../../theme/theme.css';
import SupportMe from '../../components/SupportMe';
import Navbar from '../../components/Navbar';

import { getFiles, getCategories, getDownloadCount, getFileInfo, saveEmailSubscriber, type FileInfo } from '../../lib/db';

// Define the CategoryInfo interface
interface CategoryInfo {
  id: string;
  name: string;
  description: string;
}

// Modern styled components
const StyledScripts: Record<string, CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '7rem 2rem 2rem',
    minHeight: '100vh',
    backgroundColor: 'var(--background-main)',
    color: 'var(--text-primary)',
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)',
    fontWeight: 800,
  },
  subtitle: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    marginBottom: '2rem',
  },
  filtersContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    maxWidth: '840px',
    margin: '0 auto 2rem',
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
    maxWidth: '500px',
  },
  searchInput: {
    width: '100%',
    padding: '0.8rem 1rem 0.8rem 2.5rem',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'rgba(36, 42, 56, 0.5)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(5px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  searchIcon: {
    position: 'absolute',
    left: '0.8rem',
    top: '50%',
    transform: 'translateY(-50%)',
    opacity: 0.6,
  },
  categoryFilter: {
    width: '250px',
  },
  categorySelect: {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'rgba(36, 42, 56, 0.5)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1em',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(5px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  scriptsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  loadingSpinner: {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--text-secondary)',
  },
  noScripts: {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--text-secondary)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--background-paper)',
    borderRadius: '12px',
    padding: '2rem',
    width: '90%',
    maxWidth: '500px',
    position: 'relative',
    boxShadow: 'var(--shadow)',
    animation: 'fadeIn 0.3s ease',
  },
  modalClose: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: '1rem',
    color: 'var(--text-primary)',
    fontSize: '1.5rem',
  },
  modalText: {
    color: 'var(--text-secondary)',
    marginBottom: '1.5rem',
  },
  emailInput: {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'rgba(36, 42, 56, 0.5)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    marginBottom: '1rem',
    transition: 'all 0.2s ease',
  },
  downloadButton: {
    width: '100%',
    backgroundColor: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    border: '2px solid var(--btn-primary-bg)',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginLeft: 'auto',
    boxSizing: 'border-box',
  },
  privacyNote: {
    fontSize: '0.8rem',
    textAlign: 'center',
    marginTop: '1rem',
    color: 'var(--text-secondary)',
  },
  successNotification: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    backgroundColor: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    animation: 'slideIn 0.3s ease-out',
    zIndex: 1000,
    maxWidth: '400px',
  },
  notificationIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  notificationMessage: {
    flex: 1,
    margin: 0,
    lineHeight: 1.4,
  },
  notificationClose: {
    background: 'none',
    border: 'none',
    color: 'var(--btn-primary-text)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0.2rem',
    marginLeft: 'auto',
    opacity: 0.8,
    transition: 'opacity 0.2s',
  },
};

// Script card styled components
const ScriptCardStyles: Record<string, CSSProperties> = {
  card: {
    backgroundColor: 'rgba(36, 42, 56, 0.5)',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    padding: '1.5rem',
    transition: 'transform 0.2s, box-shadow 0.2s',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(5px)',
    border: '1px solid var(--border-color)',
  },
  cardHover: {
    transform: 'translateY(-5px)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  cardIcon: {
    fontSize: '1.5rem',
    marginRight: '0.5rem',
  },
  categoryTag: {
    fontSize: '0.8rem',
    backgroundColor: 'rgba(0, 216, 122, 0.2)',
    color: 'var(--btn-primary-bg)',
    padding: '0.3rem 0.6rem',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
  cardTitle: {
    fontSize: '1.2rem',
    margin: '0 0 0.8rem 0',
    color: 'var(--text-primary)',
    fontWeight: 600,
    textAlign: 'left',
  },
  cardDescription: {
    flex: 1,
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    marginBottom: '1.5rem',
    lineHeight: 1.5,
    textAlign: 'left',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  cardInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cardSize: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginRight: '1rem',
  },
  cardDownloads: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginRight: '1rem',
  },
  downloadIcon: {
    fontSize: '0.9rem',
  },
  actionsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  downloadButton: {
    backgroundColor: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    border: '2px solid var(--btn-primary-bg)',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginLeft: 'auto',
    boxSizing: 'border-box',
  },
  downloadButtonHover: {
    backgroundColor: 'transparent',
    border: '2px solid var(--btn-primary-bg)',
    color: 'var(--btn-primary-bg)',
  },
};

// Script Card Component with inline styling
const ScriptCard: FC<{ file: FileInfo; downloadCount: number; onDownload: () => void }> = ({ 
  file, downloadCount, onDownload 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  return (
    <div 
      style={{
        ...ScriptCardStyles.card,
        ...(isHovered ? ScriptCardStyles.cardHover : {})
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top row with icon and category */}
      <div style={ScriptCardStyles.cardTopRow}>
        <span style={ScriptCardStyles.cardIcon}>📦</span>
        <span style={ScriptCardStyles.categoryTag}>{file.category}</span>
      </div>
      
      {/* Title row */}
      <h3 style={ScriptCardStyles.cardTitle}>{file.fileName}</h3>
      
      {/* Description */}
      <p style={ScriptCardStyles.cardDescription}>{file.description || 'No description available'}</p>
      
      {/* Footer with size, downloads, and button */}
      <div style={ScriptCardStyles.actionsContainer}>
        <div style={ScriptCardStyles.cardInfo}>
          <span style={ScriptCardStyles.cardDownloads}>
            <span style={ScriptCardStyles.downloadIcon}>⬇️</span>
            {downloadCount} downloads
          </span>
          <span style={ScriptCardStyles.cardSize}>{formatFileSize(file.size)}</span>
        </div>
        <button 
          style={{
            ...ScriptCardStyles.downloadButton,
            ...(isButtonHovered ? ScriptCardStyles.downloadButtonHover : {})
          }}
          onClick={onDownload}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
        >
          Download
        </button>
      </div>
    </div>
  );
};

const Scripts: FC = () => {
  const { theme } = useTheme();
  const [scripts, setScripts] = useState<FileInfo[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [showSuccessNotification, setShowSuccessNotification] = useState<boolean>(false);
  const [downloadedFileName, setDownloadedFileName] = useState<string>('');

  // Fetch scripts and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [fetchedFiles, fetchedCategories] = await Promise.all([
          getFiles(),
          getCategories()
        ]);
        
        setScripts(fetchedFiles);
        setCategories(fetchedCategories.map(cat => ({
          id: cat.id as string,
          name: cat.name as string,
          description: cat.description as string
        })));
        
        // Fetch download counts for each file
        const counts: Record<string, number> = {};
        for (const file of fetchedFiles) {
          counts[file.id] = await getDownloadCount(file.id);
        }
        setDownloadCounts(counts);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching scripts:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter scripts based on category and search query
  const filteredScripts = scripts.filter(script => {
    const matchesCategory = selectedCategory === 'all' || script.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      script.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (script.description && script.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleDownload = (fileId: string) => {
    setSelectedFileId(fileId);
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !selectedFileId) return;
    
    try {
      // Show loading state
      setLoading(true);
      
      // Save the email subscriber to the database
      await saveEmailSubscriber(email, selectedFileId);
      
      // Get basic file info (without content) to display name in success message
      const fileInfo = await getFileInfo(selectedFileId);
      
      if (fileInfo) {
        // Always use the client-side download handler for all environments
        const { handleFileDownload } = await import('../../lib/db/dev-download');
        await handleFileDownload(selectedFileId);
        console.log(`Download initiated for file ID: ${selectedFileId}`);
        
        // Close the modal and reset state
        setShowEmailModal(false);
        setEmail('');
        setSelectedFileId(null);
        
        // Update download count in UI
        setDownloadCounts(prev => ({
          ...prev,
          [selectedFileId]: (prev[selectedFileId] || 0) + 1
        }));
        
        // Show success notification
        setDownloadedFileName(fileInfo.fileName);
        setShowSuccessNotification(true);
        
        // Hide notification after 5 seconds
        setTimeout(() => {
          setShowSuccessNotification(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error processing download:', error);
      
      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('extremely large')) {
          // For extremely large files, show a more helpful message
          alert(`${error.message}

Please contact support for alternative download options.`);
        } else if (error.message.includes('too large')) {
          // For files that are large but not extremely large
          alert('This file is too large to download directly through the browser. Please try again later or contact support for assistance.');
        } else {
          // For other errors
          alert(`There was an error downloading the file: ${error.message}

Please try again or contact support if the problem persists.`);
        }
      } else {
        // Generic error message as fallback
        alert('There was an error downloading the file. Please try again or contact support.');
      }
      
      // Close the modal after error
      setShowEmailModal(false);
      setEmail('');
      setSelectedFileId(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle the download button click from navbar
  const handleNavbarDownload = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    // Focus on the search input after a short delay
    setTimeout(() => {
      const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    }, 500);
  };

  return (
    <div style={StyledScripts.container} data-theme={theme}>
      <Navbar onDownloadClick={handleNavbarDownload} />
      
      <div style={StyledScripts.header}>
        <h1 style={StyledScripts.title}>Available Scripts</h1>
        <p style={StyledScripts.subtitle}>Download useful scripts and tools for your system</p>
        
        <div style={StyledScripts.filtersContainer}>
          <div style={StyledScripts.searchContainer}>
            <input
              type="text"
              placeholder="Search scripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={StyledScripts.searchInput}
            />
            <span style={StyledScripts.searchIcon}>🔍</span>
          </div>
          
          <div style={StyledScripts.categoryFilter}>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={StyledScripts.categorySelect}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div>
        {loading ? (
          <div style={StyledScripts.loadingSpinner}>Loading scripts...</div>
        ) : filteredScripts.length > 0 ? (
          <div style={StyledScripts.scriptsGrid}>
            {filteredScripts.map(script => (
              <ScriptCard
                key={script.id}
                file={script}
                downloadCount={downloadCounts[script.id] || 0}
                onDownload={() => handleDownload(script.id)}
              />
            ))}
          </div>
        ) : (
          <div style={StyledScripts.noScripts}>
            <p>No scripts found matching your criteria.</p>
          </div>
        )}
      </div>
      
      {/* Email Modal */}
      {showEmailModal && (
        <div style={StyledScripts.modalOverlay}>
          <div style={StyledScripts.modal}>
            <button 
              style={StyledScripts.modalClose} 
              onClick={() => setShowEmailModal(false)}
            >
              ×
            </button>
            <h2 style={StyledScripts.modalTitle}>Subscribe to Download</h2>
            <p style={StyledScripts.modalText}>Enter your email to download this script and receive updates about new tools.</p>
            
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={StyledScripts.emailInput}
                disabled={loading}
              />
              <button 
                type="submit" 
                style={StyledScripts.downloadButton}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Download Now'}
              </button>
            </form>
            
            <p style={StyledScripts.privacyNote}>We respect your privacy and will never share your email.</p>
          </div>
        </div>
      )}
      
      {/* Success Notification */}
      {showSuccessNotification && (
        <div style={StyledScripts.successNotification}>
          <div style={StyledScripts.notificationIcon}>✅</div>
          <div style={StyledScripts.notificationMessage}>
            <p><strong>{downloadedFileName}</strong> has been downloaded successfully!</p>
          </div>
          <button 
            style={StyledScripts.notificationClose}
            onClick={() => setShowSuccessNotification(false)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Use the SupportMe component instead of the inline button */}
      <SupportMe />
    </div>
  );
};

export default Scripts; 