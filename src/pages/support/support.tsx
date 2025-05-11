import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import '../../theme/theme.css';
import Navbar from '../../components/Navbar';
import { createSupportTicket } from '../../lib/db';

// Constants
const MAX_FILE_SIZE = 1024 * 1024; // 1MB in bytes
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface SupportTicket {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  screenshot?: {
    file: File;
    name: string;
    type: string;
    size: number;
  } | null;
}

const styles = {
  supportContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--background-main)',
    color: 'var(--text-primary)'
  },
  supportContent: {
    flex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 80px)',
    padding: '2rem 1rem'
  },
  contentWrapper: {
    width: '100%',
    maxWidth: '1200px'
  },
  supportTitle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)'
  },
  supportDescription: {
    color: 'var(--text-secondary)',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto 2rem'
  },
  supportForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  formColumn: {
    backgroundColor: 'var(--background-paper)',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)'
    }
  },
  inputGroup: {
    marginBottom: '1rem'
  },
  inputLabel: {
    display: 'block',
    fontSize: '0.875rem',
    marginBottom: '0.25rem',
    fontWeight: 500,
    color: 'var(--text-primary)'
  },
  required: {
    color: 'var(--error-color, #ff4c4c)'
  },
  inputField: {
    width: '100%',
    backgroundColor: 'var(--background-main)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
    '&:focus': {
      borderColor: 'var(--btn-primary-bg)',
      boxShadow: '0 0 0 2px rgba(var(--btn-primary-bg-rgb, 0, 120, 212), 0.2)',
      outline: 'none'
    },
    '&:disabled': {
      opacity: 0.7,
      cursor: 'not-allowed'
    }
  },
  selectWrapper: {
    position: 'relative' as const,
    width: '100%'
  },
  selectField: {
    width: '100%',
    backgroundColor: 'var(--background-main)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    paddingRight: '2.5rem',
    fontSize: '1rem',
    appearance: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:focus': {
      borderColor: 'var(--btn-primary-bg)',
      boxShadow: '0 0 0 2px rgba(var(--btn-primary-bg-rgb, 0, 120, 212), 0.2)',
      outline: 'none'
    },
    '&:disabled': {
      opacity: 0.7,
      cursor: 'not-allowed'
    }
  },
  selectOption: {
    backgroundColor: 'var(--background-paper)',
    color: 'var(--text-primary)',
    padding: '10px',
  },
  selectIcon: {
    position: 'absolute' as const,
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    transition: 'transform 0.2s ease'
  },
  textareaField: {
    width: '100%',
    backgroundColor: 'var(--background-main)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    minHeight: '120px',
    resize: 'vertical',
    transition: 'all 0.2s ease'
  },
  fileUpload: {
    width: '100%'
  },
  uploadButton: {
    width: '100%',
    minHeight: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px dashed var(--border-color)',
    backgroundColor: 'var(--background-main)',
    borderRadius: '8px',
    '&:hover': {
      borderColor: 'var(--btn-primary-bg)',
      backgroundColor: 'var(--background-hover)'
    },
    '&:disabled': {
      opacity: 0.7,
      cursor: 'not-allowed'
    }
  },
  previewContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    position: 'relative'
  },
  imagePreview: {
    maxWidth: '100%',
    maxHeight: '200px',
    objectFit: 'contain',
    borderRadius: '4px'
  },
  removeButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--error-color, #ff4c4c)',
    color: 'white',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--error-color-dark, #e03131)',
      transform: 'scale(1.1)'
    }
  },
  uploadPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)'
  },
  submitButton: {
    width: '100%',
    backgroundColor: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: 'auto',
    '&:hover:not(:disabled)': {
      backgroundColor: 'var(--btn-primary-hover, rgba(var(--btn-primary-bg-rgb, 0, 120, 212), 0.9))',
      transform: 'translateY(-1px)'
    },
    '&:active:not(:disabled)': {
      transform: 'translateY(0)'
    },
    '&:disabled': {
      opacity: 0.7,
      cursor: 'not-allowed'
    }
  },
  statusSuccess: {
    backgroundColor: 'rgba(0, 216, 122, 0.1)',
    color: 'var(--success-color, #00d87a)',
    border: '1px solid rgba(0, 216, 122, 0.3)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    textAlign: 'center'
  },
  statusError: {
    backgroundColor: 'rgba(255, 76, 76, 0.1)',
    color: 'var(--error-color, #ff4c4c)',
    border: '1px solid rgba(255, 76, 76, 0.3)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    textAlign: 'center'
  },
  contactInfo: {
    marginTop: '2rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)'
  },
  contactLink: {
    color: 'var(--btn-primary-bg)',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  errorMessage: {
    color: 'var(--error-color, #ff4c4c)',
    fontSize: '0.875rem',
    marginBottom: '0.5rem'
  }
} as const;

