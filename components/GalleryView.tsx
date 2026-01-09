"use client";

import { useEffect, useState } from "react";

interface Photo {
  id: string;
  date: string;
  filename: string;
  path: string;
  createdAt: string;
}

interface GalleryViewProps {
  onClose: () => void;
}

export default function GalleryView({ onClose }: GalleryViewProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const response = await fetch('/api/photos');
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-white dark:hover:bg-stone-800 transition-colors"
            aria-label="Terug"
          >
            <svg className="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-light text-stone-800 dark:text-stone-100">
            Foto Galerij
          </h1>
          <div className="w-10"></div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-600 dark:border-stone-400"></div>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white dark:bg-stone-800 rounded-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-stone-400 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-stone-600 dark:text-stone-400">
              Nog geen voortgangsfoto's
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-500 mt-2">
              Upload je eerste foto om je voortgang te volgen
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-[3/4] bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden cursor-pointer group"
              >
                <img
                  src={`${photo.path}?t=${Date.now()}`}
                  alt={`Voortgangsfoto ${formatDate(photo.date)}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-medium">
                    {formatDate(photo.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Sluiten"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={`${selectedPhoto.path}?t=${Date.now()}`}
              alt={`Voortgangsfoto ${formatDate(selectedPhoto.date)}`}
              className="w-full h-auto rounded-lg"
            />
            <div className="text-center mt-4">
              <p className="text-white text-lg font-medium">
                {formatDate(selectedPhoto.date)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
