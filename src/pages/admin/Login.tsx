import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, error, clearError, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to admin dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Basic validation
    if (!identifier || !password) {
      setFormError('All fields are required');
      return;
    }

    try {
      // Call login function from the auth context
      await login(identifier, password);
      
      // If no error after login, navigate to the redirect path
      if (!error) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div style={{ ...styles.container, background: 'var(--background-main)' }}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Login</h1>
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
            <label htmlFor="identifier" style={styles.label}>Username or Email</label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your username or email"
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
              placeholder="Enter your password"
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={styles.footer}>
          <p>Don't have an account? <Link to="/admin/signup" style={styles.link}>Sign up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login; 