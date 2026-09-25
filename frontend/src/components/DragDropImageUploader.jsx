import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import getCroppedImg from '../utils/cropImage';

const DragDropImageUploader = ({ 
  onUploadSuccess, 
  currentImage, 
  aspect = 4 / 5, 
  multiple = false,
  disableCompression = false 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cropper state
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    if (!multiple && !disableCompression) {
      // Single upload: open cropper
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageToCrop(reader.result));
      reader.readAsDataURL(file);
    } else {
      // Multiple uploads or compression disabled: direct upload
      uploadFiles(acceptedFiles);
    }
  }, [multiple, disableCompression]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) {
        throw new Error("Failed to create crop. Canvas might be tainted due to CORS.");
      }
      const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
      await uploadFiles([file], true); // true = skip compression
      setImageToCrop(null); // Close cropper
    } catch (e) {
      console.error(e);
      setError('Failed to crop image. It may be due to browser caching issues.');
      setIsUploading(false);
    }
  };

  const uploadFiles = async (files, skipCompression = false) => {
    setIsUploading(true);
    setError(null);
    const uploadedUrls = [];

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };
      
      for (const file of files) {
        const fileToUpload = (skipCompression || disableCompression) ? file : await imageCompression(file, options);
        const formData = new FormData();
        formData.append('image', fileToUpload);

        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/upload`, formData);
        uploadedUrls.push(res.data.url);
      }
      
      if (multiple) {
        onUploadSuccess(uploadedUrls); // Send array of URLs
      } else {
        onUploadSuccess(uploadedUrls[0]); // Send single URL string
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload some images. Please check server connection.');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: multiple
  });

  return (
    <>
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors w-full ${
          isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-white/50 bg-[#1a1a1a]'
        }`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-primary uppercase tracking-widest">Uploading to Cloudinary...</p>
          </div>
        ) : currentImage ? (
          <div className="relative group overflow-hidden rounded mx-auto w-full bg-black flex justify-center" style={{ aspectRatio: aspect ? aspect : 'auto', maxHeight: '350px' }}>
          <img src={currentImage} alt="Uploaded preview" className="w-full h-full object-contain opacity-70 group-hover:opacity-30 transition-opacity" />
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
            <div className="text-center">
              <p className="text-sm text-white font-bold uppercase tracking-widest">Drag new image</p>
              <p className="text-xs text-gray-300 mt-1">or click to replace</p>
            </div>
            {!multiple && (
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation(); // prevent opening file dialog
                  setImageToCrop(currentImage);
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white text-white hover:text-black rounded-lg text-[10px] uppercase tracking-widest transition-colors backdrop-blur-md border border-white/30 font-bold"
              >
                Crop / Adjust Position
              </button>
            )}
          </div>
        </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-2">
            <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            <p className="text-sm text-white uppercase tracking-widest">Drag & Drop Image Here</p>
            <p className="text-xs text-gray-500">or click to browse files</p>
          </div>
        )}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* Cropper Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
              <h3 className="font-mirage text-white uppercase tracking-widest">Adjust Image</h3>
              <button type="button" onClick={() => setImageToCrop(null)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            
            <div className="relative w-full flex-1 min-h-[40vh] sm:min-h-[60vh] bg-black flex flex-col">
              <div className="relative flex-1 w-full">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  objectFit="contain"
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="px-8 py-4 bg-[#111] flex items-center gap-4 shrink-0 border-t border-white/10">
                <span className="text-white/50 text-xs uppercase tracking-widest">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            
            <div className="p-6 bg-[#0a0a0a] flex justify-end gap-4 shrink-0 border-t border-white/10">
              <button 
                type="button" 
                onClick={() => setImageToCrop(null)}
                className="px-6 py-2 rounded-xl text-white text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleCropSave}
                disabled={isUploading}
                className="px-6 py-2 rounded-xl bg-primary text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors"
              >
                {isUploading ? 'Saving...' : 'Save & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DragDropImageUploader;
