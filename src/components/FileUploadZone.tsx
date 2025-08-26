import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Code, 
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { fileService } from '@/services/fileService';

interface FileUploadZoneProps {
  onFilesUploaded: (files: FileList | File[]) => Promise<void>;
  onClose: () => void;
}

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  progress?: number;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesUploaded,
  onClose
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = fileService.getSupportedTypes();
  const maxFileSize = fileService.getMaxFileSize();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newUploadFiles: UploadFile[] = files.map(file => {
      const validation = fileService.validateFile(file);
      return {
        file,
        status: validation.valid ? 'pending' : 'error',
        error: validation.error
      };
    });

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  };

  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const validFiles = uploadFiles.filter(uf => uf.status === 'pending');
    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Simulate upload progress
      for (let i = 0; i < validFiles.length; i++) {
        const fileIndex = uploadFiles.findIndex(uf => uf.file === validFiles[i].file);
        
        setUploadFiles(prev => prev.map((uf, idx) => 
          idx === fileIndex ? { ...uf, status: 'uploading', progress: 0 } : uf
        ));

        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 20) {
          setUploadFiles(prev => prev.map((uf, idx) => 
            idx === fileIndex ? { ...uf, progress } : uf
          ));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setUploadFiles(prev => prev.map((uf, idx) => 
          idx === fileIndex ? { ...uf, status: 'success', progress: 100 } : uf
        ));
      }

      await onFilesUploaded(validFiles.map(uf => uf.file));
      onClose();
    } catch (error) {
      setUploadFiles(prev => prev.map(uf => 
        uf.status === 'uploading' ? { ...uf, status: 'error', error: 'Upload failed' } : uf
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <ImageIcon className="h-5 w-5" />;
    } else if (['js', 'ts', 'py', 'java', 'cpp', 'html', 'css'].includes(extension || '')) {
      return <Code className="h-5 w-5" />;
    } else {
      return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <Upload className="h-4 w-4 text-muted-foreground" />;
      case 'uploading':
        return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const validFiles = uploadFiles.filter(uf => uf.status === 'pending' || uf.status === 'success');
  const hasErrors = uploadFiles.some(uf => uf.status === 'error');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Upload Area */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            `}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`h-12 w-12 mx-auto mb-4 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-lg font-medium mb-2">
              {dragOver ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse files
            </p>
            <Button variant="outline" size="sm">
              Choose Files
            </Button>
          </div>

          {/* File Type Information */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Supported file types:</strong> {Object.values(supportedTypes).flat().join(', ')}
              <br />
              <strong>Maximum file size:</strong> {fileService.formatFileSize(maxFileSize)}
            </AlertDescription>
          </Alert>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <h4 className="font-medium mb-2">Selected Files ({uploadFiles.length})</h4>
              <div className="space-y-2">
                {uploadFiles.map((uploadFile, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                      {getFileIcon(uploadFile.file.name)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{uploadFile.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {fileService.formatFileSize(uploadFile.file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(uploadFile.status)}
                      
                      {uploadFile.status === 'uploading' && uploadFile.progress !== undefined && (
                        <div className="w-20">
                          <Progress value={uploadFile.progress} className="h-2" />
                        </div>
                      )}

                      {uploadFile.status !== 'uploading' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {hasErrors && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some files could not be uploaded. Please check the file types and sizes.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {validFiles.length > 0 && `${validFiles.length} file${validFiles.length !== 1 ? 's' : ''} ready to upload`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={validFiles.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {validFiles.length} file{validFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".txt,.md,.json,.csv,.log,.js,.ts,.py,.java,.cpp,.html,.css,.xml,.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx"
        />
      </DialogContent>
    </Dialog>
  );
};