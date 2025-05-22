-- Schema for storing upload files

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  size INTEGER NOT NULL,
  content BLOB NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table (for different file categories)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, description) VALUES
  ('windows-activation', 'Windows Activation', 'Scripts for activating Windows'),
  ('adobe-block', 'Adobe Firewall Block', 'Scripts for blocking Adobe validation'),
  ('system-optimization', 'System Optimization', 'Tools for optimizing system performance'),
  ('privacy-tools', 'Privacy Tools', 'Tools for enhancing privacy and security');

-- Create downloads table (for tracking download statistics)
CREATE TABLE IF NOT EXISTS downloads (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id)
);

-- Create email subscribers table (for collecting user emails when downloading)
CREATE TABLE IF NOT EXISTS email_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  download_count INTEGER DEFAULT 1,
  last_download_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  file_id TEXT,
  FOREIGN KEY (file_id) REFERENCES files(id)
);

-- Create admin users table (for admin authentication)
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Create support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create support ticket screenshots table
CREATE TABLE IF NOT EXISTS support_ticket_screenshots (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content BLOB NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- Create support ticket replies table
CREATE TABLE IF NOT EXISTS support_replies (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id)
);

-- Create support ticket categories
CREATE TABLE IF NOT EXISTS support_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default support categories
INSERT OR IGNORE INTO support_categories (id, name, description) VALUES
  ('general', 'General Question', 'General questions about our products'),
  ('technical', 'Technical Support', 'Technical issues with scripts or tools'),
  ('billing', 'Billing Issue', 'Questions about billing or payments'),
  ('feature', 'Feature Request', 'Suggestions for new features'),
  ('bug', 'Bug Report', 'Report bugs in our scripts or website'),
  ('other', 'Other', 'Other inquiries');

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_downloads_file_id ON downloads(file_id);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_replies_ticket_id ON support_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_screenshots_ticket_id ON support_ticket_screenshots(ticket_id); 