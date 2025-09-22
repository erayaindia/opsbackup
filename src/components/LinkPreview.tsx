import React, { useState, useEffect } from 'react';

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  favicon?: string;
  siteName?: string;
}

interface LinkPreviewProps {
  url: string;
  onClose: () => void;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ url, onClose }) => {
  const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchLinkPreview(url);
  }, [url]);

  const fetchLinkPreview = async (targetUrl: string) => {
    setLoading(true);
    setError(false);

    try {
      // For demo purposes, we'll create mock preview data
      // In a real implementation, you'd use a service like linkpreview.net or microlink.io
      const mockData: LinkPreviewData = {
        title: getPageTitle(targetUrl),
        description: `Preview for ${targetUrl}`,
        url: targetUrl,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(targetUrl).hostname}`,
        siteName: new URL(targetUrl).hostname,
      };

      setTimeout(() => {
        setPreviewData(mockData);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

  const getPageTitle = (url: string): string => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '').split('.')[0].charAt(0).toUpperCase() +
             hostname.replace('www.', '').split('.')[0].slice(1);
    } catch {
      return 'Link Preview';
    }
  };

  if (loading) {
    return (
      <div className="link-preview-card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !previewData) {
    return (
      <div className="link-preview-card">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-600 rounded"></div>
          <span className="text-sm text-gray-400 truncate">{url}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="link-preview-card">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-xs"
      >
        ×
      </button>

      <a
        href={previewData.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-gray-700 rounded p-3 transition-colors"
      >
        <div className="flex items-start space-x-3">
          {previewData.favicon && (
            <img
              src={previewData.favicon}
              alt=""
              className="w-4 h-4 mt-1 flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {previewData.title || previewData.url}
            </div>

            {previewData.description && (
              <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                {previewData.description}
              </div>
            )}

            <div className="text-xs text-gray-500 mt-1 truncate">
              {previewData.siteName || new URL(previewData.url).hostname}
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};