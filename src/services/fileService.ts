export interface ProcessedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  preview?: string;
  metadata?: Record<string, any>;
  uploadedAt: Date;
}

class FileService {
  private readonly enabled = import.meta.env.VITE_ENABLE_FILE_UPLOAD === 'true';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly supportedTypes = {
    text: ['.txt', '.md', '.json', '.csv', '.log'],
    document: ['.pdf', '.doc', '.docx'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    code: ['.js', '.ts', '.py', '.java', '.cpp', '.html', '.css', '.xml']
  };

  async processFile(file: File): Promise<ProcessedFile> {
    if (!this.enabled) {
      throw new Error('File upload is not enabled');
    }

    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`);
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.isTypeSupported(extension)) {
      throw new Error(`File type ${extension} is not supported`);
    }

    const processedFile: ProcessedFile = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      content: '',
      uploadedAt: new Date()
    };

    try {
      if (this.isTextFile(extension)) {
        processedFile.content = await this.readTextFile(file);
      } else if (this.isImageFile(extension)) {
        processedFile.content = await this.processImage(file);
        processedFile.preview = await this.createImagePreview(file);
      } else if (extension === '.json') {
        processedFile.content = await this.readTextFile(file);
        try {
          processedFile.metadata = JSON.parse(processedFile.content);
        } catch {
          // Invalid JSON, treat as text
        }
      } else if (extension === '.csv') {
        processedFile.content = await this.readTextFile(file);
        processedFile.metadata = await this.parseCSV(processedFile.content);
      } else {
        // For other file types, just store basic info
        processedFile.content = `[${file.type || 'Unknown'} file: ${file.name}]`;
      }

      return processedFile;
    } catch (error) {
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processMultipleFiles(files: FileList | File[]): Promise<ProcessedFile[]> {
    const results: ProcessedFile[] = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      try {
        const processed = await this.processFile(file);
        results.push(processed);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Continue processing other files
      }
    }

    return results;
  }

  private isTypeSupported(extension: string): boolean {
    return Object.values(this.supportedTypes).some(types => types.includes(extension));
  }

  private isTextFile(extension: string): boolean {
    return [...this.supportedTypes.text, ...this.supportedTypes.code].includes(extension);
  }

  private isImageFile(extension: string): boolean {
    return this.supportedTypes.image.includes(extension);
  }

  private async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private async processImage(file: File): Promise<string> {
    // For images, we return a base64 representation or description
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract metadata
        const description = `Image file: ${file.name}, Size: ${(file.size / 1024).toFixed(1)}KB, Type: ${file.type}`;
        resolve(description);
      };
      reader.onerror = () => reject(new Error('Failed to process image'));
      reader.readAsDataURL(file);
    });
  }

  private async createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to create image preview'));
      reader.readAsDataURL(file);
    });
  }

  private async parseCSV(content: string): Promise<Record<string, any>> {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return { rows: 0, columns: 0 };

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => 
      line.split(',').reduce((obj, value, index) => {
        obj[headers[index]] = value.trim();
        return obj;
      }, {} as Record<string, string>)
    );

    return {
      headers,
      rows: rows.length,
      columns: headers.length,
      preview: rows.slice(0, 5), // First 5 rows as preview
      totalSize: content.length
    };
  }

  // Generate AI-friendly content for different file types
  generatePromptContext(files: ProcessedFile[]): string {
    if (files.length === 0) return '';

    let context = `I have ${files.length} file${files.length > 1 ? 's' : ''} to analyze:\n\n`;

    files.forEach((file, index) => {
      context += `**File ${index + 1}: ${file.name}**\n`;
      context += `- Type: ${file.type}\n`;
      context += `- Size: ${(file.size / 1024).toFixed(1)}KB\n`;
      
      if (file.metadata && file.name.endsWith('.csv')) {
        const meta = file.metadata;
        context += `- CSV Data: ${meta.rows} rows, ${meta.columns} columns\n`;
        context += `- Headers: ${meta.headers?.join(', ')}\n`;
      }

      // Include content based on file size
      if (file.content.length < 2000) {
        context += `- Content:\n\`\`\`\n${file.content}\n\`\`\`\n\n`;
      } else {
        context += `- Content Preview:\n\`\`\`\n${file.content.substring(0, 1000)}...\n\`\`\`\n\n`;
      }
    });

    context += 'Please analyze these files and provide insights or answer any questions about them.';
    
    return context;
  }

  // File export utilities
  exportFile(content: string, filename: string, type: string = 'text/plain'): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportJSON(data: any, filename: string): void {
    const content = JSON.stringify(data, null, 2);
    this.exportFile(content, filename, 'application/json');
  }

  exportMarkdown(content: string, filename: string): void {
    this.exportFile(content, filename, 'text/markdown');
  }

  exportCSV(data: any[], filename: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => 
        typeof row[header] === 'string' && row[header].includes(',') 
          ? `"${row[header]}"` 
          : row[header]
      ).join(','))
    ].join('\n');

    this.exportFile(csvContent, filename, 'text/csv');
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.enabled) {
      return { valid: false, error: 'File upload is not enabled' };
    }

    if (file.size > this.maxFileSize) {
      return { 
        valid: false, 
        error: `File size exceeds ${this.formatFileSize(this.maxFileSize)} limit` 
      };
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.isTypeSupported(extension)) {
      return { 
        valid: false, 
        error: `File type ${extension} is not supported. Supported types: ${Object.values(this.supportedTypes).flat().join(', ')}` 
      };
    }

    return { valid: true };
  }

  getSupportedTypes(): Record<string, string[]> {
    return { ...this.supportedTypes };
  }

  getMaxFileSize(): number {
    return this.maxFileSize;
  }
}

export const fileService = new FileService();