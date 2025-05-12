import type { FC, CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../theme/theme.css';

// Styled components defined inline with proper CSS types
const StyledNavbar: Record<string, CSSProperties> = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 2rem',
    width: '90%',
    maxWidth: '1200px',
    position: 'fixed',
    top: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    backgroundColor: 'rgba(36, 38, 47, 0.9)',
    backdropFilter: 'blur(10px)',
    boxSizing: 'border-box',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
  },
  scrolled: {
    top: '0.5rem',
    width: '95%',
    backgroundColor: 'rgba(36, 38, 47, 0.95)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  navLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  logoIcon: {
    fontSize: '1.8rem',
    display: 'inline-block',
    marginBottom: '2px',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#4A90E2',
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
    margin: '0 1rem',
  },
  navLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '1rem',
    transition: 'color 0.2s ease',
    whiteSpace: 'nowrap',
    padding: '0.5rem 0',
    position: 'relative',
  },
  navLinkHover: {
    color: 'var(--text-primary)',
  },
  navLinkUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '0%',
    height: '2px',
    backgroundColor: 'var(--btn-primary-bg)',
    transition: 'width 0.3s ease',
  },
  navLinkUnderlineActive: {
    width: '100%',
  },
  navActions: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexShrink: 0,
  },
  btnLogin: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '5px',
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '0.9rem',
  },
  btnLoginHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  btnPrimary: {
    backgroundColor: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    fontWeight: 600,
    border: 'none',
    borderRadius: '5px',
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    fontSize: '0.9rem',
  },
  btnPrimaryHover: {
    backgroundColor: 'transparent',
    border: '2px solid var(--btn-primary-bg)',
    color: 'var(--btn-primary-bg)',
    padding: '6px 14px',
  },
};

// Media query helper function to apply responsive styles
const applyMediaStyles = (isMobile: boolean): Record<string, CSSProperties> => {
  if (!isMobile) return {};
  
  return {
    navbar: {
      padding: '0.75rem 1rem',
      width: '95%',
    },
    navLinks: {
      display: 'none',
    },
    btnLogin: {
      padding: '6px 12px',
      fontSize: '0.8rem',
    },
    btnPrimary: {
      padding: '6px 12px',
      fontSize: '0.8rem',
    },
    logoText: {
      fontSize: '1.3rem',
    },
  };
};

// Add a simple badge style
const comingSoonBadge: CSSProperties = {
  background: '#ffb347',
  color: '#222',
  fontSize: '0.7rem',
  fontWeight: 600,
  borderRadius: '6px',
  padding: '2px 7px',
  marginLeft: '8px',
  letterSpacing: '0.03em',
  verticalAlign: 'middle',
  display: 'inline-block',
};

interface NavbarProps {
  onDownloadClick?: () => void;
}

const Navbar: FC<NavbarProps> = ({ onDownloadClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [isHoveredPrimary, setIsHoveredPrimary] = useState(false);

  // Handle scrolling effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleDownloadClick = () => {
    if (onDownloadClick) {
      onDownloadClick();
    }
  };

  const mediaStyles = applyMediaStyles(isMobile);

  return (
    <nav style={{
      ...StyledNavbar.navbar,
      ...(isScrolled ? StyledNavbar.scrolled : {}),
      ...(mediaStyles.navbar || {})
    }}>
      <div style={StyledNavbar.navLogo}>
        <span style={StyledNavbar.logoIcon}>🐺</span>
        <span style={{
          ...StyledNavbar.logoText,
          ...(mediaStyles.logoText || {})
        }}>Wolf</span>
      </div>
      <div style={{
        ...StyledNavbar.navLinks,
        ...(mediaStyles.navLinks || {})
      }}>
        <Link 
          to="/scripts" 
          style={{
            ...StyledNavbar.navLink,
            ...(hoveredLink === 'scripts' ? StyledNavbar.navLinkHover : {})
          }}
          onMouseEnter={() => setHoveredLink('scripts')}
          onMouseLeave={() => setHoveredLink(null)}
        >
          Scripts
          <div style={{
            ...StyledNavbar.navLinkUnderline,
            ...(hoveredLink === 'scripts' ? StyledNavbar.navLinkUnderlineActive : {})
          }} />
        </Link>
        <span
          style={{
            ...StyledNavbar.navLink,
            cursor: 'not-allowed',
            opacity: 0.7,
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
          }}
          onMouseEnter={() => setHoveredLink('feedback')}
          onMouseLeave={() => setHoveredLink(null)}
          tabIndex={-1}
          aria-disabled="true"
        >
          Feedback
          <span style={comingSoonBadge}>Coming Soon</span>
          <div style={{
            ...StyledNavbar.navLinkUnderline,
            ...(hoveredLink === 'feedback' ? StyledNavbar.navLinkUnderlineActive : {})
          }} />
        </span>
        <Link 
          to="/support" 
          style={{
            ...StyledNavbar.navLink,
            ...(hoveredLink === 'support' ? StyledNavbar.navLinkHover : {})
          }}
          onMouseEnter={() => setHoveredLink('support')}
          onMouseLeave={() => setHoveredLink(null)}
        >
          Support
          <div style={{
            ...StyledNavbar.navLinkUnderline,
            ...(hoveredLink === 'support' ? StyledNavbar.navLinkUnderlineActive : {})
          }} />
        </Link>
        <span
          style={{
            ...StyledNavbar.navLink,
            cursor: 'not-allowed',
            opacity: 0.7,
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
          }}
          onMouseEnter={() => setHoveredLink('website')}
          onMouseLeave={() => setHoveredLink(null)}
          tabIndex={-1}
          aria-disabled="true"
        >
          Website
          <span style={comingSoonBadge}>Coming Soon</span>
          <div style={{
            ...StyledNavbar.navLinkUnderline,
            ...(hoveredLink === 'website' ? StyledNavbar.navLinkUnderlineActive : {})
          }} />
        </span>
      </div>
      <div style={StyledNavbar.navActions}>
        <button 
          style={{
            ...StyledNavbar.btnPrimary,
            ...(isHoveredPrimary ? StyledNavbar.btnPrimaryHover : {}),
            ...(mediaStyles.btnPrimary || {})
          }}
          onClick={handleDownloadClick}
          onMouseEnter={() => setIsHoveredPrimary(true)}
          onMouseLeave={() => setIsHoveredPrimary(false)}
        >
          DOWNLOAD
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 