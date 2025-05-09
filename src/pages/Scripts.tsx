import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';
import '../theme/theme.css';
import './Scripts.css';
import { getFiles, getCategories, getDownloadCount, type FileInfo } from '../lib/db';

interface CategoryInfo {
  id: string;
  name: string;
  description: string;
}

const ScriptCard: FC<{ file: FileInfo; downloadCount: number; onDownload: () => void }> = ({ 
  file, downloadCount, onDownload 
}) => {
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
    <div className="script-card">
      <div className="script-card-header">
        <div className="script-card-title">
          <span className="script-icon">📦</span>
          <h3>{file.fileName}</h3>
        </div>
        <span className="script-category">{file.category}</span>
      </div>
      
      <p className="script-description">{file.description || 'No description available'}</p>
      
      <div className="script-card-footer">
        <div className="script-info">
          <span className="script-size">{formatFileSize(file.size)}</span>
          <span className="script-downloads">
            <span className="download-icon">⬇️</span>
            {downloadCount} downloads
          </span>
        </div>
        <button className="btn-download" onClick={onDownload}>Download</button>
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
      // Here you would typically handle the email submission and download
      // For now, let's just simulate a download
      const fileToDownload = scripts.find(script => script.id === selectedFileId);
      if (fileToDownload) {
        // In a real app, you'd trigger the actual file download here
        // and save the email to your database
        console.log(`Downloading ${fileToDownload.fileName} for email: ${email}`);
        
        // Close the modal and reset state
        setShowEmailModal(false);
        setEmail('');
        setSelectedFileId(null);
        
        // Update download count in UI
        setDownloadCounts(prev => ({
          ...prev,
          [selectedFileId]: (prev[selectedFileId] || 0) + 1
        }));
      }
    } catch (error) {
      console.error('Error processing download:', error);
    }
  };

  return (
    <div className="scripts-container" data-theme={theme}>
      <div className="scripts-header">
        <h1>Available Scripts</h1>
        <p className="scripts-subtitle">Download useful scripts and tools for your system</p>
        
        <div className="scripts-filters">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search scripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="category-filter">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="scripts-content">
        {loading ? (
          <div className="loading-spinner">Loading scripts...</div>
        ) : filteredScripts.length > 0 ? (
          <div className="scripts-grid">
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
          <div className="no-scripts">
            <p>No scripts found matching your criteria.</p>
          </div>
        )}
      </div>
      
      {/* Email Modal */}
      {showEmailModal && (
        <div className="email-modal-overlay">
          <div className="email-modal">
            <button className="modal-close" onClick={() => setShowEmailModal(false)}>×</button>
            <h2>Subscribe to Download</h2>
            <p>Enter your email to download this script and receive updates about new tools.</p>
            
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="email-input"
              />
              <button type="submit" className="btn-primary">Download Now</button>
            </form>
            
            <p className="privacy-note">We respect your privacy and will never share your email.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scripts; 