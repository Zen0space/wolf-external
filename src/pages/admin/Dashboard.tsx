import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { 
  uploadFile, 
  getCategories, 
  getFiles, 
  getTotalDownloadsCount, 
  getSubscribersCount, 
  getCategoriesCount, 
  getFilesCount,
  getRecentActivities,
  type FileInfo 
} from '../../lib/db';
import '../../theme/theme.css';

// Add a constant for Malaysia timezone for consistency
const MALAYSIA_TIMEZONE = '(MYT)'; // Malaysia Time

// Styled Components
const DashboardContainer = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: var(--background-main);
  color: var(--text-primary);
`;

// Sidebar styles
const Sidebar = styled.div`
  width: 260px;
  background-color: #24262f;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;

  @media (max-width: 768px) {
    width: 70px;
    padding: 1rem 0;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1.5rem;
  margin-bottom: 2rem;
`;

const LogoIcon = styled.span`
  font-size: 1.8rem;
`;

const LogoText = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: #4A90E2;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    display: none;
  }
`;

const SidebarMenu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const MenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  text-decoration: none;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  &.active {
    background-color: rgba(0, 216, 122, 0.1);
    color: var(--text-primary);
    border-left-color: var(--accent-color);
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
    justify-content: center;
  }
`;

const MenuIcon = styled.span`
  font-size: 1.2rem;
  width: 24px;
  text-align: center;

  @media (max-width: 768px) {
    margin: 0;
  }
`;

const MenuLabel = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
`;

// Content styles
const Content = styled.div`
  flex: 1;
  padding: 2rem;
  margin-left: 260px;

  @media (max-width: 768px) {
    margin-left: 70px;
    padding: 1.5rem;
  }
`;

const DashboardHeader = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
`;

const UserInfo = styled.div`
  margin-bottom: 1rem;
`;

const UserName = styled.span`
  margin-right: 1rem;
`;

const LogoutButton = styled.button`
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }
`;

// Tabs
const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
`;

const TabButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    color: var(--text-primary);
  }

  &.active {
    color: var(--accent-color);
    border-bottom-color: var(--accent-color);
  }
