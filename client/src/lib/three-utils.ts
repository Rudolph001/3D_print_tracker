import * as THREE from 'three';

// Since we can't import Three.js modules directly, we'll use a CDN approach
declare global {
  interface Window {
    THREE: any;
    STLLoader: any;
  }
}

export function initializeSTLViewer(container: HTMLElement, stlUrl: string): (() => void) | undefined {
  // Check if Three.js is available
  if (typeof window === 'undefined' || !window.THREE) {
    console.warn('Three.js not available');
    return;
  }

  const scene = new window.THREE.Scene();
  const camera = new window.THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true });
  
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0xf5f5f5, 1);
  container.appendChild(renderer.domElement);

  // Add lighting
  const ambientLight = new window.THREE.AmbientLight(0x404040, 0.4);
  scene.add(ambientLight);

  const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Add orbit controls if available
  let controls: any;
  if (window.THREE.OrbitControls) {
    controls = new window.THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
  }

  // Load STL file
  if (window.STLLoader) {
    const loader = new window.STLLoader();
    loader.load(stlUrl, (geometry: any) => {
      const material = new window.THREE.MeshPhongMaterial({ 
        color: 0x00a8ff, 
        shininess: 100 
      });
      const mesh = new window.THREE.Mesh(geometry, material);
      
      // Center the geometry
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      const center = box.getCenter(new window.THREE.Vector3());
      geometry.translate(-center.x, -center.y, -center.z);
      
      scene.add(mesh);
      
      // Position camera
      const size = box.getSize(new window.THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      camera.position.set(maxDim, maxDim, maxDim);
      camera.lookAt(0, 0, 0);
    }, undefined, (error: any) => {
      console.error('Error loading STL file:', error);
    });
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    if (controls) {
      controls.update();
    }
    
    renderer.render(scene, camera);
  }
  animate();

  // Handle resize
  const handleResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener('resize', handleResize);

  // Cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
    renderer.dispose();
  };
}
