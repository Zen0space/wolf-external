import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../theme/theme.css';

// CSS-in-JS styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '2rem',
    background: 'var(--background-main)',
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

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { signup, error, clearError, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
      setFormError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      await signup(username, email, password);
      
      // If no error after signup, navigate to login
      if (!error) {
        navigate('/admin/login');
      }
    } catch (err) {
      console.error('Signup error:', err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Signup</h1>
          <div style={styles.logoContainer}>
            <span style={styles.logoIcon}>🐺</span>
            <span style={styles.logoText}>Wolf Admin</span>
          </div>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          {(error || formError) && (
            <div style={styles.errorMessage}>
              {formError || error}
              <button 
                type="button" 
                style={styles.errorCloseBtn} 
                onClick={() => {
                  setFormError('');
                  clearError();
                }}
              >
                ×
              </button>
            </div>
          )}

          <div style={styles.formGroup}>
            <label htmlFor="username" style={styles.label}>Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              disabled={loading}
              style={styles.input}
            />
          </div>

          <button 
            type="submit" 
            style={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.footer}>
          Already have an account? <Link to="/admin/login" style={styles.link}>Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup; 