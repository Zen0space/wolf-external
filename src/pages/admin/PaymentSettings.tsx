import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { getPaymentSettings, savePaymentSetting, deletePaymentSetting } from '../../lib/db';
import type { PaymentSetting } from '../../lib/db';
import '../../theme/theme.css';

// Styled Components
const PageContainer = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: var(--background-main);
  color: var(--text-primary);
`;

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

const Content = styled.div`
  flex: 1;
  padding: 2rem;
  margin-left: 260px;
  max-width: 1200px;
  margin: 0 auto 0 260px;

  @media (max-width: 768px) {
    margin-left: 70px;
    padding: 1.5rem;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, var(--accent-color), #4A90E2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    color: var(--text-secondary);
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }
`;

const Card = styled.div`
  background-color: rgba(36, 42, 56, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0;
    color: #fff;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 1rem;
`;

const TableHead = styled.thead`
  background-color: rgba(0, 0, 0, 0.2);
  
  th {
    text-align: left;
    padding: 1.2rem 1rem;
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--border-color);
    
    &:first-child {
      border-top-left-radius: 10px;
    }
    
    &:last-child {
      border-top-right-radius: 10px;
    }
  }
`;

const TableBody = styled.tbody`
  tr {
    transition: background-color 0.2s ease;
    
    &:last-child td {
      border-bottom: none;
    }
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
  
  td {
    padding: 1.2rem 1rem;
    vertical-align: middle;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 0.95rem;
  }
`;

const Button = styled.button`
  background-color: var(--accent-color);
  color: #121212;
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 216, 122, 0.3);
  }
  
  &:disabled {
    background-color: #3a3f4b;
    cursor: not-allowed;
    transform: none;
  }
`;

const DeleteButton = styled(Button)`
  background-color: #e53935;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(229, 57, 53, 0.3);
  }
