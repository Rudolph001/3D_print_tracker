
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

  // Clear container first
  container.innerHTML = '';

  const scene = new window.THREE.Scene();
  const camera = new window.THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true });
  
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0xf8f9fa, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = window.THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Add lighting
  const ambientLight = new window.THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // Add orbit controls if available
  let controls: any;
  if (window.THREE.OrbitControls) {
    controls = new window.THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
  }

  // Load STL file
  if (window.STLLoader) {
    const loader = new window.STLLoader();
    
    // Add error handling and success callback
    loader.load(
      stlUrl,
      (geometry: any) => {
        console.log('STL loaded successfully');
        
        // Create material with better appearance
        const material = new window.THREE.MeshPhongMaterial({ 
          color: 0x0ea5e9,
          shininess: 100,
          specular: 0x111111
        });
        
        const mesh = new window.THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Center and scale the geometry
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const center = box.getCenter(new window.THREE.Vector3());
        const size = box.getSize(new window.THREE.Vector3());
        
        // Move geometry to center
        geometry.translate(-center.x, -center.y, -center.z);
        
        scene.add(mesh);
        
        // Position camera based on object size
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
        
        camera.position.set(distance, distance, distance);
        camera.lookAt(0, 0, 0);
        
        if (controls) {
          controls.target.set(0, 0, 0);
          controls.update();
        }
      },
      (progress: any) => {
        console.log('Loading progress:', progress);
      },
      (error: any) => {
        console.error('Error loading STL file:', error);
        console.error('STL URL:', stlUrl);
        
        // Add error visualization
        const errorGeometry = new window.THREE.BoxGeometry(1, 1, 1);
        const errorMaterial = new window.THREE.MeshPhongMaterial({ color: 0xff6b6b });
        const errorMesh = new window.THREE.Mesh(errorGeometry, errorMaterial);
        scene.add(errorMesh);
        
        camera.position.set(2, 2, 2);
        camera.lookAt(0, 0, 0);
      }
    );
  } else {
    console.error('STLLoader not available');
  }

  // Animation loop
  let animationId: number;
  function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (controls) {
      controls.update();
    }
    
    renderer.render(scene, camera);
  }
  animate();

  // Handle resize
  const handleResize = () => {
    if (container.clientWidth > 0 && container.clientHeight > 0) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  };
  
  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);

  // Cleanup function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    resizeObserver.disconnect();
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
    renderer.dispose();
    if (controls) {
      controls.dispose();
    }
  };
}
