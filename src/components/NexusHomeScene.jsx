import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import gsap from 'gsap';
import './NexusHomeScene.css';

function NexusHomeScene() {
  const mountRef = useRef(null);
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Store ref value for cleanup
    const currentMount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000509, 10, 50);

    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // Raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const mouseTarget = new THREE.Vector2();

    // Create particle planet with continent-like distribution
    const particleCount = 12000;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Simple procedural continent pattern using noise-like distribution
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 3 + Math.random() * 0.3;

      // Create continent-like clusters using simple procedural approach
      const continentSeed = Math.sin(theta * 3) * Math.cos(phi * 2);
      const continentFactor = continentSeed > -0.2 ? 1 : Math.random() * 0.5;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta) * continentFactor;
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * continentFactor;
      positions[i * 3 + 2] = radius * Math.cos(phi) * continentFactor;

      // Blue to cyan gradient
      const colorMix = Math.random();
      colors[i * 3] = 0; // R
      colors[i * 3 + 1] = 0.6 + colorMix * 0.3; // G
      colors[i * 3 + 2] = 0.8 + colorMix * 0.2; // B
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const planet = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(planet);

    // Node configuration
    const nodeConfigs = [
      {
        id: 0,
        label: 'Centros con telemetría',
        action: () => navigate('/centros'),
        color: 0x00e5ff,
        angle: 0,
        radius: 6,
        verticalOffset: 1
      },
      {
        id: 1,
        label: 'Interfaz Conversor Blocky',
        action: () => window.open('https://yunamuno.github.io/FP_Robotik_Interface_v2/', '_blank', 'noopener,noreferrer'),
        color: 0xa855f7,
        angle: Math.PI * 0.4,
        radius: 6.5,
        verticalOffset: -0.5
      },
      {
        id: 2,
        label: 'Control de validación código',
        action: () => navigate('/validacion'),
        color: 0xff33bb,
        angle: Math.PI * 0.8,
        radius: 6,
        verticalOffset: -1.5
      },
      {
        id: 3,
        label: 'Sistema de monitoreo',
        action: () => console.log('Acceso a nodo 4: Sistema de monitoreo'), // Placeholder as specified
        color: 0x10b981,
        angle: Math.PI * 1.2,
        radius: 6.5,
        verticalOffset: 0.5
      },
      {
        id: 4,
        label: 'Panel de configuración',
        action: () => console.log('Acceso a nodo 5: Panel de configuración'), // Placeholder as specified
        color: 0xfbbf24,
        angle: Math.PI * 1.6,
        radius: 6,
        verticalOffset: 1.2
      }
    ];

    // Create orbital nodes
    const nodes = [];
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    nodeConfigs.forEach((config) => {
      // Create glowing sphere for each node
      const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.9
      });
      const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);

      // Position node in orbit
      nodeMesh.position.x = Math.cos(config.angle) * config.radius;
      nodeMesh.position.y = Math.sin(config.angle) * config.radius * 0.5 + config.verticalOffset;
      nodeMesh.position.z = Math.sin(config.angle) * config.radius * 0.5;

      // Add glow sprite
      const spriteMaterial = new THREE.SpriteMaterial({
        map: createGlowTexture(config.color),
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.6
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(1.5, 1.5, 1);
      nodeMesh.add(sprite);

      nodeMesh.userData = {
        ...config,
        originalScale: 1,
        isHovered: false,
        orbiting: true,
        orbitSpeed: 0.002 * (config.id % 2 === 0 ? 1 : -1)
      };

      nodeGroup.add(nodeMesh);
      nodes.push(nodeMesh);
    });

    // Create glow texture for sprites
    function createGlowTexture(color) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      const c = new THREE.Color(color);
      gradient.addColorStop(0, `rgba(${c.r * 255}, ${c.g * 255}, ${c.b * 255}, 1)`);
      gradient.addColorStop(0.3, `rgba(${c.r * 255}, ${c.g * 255}, ${c.b * 255}, 0.6)`);
      gradient.addColorStop(1, `rgba(${c.r * 255}, ${c.g * 255}, ${c.b * 255}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    }

    // Mouse move handler
    function onMouseMove(event) {
      const rect = currentMount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Parallax target
      mouseTarget.x = mouse.x * 0.3;
      mouseTarget.y = mouse.y * 0.3;
    }

    // Click handler
    function onClick() {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodes);

      if (intersects.length > 0) {
        const node = intersects[0].object;
        // Log node access as specified in requirements
        console.log(`Acceso a nodo ${node.userData.id + 1}: ${node.userData.label}`);
        
        // Click animation
        gsap.to(node.scale, {
          x: 1.5,
          y: 1.5,
          z: 1.5,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
          onComplete: () => {
            node.userData.action();
          }
        });
      }
    }

    currentMount.addEventListener('mousemove', onMouseMove);
    currentMount.addEventListener('click', onClick);

    // Window resize handler
    function onWindowResize() {
      if (!currentMount) return;
      
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    }

    window.addEventListener('resize', onWindowResize);

    // Animation loop
    let animationId;
    function animate() {
      animationId = requestAnimationFrame(animate);

      // Rotate planet slowly
      planet.rotation.y += 0.0005;
      planet.rotation.x += 0.0003;

      // Smooth parallax effect
      camera.position.x += (mouseTarget.x - camera.position.x) * 0.05;
      camera.position.y += (mouseTarget.y - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      // Raycaster for hover detection
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodes);

      // Reset non-hovered nodes
      nodes.forEach(node => {
        if (!intersects.find(i => i.object === node)) {
          if (node.userData.isHovered) {
            node.userData.isHovered = false;
            node.userData.orbiting = true;
            setHoveredNode(null);
            
            gsap.to(node.scale, {
              x: node.userData.originalScale,
              y: node.userData.originalScale,
              z: node.userData.originalScale,
              duration: 0.3,
              ease: 'power2.out'
            });
            
            // Resume orbit
            gsap.to(node.userData, {
              orbitSpeed: 0.002 * (node.userData.id % 2 === 0 ? 1 : -1),
              duration: 0.5,
              ease: 'power2.out'
            });
          }
        }
      });

      // Apply hover effect
      if (intersects.length > 0) {
        const hoveredNodeObj = intersects[0].object;
        if (!hoveredNodeObj.userData.isHovered) {
          hoveredNodeObj.userData.isHovered = true;
          setHoveredNode(hoveredNodeObj.userData.id);
          
          gsap.to(hoveredNodeObj.scale, {
            x: hoveredNodeObj.userData.originalScale * 1.4,
            y: hoveredNodeObj.userData.originalScale * 1.4,
            z: hoveredNodeObj.userData.originalScale * 1.4,
            duration: 0.3,
            ease: 'power2.out'
          });
          
          // Slow down orbit smoothly
          gsap.to(hoveredNodeObj.userData, {
            orbitSpeed: 0,
            duration: 0.5,
            ease: 'power2.out'
          });
        }
      }

      // Animate orbital nodes
      nodes.forEach((node) => {
        if (node.userData.orbiting || node.userData.orbitSpeed !== 0) {
          node.userData.angle += node.userData.orbitSpeed;
          const config = nodeConfigs[node.userData.id];
          node.position.x = Math.cos(node.userData.angle) * config.radius;
          node.position.y = Math.sin(node.userData.angle) * config.radius * 0.5 + config.verticalOffset;
          node.position.z = Math.sin(node.userData.angle) * config.radius * 0.5;
        }
      });

      renderer.render(scene, camera);
    }

    // Initial animations
    gsap.from(planet.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 2,
      ease: 'power2.out'
    });

    nodes.forEach((node, index) => {
      gsap.from(node.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1,
        delay: 0.5 + index * 0.15,
        ease: 'back.out(1.7)'
      });
    });

    animate();

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      if (currentMount) {
        currentMount.removeEventListener('mousemove', onMouseMove);
        currentMount.removeEventListener('click', onClick);
      }
      window.removeEventListener('resize', onWindowResize);

      // Dispose geometries and materials
      particleGeometry.dispose();
      particleMaterial.dispose();
      
      nodes.forEach(node => {
        node.geometry.dispose();
        node.material.dispose();
        if (node.children[0]) {
          node.children[0].material.map.dispose();
          node.children[0].material.dispose();
        }
      });

      renderer.dispose();
      
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, [navigate]);

  // Get node labels for HTML overlay
  const nodeLabels = [
    { id: 0, label: 'Centros con telemetría', color: '#00e5ff' },
    { id: 1, label: 'Interfaz Conversor Blocky', color: '#a855f7' },
    { id: 2, label: 'Control de validación código', color: '#ff33bb' },
    { id: 3, label: 'Sistema de monitoreo', color: '#10b981' },
    { id: 4, label: 'Panel de configuración', color: '#fbbf24' }
  ];

  return (
    <div className="nexus-scene-container">
      <div className="scene-title">
        <h1>NEXUS CENTRAL</h1>
        <p>Sistema de Control Unificado</p>
      </div>
      <div ref={mountRef} className="nexus-canvas" />
      <div className="node-labels-container">
        {nodeLabels.map((node) => (
          <div
            key={node.id}
            className={`node-label ${hoveredNode === node.id ? 'hovered' : ''}`}
            style={{ '--label-color': node.color }}
          >
            {node.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NexusHomeScene;
