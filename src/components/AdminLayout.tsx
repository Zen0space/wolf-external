import React from 'react';
import styled from 'styled-components';
import AdminSidebar from './AdminSidebar';

const LayoutContainer = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: var(--background-main);
  color: var(--text-primary);
`;

const Content = styled.div`
  flex: 1;
  padding: 2rem;
  margin-left: 260px;

  @media (max-width: 768px) {
    margin-left: 70px;
    padding: 1.5rem;
  }
`;

interface AdminLayoutProps {
  children: React.ReactNode;
  activePage: string;
  showSidebar?: boolean;
}

const AdminLayout = ({ children, activePage, showSidebar = true }: AdminLayoutProps) => {
  return (
    <LayoutContainer>
      {showSidebar && <AdminSidebar active={activePage} />}
      <Content>
        {children}
      </Content>
    </LayoutContainer>
  );
};

export default AdminLayout; 