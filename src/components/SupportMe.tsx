import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getQRPaymentImage, getQRPaymentContactInfo } from '../lib/db';

// Styled components for the support button and modal
const SupportButton = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, #4A90E2 0%, #9B59B6 100%);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: var(--background-paper, #1e2028);
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 560px;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;
  
  /* Customize scrollbar for modern browsers */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    border: transparent;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.3);
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
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary, #a0a0a0);
  transition: color 0.2s;
  
  &:hover {
    color: var(--text-primary, #ffffff);
  }
`;

const ModalTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--text-primary, #ffffff);
  font-size: 1.75rem;
`;

const ModalDescription = styled.p`
  color: var(--text-secondary, #a0a0a0);
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const SupportOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const SupportOption = styled.a`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  text-decoration: none;
  transition: transform 0.2s, background-color 0.2s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const OptionIcon = styled.span`
  font-size: 2rem;
  margin-bottom: 0.75rem;
`;

const OptionTitle = styled.span`
  color: var(--text-primary, #ffffff);
  font-weight: 600;
  margin-bottom: 0.3rem;
`;

const OptionDescription = styled.span`
  color: var(--text-secondary, #a0a0a0);
  font-size: 0.8rem;
  text-align: center;
`;

const ThankYouMessage = styled.p`
  text-align: center;
  color: var(--text-secondary, #a0a0a0);
  font-size: 0.9rem;
  margin: 0;
`;

// Tabs styling
const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  background-color: var(--background-paper, #1e2028);
  z-index: 5;
  padding-top: 0.5rem;
`;

const Tab = styled.button<{ active: boolean }>`
  background: transparent;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  color: ${props => props.active ? 'var(--text-primary, #ffffff)' : 'var(--text-secondary, #a0a0a0)'};
  border-bottom: 2px solid ${props => props.active ? 'var(--accent-color, #4A90E2)' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--text-primary, #ffffff);
  }
`;

const TabContent = styled.div`
  padding: 1rem 0;
`;

const KofiContainer = styled.div`
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  
  /* Hide iframe scrollbar */
  iframe {
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

// QR Code container
const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem 0 2rem;
`;

const QRImage = styled.img`
  width: 280px;
  height: auto;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const QRCaption = styled.p`
  color: var(--text-secondary, #a0a0a0);
  text-align: center;
  font-size: 0.9rem;
  margin: 0;
  max-width: 320px;
  line-height: 1.5;
`;

// Image loading placeholder
const ImagePlaceholder = styled.div`
  width: 280px;
  height: 280px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  
  svg {
    width: 40px;
    height: 40px;
    animation: spin 1.5s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface SupportMeProps {
  // You can add custom props here if needed
}

const SupportMe: React.FC<SupportMeProps> = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'options' | 'qr' | 'kofi'>('options');
  const [qrImageSrc, setQrImageSrc] = useState<string>('');
  const [qrContactInfo, setQrContactInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const openModal = () => {
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    // Reset to default tab when closing
    setActiveTab('options');
  };
  
  // Fetch QR image when QR tab is selected
  useEffect(() => {
    if (activeTab === 'qr' && !qrImageSrc) {
      const fetchQrImage = async () => {
        setIsLoading(true);
        try {
          const imageUrl = await getQRPaymentImage();
          const contactInfo = await getQRPaymentContactInfo();
          
          setQrImageSrc(imageUrl);
          setQrContactInfo(contactInfo);
        } catch (error) {
          console.error('Error fetching QR image:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchQrImage();
    }
  }, [activeTab, qrImageSrc]);
  
  return (
    <>
      <SupportButton onClick={openModal}>
        Support Me ↗
      </SupportButton>
      
      {showModal && (
        <ModalOverlay onClick={(e) => {
          // Close only if clicking the overlay itself, not its children
          if (e.target === e.currentTarget) {
            closeModal();
          }
        }}>
          <ModalContent>
            <CloseButton onClick={closeModal}>×</CloseButton>
            <ModalTitle>Support This Project</ModalTitle>
            <ModalDescription>
              Your support helps keep the scripts free and continuously updated.
            </ModalDescription>
            
            <TabsContainer>
              <Tab 
                active={activeTab === 'options'} 
                onClick={() => setActiveTab('options')}
              >
                Support Options
              </Tab>
              <Tab 
                active={activeTab === 'qr'} 
                onClick={() => setActiveTab('qr')}
              >
                QR Payment
              </Tab>
              <Tab 
                active={activeTab === 'kofi'} 
                onClick={() => setActiveTab('kofi')}
              >
                Ko-fi
              </Tab>
            </TabsContainer>
            
            {activeTab === 'options' && (
              <TabContent>
                <SupportOptions>
                  <SupportOption onClick={() => setActiveTab('qr')}>
                    <OptionIcon>📱</OptionIcon>
                    <OptionTitle>QR Payment</OptionTitle>
                    <OptionDescription>Pay with e-wallet or bank</OptionDescription>
                  </SupportOption>
                  
                  <SupportOption onClick={() => setActiveTab('kofi')}>
                    <OptionIcon>☕</OptionIcon>
                    <OptionTitle>Ko-fi</OptionTitle>
                    <OptionDescription>Buy me a coffee</OptionDescription>
                  </SupportOption>
                </SupportOptions>
              </TabContent>
            )}
            
            {activeTab === 'qr' && (
              <TabContent>
                <QRCodeContainer>
                  {isLoading ? (
                    <ImagePlaceholder>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </ImagePlaceholder>
                  ) : qrImageSrc ? (
                    <QRImage 
                      src={qrImageSrc} 
                      alt="QR Payment Code"
                    />
                  ) : (
                    <ImagePlaceholder>
                      <span>No QR code available</span>
                    </ImagePlaceholder>
                  )}
                  <QRCaption>
                    {qrContactInfo || 'All scripts are free to plunder! Want to support the ship? Scan QR code with your e-wallet or banking app.'}
                  </QRCaption>
                </QRCodeContainer>
              </TabContent>
            )}
            
            {activeTab === 'kofi' && (
              <TabContent>
                <KofiContainer>
                  <iframe 
                    id='kofiframe' 
                    src='https://ko-fi.com/kairulzen0/?hidefeed=true&widget=true&embed=true&preview=true' 
                    style={{
                      border: 'none',
                      width: '100%',
                      padding: '4px',
                      background: '#f9f9f9',
                    }}
                    height='712' 
                    title='kairulzen0'
                  />
                </KofiContainer>
              </TabContent>
            )}
            
            <ThankYouMessage>
              Thank you for supporting independent developers! ❤️
            </ThankYouMessage>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default SupportMe; 