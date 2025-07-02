import { useEffect, useRef } from "react";
import { initializeSTLViewer } from "@/lib/three-utils";
import { Box } from "lucide-react";

interface STLViewerProps {
  stlUrl?: string;
  className?: string;
}

export function STLViewer({ stlUrl, className = "" }: STLViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;

    if (stlUrl) {
      cleanup = initializeSTLViewer(containerRef.current, stlUrl);
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

  return (
    <div 
      ref={containerRef} 
      className={`bg-gradient-to-br from-gray-100 to-gray-200 ${className}`}
    />
  );
}