const ChevronDownIcon = () => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M4 6L8 10L12 6" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const Support: FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<SupportTicket>({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
    screenshot: null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fileError, setFileError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 1MB limit. Please choose a smaller file.';
    }

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (file) {
      const error = validateFile(file);
      
      if (error) {
        setFileError(error);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      const screenshot = {
        file,
        name: file.name,
        type: file.type,
        size: file.size
      };

      setFormData(prev => ({ ...prev, screenshot }));
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, screenshot: null }));
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFileError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await createSupportTicket(formData);
      setFormData({ 
        name: '', 
        email: '', 
        subject: '', 
        category: 'general', 
        message: '',
        screenshot: null 
      });
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom styles for the dropdown options
  useEffect(() => {
    // Add custom styles to fix dropdown option colors
    const style = document.createElement('style');
    style.textContent = `
      select.support-select option {
        background-color: var(--background-paper);
        color: var(--text-primary);
        padding: 10px;
      }
      
      select.support-select {
        color: var(--text-primary) !important;
        background-color: var(--background-main) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={styles.supportContainer}>
      <Navbar />
      
      <div style={styles.supportContent}>
        <div style={styles.contentWrapper}>
          <h1 style={styles.supportTitle}>Support</h1>
          <p style={styles.supportDescription}>
            Need help? Submit a support ticket and we'll get back to you as soon as possible.
          </p>

          {submitStatus === 'success' && (
            <div style={styles.statusSuccess}>
              Your support ticket has been submitted successfully. We'll get back to you soon!
            </div>
          )}
          
          {submitStatus === 'error' && (
            <div style={styles.statusError}>
              There was an error submitting your support ticket. Please try again later.
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.supportForm}>
            {/* Left Column - Personal Info */}
            <div style={styles.formColumn}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>
                  Name <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={styles.inputField}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>
                  Email <span style={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.inputField}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>
                  Subject <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  style={styles.inputField}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Category</label>
                <div style={styles.selectWrapper}>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    style={styles.selectField}
                    disabled={isSubmitting}
                    className="support-select"
                  >
                    <option value="general">General Question</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Issue</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug Report</option>
                    <option value="other">Other</option>
                  </select>
                  <div style={styles.selectIcon}>
                    <ChevronDownIcon />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Message and Screenshot */}
            <div style={styles.formColumn}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>
                  Message <span style={styles.required}>*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  style={styles.textareaField}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Screenshot (optional, max 1MB)</label>
                {fileError && <div style={styles.errorMessage}>{fileError}</div>}
                <div style={styles.fileUpload}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    style={{ display: 'none' }}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={styles.uploadButton}
                    disabled={isSubmitting}
                  >
                    {previewUrl ? (
                      <div style={styles.previewContainer}>
                        <img 
                          src={previewUrl} 
                          alt="Screenshot preview" 
                          style={styles.imagePreview}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          style={styles.removeButton}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={styles.uploadPlaceholder}>
                        Click to upload screenshot
                        <br />
                        <span style={{ fontSize: '0.875rem' }}>or drag and drop</span>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Supported: JPEG, PNG, GIF, WebP
                        </span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...styles.submitButton,
                  ...(isSubmitting && { opacity: 0.7, cursor: 'not-allowed' })
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </div>
          </form>

          <div style={styles.contactInfo}>
            You can also reach us directly at:{' '}
            <a 
              href="mailto:kairul@zen0.space" 
              style={styles.contactLink}
            >
              kairul@zen0.space
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
