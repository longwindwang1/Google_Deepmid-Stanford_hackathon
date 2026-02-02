import React, { useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { FileData } from '../types';

interface FileUploadProps {
  onFileSelect: (data: FileData | null) => void;
  selectedFile: FileData | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile }) => {

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 data (remove data:image/png;base64, prefix)
      const base64Content = result.split(',')[1];
      const mimeType = result.split(',')[0].match(/:(.*?);/)?.[1] || 'image/jpeg';

      onFileSelect({
        file,
        previewUrl: result,
        base64: base64Content,
        mimeType: mimeType
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  if (selectedFile) {
    return (
      <div className="relative group rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm">
        <img 
          src={selectedFile.previewUrl} 
          alt="Floor Plan Preview" 
          className="w-full h-64 object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button 
            onClick={() => onFileSelect(null)}
            className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-red-50 transition-colors"
          >
            <X size={18} /> Remove Image
          </button>
        </div>
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {selectedFile.file.name}
        </div>
      </div>
    );
  }

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-safety-500 hover:bg-safety-50 transition-all cursor-pointer bg-white min-h-[256px]"
    >
      <div className="bg-slate-100 p-4 rounded-full mb-4 text-slate-500">
        <Upload size={32} />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">Upload Floor Plan</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs">
        Drag and drop your factory layout image here, or click to browse.
      </p>
      
      <label className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-2">
        <ImageIcon size={18} />
        <span>Select Image</span>
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleChange}
        />
      </label>
      <p className="mt-4 text-xs text-slate-400">Supported: JPG, PNG, WEBP</p>
    </div>
  );
};