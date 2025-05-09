import type { FC } from 'react'
import './App.css'
import './theme/theme.css'
import { useTheme } from './theme/ThemeContext'

// Theme toggle button component
const ThemeToggle: FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button 
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

// Components
const Navbar: FC = () => {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <span className="logo-icon">🐺</span>
        <span className="logo-text">Wolf</span>
      </div>
      <div className="nav-links">
        <a href="#scripts">Scripts</a>
        <a href="#windows">Windows</a>
        <a href="#adobe">Adobe</a>
        <a href="#tools">Tools</a>
      </div>
      <div className="nav-actions">
        <button className="btn-login">Log In</button>
        <button className="btn-primary">Download Now</button>
      </div>
    </nav>
  );
};

const WelcomeSection: FC = () => {
  return (
    <section className="welcome-section">
      <div className="welcome-content">
        <h1>Powerful Scripts & Tools<br />For Every Need</h1>
        <p className="subtitle">Streamline your system with automated solutions</p>
        <div className="cta-buttons">
          <button className="btn-primary">Download Scripts</button>
          <button className="btn-secondary">View Documentation</button>
        </div>
      </div>
    </section>
  )
}

const FeatureSection: FC = () => {
  const features = [
    {
      title: "Windows Activation",
      description: "Easily activate your Windows OS with our reliable activation scripts. Support for Windows 10 and 11.",
      icon: "🔑"
    },
    {
      title: "Adobe Firewall Block",
      description: "Block Adobe products from connecting to validation servers with our firewall configuration scripts.",
      icon: "🔒"
    },
    {
      title: "System Optimization",
      description: "Boost your system performance with our collection of optimization scripts and tools.",
      icon: "⚡"
    },
    {
      title: "Privacy Protection",
      description: "Enhance your privacy and security with tools designed to block telemetry and unwanted connections.",
      icon: "🛡️"
    }
  ]

  return (
    <section className="feature-section">
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const AppContent: FC = () => {
  return (
    <div className="app">
      <ThemeToggle />
      <Navbar />
      <main>
        <WelcomeSection />
        <FeatureSection />
      </main>
    </div>
  )
}

const App: FC = () => {
  return (
    <AppContent />
  )
}

export default App
