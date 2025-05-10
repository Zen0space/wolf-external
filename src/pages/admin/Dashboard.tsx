import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { uploadFile, getCategories, getFiles, type FileInfo } from '../../lib/db';
import '../../theme/theme.css';
import '../Dashboard.css';

// Admin Sidebar component
const AdminSidebar = () => {
  return (
    <div className="dashboard-sidebar">
      <div className="sidebar-header">
        <span className="logo-icon">🐺</span>
        <span className="logo-text">Wolf Admin</span>
      </div>
      <div className="sidebar-menu">
        <Link to="/admin/dashboard" className="menu-item active">
          <span className="menu-icon">📊</span>
          <span>Overview</span>
        </Link>
        <Link to="/admin/files" className="menu-item">
          <span className="menu-icon">🔑</span>
          <span>Windows Tools</span>
        </Link>
        <Link to="/admin/categories" className="menu-item">
          <span className="menu-icon">🔒</span>
          <span>Adobe Tools</span>
        </Link>
        <Link to="/admin/users" className="menu-item">
          <span className="menu-icon">⚡</span>
          <span>System Tools</span>
        </Link>
        <Link to="/admin/settings" className="menu-item">
          <span className="menu-icon">⚙️</span>
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <span>{icon}</span>
      </div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );
};

const ToolCard = ({ title, description, icon }: { title: string; description: string; icon: string }) => {
  return (
    <div className="tool-card">
      <div className="tool-header">
        <span className="tool-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <p>{description}</p>
      <button className="btn-tool">Run Tool</button>
    </div>
  );
};

// File Upload Component
const FileUploadSection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('windows-activation');
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileInfo[]>([]);
  
  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };
  
  // Fetch categories and recent files on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, files] = await Promise.all([
          getCategories(),
          getFiles()
        ]);
        setCategories(cats);
        setRecentFiles(files.slice(0, 3)); // Show only 3 most recent files
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setMessage('Please select a file to upload');
      return;
    }
    
    if (!file.name.endsWith('.zip')) {
      setMessage('Only ZIP files are allowed');
      return;
    }
    
    try {
      setUploading(true);
      setMessage('Uploading file...');
      
      // Read the file as ArrayBuffer
      const buffer = await file.arrayBuffer();
      
      await uploadFile({
        fileName: file.name,
        fileType: file.type,
        description,
        category,
        size: file.size,
        content: buffer
      });
      
      setMessage('File uploaded successfully!');
      setFile(null);
      setDescription('');
      
      // Clear the file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="upload-section">
      <h2>Upload Script</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="file-upload">Select ZIP File</label>
          <input
            type="file"
            id="file-upload"
            accept=".zip"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">({formatFileSize(file.size)})</span>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={uploading}
          >
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description for this file"
            disabled={uploading}
          />
        </div>
        
        <button
          type="submit"
          className="btn-upload"
          disabled={uploading || !file}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
        
        {message && <div className="upload-message">{message}</div>}
      </form>
      
      {recentFiles.length > 0 && (
        <div className="recent-uploads">
          <h3>Recent Uploads</h3>
          <div className="recent-files-list">
            {recentFiles.map((file) => (
              <div key={file.id} className="recent-file-item">
                <div className="recent-file-name">{file.fileName}</div>
                <div className="recent-file-meta">
                  <span className="file-category">{file.category}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Stats
  const stats = [
    { title: 'Scripts Run', value: '86', icon: '🚀', color: 'rgba(74, 144, 226, 0.2)' },
    { title: 'Tools Used', value: '12', icon: '🔧', color: 'rgba(0, 216, 122, 0.2)' },
    { title: 'Windows Activations', value: '31', icon: '🔑', color: 'rgba(255, 159, 64, 0.2)' },
    { title: 'Adobe Blocks', value: '24', icon: '🔒', color: 'rgba(255, 99, 132, 0.2)' }
  ];
  
  // Tools
  const tools = [
    {
      title: 'Windows Activation',
      description: 'Activate Windows 10/11 with digital license',
      icon: '🔑'
    },
    {
      title: 'Adobe Firewall Block',
      description: 'Block Adobe validation servers in Windows Firewall',
      icon: '🔒'
    },
    {
      title: 'System Optimizer',
      description: 'Clean and optimize your system performance',
      icon: '⚡'
    },
    {
      title: 'Privacy Guard',
      description: 'Block telemetry and enhance privacy settings',
      icon: '🛡️'
    }
  ];
  
  return (
    <div className="dashboard-container" data-theme={theme}>
      <AdminSidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.username}</h1>
          <div className="admin-user-info">
            <span className="admin-user-name">{user?.username}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
          
          <div className="dashboard-tabs">
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'uploads' ? 'active' : ''}`}
              onClick={() => setActiveTab('uploads')}
            >
              File Uploads
            </button>
          </div>
        </div>
        
        {activeTab === 'overview' ? (
          <>
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <StatCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                />
              ))}
            </div>
            
            <div className="section-header">
              <h2>Quick Access Tools</h2>
              <button className="btn-secondary">View All</button>
            </div>
            
            <div className="tools-grid">
              {tools.map((tool, index) => (
                <ToolCard
                  key={index}
                  title={tool.title}
                  description={tool.description}
                  icon={tool.icon}
                />
              ))}
            </div>
            
            <div className="section-header">
              <h2>Recent Activity</h2>
              <button className="btn-secondary">View All</button>
            </div>
            
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">🔑</div>
                <div className="activity-content">
                  <p className="activity-text">Windows 11 Activation completed successfully</p>
                  <p className="activity-time">Today, 10:23 AM</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🔒</div>
                <div className="activity-content">
                  <p className="activity-text">Adobe Firewall Block Rules updated</p>
                  <p className="activity-time">Yesterday, 3:45 PM</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">⚡</div>
                <div className="activity-content">
                  <p className="activity-text">System Optimization completed</p>
                  <p className="activity-time">Jan 28, 2024, 9:15 AM</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="upload-container">
            <FileUploadSection />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 