"use client";

import { useState, useRef, useEffect } from "react";

interface ProgressPhotoProps {
  date: string;
  onClose: () => void;
  onSave: (photoData: string) => void;
  existingPhoto?: string;
  loadPhoto?: (date: string) => Promise<string | null>;
}

export default function ProgressPhoto({ date, onClose, onSave, existingPhoto, loadPhoto }: ProgressPhotoProps) {
  const [photo, setPhoto] = useState<string | null>(existingPhoto || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lazy load foto bij mount als deze nog niet geladen is
  useEffect(() => {
    if (!existingPhoto && loadPhoto) {
      setLoading(true);
      loadPhoto(date).then((photoPath) => {
        if (photoPath) {
          setPhoto(photoPath);
        }
        setLoading(false);
      });
    }
  }, [date, existingPhoto, loadPhoto]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!photo || !selectedFile) {
      console.log('No photo or file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('date', date);

    try {
      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.path);
        onClose();
      } else {
        console.error('Failed to upload photo');
        alert('Kon foto niet uploaden');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Fout bij uploaden foto');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/photos?date=${date}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPhoto(null);
        setSelectedFile(null);
        onSave('');
      } else {
        console.error('Failed to delete photo');
        alert('Kon foto niet verwijderen');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Fout bij verwijderen foto');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-800 rounded-lg shadow-lg max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-stone-800 dark:text-stone-200">
            Voortgangsfoto
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label="Sluiten"
          >
            <svg className="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-stone-600 dark:text-stone-400" suppressHydrationWarning>
          {new Date(date).toLocaleDateString('nl-NL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>

        {/* Photo Preview or Silhouette */}
        <div className="relative aspect-[3/4] bg-stone-100 dark:bg-stone-900 rounded-lg overflow-hidden">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-600 dark:border-stone-400"></div>
            </div>
          ) : photo ? (
            <>
              <img 
                src={photo.startsWith('data:') ? photo : `${photo}?t=${Date.now()}`} 
                alt="Voortgangsfoto" 
                className="w-full h-full object-cover" 
              />
            </>
          ) : (
            <>
              <img 
                src="/progress_example_woman.png" 
                alt="Voorbeeld voortgangsfoto" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white font-medium text-sm uppercase tracking-wider">Example</span>
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        {!photo && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">📸 Tips voor de beste foto:</p>
            <ul className="space-y-1 text-xs">
              <li>• Sta recht met je <strong>rug naar de camera</strong></li>
              <li>• Armen langs je lichaam</li>
              <li>• Goede verlichting</li>
              <li>• Gebruik dezelfde achtergrond</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {photo ? (
            <>
              <button
                onClick={handleSave}
                className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
              >
                Opslaan
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
              >
                Foto verwijderen
              </button>
            </>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Foto maken / uploaden
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
