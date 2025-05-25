import type { FC, CSSProperties } from 'react';
import { useState } from 'react';
import '../../theme/theme.css';
import Navbar from '../../components/Navbar';
import { ExternalLink, Globe, Star, Calendar } from 'react-feather';

// Website project interface
interface WebsiteProject {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  category: string;
  technologies: string[];
  featured: boolean;
  launchDate: string;
  status: 'live' | 'development' | 'maintenance';
}

// Sample projects data
const websiteProjects: WebsiteProject[] = [
  {
    id: '1',
    title: 'Wolf YouTube Downloader',
    description: 'Fast, reliable, and powerful YouTube downloader. Get your favorite videos in high quality with just one click. No ads, no limits, just pure downloading power.',
    url: 'https://wolf-yt.zen0.space/',
    thumbnail: '/images/thumbnail-wolf-yt.png', // Wolf YT Downloader thumbnail
    category: 'Web Application',
    technologies: ['React', 'TypeScript', 'Node.js', 'YouTube API'],
    featured: true,
    launchDate: '2024',
    status: 'live'
  }
];

// Styled components
const StyledWebsite: Record<string, CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '7rem 2rem 2rem',
    minHeight: '100vh',
    backgroundColor: 'var(--background-main)',
    color: 'var(--text-primary)',
  },
  header: {
    marginBottom: '3rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)',
    fontWeight: 800,
    background: 'linear-gradient(135deg, var(--accent-color), #00d4aa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    marginBottom: '2rem',
    maxWidth: '600px',
    margin: '0 auto 2rem',
    lineHeight: 1.6,
  },
  filtersContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '3rem',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '0.8rem 1.5rem',
    borderRadius: '25px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'rgba(36, 42, 56, 0.5)',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(5px)',
  },
  filterButtonActive: {
    backgroundColor: 'var(--accent-color)',
    color: '#121212',
    borderColor: 'var(--accent-color)',
    fontWeight: 600,
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  projectCard: {
    backgroundColor: 'var(--background-paper)',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
  },
  projectCardHover: {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    borderColor: 'var(--accent-color)',
  },
  featuredBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: 'var(--accent-color)',
    color: '#121212',
    padding: '0.4rem 0.8rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    zIndex: 2,
  },
  statusBadge: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    padding: '0.4rem 0.8rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 600,
    zIndex: 2,
  },
  statusLive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    border: '1px solid rgba(34, 197, 94, 0.3)',
  },
  statusDevelopment: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    color: '#fbbf24',
    border: '1px solid rgba(251, 191, 36, 0.3)',
  },
  statusMaintenance: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: '200px',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  cardContent: {
    padding: '1.5rem',
  },
  projectTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
    lineHeight: 1.3,
  },
  projectDescription: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    marginBottom: '1rem',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  projectMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  category: {
    backgroundColor: 'rgba(0, 216, 122, 0.1)',
    color: 'var(--accent-color)',
    padding: '0.3rem 0.8rem',
    borderRadius: '15px',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  technologies: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  techTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-secondary)',
    padding: '0.3rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    border: '1px solid var(--border-color)',
  },
  cardActions: {
    display: 'flex',
    gap: '0.8rem',
  },
  visitButton: {
    flex: 1,
    backgroundColor: 'var(--accent-color)',
    color: '#121212',
    border: 'none',
    borderRadius: '8px',
    padding: '0.8rem 1rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
  },
  visitButtonHover: {
    backgroundColor: '#00b894',
    transform: 'translateY(-2px)',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: 'var(--text-secondary)',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)',
  },
  emptyDescription: {
    fontSize: '1rem',
    maxWidth: '400px',
    margin: '0 auto',
    lineHeight: 1.6,
  },
};

const Website: FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(websiteProjects.map(project => project.category)))];

  // Filter projects based on selected category
  const filteredProjects = selectedCategory === 'all' 
    ? websiteProjects 
    : websiteProjects.filter(project => project.category === selectedCategory);

  const handleVisitWebsite = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'live':
        return { ...StyledWebsite.statusBadge, ...StyledWebsite.statusLive };
      case 'development':
        return { ...StyledWebsite.statusBadge, ...StyledWebsite.statusDevelopment };
      case 'maintenance':
        return { ...StyledWebsite.statusBadge, ...StyledWebsite.statusMaintenance };
      default:
        return StyledWebsite.statusBadge;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return 'Live';
      case 'development':
        return 'In Development';
      case 'maintenance':
        return 'Maintenance';
      default:
        return status;
    }
  };

  return (
    <>
      <Navbar onDownloadClick={() => {}} />
      <div style={StyledWebsite.container}>
        <header style={StyledWebsite.header}>
          <h1 style={StyledWebsite.title}>Our Projects</h1>
          <p style={StyledWebsite.subtitle}>
            Explore our collection of web applications and digital solutions. 
            Each project represents our commitment to creating powerful, user-friendly tools.
          </p>
        </header>

        <div style={StyledWebsite.filtersContainer}>
          {categories.map(category => (
            <button
              key={category}
              style={{
                ...StyledWebsite.filterButton,
                ...(selectedCategory === category ? StyledWebsite.filterButtonActive : {})
              }}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All Projects' : category}
            </button>
          ))}
        </div>

        {filteredProjects.length > 0 ? (
          <div style={StyledWebsite.projectsGrid}>
            {filteredProjects.map(project => (
              <div
                key={project.id}
                style={{
                  ...StyledWebsite.projectCard,
                  ...(hoveredCard === project.id ? StyledWebsite.projectCardHover : {})
                }}
                onMouseEnter={() => setHoveredCard(project.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {project.featured && (
                  <div style={StyledWebsite.featuredBadge}>
                    <Star size={12} />
                    Featured
                  </div>
                )}
                
                <div style={getStatusStyle(project.status)}>
                  {getStatusText(project.status)}
                </div>

                <div style={StyledWebsite.thumbnailContainer}>
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    style={{
                      ...StyledWebsite.thumbnail,
                      ...(hoveredCard === project.id ? { transform: 'scale(1.05)' } : {})
                    }}
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                  <div 
                    style={{
                      ...StyledWebsite.thumbnailOverlay,
                      ...(hoveredCard === project.id ? { opacity: 1 } : {})
                    }}
                  />
                </div>

                <div style={StyledWebsite.cardContent}>
                  <h3 style={StyledWebsite.projectTitle}>{project.title}</h3>
                  <p style={StyledWebsite.projectDescription}>{project.description}</p>
                  
                  <div style={StyledWebsite.projectMeta}>
                    <span style={StyledWebsite.category}>{project.category}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={12} />
                      {project.launchDate}
                    </span>
                  </div>

                  <div style={StyledWebsite.technologies}>
                    {project.technologies.map(tech => (
                      <span key={tech} style={StyledWebsite.techTag}>
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div style={StyledWebsite.cardActions}>
                    <button
                      style={{
                        ...StyledWebsite.visitButton,
                        ...(hoveredCard === project.id ? StyledWebsite.visitButtonHover : {})
                      }}
                      onClick={() => handleVisitWebsite(project.url)}
                    >
                      <ExternalLink size={16} />
                      Visit Website
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={StyledWebsite.emptyState}>
            <div style={StyledWebsite.emptyIcon}>
              <Globe />
            </div>
            <h3 style={StyledWebsite.emptyTitle}>No Projects Found</h3>
            <p style={StyledWebsite.emptyDescription}>
              No projects match the selected category. Try selecting a different category or check back later for new projects.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Website; 