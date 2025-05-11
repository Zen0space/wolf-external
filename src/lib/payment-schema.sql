-- Schema for payment settings

-- Create payment_settings table (for admin configurable payment options)
CREATE TABLE IF NOT EXISTS payment_settings (
  id TEXT PRIMARY KEY,
  payment_type TEXT NOT NULL, -- 'qr', 'kofi', etc.
  is_enabled BOOLEAN DEFAULT TRUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Emoji or icon reference
  position INTEGER DEFAULT 0, -- For ordering in the UI
  qr_image_url TEXT, -- URL to QR code image or data URL for uploaded images
  qr_image_type TEXT, -- Image mimetype (image/jpeg, image/png)
  payment_link TEXT, -- External payment link if applicable
  contact_info TEXT, -- Contact information after payment
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default payment settings
INSERT OR IGNORE INTO payment_settings (id, payment_type, display_name, description, icon, position, qr_image_url, contact_info) VALUES
  ('qr-payment', 'qr', 'QR Payment', 'Pay with e-wallet or banking app', '📱', 1, '', 'DM me on Discord (@kairu_main) for access!'),
  ('kofi-payment', 'kofi', 'Ko-fi', 'Buy me a coffee', '☕', 2, '', 'DM me on Discord (@kairu_main) after payment');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_settings_type ON payment_settings(payment_type); 