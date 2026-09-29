import React, { useState } from 'react';
import { 
  Upload, 
  Github, 
  FileArchive, 
  ArrowRight, 
  AlertCircle, 
  Code, 
  CheckCircle2, 
  Terminal, 
  FolderGit2,
  Sparkles
} from 'lucide-react';
import { Repository } from '../../types/index.ts';

export interface AnalysisRequestOptions {
  file?: File;
  githubUrl?: string;
}

interface UploadCardProps {
  onStartAnalysis: (repo: Repository, options?: AnalysisRequestOptions) => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  onStartAnalysis
}) => {
  const [githubUrl, setGithubUrl] = useState('');
  const [uploadMode, setUploadMode] = useState<'upload' | 'github'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
      setUploadedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      setUploadedFile(file);
    }
  };

  const handleStartAnalysis = () => {
    if (uploadMode === 'github' && githubUrl.trim()) {
      const name = githubUrl.split('/').pop()?.replace('.git', '') || 'repository';
      onStartAnalysis({
        id: name.toLowerCase(),
        name: name,
        branch: 'main',
        lastAnalyzed: '',
        fileCount: 0,
        language: 'Python',
        description: `Imported from ${githubUrl}`
      }, { githubUrl: githubUrl.trim() });
    } else if (uploadedFile) {
      const cleanName = uploadedFile.name.replace(/\.(zip|tar\.gz)$/i, '');
      onStartAnalysis({
        id: cleanName.toLowerCase(),
        name: cleanName,
        branch: 'main',
        lastAnalyzed: '',
        fileCount: 0,
        language: 'Python',
        description: 'Uploaded codebase archive'
      }, { file: uploadedFile });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Find the security debt <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-emerald-400">
            hiding inside your code.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-2xl mx-auto">
          Analyze Python source for structural patterns that can affect maintainability and reliability.
        </p>

        {/* Small product positioning text */}
        <div className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 border border-neutral-800 bg-neutral-900/60 px-3.5 py-1.5 rounded-full">
          <Terminal className="h-3.5 w-3.5 text-neutral-400" />
          <span>Python AST · Local Import Graph · Source Evidence</span>
        </div>
      </div>

      {/* Main Analysis Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="border-b border-neutral-800/80 pb-5">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Analyze your codebase
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Upload a ZIP file or connect a GitHub repository.
          </p>
        </div>

        {/* Upload Mode Switcher */}
        <div className="flex items-center gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800/80 max-w-md">
          <button
            onClick={() => setUploadMode('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              uploadMode === 'upload'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload ZIP</span>
          </button>

          <button
            onClick={() => setUploadMode('github')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              uploadMode === 'github'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Github className="h-4 w-4" />
            <span>Analyze GitHub Repository</span>
          </button>
        </div>

        {/* Upload Form */}
        {uploadMode === 'upload' ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              dragActive
                ? 'border-neutral-400 bg-neutral-800/40'
                : uploadedFileName
                ? 'border-emerald-500/50 bg-emerald-950/10'
                : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
            }`}
          >
            <input
              type="file"
              accept=".zip,.tar,.gz"
              id="file-upload-input"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300">
                {uploadedFileName ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : (
                  <FileArchive className="h-6 w-6 text-neutral-400" />
                )}
              </div>

              <div>
                {uploadedFileName ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white font-mono">{uploadedFileName}</p>
                    <p className="text-xs text-emerald-400">Ready for silent security debt extraction</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">
                      Drop your codebase archive (.zip) here, or <span className="text-amber-400 underline cursor-pointer">browse</span>
                    </p>
                    <p className="text-xs text-neutral-500">
                      Archive should contain Python source files for analysis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-xs font-mono text-neutral-400 block">
              Public or Private GitHub Repository URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Github className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/organization/repository"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-white placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-3">
          <button
            onClick={handleStartAnalysis}
            disabled={uploadMode === 'upload' ? !uploadedFile : !githubUrl.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-bold text-sm transition-all shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Run CodeSentinel Analysis</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Supported Language Note */}
        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-neutral-400 font-mono">
          <Code className="h-3.5 w-3.5 text-neutral-500" />
          <span>Python source analysis</span>
        </div>
      </div>

      {/* Mandatory Product Disclaimer */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/70 p-4 max-w-2xl mx-auto flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
        <p className="text-xs text-neutral-400 leading-relaxed">
          <strong>Important notice:</strong> CodeSentinel identifies architectural risk patterns. It does not determine whether code was written by AI.
        </p>
      </div>
    </div>
  );
};
