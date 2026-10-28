import React, { useState, useEffect } from 'react';
import { Download, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { MediaAttachment } from '../types';
import { fetchMediaBlobUrl, downloadMediaFile, getCachedMediaBlobUrl } from '../services/driveSync';
import { AudioPlayer } from './AudioPlayer';

interface MediaItemProps {
  media: MediaAttachment;
  isOutgoing: boolean;
  onImageClick?: (url: string) => void;
}

export const MediaItem: React.FC<MediaItemProps> = ({
  media,
  isOutgoing,
  onImageClick,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    () => (media.driveFileId ? getCachedMediaBlobUrl(media.driveFileId) || null : media.url || null)
  );
  const [isLoading, setIsLoading] = useState<boolean>(!resolvedUrl && !!media.driveFileId);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // If we already have a working blob URL or valid data/http URL, verify it
    if (resolvedUrl && !resolvedUrl.startsWith('blob:')) {
      return;
    }

    if (media.driveFileId) {
      const cached = getCachedMediaBlobUrl(media.driveFileId);
      if (cached) {
        setResolvedUrl(cached);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      fetchMediaBlobUrl(media.driveFileId)
        .then((url) => {
          if (isMounted) {
            setResolvedUrl(url);
            setIsLoading(false);
            setLoadError(false);
          }
        })
        .catch((err) => {
          console.warn('Failed to resolve drive media blob:', err);
          if (isMounted) {
            setIsLoading(false);
            setLoadError(true);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [media.driveFileId]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      if (media.driveFileId) {
        await downloadMediaFile(media.driveFileId, media.name);
      } else if (resolvedUrl) {
        const a = document.createElement('a');
        a.href = resolvedUrl;
        a.download = media.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not download file. Ensure you have access to the Google Drive folder.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (media.driveFileId) {
      setIsLoading(true);
      setLoadError(false);
      fetchMediaBlobUrl(media.driveFileId)
        .then((url) => {
          setResolvedUrl(url);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          setLoadError(true);
        });
    }
  };

  // Image Media
  if (media.type === 'image') {
    return (
      <div className="mb-2 rounded-md overflow-hidden bg-black/30 relative min-h-[140px] flex items-center justify-center">
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-6 space-y-2 text-xs text-[#8696a0]">
            <RefreshCw className="w-5 h-5 animate-spin text-[#00a884]" />
            <span>Loading image from Drive...</span>
          </div>
        )}

        {loadError && !isLoading && (
          <div className="flex flex-col items-center justify-center p-4 space-y-2 text-xs text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <span>Drive media unavailable</span>
            <button
              onClick={handleRetry}
              className="px-2 py-1 bg-[#202c33] hover:bg-[#2a3942] rounded text-[11px] text-[#00a884]"
            >
              Retry
            </button>
          </div>
        )}

        {resolvedUrl && !isLoading && !loadError && (
          <div className="relative group cursor-pointer w-full">
            <img
              src={resolvedUrl}
              alt={media.name}
              onClick={() => onImageClick?.(resolvedUrl)}
              className="max-h-72 w-full object-cover rounded hover:opacity-95 transition-opacity"
            />
            {/* Quick download button on hover */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Download image"
            >
              {isDownloading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Audio Voice Note
  if (media.type === 'audio') {
    if (isLoading) {
      return (
        <div className="p-2 flex items-center gap-2 text-xs text-[#8696a0]">
          <RefreshCw className="w-4 h-4 animate-spin text-[#00a884]" />
          <span>Loading voice note...</span>
        </div>
      );
    }
    if (loadError || !resolvedUrl) {
      return (
        <div className="p-2 flex items-center gap-2 text-xs text-amber-400">
          <AlertCircle className="w-4 h-4" />
          <span>Voice note not loaded</span>
          <button onClick={handleRetry} className="text-[#00a884] underline text-xs">
            Retry
          </button>
        </div>
      );
    }
    return (
      <div className="mb-1">
        <AudioPlayer src={resolvedUrl} duration={media.duration} isOutgoing={isOutgoing} />
      </div>
    );
  }

  // Document Media
  return (
    <div className="mb-2 p-2.5 bg-black/20 rounded-lg flex items-center justify-between gap-3 border border-white/5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 bg-[#00a884]/20 text-[#00a884] rounded">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-xs truncate text-[#e9edef]">{media.name}</p>
          <p className="text-[10px] text-[#8696a0]">
            {(media.size / 1024).toFixed(1)} KB • Drive File
          </p>
        </div>
      </div>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="p-1.5 hover:bg-white/10 rounded-full text-[#8696a0] hover:text-[#e9edef] transition-colors"
        title="Download file from Drive"
      >
        {isDownloading ? (
          <RefreshCw className="w-4 h-4 animate-spin text-[#00a884]" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};
