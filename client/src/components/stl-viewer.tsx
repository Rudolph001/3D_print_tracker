
import { useEffect, useRef, useState } from "react";
import { initializeSTLViewer } from "@/lib/three-utils";
import { Box, AlertCircle, Loader2 } from "lucide-react";

interface STLViewerProps {
  stlUrl?: string;
  className?: string;
}

export function STLViewer({ stlUrl, className = "" }: STLViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;
    setIsLoading(true);
    setHasError(false);

    if (stlUrl) {
      // Check if Three.js is loaded
      if (typeof window !== 'undefined' && window.THREE && window.STLLoader) {
        try {
          cleanup = initializeSTLViewer(containerRef.current, stlUrl);
          
          // Set a timeout to hide loading after a reasonable time
          const loadingTimer = setTimeout(() => {
            setIsLoading(false);
          }, 3000);

          // Check if STL file is accessible
          fetch(stlUrl, { method: 'HEAD' })
            .then(response => {
              if (!response.ok) {
                throw new Error(`STL file not found: ${response.status}`);
              }
              setIsLoading(false);
              clearTimeout(loadingTimer);
            })
            .catch(error => {
              console.error('STL file check failed:', error);
              setHasError(true);
              setIsLoading(false);
              clearTimeout(loadingTimer);
            });

          return () => {
            clearTimeout(loadingTimer);
            if (cleanup) cleanup();
          };
        } catch (error) {
          console.error('STL Viewer initialization error:', error);
          setHasError(true);
          setIsLoading(false);
        }
      } else {
        // Wait for Three.js to load
        const checkThreeJS = setInterval(() => {
          if (window.THREE && window.STLLoader) {
            clearInterval(checkThreeJS);
            try {
              cleanup = initializeSTLViewer(containerRef.current!, stlUrl);
              setIsLoading(false);
            } catch (error) {
              console.error('STL Viewer initialization error:', error);
              setHasError(true);
              setIsLoading(false);
            }
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkThreeJS);
          if (isLoading) {
            setHasError(true);
            setIsLoading(false);
          }
        }, 5000);

        return () => {
          clearInterval(checkThreeJS);
          if (cleanup) cleanup();
        };
      }
    } else {
      setIsLoading(false);
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [stlUrl]);

  if (!stlUrl) {
    return (
      <div className={`bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Box className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">3D Preview</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">Failed to load 3D model</p>
          <p className="text-xs text-red-500 mt-1">Check console for details</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-gray-100 to-gray-200 relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 z-10">
          <div className="text-center">
            <Loader2 className="h-6 w-6 text-blue-500 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-gray-600">Loading 3D model...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
