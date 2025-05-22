import { useState, useEffect } from 'react';
import styled from 'styled-components';
import AdminLayout from '../../components/AdminLayout';
import { getFiles, getCategories, deleteFile, type FileInfo } from '../../lib/db';
import { useTheme } from '../../theme/ThemeContext';
import { File, Image, Package, FileText, Edit, Trash2, Download, Plus, ChevronLeft, ChevronRight } from 'react-feather';

// Styled Components
const PageHeader = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--text-secondary);
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterSelect = styled.select`
  background-color: rgba(36, 42, 56, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  min-width: 200px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const SearchInput = styled.input`
  background-color: rgba(36, 42, 56, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  flex: 1;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const FilesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FileCard = styled.div`
  background-color: rgba(36, 42, 56, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow);
  }
`;

const FileIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: var(--accent-color);

  svg {
    width: 32px;
    height: 32px;
    stroke-width: 1.5px;
  }
`;

const FileName = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  word-break: break-word;
`;

const FileDetails = styled.div`
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const FileDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  flex-grow: 1;
`;

const FileActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
`;

const ActionButton = styled.button`
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  svg {
    width: 16px;
    height: 16px;
    stroke-width: 2px;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  &.primary {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }

  &.danger {
    border-color: #e53e3e;
    color: #e53e3e;

    &:hover {
      background-color: rgba(229, 62, 62, 0.1);
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: rgba(36, 42, 56, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 2rem;

  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--accent-color);
  animation: spin 1s ease-in-out infinite;
  margin-right: 10px;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
`;

const PageButton = styled.button`
  background-color: rgba(36, 42, 56, 0.5);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  width: 40px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }

  &.active {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ScriptFiles = () => {
  const { colors } = useTheme();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [filesData, categoriesData] = await Promise.all([
          getFiles(selectedCategory || undefined),
          getCategories()
        ]);
        setFiles(filesData);
        
        // Transform the categories data to match our expected type
        const formattedCategories = categoriesData.map((cat: any) => ({
          id: cat.id,
          name: cat.name
        }));
        setCategories(formattedCategories);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteFile = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(id);
        setFiles(files.filter(file => file.id !== id));
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file. Please try again.');
      }
    }
  };

  // Filter files based on search query
  const filteredFiles = files.filter(file => 
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstItem, indexOfLastItem);

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <Image />;
    if (fileType.includes('pdf')) return <FileText />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <Package />;
    if (fileType.includes('text')) return <FileText />;
    if (fileType.includes('msword') || fileType.includes('document')) return <FileText />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileText />;
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <FileText />;
    if (fileType.includes('video')) return <FileText />;
    if (fileType.includes('audio')) return <FileText />;
    if (fileType.includes('bat') || fileType.includes('exe') || fileType.includes('sh')) return <File />;
    return <File />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AdminLayout activePage="files">
      <PageHeader>
        <h1>Script Files</h1>
        <p>Manage all script files available for download</p>
      </PageHeader>

      <FiltersContainer>
        <FilterSelect 
          value={selectedCategory} 
          onChange={handleCategoryChange}
          style={{ backgroundColor: colors.background.paper, borderColor: colors.border }}
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </FilterSelect>

        <SearchInput 
          type="text" 
          placeholder="Search files..." 
          value={searchQuery} 
          onChange={handleSearchChange}
          style={{ backgroundColor: colors.background.paper, borderColor: colors.border }}
        />
      </FiltersContainer>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <LoadingSpinner />
          <p>Loading files...</p>
        </div>
      ) : currentFiles.length > 0 ? (
        <>
          <FilesGrid>
            {currentFiles.map(file => (
              <FileCard key={file.id} style={{ backgroundColor: colors.background.paper, borderColor: colors.border }}>
                <FileIcon>{getFileIcon(file.fileType)}</FileIcon>
                <FileName>{file.fileName}</FileName>
                <FileDetails>
                  <div>Category: {categories.find(c => c.id === file.category)?.name || file.category}</div>
                  <div>Size: {formatFileSize(file.size)}</div>
                  <div>Uploaded: {new Date(file.createdAt).toLocaleDateString()}</div>
                </FileDetails>
                <FileDescription>{file.description || 'No description provided'}</FileDescription>
                <FileActions>
                  <ActionButton className="primary" onClick={() => window.open(`/download/${file.id}`, '_blank')}>
                    <Download size={16} /> Download
                  </ActionButton>
                  <ActionButton onClick={() => window.location.href = `/admin/edit-file/${file.id}`}>
                    <Edit size={16} /> Edit
                  </ActionButton>
                  <ActionButton className="danger" onClick={() => handleDeleteFile(file.id)}>
                    <Trash2 size={16} /> Delete
                  </ActionButton>
                </FileActions>
              </FileCard>
            ))}
          </FilesGrid>

          {totalPages > 1 && (
            <Pagination>
              <PageButton 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </PageButton>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PageButton
                  key={page}
                  className={currentPage === page ? 'active' : ''}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PageButton>
              ))}
              
              <PageButton 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </PageButton>
            </Pagination>
          )}
        </>
      ) : (
        <EmptyState>
          <h3>No files found</h3>
          <p>
            {searchQuery 
              ? `No files match your search "${searchQuery}". Try a different search term.` 
              : selectedCategory 
                ? 'No files found in this category. Try selecting a different category.' 
                : 'No files have been uploaded yet.'}
          </p>
          <ActionButton className="primary" onClick={() => window.location.href = '/admin/upload'}>
            <Plus size={16} /> Upload New File
          </ActionButton>
        </EmptyState>
      )}
    </AdminLayout>
  );
};

export default ScriptFiles;
