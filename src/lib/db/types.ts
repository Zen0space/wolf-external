// Interface for file upload
export interface FileUpload {
  id?: string;
  fileName: string;
  fileType: string;
  description?: string;
  category: string;
  size: number;
  content: Uint8Array | ArrayBuffer;
}

// Interface for file info (without content blob)
export interface FileInfo {
  id: string;
  fileName: string;
  fileType: string;
  description?: string;
  category: string;
  size: number;
  createdAt: string;
  createdAtISO: string; // Add ISO timestamp
}

// Interface for admin user
export interface AdminUser {
  id?: string;
  username: string;
  email: string;
  passwordHash?: string;
  password?: string; // Used only for signup/login, not stored
  isActive?: boolean;
  role?: string;
  createdAt?: Date;
  createdAtISO?: string; // Add ISO timestamp
  lastLogin?: Date;
  lastLoginISO?: string; // Add ISO timestamp
}

// Interface for payment settings
export interface PaymentSetting {
  id: string;
  paymentType: string;
  isEnabled: boolean;
  displayName: string;
  description: string;
  icon: string;
  position: number;
  qrImageUrl: string;
  qrImageType?: string;
  paymentLink: string;
  contactInfo: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for support ticket
export interface SupportTicket {
  id?: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status?: string;
  createdAt?: string;
  createdAtISO?: string;
  updatedAt?: string;
  updatedAtISO?: string;
  screenshot?: {
    file: File;
    name: string;
    type: string;
    size: number;
  } | null;
}

// Interface for support reply
export interface SupportReply {
  id?: string;
  ticketId: string;
  message: string;
  isAdmin: boolean;
  createdAt?: string;
  createdAtISO?: string;
}

// Interface for email subscriber
export interface EmailSubscriber {
  id: string;
  email: string;
  fileId?: string;
  ipAddress?: string;
  downloadCount?: number;
  lastDownloadAt?: string;
  createdAt: string;
}

// Interface for support category
export interface SupportCategory {
  id: string;
  name: string;
  description?: string;
}

// Interface for activity in dashboard
export interface Activity {
  id: string;
  type: 'download' | 'subscriber' | 'support';
  date: string;
  formattedDate?: string;
  isoDate?: string;
  details: {
    fileId?: string;
    fileName?: string;
    email?: string;
    subject?: string;
  };
}