`;

const EditButton = styled(Button)`
  background-color: #4A90E2;
  margin-right: 0.5rem;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(74, 144, 226, 0.3);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  padding: 30px 20px;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background-color: var(--background-paper);
  border-radius: 16px;
  padding: 2.5rem;
  width: 90%;
  max-width: 600px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  animation: fadeIn 0.3s ease;
  margin: auto;
  max-height: 85vh;
  overflow-y: auto;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
  
  h2 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: white;
    text-align: center;
    position: sticky;
    top: 0;
    background-color: var(--background-paper);
    padding: 0.5rem 0;
    z-index: 1;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.2s;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:hover {
    color: var(--text-primary);
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const FormRow = styled.div`
  margin-bottom: 1.8rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.7rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(0, 216, 122, 0.2);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(0, 216, 122, 0.2);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 1rem;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(0, 216, 122, 0.2);
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  
  input {
    width: 20px;
    height: 20px;
    accent-color: var(--accent-color);
    cursor: pointer;
  }
  
  span {
    font-size: 1rem;
  }
`;

const IconPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.8rem;
  font-size: 2rem;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 8px;
  justify-content: center;
`;

const QRPreview = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  
  img {
    max-width: 200px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const FileUploadContainer = styled.div`
  position: relative;
  width: 100%;
  height: 120px;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  
  &:hover {
    border-color: var(--accent-color);
    background-color: rgba(0, 216, 122, 0.05);
  }
  
  input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  
  .upload-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: var(--accent-color);
  }
  
  .upload-text {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2.5rem;
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  
  &:hover {
    color: var(--text-primary);
    background-color: rgba(255, 255, 255, 0.05);
    box-shadow: none;
  }
`;

const SaveButton = styled(Button)`
  min-width: 120px;
`;

const StatusBadge = styled.span<{ $isActive: boolean }>`
  display: inline-flex;
  padding: 0.4rem 1rem;
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 500;
  background-color: ${props => props.$isActive ? 'rgba(0, 216, 122, 0.15)' : 'rgba(229, 57, 53, 0.15)'};
  color: ${props => props.$isActive ? 'var(--accent-color)' : '#e53935'};
`;

// Admin Sidebar component
const AdminSidebar = ({ active }: { active: string }) => {
  return (
    <Sidebar>
      <SidebarHeader>
        <LogoIcon>🐺</LogoIcon>
        <LogoText>Wolf Admin</LogoText>
      </SidebarHeader>
      <SidebarMenu>
        <MenuItem to="/admin/dashboard" className={active === 'dashboard' ? 'active' : ''}>
          <MenuIcon>📊</MenuIcon>
          <MenuLabel>Dashboard</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/files" className={active === 'files' ? 'active' : ''}>
          <MenuIcon>📁</MenuIcon>
          <MenuLabel>Files</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/categories" className={active === 'categories' ? 'active' : ''}>
          <MenuIcon>🗂️</MenuIcon>
          <MenuLabel>Categories</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/subscribers" className={active === 'subscribers' ? 'active' : ''}>
          <MenuIcon>📧</MenuIcon>
          <MenuLabel>Subscribers</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/payment-settings" className={active === 'payment-settings' ? 'active' : ''}>
          <MenuIcon>💰</MenuIcon>
          <MenuLabel>Payment Settings</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/stats" className={active === 'stats' ? 'active' : ''}>
          <MenuIcon>📈</MenuIcon>
          <MenuLabel>Statistics</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/settings" className={active === 'settings' ? 'active' : ''}>
          <MenuIcon>⚙️</MenuIcon>
          <MenuLabel>Settings</MenuLabel>
        </MenuItem>
      </SidebarMenu>
    </Sidebar>
  );
};

const PaymentSettings = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSetting, setCurrentSetting] = useState<PaymentSetting | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [qrImagePreview, setQrImagePreview] = useState<string>('');
  
  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, navigate]);
  
  // Fetch payment settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsInitialLoading(true);
        const settings = await getPaymentSettings();
        setPaymentSettings(settings);
        setError(null);
      } catch (err) {
        console.error('Error fetching payment settings:', err);
        setError('Failed to load payment settings. Please try again.');
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Handle QR image upload
  const handleQrImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Only accept image files (jpg, png)
      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        alert('Please select a valid image file (JPG or PNG)');
        return;
      }
      
      setQrImage(file);
      
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setQrImagePreview(previewUrl);
      
      // Update the current setting with the preview URL
      if (currentSetting) {
        setCurrentSetting({
          ...currentSetting,
          qrImageUrl: previewUrl
        });
      }
    }
  };
  
  // Empty setting template for new settings
  const emptyPaymentSetting: PaymentSetting = {
    id: '',
    paymentType: 'custom',
    isEnabled: true,
    displayName: '',
    description: '',
    icon: '💲',
    position: paymentSettings.length + 1,
    qrImageUrl: '',
    paymentLink: '',
    contactInfo: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const openEditModal = (setting: PaymentSetting) => {
    setCurrentSetting({...setting});
    setQrImagePreview(setting.qrImageUrl);
    setQrImage(null);
    setIsModalOpen(true);
  };
  
  const openAddModal = () => {
    setCurrentSetting({...emptyPaymentSetting});
    setQrImagePreview('');
    setQrImage(null);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    // Clean up any object URLs to avoid memory leaks
    if (qrImagePreview && !qrImagePreview.startsWith('http')) {
      URL.revokeObjectURL(qrImagePreview);
    }
    setIsModalOpen(false);
    setCurrentSetting(null);
    setQrImagePreview('');
    setQrImage(null);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!currentSetting) return;
    
    const { name, value } = e.target;
    setCurrentSetting(prev => {
      if (!prev) return prev;
      return { ...prev, [name]: value };
    });
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentSetting) return;
    
    const { name, checked } = e.target;
    setCurrentSetting(prev => {
      if (!prev) return prev;
      return { ...prev, [name]: checked };
    });
  };
  
  const handleSave = async () => {
    if (!currentSetting) return;
    
    setIsLoading(true);
    
    try {
      let updatedSetting = { ...currentSetting };
      
      // Handle QR image upload if there's a new image
      if (qrImage && currentSetting.paymentType === 'qr') {
        // Convert the file to a data URL or upload to server/storage
        // For this example, we'll use a data URL, but in production you'd upload to a server
        const reader = new FileReader();
        
        // Create a Promise to handle the asynchronous file reading
        const imageDataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(qrImage);
        });
        
        updatedSetting.qrImageUrl = imageDataUrl;
      }
      
      // Save to database
      await savePaymentSetting(updatedSetting);
      
      // Refresh payment settings
      const updatedSettings = await getPaymentSettings();
      setPaymentSettings(updatedSettings);
      
      setIsLoading(false);
      closeModal();
    } catch (err) {
      console.error('Error saving payment setting:', err);
      alert('Failed to save payment settings. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        await deletePaymentSetting(id);
        
        // Refresh payment settings
        const updatedSettings = await getPaymentSettings();
        setPaymentSettings(updatedSettings);
      } catch (err) {
        console.error('Error deleting payment setting:', err);
        alert('Failed to delete payment settings. Please try again.');
      }
    }
  };
  
  const toggleStatus = async (id: string) => {
    try {
      // Find the setting to toggle
      const settingToToggle = paymentSettings.find(item => item.id === id);
      if (!settingToToggle) return;
      
      // Create updated setting with toggled status
      const updatedSetting = { 
        ...settingToToggle, 
        isEnabled: !settingToToggle.isEnabled,
        updatedAt: new Date().toISOString()
      };
      
      // Save to database
      await savePaymentSetting(updatedSetting);
      
      // Refresh payment settings
      const updatedSettings = await getPaymentSettings();
      setPaymentSettings(updatedSettings);
    } catch (err) {
      console.error('Error toggling payment setting status:', err);
      alert('Failed to update payment setting status. Please try again.');
    }
  };
  
  const handleSaveAndApply = async () => {
    if (!currentSetting) return;
    
    setIsLoading(true);
    
    try {
      let updatedSetting = { ...currentSetting };
      
      // Handle QR image upload if there's a new image
      if (qrImage && currentSetting.paymentType === 'qr') {
        // Convert the file to a data URL or upload to server/storage
        const reader = new FileReader();
        
        // Create a Promise to handle the asynchronous file reading
        const imageDataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(qrImage);
        });
        
        updatedSetting.qrImageUrl = imageDataUrl;
      }
      
      // Save to database
      await savePaymentSetting(updatedSetting);
      
      // Refresh payment settings
      const updatedSettings = await getPaymentSettings();
      setPaymentSettings(updatedSettings);
      
      // Simulate updating the SupportMe component with new settings
      console.log('Applying new settings to SupportMe component:', updatedSetting);
      
      setIsLoading(false);
      closeModal();
      
      // Show success message
      alert('Settings saved and applied successfully!');
    } catch (err) {
      console.error('Error saving and applying payment setting:', err);
      alert('Failed to save and apply payment settings. Please try again.');
      setIsLoading(false);
    }
  };
  
  return (
    <PageContainer data-theme={theme}>
      <AdminSidebar active="payment-settings" />
      <Content>
        <PageHeader>
          <h1>Payment Settings</h1>
          <p>Configure payment methods and options for users to support the project.</p>
        </PageHeader>
        
        {error && (
          <Card style={{ backgroundColor: 'rgba(229, 57, 53, 0.1)', marginBottom: '1rem' }}>
            <p style={{ color: '#e53935', margin: 0 }}>{error}</p>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <h2>Payment Methods</h2>
            <Button onClick={openAddModal}>Add Payment Method</Button>
          </CardHeader>
          
          {isInitialLoading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Loading payment settings...</p>
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <th style={{ width: '50px' }}>Icon</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </TableHead>
              <TableBody>
                {paymentSettings.map(setting => (
                  <tr key={setting.id}>
                    <td>{setting.icon}</td>
                    <td>{setting.displayName}</td>
                    <td style={{ textTransform: 'capitalize' }}>{setting.paymentType}</td>
                    <td>{setting.description}</td>
                    <td>
                      <StatusBadge $isActive={setting.isEnabled}>
                        {setting.isEnabled ? 'Active' : 'Disabled'}
                      </StatusBadge>
                    </td>
                    <td>
                      <Button 
                        onClick={() => toggleStatus(setting.id)}
                        style={{ 
                          marginRight: '0.5rem',
                          backgroundColor: setting.isEnabled ? '#e53935' : 'var(--accent-color)',
                          minWidth: 'auto',
                          padding: '0.25rem 0.5rem'
                        }}
                      >
                        {setting.isEnabled ? 'Disable' : 'Enable'}
                      </Button>
                      <EditButton onClick={() => openEditModal(setting)}>Edit</EditButton>
                      <DeleteButton onClick={() => handleDelete(setting.id)}>Delete</DeleteButton>
                    </td>
                  </tr>
                ))}
                
                {paymentSettings.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                      No payment methods configured. Add your first one!
                    </td>
                  </tr>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
        
        {isModalOpen && currentSetting && (
          <Modal>
            <ModalContent>
              <CloseButton onClick={closeModal}>×</CloseButton>
              <h2>{currentSetting.id ? 'Edit Payment Method' : 'Add Payment Method'}</h2>
              
              <FormRow>
                <Label htmlFor="isEnabled">Status</Label>
                <Checkbox>
                  <input 
                    type="checkbox" 
                    id="isEnabled" 
                    name="isEnabled" 
                    checked={currentSetting.isEnabled} 
                    onChange={handleCheckboxChange} 
                  />
                  <span>{currentSetting.isEnabled ? 'Active' : 'Disabled'}</span>
                </Checkbox>
              </FormRow>
              
              <FormRow>
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select 
                  id="paymentType" 
                  name="paymentType" 
                  value={currentSetting.paymentType} 
                  onChange={handleChange}
                >
                  <option value="qr">QR Code Payment</option>
                  <option value="kofi">Ko-fi</option>
                  <option value="paypal">PayPal</option>
                  <option value="patreon">Patreon</option>
                  <option value="custom">Custom</option>
                </Select>
              </FormRow>
              
              <FormRow>
                <Label htmlFor="displayName">Display Name</Label>
                <Input 
                  type="text" 
                  id="displayName" 
                  name="displayName" 
                  value={currentSetting.displayName} 
                  onChange={handleChange} 
                  placeholder="E.g. QR Payment, PayPal, etc." 
                  required 
                />
              </FormRow>
              
              <FormRow>
                <Label htmlFor="description">Description</Label>
                <Input 
                  type="text" 
                  id="description" 
                  name="description" 
                  value={currentSetting.description} 
                  onChange={handleChange} 
                  placeholder="Short description of the payment method" 
                />
              </FormRow>
              
              <FormRow>
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input 
                  type="text" 
                  id="icon" 
                  name="icon" 
                  value={currentSetting.icon} 
                  onChange={handleChange} 
                  placeholder="Enter an emoji: 💰, 💸, 💳, etc." 
                  maxLength={2}
                />
                <IconPreview>
                  <span>Preview: </span>
                  <span>{currentSetting.icon}</span>
                </IconPreview>
              </FormRow>
              
              <FormRow>
                <Label htmlFor="position">Position Order</Label>
                <Input 
                  type="number" 
                  id="position" 
                  name="position" 
                  value={currentSetting.position} 
                  onChange={handleChange} 
                  min="1" 
                />
              </FormRow>
              
              {currentSetting.paymentType === 'qr' && (
                <FormRow>
                  <Label htmlFor="qrImageUrl">QR Code Image</Label>
                  <FileUploadContainer>
                    <input 
                      type="file" 
                      id="qrImage" 
                      name="qrImage" 
                      accept="image/jpeg,image/png" 
                      onChange={handleQrImageChange}
                    />
                    <span className="upload-icon">📸</span>
                    <span className="upload-text">Click to upload QR code image</span>
                  </FileUploadContainer>
                  {qrImagePreview && (
                    <QRPreview>
                      <img src={qrImagePreview} alt="QR Code Preview" />
                    </QRPreview>
                  )}
                </FormRow>
              )}
              
              {currentSetting.paymentType !== 'qr' && (
                <FormRow>
                  <Label htmlFor="paymentLink">Payment Link</Label>
                  <Input 
                    type="text" 
                    id="paymentLink" 
                    name="paymentLink" 
                    value={currentSetting.paymentLink} 
                    onChange={handleChange} 
                    placeholder="https://example.com/payment" 
                  />
                </FormRow>
              )}
              
              <FormRow>
                <Label htmlFor="contactInfo">Contact Information After Payment</Label>
                <Textarea 
                  id="contactInfo" 
                  name="contactInfo" 
                  value={currentSetting.contactInfo} 
                  onChange={handleChange} 
                  placeholder="Instructions for contacting you after payment" 
                />
              </FormRow>
              
              <ButtonGroup>
                <CancelButton onClick={closeModal}>Cancel</CancelButton>
                <SaveButton onClick={handleSave} disabled={isLoading} style={{ marginRight: '8px' }}>
                  {isLoading ? 'Saving...' : 'Save Only'}
                </SaveButton>
                <SaveButton onClick={handleSaveAndApply} disabled={isLoading} style={{ backgroundColor: '#10b981' }}>
                  {isLoading ? 'Applying...' : 'Save & Apply'}
                </SaveButton>
              </ButtonGroup>
            </ModalContent>
          </Modal>
        )}
      </Content>
    </PageContainer>
  );
};

export default PaymentSettings; 