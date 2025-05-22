import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import AdminLayout from '../../components/AdminLayout';
import { getFileInfo, getCategories, updateFile } from '../../lib/db';
import { useTheme } from '../../theme/ThemeContext';
import { FileText, Save, Upload, ArrowLeft } from 'react-feather';

// Styled Components
const PageHeader = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--text-secondary);
  }
`;

const BackButton = styled.button`
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }
`;

const FormContainer = styled.div`
  background-color: rgba(36, 42, 56, 0.5);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: rgba(36, 42, 56, 0.8);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: rgba(36, 42, 56, 0.8);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: rgba(36, 42, 56, 0.8);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
  }
`;

const FileUploadContainer = styled.div`
  border: 2px dashed var(--border-color);
  border-radius: 6px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--accent-color);
    background-color: rgba(255, 255, 255, 0.02);
  }
`;

const FileUploadIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  color: var(--accent-color);

  svg {
    width: 48px;
    height: 48px;
    stroke-width: 1px;
  }
`;

const FileDetails = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: rgba(36, 42, 56, 0.8);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const FileIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-color);

  svg {
    width: 24px;
    height: 24px;
  }
`;

const FileInfo = styled.div`
  flex: 1;

  h4 {
    margin: 0 0 0.25rem 0;
    font-weight: 500;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &.primary {
    background-color: var(--accent-color);
    border: 1px solid var(--accent-color);
    color: white;

    &:hover {
      opacity: 0.9;
    }

    &:disabled {
      background-color: rgba(74, 144, 226, 0.5);
      border-color: rgba(74, 144, 226, 0.5);
      cursor: not-allowed;
    }
  }

  &.secondary {
    background-color: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }
  }
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  margin-top: 0.5rem;
  font-size: 0.875rem;
`;

const SuccessMessage = styled.div`
  background-color: rgba(0, 216, 122, 0.1);
  border: 1px solid rgba(0, 216, 122, 0.2);
  color: #00d87a;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoMessage = styled.div`
  background-color: rgba(0, 123, 255, 0.1);
  color: #0056b3;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
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

interface FileData {
  id: string;
  fileName: string;
  fileType: string;
  description?: string;
  category: string;
  size: number;
}

const EditFile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<FileData | null>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading file information...');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError('File ID is missing');
          return;
        }

        const [fileData, categoriesData] = await Promise.all([
          getFileInfo(id),
          getCategories()
        ]);

        if (!fileData) {
          setError('File not found');
          return;
        }

        setFile(fileData);
        setFileName(fileData.fileName);
        setDescription(fileData.description || '');
        setCategory(fileData.category);

        // Transform the categories data to match our expected type
        const formattedCategories = categoriesData.map((cat: any) => ({
          id: cat.id,
          name: cat.name
        }));
        setCategories(formattedCategories);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load file data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if it's a zip file
      if (!selectedFile.type.includes('zip') && !selectedFile.name.endsWith('.zip')) {
        setError('Only ZIP files are allowed');
        return;
      }
      
      setNewFile(selectedFile);
      setError('');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!id) {
        throw new Error('File ID is missing');
      }

      // Prepare the update data
      const updateData: any = {
        fileName,
        description,
        category
      };

      // If a new file was uploaded, add its content
      if (newFile) {
        const fileContent = await newFile.arrayBuffer();
        updateData.fileType = newFile.type || 'application/zip';
        updateData.size = newFile.size;
        updateData.content = fileContent;
        
        // Add loading message for large files with size-specific information
        if (newFile.size > 5 * 1024 * 1024) {
          setLoading(true);
          
          // Different messages based on file size
          if (newFile.size > 45 * 1024 * 1024) {
            setLoadingMessage('Uploading very large file (>45MB). This may take some time and will be stored in the database...');
          } else if (newFile.size > 20 * 1024 * 1024) {
            setLoadingMessage('Uploading large file to cloud storage. This may take some time...');
          } else {
            setLoadingMessage('Uploading file to cloud storage...');
          }
        }
      }

      const success = await updateFile(id, updateData);
      if (success) {
        setSuccess(true);
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setNewFile(null);

        // Scroll to top to show success message
        window.scrollTo(0, 0);

        // Redirect back to files list after a delay
        setTimeout(() => {
          navigate('/admin/script-files');
        }, 2000);
      } else {
        throw new Error('Failed to update file');
      }
    } catch (error) {
      console.error('Error updating file:', error);
      setError(error instanceof Error ? error.message : 'Failed to update file');
    } finally {
      setSaving(false);
    }
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
        <div>
          <h1>Edit File</h1>
          <p>Update file details or replace the file content</p>
        </div>
        <BackButton onClick={() => navigate('/admin/script-files')}>
          <ArrowLeft size={16} /> Back to Files
        </BackButton>
      </PageHeader>

      {success && (
        <SuccessMessage>
          <strong>Success!</strong> File updated successfully. Redirecting to file list...
        </SuccessMessage>
      )}
      
      <InfoMessage>
        <strong>Note:</strong> Large files (over 5MB) will be automatically stored in cloud storage for better performance.
      </InfoMessage>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <LoadingSpinner />
          <p>{loadingMessage}</p>
        </div>
      ) : error && !file ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#e53e3e' }}>
          <p>{error}</p>
          <Button className="secondary" onClick={() => navigate('/admin/script-files')}>
            Back to Files
          </Button>
        </div>
      ) : file && (
        <form onSubmit={handleSubmit}>
          <FormContainer style={{ backgroundColor: colors.background.paper, borderColor: colors.border }}>
            <FormGroup>
              <Label htmlFor="fileName">File Name</Label>
              <Input 
                type="text" 
                id="fileName" 
                value={fileName} 
                onChange={(e) => setFileName(e.target.value)}
                required
                style={{ backgroundColor: colors.background.main, borderColor: colors.border }}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="description">Description</Label>
              <TextArea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                style={{ backgroundColor: colors.background.main, borderColor: colors.border }}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="category">Category</Label>
              <Select 
                id="category" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                required
                style={{ backgroundColor: colors.background.main, borderColor: colors.border }}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Current File</Label>
              <FileDetails style={{ backgroundColor: colors.background.main, borderColor: colors.border }}>
                <FileIcon>
                  <FileText />
                </FileIcon>
                <FileInfo>
                  <h4>{file.fileName}</h4>
                  <p>Size: {formatFileSize(file.size)}</p>
                  <p>Type: {file.fileType}</p>
                </FileInfo>
              </FileDetails>
            </FormGroup>

            <FormGroup>
              <Label>Replace File (ZIP files only)</Label>
              <FileUploadContainer 
                onClick={triggerFileInput}
                style={{ borderColor: newFile ? colors.accent : colors.border }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                  accept=".zip,application/zip,application/x-zip,application/x-zip-compressed"
                />
                <FileUploadIcon>
                  <Upload />
                </FileUploadIcon>
                <p>{newFile ? newFile.name : 'Click to select a new ZIP file'}</p>
                {newFile && (
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Size: {formatFileSize(newFile.size)}
                  </p>
                )}
              </FileUploadContainer>
              {error && <ErrorMessage>{error}</ErrorMessage>}
            </FormGroup>

            <ButtonContainer>
              <Button 
                type="button" 
                className="secondary" 
                onClick={() => navigate('/admin/script-files')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="primary" 
                disabled={saving}
              >
                {saving ? <LoadingSpinner /> : <Save size={18} />} 
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </ButtonContainer>
          </FormContainer>
        </form>
      )}
    </AdminLayout>
  );
};

export default EditFile;
