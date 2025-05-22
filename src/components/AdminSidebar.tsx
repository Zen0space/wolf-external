import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Home, FileText, Folder, Mail, MessageSquare, DollarSign, BarChart2, Settings, Globe } from 'react-feather';

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

const LogoIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: #4A90E2;
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

const MenuIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  color: inherit;

  @media (max-width: 768px) {
    margin: 0;
  }

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2px;
  }
`;

const MenuLabel = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
`;

interface AdminSidebarProps {
  active: string;
}

const AdminSidebar = ({ active }: AdminSidebarProps) => {
  // Map of page names to their routes for easier maintenance
  const pageRoutes = {
    dashboard: '/admin/dashboard',
    files: '/admin/script-files',
    categories: '/admin/categories',
    subscribers: '/admin/subscribers',
    support: '/admin/support',
    'payment-settings': '/admin/payment-settings',
    stats: '/admin/stats',
    settings: '/admin/settings'
  };
  return (
    <Sidebar>
      <SidebarHeader>
        <LogoIcon><Globe size={24} /></LogoIcon>
        <LogoText>Wolf Admin</LogoText>
      </SidebarHeader>
      <SidebarMenu>
        <MenuItem to={pageRoutes.dashboard} className={active === 'dashboard' ? 'active' : ''}>
          <MenuIcon><Home /></MenuIcon>
          <MenuLabel>Dashboard</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/script-files" className={active === 'files' ? 'active' : ''}>
          <MenuIcon><FileText /></MenuIcon>
          <MenuLabel>Files</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/categories" className={active === 'categories' ? 'active' : ''}>
          <MenuIcon><Folder /></MenuIcon>
          <MenuLabel>Categories</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/subscribers" className={active === 'subscribers' ? 'active' : ''}>
          <MenuIcon><Mail /></MenuIcon>
          <MenuLabel>Subscribers</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/support" className={active === 'support' ? 'active' : ''}>
          <MenuIcon><MessageSquare /></MenuIcon>
          <MenuLabel>Support Tickets</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/payment-settings" className={active === 'payment-settings' ? 'active' : ''}>
          <MenuIcon><DollarSign /></MenuIcon>
          <MenuLabel>Payment Settings</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/stats" className={active === 'stats' ? 'active' : ''}>
          <MenuIcon><BarChart2 /></MenuIcon>
          <MenuLabel>Statistics</MenuLabel>
        </MenuItem>
        <MenuItem to="/admin/settings" className={active === 'settings' ? 'active' : ''}>
          <MenuIcon><Settings /></MenuIcon>
          <MenuLabel>Settings</MenuLabel>
        </MenuItem>
      </SidebarMenu>
    </Sidebar>
  );
};

export default AdminSidebar; 