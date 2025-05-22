import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../theme/ThemeContext';
import AdminLayout from '../../components/AdminLayout';
import { 
  getSupportTickets,
  getSupportCategories,
  getSupportReplies,
  addSupportReply,
  updateSupportTicketStatus,
  type SupportTicket as DBSupportTicket,
  type SupportReply as DBSupportReply
} from '../../lib/db';

// Local interfaces that match the component's needs
interface SupportTicket extends DBSupportTicket {
  status: 'open' | 'closed';
}

interface SupportReply extends DBSupportReply {
  isAdmin: boolean;
  createdAt: string;
}

interface SupportCategory {
  id: string;
  name: string;
  description?: string;
}

// Styled Components
const PageContainer = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background: var(--background-main);
  color: var(--text-primary);
`;

const Content = styled.div`
  flex: 1;
  padding: 2rem;
  margin-left: 0;
  margin: 0 auto;
  width: calc(100% - 260px);
  max-width: 1200px;
  padding-left: 4rem;

  @media (max-width: 768px) {
    width: calc(100% - 70px);
    padding: 1.5rem;
    padding-left: 2rem;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
`;

const TabButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'var(--accent-color)' : 'transparent'};
  color: ${props => props.$active ? '#000' : 'var(--text-primary)'};
  border: 1px solid ${props => props.$active ? 'var(--accent-color)' : 'var(--border-color)'};
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 500;

  &:hover {
    background: ${props => props.$active ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const TicketGrid = styled.div`
  display: grid;
  gap: 1rem;
  max-width: 900px;
  margin: 0 auto;
`;

const TicketCard = styled.div`
  background: rgba(36, 42, 56, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const TicketHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const TicketTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
`;

const TicketStatus = styled.span<{ $status: string }>`
  padding: 0.35rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  background: ${props => {
    switch (props.$status) {
      case 'open':
        return 'rgba(0, 216, 122, 0.2)';
      case 'closed':
        return 'rgba(255, 69, 58, 0.2)';
      default:
        return 'rgba(255, 159, 64, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'open':
        return '#00d87a';
      case 'closed':
        return '#ff453a';
      default:
        return '#ff9f40';
    }
  }};
`;

const TicketMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  align-items: center;
`;

const TicketMessage = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: var(--background-paper);
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }
`;

const TicketDetails = styled.div`
  background: rgba(0, 0, 0, 0.15);
  padding: 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
`;

const DetailLabel = styled.span`
  color: var(--text-secondary);
  font-weight: 500;
`;

const DetailValue = styled.span`
  color: var(--text-primary);
  text-align: right;
`;

const MessageSection = styled.div`
  margin-bottom: 2rem;
`;

const MessageHeader = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
`;

const Message = styled.div`
  background: rgba(0, 0, 0, 0.2);
  padding: 1.25rem;
  border-radius: 8px;
  white-space: pre-wrap;
  line-height: 1.5;
`;

const ConversationSection = styled.div`
  margin: 2rem 0;
`;

const ReplyItem = styled.div<{ $isAdmin: boolean }>`
  margin-bottom: 1rem;
  background: ${props => props.$isAdmin ? 'rgba(0, 216, 122, 0.1)' : 'rgba(0, 0, 0, 0.2)'};
  padding: 1rem;
  border-radius: 8px;
  border-left: ${props => props.$isAdmin ? '3px solid var(--accent-color)' : 'none'};
`;

const ReplySection = styled.div`
  margin-top: 2rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
`;

const ReplyInput = styled.textarea`
  width: 100%;
  min-height: 100px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  color: var(--text-primary);
  font-size: 0.95rem;
  resize: vertical;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  background: var(--accent-color);
  color: #000;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 216, 122, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AdminSupport = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tickets based on status
  const fetchTickets = async (status: 'open' | 'closed') => {
    try {
      const result = await getSupportTickets(status);
      setTickets(result as SupportTicket[]);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets');
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const result = await getSupportCategories();
      setCategories(result);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch replies for a ticket
  const fetchReplies = async (ticketId: string) => {
    try {
      const result = await getSupportReplies(ticketId);
      // Ensure created_at is properly formatted before setting to state
      const formattedReplies = (result as SupportReply[]).map(reply => ({
        ...reply,
        // If the date is coming from the database in a different property name
        // or if there's any formatting issue, ensure we have a valid date
        createdAt: reply.createdAt || (reply as any).created_at || new Date().toISOString()
      }));
      setReplies(formattedReplies);
    } catch (err) {
      console.error('Error fetching replies:', err);
    }
  };

  // Load tickets when tab changes
  useEffect(() => {
    setLoading(true);
    fetchTickets(activeTab)
      .finally(() => setLoading(false));
  }, [activeTab]);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const handleTicketClick = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    await fetchReplies(ticket.id!);
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      // Add reply
      await addSupportReply({
        ticketId: selectedTicket.id!,
        message: replyMessage.trim(),
        isAdmin: true
      });

      // Fetch updated replies
      await fetchReplies(selectedTicket.id!);
      setReplyMessage('');
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply');
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: 'open' | 'closed') => {
    try {
      await updateSupportTicketStatus(ticketId, newStatus);

      // Refresh tickets list
      await fetchTickets(activeTab);

      // If the changed ticket is currently selected, update its status in the state
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      setError('Failed to update ticket status');
    }
  };

  // Modify the formatDate function to handle potentially invalid dates
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  return (
    <AdminLayout activePage="support">
      <PageContainer data-theme={theme}>
        <Content>
          <PageHeader>
            <h1>Support Tickets</h1>
          </PageHeader>

          <TabsContainer>
            <TabButton
              $active={activeTab === 'open'}
              onClick={() => setActiveTab('open')}
            >
              Open Tickets
            </TabButton>
            <TabButton
              $active={activeTab === 'closed'}
              onClick={() => setActiveTab('closed')}
            >
              Closed Tickets
            </TabButton>
          </TabsContainer>

          {error && (
            <div style={{ 
              backgroundColor: 'rgba(255, 99, 132, 0.1)', 
              color: '#ff6384', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1rem',
              maxWidth: '900px',
              margin: '0 auto 1rem'
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading tickets...</div>
          ) : (
            <TicketGrid>
              {tickets.map(ticket => (
                <TicketCard key={ticket.id} onClick={() => handleTicketClick(ticket)}>
                  <TicketHeader>
                    <TicketTitle>{ticket.subject}</TicketTitle>
                    <TicketStatus $status={ticket.status}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </TicketStatus>
                  </TicketHeader>
                  <TicketMeta>
                    <span>{ticket.name}</span>
                    <span>•</span>
                    <span>{formatDate(ticket.createdAt!)}</span>
                    <span>•</span>
                    <span>{categories.find(c => c.id === ticket.category)?.name || ticket.category}</span>
                  </TicketMeta>
                  <TicketMessage>{ticket.message}</TicketMessage>
                </TicketCard>
              ))}
              {tickets.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No {activeTab} tickets found
                </div>
              )}
            </TicketGrid>
          )}

          {selectedTicket && (
            <Modal onClick={() => setSelectedTicket(null)}>
              <ModalContent onClick={e => e.stopPropagation()}>
                <ModalHeader>
                  <ModalTitle>{selectedTicket.subject}</ModalTitle>
                  <CloseButton onClick={() => setSelectedTicket(null)}>✕</CloseButton>
                </ModalHeader>

                <TicketDetails>
                  <DetailsGrid>
                    <DetailItem>
                      <DetailLabel>Ticket ID:</DetailLabel>
                      <DetailValue>{selectedTicket.id}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Status:</DetailLabel>
                      <DetailValue>
                        <TicketStatus $status={selectedTicket.status}>
                          {selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1)}
                        </TicketStatus>
                      </DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>From:</DetailLabel>
                      <DetailValue>{selectedTicket.name}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Email:</DetailLabel>
                      <DetailValue>{selectedTicket.email}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Created:</DetailLabel>
                      <DetailValue>{formatDate(selectedTicket.createdAt!)}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Category:</DetailLabel>
                      <DetailValue>
                        {categories.find(c => c.id === selectedTicket.category)?.name || selectedTicket.category}
                      </DetailValue>
                    </DetailItem>
                  </DetailsGrid>
                </TicketDetails>
                
                <MessageSection>
                  <MessageHeader>Customer Message</MessageHeader>
                  <Message>{selectedTicket.message}</Message>
                </MessageSection>

                <ConversationSection>
                  <MessageHeader>Conversation</MessageHeader>
                  {replies.length > 0 ? (
                    replies.map(reply => (
                      <ReplyItem key={reply.id} $isAdmin={reply.isAdmin}>
                        <TicketMeta>
                          <span style={{ fontWeight: reply.isAdmin ? 600 : 400 }}>
                            {reply.isAdmin ? 'Support Agent' : selectedTicket.name}
                          </span>
                          <span>•</span>
                          <span>{formatDate(reply.createdAt)}</span>
                        </TicketMeta>
                        <p style={{ margin: '0.5rem 0 0 0' }}>{reply.message}</p>
                      </ReplyItem>
                    ))
                  ) : (
                    <div style={{ 
                      padding: '1rem', 
                      backgroundColor: 'rgba(0, 0, 0, 0.1)', 
                      borderRadius: '8px', 
                      textAlign: 'center',
                      color: 'var(--text-secondary)'
                    }}>
                      No replies yet
                    </div>
                  )}
                </ConversationSection>

                <ReplySection>
                  <MessageHeader>Your Reply</MessageHeader>
                  <ReplyInput
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                  />
                  <ButtonGroup>
                    <Button onClick={handleReply} disabled={!replyMessage.trim()}>
                      Send Reply
                    </Button>
                    <Button 
                      onClick={() => handleStatusChange(
                        selectedTicket.id!, 
                        selectedTicket.status === 'open' ? 'closed' : 'open'
                      )}
                      style={{ 
                        backgroundColor: selectedTicket.status === 'open' ? '#ff6384' : 'var(--accent-color)'
                      }}
                    >
                      {selectedTicket.status === 'open' ? 'Close Ticket' : 'Reopen Ticket'}
                    </Button>
                  </ButtonGroup>
                </ReplySection>
              </ModalContent>
            </Modal>
          )}
        </Content>
      </PageContainer>
    </AdminLayout>
  );
};

export default AdminSupport;
