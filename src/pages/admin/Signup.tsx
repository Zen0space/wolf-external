import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createAdminUser } from '../../lib/db';
import '../../theme/theme.css';

// CSS-in-JS styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '2rem',
  },
  card: {
    backgroundColor: 'var(--background-paper)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow)',
    width: '100%',
    maxWidth: '480px',
    padding: '2.5rem',
    border: '1px solid var(--border-color)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: 'var(--text-primary)',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  logoIcon: {
    fontSize: '2rem',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--accent-color)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid var(--border-color)',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    transition: 'border-color 0.2s ease',
  },
  errorMessage: {
    backgroundColor: 'rgba(255, 99, 132, 0.1)',
    borderLeft: '3px solid rgba(255, 99, 132, 1)',
    color: 'rgba(255, 99, 132, 1)',
    padding: '0.75rem 1rem',
    borderRadius: '4px',
    fontSize: '0.9rem',
    position: 'relative',
  },
  successMessage: {
    backgroundColor: 'rgba(0, 216, 122, 0.1)',
    borderLeft: '3px solid var(--accent-color)',
    color: 'var(--accent-color)',
    padding: '1.5rem',
    borderRadius: '4px',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  successTitle: {
    marginBottom: '0.5rem',
    fontSize: '1.2rem',
    fontWeight: 600,
  },
  errorCloseBtn: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    background: 'none',
    border: 'none',
    color: 'rgba(255, 99, 132, 1)',
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  submitButton: {
    backgroundColor: 'var(--accent-color)',
    color: '#121212',
    border: 'none',
    borderRadius: '6px',
    padding: '0.75rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '0.5rem',
  },
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  link: {
    color: 'var(--accent-color)',
    textDecoration: 'none',
  }
};

// Secret key for admin signup - in a real app, this would be stored securely in environment variables
// and not hardcoded in the source code
const ADMIN_SIGNUP_SECRET_KEY = import.meta.env.VITE_ADMIN_SIGNUP_SECRET || 'wolf-admin-secret-2024';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    secretKey: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.secretKey) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    // Verify secret key
    if (formData.secretKey !== ADMIN_SIGNUP_SECRET_KEY) {
      setError('Invalid secret key. You are not authorized to create an admin account.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await createAdminUser({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      setSuccess(true);
      
      // Redirect to login after successful signup
      setTimeout(() => {
        navigate('/admin/login');
      }, 2000);

    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        setError('Username or email already exists');
      } else {
        setError('An error occurred during signup');
        console.error('Signup error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.container, background: 'var(--background-main)' }}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Signup</h1>
          <div style={styles.logoContainer}>
            <span style={styles.logoIcon}>🐺</span>
            <span style={styles.logoText}>Wolf Admin</span>
          </div>
        </div>

        {success ? (
          <div style={styles.successMessage}>
            <h2 style={styles.successTitle}>Account Created Successfully!</h2>
            <p>Redirecting to login page...</p>
          </div>
        ) : (
          <form style={styles.form} onSubmit={handleSubmit}>
            {error && (
              <div style={styles.errorMessage}>
                {error}
                <button 
                  type="button"
                  style={styles.errorCloseBtn}
                  onClick={() => setError('')}
                >
                  ×
                </button>
              </div>
            )}

            <div style={styles.formGroup}>
              <label htmlFor="secretKey" style={styles.label}>Admin Secret Key</label>
              <input
                id="secretKey"
                name="secretKey"
                type="password"
                value={formData.secretKey}
                onChange={handleChange}
                placeholder="Enter the admin secret key"
                disabled={loading}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="username" style={styles.label}>Username</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                disabled={loading}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.label}>Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={loading}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                disabled={loading}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="confirmPassword" style={styles.label}>Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                disabled={loading}
                style={styles.input}
              />
            </div>

            <button 
              type="submit" 
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        )}

        <div style={styles.footer}>
          <p>Already have an account? <Link to="/admin/login" style={styles.link}>Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Signup; 