`;

// Add a loading spinner component
const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--accent-color);
  animation: spin 1s ease-in-out infinite;
  margin-right: 10px;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Stats section
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCardWrapper = styled.div`
  background-color: rgba(36, 42, 56, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatIconWrapper = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`;

const StatContent = styled.div`
  h3 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  p {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
`;

// Section headers
const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
  }
`;

const SecondaryButton = styled.button`
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }
`;

// Tools section
const ToolsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ToolCardWrapper = styled.div`
  background-color: rgba(36, 42, 56, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow);
  }
`;

const ToolHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  h3 {
    font-size: 1.1rem;
    font-weight: 600;
  }
`;

const ToolIcon = styled.span`
  font-size: 1.5rem;
`;

const ToolDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const ToolButton = styled.button`
  background-color: rgba(0, 216, 122, 0.15);
  color: var(--accent-color);
  border: 1px solid rgba(0, 216, 122, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  width: 100%;
  cursor: pointer;

  &:hover {
    background-color: rgba(0, 216, 122, 0.25);
  }
`;

// Activity section
const ActivityList = styled.div`
  background-color: rgba(36, 42, 56, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  gap: 1rem;

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIconWrapper = styled.div`
  font-size: 1.25rem;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: rgba(74, 144, 226, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityText = styled.p`
  font-size: 0.925rem;
  margin-bottom: 0.25rem;
`;

// Add styled component for ISO timestamp tooltip
const TimeTooltip = styled.span`
  position: relative;
  cursor: pointer;
  
  &:hover::after {
    content: attr(data-iso);
    position: absolute;
    bottom: 100%;
    left: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    white-space: nowrap;
    z-index: 10;
    margin-bottom: 5px;
  }
`;

const ActivityTime = styled.p`
  font-size: 0.75rem;
  color: var(--text-secondary);
`;

// Upload section
const UploadContainer = styled.div`
  margin-top: 2rem;
`;

const UploadSection = styled.div`
  background-color: rgba(36, 42, 56, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2.5rem;

  h2 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
  }
`;

const UploadForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  input[type="file"] {
    background-color: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-color);
    padding: 0.75rem;
    border-radius: 6px;
    font-size: 0.9rem;
    color: var(--text-primary);
  }

  select, textarea {
    background-color: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-color);
    padding: 0.75rem;
    border-radius: 6px;
    font-size: 0.9rem;
    color: var(--text-primary);
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  background-color: rgba(0, 216, 122, 0.1);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
`;

const FileName = styled.span`
  font-weight: 600;
`;

const FileSize = styled.span`
  color: var(--text-secondary);
`;

const UploadButton = styled.button`
  background-color: var(--accent-color);
  color: #121212;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 216, 122, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const UploadMessage = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.2);
  text-align: center;
`;

// Recent uploads section
const RecentUploads = styled.div`
  margin-top: 2rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;

  h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: var(--text-secondary);
  }
`;

const RecentFilesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RecentFileItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
`;

const RecentFileName = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
`;

const RecentFileMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const FileCategory = styled.span`
  background-color: rgba(0, 216, 122, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: var(--text-accent);
`;

const RefreshButton = styled.button`
  background-color: #10b981; /* Green color similar to the screenshot */
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #059669;
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const RefreshIcon = styled.span`
  font-size: 1rem;
`;

// Admin Sidebar component
const AdminSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader>
        <LogoIcon>🐺</LogoIcon>
        <LogoText>Wolf Admin</LogoText>
      </SidebarHeader>
      <SidebarMenu>
        <MenuItem to="/admin/dashboard" className="active">
          <MenuIcon>📊</MenuIcon>
          <MenuLabel>Dashboard</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/files">
          <MenuIcon>📁</MenuIcon>
          <MenuLabel>Files</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/categories">
          <MenuIcon>🗂️</MenuIcon>
          <MenuLabel>Categories</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/subscribers">
          <MenuIcon>📧</MenuIcon>
          <MenuLabel>Subscribers</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/stats">
          <MenuIcon>📈</MenuIcon>
          <MenuLabel>Statistics</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/settings">
          <MenuIcon>⚙️</MenuIcon>
          <MenuLabel>Settings</MenuLabel>
        </MenuItem>
      </SidebarMenu>
    </Sidebar>
  );
};

const StatCard = ({ title, value, icon, color, isLoading }: { title: string; value: string; icon: string; color: string; isLoading?: boolean }) => {
  return (
    <StatCardWrapper>
      <StatIconWrapper style={{ backgroundColor: color }}>
        <span>{icon}</span>
      </StatIconWrapper>
      <StatContent>
        <h3>{isLoading ? <><LoadingSpinner /><span>Loading...</span></> : value}</h3>
        <p>{title}</p>
      </StatContent>
    </StatCardWrapper>
  );
};

const ToolCard = ({ title, description, icon }: { title: string; description: string; icon: string }) => {
  return (
    <ToolCardWrapper>
      <ToolHeader>
        <ToolIcon>{icon}</ToolIcon>
        <h3>{title}</h3>
      </ToolHeader>
      <ToolDescription>{description}</ToolDescription>
      <ToolButton>Run Tool</ToolButton>
    </ToolCardWrapper>
  );
};

// File Upload Component
const FileUploadSection = ({ onUploadSuccess }: { onUploadSuccess?: () => void }) => {
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
        
        // Ensure cats matches the schema structure
        setCategories(cats);
        
        // Display files in reverse chronological order (newest first)
        setRecentFiles(files.slice(0, 5)); // Show 5 most recent files
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
      
      // Match the upload data structure with schema.sql fields
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
      
      // Refresh the recent files list
      const updatedFiles = await getFiles();
      setRecentFiles(updatedFiles.slice(0, 5));
      
      // Notify parent component about the successful upload
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
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
    <UploadSection>
      <h2>Upload Script</h2>
      <UploadForm onSubmit={handleSubmit}>
        <FormGroup>
          <label htmlFor="file-upload">Select ZIP File</label>
          <input
            type="file"
            id="file-upload"
            accept=".zip"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <FileInfo>
              <FileName>{file.name}</FileName>
              <FileSize>({formatFileSize(file.size)})</FileSize>
            </FileInfo>
          )}
        </FormGroup>
        
        <FormGroup>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={uploading}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </FormGroup>
        
        <FormGroup>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description for this file"
            disabled={uploading}
          />
        </FormGroup>
        
        <UploadButton
          type="submit"
          disabled={uploading || !file}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </UploadButton>
        
        {message && <UploadMessage>{message}</UploadMessage>}
      </UploadForm>
      
      {recentFiles.length > 0 && (
        <RecentUploads>
          <h3>Recent Uploads</h3>
          <RecentFilesList>
            {recentFiles.map((file) => (
              <RecentFileItem key={file.id}>
                <RecentFileName>{file.fileName}</RecentFileName>
                <RecentFileMeta>
                  <FileCategory>{file.category}</FileCategory>
                  <TimeTooltip data-iso={file.createdAtISO}>
                    <FileSize>{formatFileSize(file.size)} • {file.createdAt} {MALAYSIA_TIMEZONE}</FileSize>
                  </TimeTooltip>
                </RecentFileMeta>
              </RecentFileItem>
            ))}
          </RecentFilesList>
        </RecentUploads>
      )}
    </UploadSection>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [statistics, setStatistics] = useState({
    downloads: 0,
    files: 0,
    subscribers: 0,
    categories: 0
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  
  useEffect(() => {
    // Fetch dashboard statistics from the actual database
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        // Fetch actual stats from the database via API calls
        const [downloadsCount, filesCount, subscribersCount, categoriesCount] = await Promise.all([
          getTotalDownloadsCount(),
          getFilesCount(),
          getSubscribersCount(),
          getCategoriesCount()
        ]);
        
        setStatistics({
          downloads: downloadsCount,
          files: filesCount, 
          subscribers: subscribersCount,
          categories: categoriesCount
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
        // Fallback to default values if the API call fails
        setStatistics({
          downloads: 0,
          files: 0,
          subscribers: 0,
          categories: 4  // We know there are 4 default categories from schema.sql
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch recent activities
    const fetchRecentActivities = async () => {
      try {
        setActivitiesLoading(true);
        const recentActivities = await getRecentActivities(3); // Get 3 most recent activities
        setActivities(recentActivities);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };
    
    fetchStatistics();
    fetchRecentActivities();
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Stats based on schema.sql
  const stats = [
    { title: 'Total Downloads', value: statistics.downloads.toString(), icon: '📊', color: 'rgba(74, 144, 226, 0.2)' },
    { title: 'Uploaded Files', value: statistics.files.toString(), icon: '📁', color: 'rgba(0, 216, 122, 0.2)' },
    { title: 'Email Subscribers', value: statistics.subscribers.toString(), icon: '📧', color: 'rgba(255, 159, 64, 0.2)' },
    { title: 'File Categories', value: statistics.categories.toString(), icon: '🗂️', color: 'rgba(255, 99, 132, 0.2)' }
  ];
  
  // Tools based on schema.sql categories
  const tools = [
    {
      title: 'Windows Activation',
      description: 'Scripts for activating Windows',
      icon: '🔑'
    },
    {
      title: 'Adobe Firewall Block',
      description: 'Scripts for blocking Adobe validation',
      icon: '🔒'
    },
    {
      title: 'System Optimization',
      description: 'Tools for optimizing system performance',
      icon: '⚡'
    },
    {
      title: 'Privacy Tools',
      description: 'Tools for enhancing privacy and security',
      icon: '🛡️'
    }
  ];
  
  // Get appropriate icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return '📥';
      case 'subscriber':
        return '📧';
      case 'download':
        return '📊';
      default:
        return '📝';
    }
  };
  
  // Get appropriate activity text
  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case 'upload':
        return `New file uploaded: ${activity.title}`;
      case 'subscriber':
        return `New subscriber: ${activity.email}`;
      case 'download':
        return `File downloaded: ${activity.title}`;
      default:
        return activity.title;
    }
  };
  
  // Add a refresh function for all dashboard data
  const refreshDashboard = async () => {
    try {
      console.log('Refreshing dashboard data...');
      setLoading(true);
      setActivitiesLoading(true);
      
      // Fetch all data in parallel
      const [downloadsCount, filesCount, subscribersCount, categoriesCount, recentActivities] = await Promise.all([
        getTotalDownloadsCount(),
        getFilesCount(),
        getSubscribersCount(),
        getCategoriesCount(),
        getRecentActivities(3)
      ]);
      
      console.log('Dashboard data refreshed successfully');
      
      // Update states
      setStatistics({
        downloads: downloadsCount,
        files: filesCount,
        subscribers: subscribersCount,
        categories: categoriesCount
      });
      
      setActivities(recentActivities);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setLoading(false);
      setActivitiesLoading(false);
    }
  };
  
  return (
    <DashboardContainer data-theme={theme}>
      <AdminSidebar />
      <Content>
        <DashboardHeader>
          <h1>Welcome back, {user?.username}</h1>
          <UserInfo>
            <UserName>{user?.username}</UserName>
            <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
          </UserInfo>
          
          <TabsContainer>
            <TabButton 
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </TabButton>
            <TabButton 
              className={activeTab === 'uploads' ? 'active' : ''}
              onClick={() => setActiveTab('uploads')}
            >
              File Uploads
            </TabButton>
          </TabsContainer>
        </DashboardHeader>
        
        {activeTab === 'overview' ? (
          <>
            <StatsGrid>
              {stats.map((stat, index) => (
                <StatCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                  isLoading={loading}
                />
              ))}
            </StatsGrid>
            
            <SectionHeader>
              <h2>Script Categories</h2>
              <SecondaryButton>Manage Categories</SecondaryButton>
            </SectionHeader>
            
            <ToolsGrid>
              {tools.map((tool, index) => (
                <ToolCard
                  key={index}
                  title={tool.title}
                  description={tool.description}
                  icon={tool.icon}
                />
              ))}
            </ToolsGrid>
            
            <SectionHeader>
              <h2>Recent Activity</h2>
              <RefreshButton onClick={refreshDashboard}>
                <RefreshIcon>🔄</RefreshIcon>
                {activitiesLoading ? 'Refreshing...' : 'Refresh Now'}
              </RefreshButton>
            </SectionHeader>
            
            <ActivityList>
              {activitiesLoading ? (
                <ActivityItem>
                  <ActivityIconWrapper>
                    <LoadingSpinner />
                  </ActivityIconWrapper>
                  <ActivityContent>
                    <ActivityText>Loading recent activities...</ActivityText>
                  </ActivityContent>
                </ActivityItem>
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <ActivityItem key={activity.id}>
                    <ActivityIconWrapper>{getActivityIcon(activity.type)}</ActivityIconWrapper>
                    <ActivityContent>
                      <ActivityText>{getActivityText(activity)}</ActivityText>
                      <TimeTooltip data-iso={activity.isoTimestamp}>
                        <ActivityTime>{activity.formattedTime} {MALAYSIA_TIMEZONE}</ActivityTime>
                      </TimeTooltip>
                    </ActivityContent>
                  </ActivityItem>
                ))
              ) : (
                <ActivityItem>
                  <ActivityIconWrapper>📝</ActivityIconWrapper>
                  <ActivityContent>
                    <ActivityText>No recent activities found</ActivityText>
                    <ActivityTime>Try adding some files or getting downloads</ActivityTime>
                  </ActivityContent>
                </ActivityItem>
              )}
            </ActivityList>
          </>
        ) : (
          <UploadContainer>
            <FileUploadSection onUploadSuccess={refreshDashboard} />
          </UploadContainer>
        )}
      </Content>
    </DashboardContainer>
  );
};

export default AdminDashboard; 