import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Play, RotateCcw, Volume2, VolumeX, Sparkles, Trophy, Flame } from 'lucide-react';

interface ThreeGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreeGameModal: React.FC<ThreeGameModalProps> = ({ isOpen, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'title' | 'playing' | 'gameover'>('title');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(45);
  const [isMuted, setIsMuted] = useState(false);

  // Refs for loop state without React re-renders
  const gameLoopRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    player?: THREE.Group;
    roadTiles: THREE.Group[];
    obstacles: THREE.Group[];
    pickups: THREE.Group[];
    particles: THREE.Points;
    keys: { left: boolean; right: boolean; boost: boolean };
    playerX: number;
    playerTargetX: number;
    speed: number;
    distance: number;
    score: number;
    coins: number;
    running: boolean;
    audioCtx?: AudioContext;
    shake: number;
  }>({
    roadTiles: [],
    obstacles: [],
    pickups: [],
    particles: {} as THREE.Points,
    keys: { left: false, right: false, boost: false },
    playerX: 0,
    playerTargetX: 0,
    speed: 0.6,
    distance: 0,
    score: 0,
    coins: 0,
    running: false,
    shake: 0,
  });

  // Sound Synth Helpers
  const playSound = (type: 'coin' | 'crash' | 'boost' | 'start') => {
    if (isMuted) return;
    try {
      if (!gameLoopRef.current.audioCtx) {
        gameLoopRef.current.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = gameLoopRef.current.audioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'boost') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.25);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Audio fallback
    }
  };

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Studio PBR Lighting Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 4.5, 9);
    camera.lookAt(0, 1.2, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Warm Key Light & Cool Fill
    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    dirLight.position.set(15, 25, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.8);
    scene.add(hemiLight);

    // 2. Procedural Player Vehicle: Composite 9-part Namma Auto-Rickshaw
    const playerGroup = new THREE.Group();

    // Body chassis (Yellow auto body)
    const bodyGeo = new THREE.BoxGeometry(1.4, 0.9, 2.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.2 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.8;
    bodyMesh.castShadow = true;
    playerGroup.add(bodyMesh);

    // Black canvas roof (Classic Indian auto canopy)
    const roofGeo = new THREE.CylinderGeometry(0.72, 0.76, 1.9, 16, 1, false, 0, Math.PI);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.rotation.z = Math.PI / 2;
    roofMesh.rotation.y = Math.PI / 2;
    roofMesh.position.set(0, 1.45, 0.1);
    playerGroup.add(roofMesh);

    // Windshield & Frame
    const glassGeo = new THREE.PlaneGeometry(1.2, 0.6);
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.6, roughness: 0.1, transmission: 0.8 });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(0, 1.15, -0.9);
    glassMesh.rotation.x = 0.15;
    playerGroup.add(glassMesh);

    // Headlight (Glowing emission)
    const lightGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16);
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 2 });
    const lightMesh = new THREE.Mesh(lightGeo, lightMat);
    lightMesh.rotation.x = Math.PI / 2;
    lightMesh.position.set(0, 0.65, -1.1);
    playerGroup.add(lightMesh);

    // Wheels (3 wheels: 1 front, 2 rear)
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });

    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.35, -0.9);
    playerGroup.add(frontWheel);

    const rearLeft = new THREE.Mesh(wheelGeo, wheelMat);
    rearLeft.rotation.z = Math.PI / 2;
    rearLeft.position.set(-0.75, 0.35, 0.7);
    playerGroup.add(rearLeft);

    const rearRight = new THREE.Mesh(wheelGeo, wheelMat);
    rearRight.rotation.z = Math.PI / 2;
    rearRight.position.set(0.75, 0.35, 0.7);
    playerGroup.add(rearRight);

    // Soft Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.8, 2.6);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.02;
    playerGroup.add(shadowMesh);

    scene.add(playerGroup);

    // 3. Procedural Road Tiles & Scenery (Marina Beach Promenade)
    const roadTiles: THREE.Group[] = [];
    const roadWidth = 9;
    const tileLength = 30;

    for (let i = 0; i < 5; i++) {
      const tile = new THREE.Group();
      tile.position.z = -i * tileLength;

      // Asphalt Road
      const roadGeo = new THREE.PlaneGeometry(roadWidth, tileLength);
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.receiveShadow = true;
      tile.add(roadMesh);

      // Yellow Center Dash
      for (let d = -tileLength / 2 + 2; d < tileLength / 2; d += 6) {
        const dashGeo = new THREE.PlaneGeometry(0.2, 3);
        const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const dashMesh = new THREE.Mesh(dashGeo, dashMat);
        dashMesh.rotation.x = -Math.PI / 2;
        dashMesh.position.set(0, 0.01, d);
        tile.add(dashMesh);
      }

      // Sidewalks & Marina Beach Sand
      const sidewalkLeftGeo = new THREE.PlaneGeometry(12, tileLength);
      const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 }); // Golden sand
      const sandMesh = new THREE.Mesh(sidewalkLeftGeo, sidewalkMat);
      sandMesh.rotation.x = -Math.PI / 2;
      sandMesh.position.set(-roadWidth / 2 - 6, 0, 0);
      tile.add(sandMesh);

      const citySideGeo = new THREE.PlaneGeometry(12, tileLength);
      const citySideMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
      const cityMesh = new THREE.Mesh(citySideGeo, citySideMat);
      cityMesh.rotation.x = -Math.PI / 2;
      cityMesh.position.set(roadWidth / 2 + 6, 0, 0);
      tile.add(cityMesh);

      // Palm Trees on Beach Promenade
      for (let p = -tileLength / 2 + 5; p < tileLength / 2; p += 10) {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(-roadWidth / 2 - 3.5, 0, p);

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 4.5, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2.25;
        treeGroup.add(trunk);

        // Palm Crown
        const crownGeo = new THREE.ConeGeometry(2.2, 1.6, 6);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.y = 4.8;
        treeGroup.add(crown);

        tile.add(treeGroup);
      }

      // Temple Gopuram / Architecture silhouette in distance
      if (i % 2 === 0) {
        const gopuram = new THREE.Group();
        gopuram.position.set(roadWidth / 2 + 5, 0, 0);
        for (let tier = 0; tier < 4; tier++) {
          const tierW = 3.5 - tier * 0.7;
          const tierGeo = new THREE.BoxGeometry(tierW, 1.4, tierW);
          const tierMat = new THREE.MeshStandardMaterial({ color: tier % 2 === 0 ? 0xd97706 : 0xb45309 });
          const tierMesh = new THREE.Mesh(tierGeo, tierMat);
          tierMesh.position.y = 0.7 + tier * 1.3;
          gopuram.add(tierMesh);
        }
        tile.add(gopuram);
      }

      scene.add(tile);
      roadTiles.push(tile);
    }

    // 4. Particle Dust System
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount * 3; p += 3) {
      positions[p] = (Math.random() - 0.5) * 20;
      positions[p + 1] = Math.random() * 4 + 0.5;
      positions[p + 2] = -Math.random() * 80;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0xfef08a, size: 0.15, transparent: true, opacity: 0.6 });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Save game refs
    gameLoopRef.current = {
      renderer,
      scene,
      camera,
      player: playerGroup,
      roadTiles,
      obstacles: [],
      pickups: [],
      particles: particleSystem,
      keys: { left: false, right: false, boost: false },
      playerX: 0,
      playerTargetX: 0,
      speed: 0.7,
      distance: 0,
      score: 0,
      coins: 0,
      running: true,
      shake: 0,
    };

    // Spawn Obstacle (Bus / Car)
    const spawnObstacle = (z: number) => {
      const obsGroup = new THREE.Group();
      const lanes = [-2.8, 0, 2.8];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      obsGroup.position.set(lane, 0, z);

      const isBus = Math.random() > 0.5;
      const obsGeo = new THREE.BoxGeometry(isBus ? 1.8 : 1.5, isBus ? 1.8 : 0.9, isBus ? 4.2 : 2.5);
      const obsMat = new THREE.MeshStandardMaterial({
        color: isBus ? 0xef4444 : 0x0284c7, // Metropolitan Red Bus or Blue Car
        roughness: 0.4,
      });
      const obsMesh = new THREE.Mesh(obsGeo, obsMat);
      obsMesh.position.y = isBus ? 0.9 : 0.45;
      obsMesh.castShadow = true;
      obsGroup.add(obsMesh);

      scene.add(obsGroup);
      gameLoopRef.current.obstacles.push(obsGroup);
    };

    // Spawn Golden Coin
    const spawnCoin = (z: number) => {
      const coinGroup = new THREE.Group();
      const lanes = [-2.8, 0, 2.8];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      coinGroup.position.set(lane, 0.9, z);

      const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
      const coinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2, emissive: 0xeab308, emissiveIntensity: 0.4 });
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.rotation.x = Math.PI / 2;
      coinGroup.add(coinMesh);

      scene.add(coinGroup);
      gameLoopRef.current.pickups.push(coinGroup);
    };

    // Pre-populate initial track objects
    for (let z = -30; z > -120; z -= 18) {
      if (Math.random() > 0.3) spawnObstacle(z);
      if (Math.random() > 0.4) spawnCoin(z + 8);
    }

    // 5. Input handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameLoopRef.current.keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameLoopRef.current.keys.right = true;
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        gameLoopRef.current.keys.boost = true;
        playSound('boost');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameLoopRef.current.keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameLoopRef.current.keys.right = false;
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        gameLoopRef.current.keys.boost = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 6. Lossless 60fps Game Loop
    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const state = gameLoopRef.current;
      if (state.running) {
        // Player Lateral Steer (exponential damping)
        const moveSpeed = 9;
        if (state.keys.left) state.playerTargetX = Math.max(state.playerTargetX - moveSpeed * dt, -3.2);
        if (state.keys.right) state.playerTargetX = Math.min(state.playerTargetX + moveSpeed * dt, 3.2);

        state.playerX += (state.playerTargetX - state.playerX) * (1 - Math.exp(-14 * dt));

        if (state.player) {
          state.player.position.x = state.playerX;
          // Natural auto-rickshaw tilt when steering
          const steerTilt = (state.playerTargetX - state.playerX) * 0.25;
          state.player.rotation.z = -steerTilt;
          state.player.rotation.y = -steerTilt * 0.4;
        }

        // Speed calculation
        const baseSpeed = 0.65;
        const currentSpeed = state.keys.boost ? baseSpeed * 1.6 : baseSpeed;
        state.speed = currentSpeed;
        state.distance += currentSpeed * 60 * dt;
        state.score = Math.floor(state.distance + state.coins * 50);

        setScore(state.score);
        setSpeedKmh(Math.floor(currentSpeed * 75));

        // Scroll Road Tiles
        state.roadTiles.forEach((tile) => {
          tile.position.z += currentSpeed * 40 * dt;
          if (tile.position.z > 30) {
            tile.position.z -= 5 * 30;
          }
        });

        // Update Obstacles
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.position.z += currentSpeed * 40 * dt;

          // Collision Check with Player Auto
          const dx = Math.abs(obs.position.x - state.playerX);
          const dz = Math.abs(obs.position.z - (state.player?.position.z || 0));

          if (dx < 1.3 && dz < 1.8) {
            // Collision Crash
            state.running = false;
            state.shake = 0.8;
            playSound('crash');
            setGameState('gameover');
            setHighScore((prev) => Math.max(prev, state.score));
            break;
          }

          // Despawn & Recycle
          if (obs.position.z > 15) {
            scene.remove(obs);
            state.obstacles.splice(i, 1);
            spawnObstacle(-130);
          }
        }

        // Update Pickups (Coins)
        for (let j = state.pickups.length - 1; j >= 0; j--) {
          const coin = state.pickups[j];
          coin.position.z += currentSpeed * 40 * dt;
          coin.rotation.y += 3 * dt;

          // Collect Check
          const cdx = Math.abs(coin.position.x - state.playerX);
          const cdz = Math.abs(coin.position.z - (state.player?.position.z || 0));

          if (cdx < 1.2 && cdz < 1.4) {
            scene.remove(coin);
            state.pickups.splice(j, 1);
            state.coins += 1;
            setCoins(state.coins);
            playSound('coin');
            spawnCoin(-120);
            continue;
          }

          if (coin.position.z > 15) {
            scene.remove(coin);
            state.pickups.splice(j, 1);
            spawnCoin(-120);
          }
        }

        // Camera Follow with dynamic speed pull-back
        camera.position.x = state.playerX * 0.45;
        camera.position.z = 8 + (state.keys.boost ? 0.8 : 0);

        // Screen Shake decay
        if (state.shake > 0) {
          camera.position.x += (Math.random() - 0.5) * state.shake;
          camera.position.y = 4.5 + (Math.random() - 0.5) * state.shake;
          state.shake = Math.max(0, state.shake - 3 * dt);
        } else {
          camera.position.y = 4.5;
        }
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, [isOpen]);

  const startGame = () => {
    const s = gameLoopRef.current;
    s.playerX = 0;
    s.playerTargetX = 0;
    s.distance = 0;
    s.coins = 0;
    s.score = 0;
    s.shake = 0;
    s.running = true;
    setScore(0);
    setCoins(0);
    setGameState('playing');
    playSound('start');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
        {/* Top Control Bar */}
        <div className="absolute top-0 inset-x-0 h-14 px-4 flex items-center justify-between z-20 bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
              ந
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-wide">Chennai Cruiser 3D</span>
              <span className="text-[10px] text-amber-400">Marina Beach Auto Arcade</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D WebGL Canvas Container */}
        <div ref={containerRef} className="w-full h-full relative" />

        {/* HUD Overlay during Playing */}
        {gameState === 'playing' && (
          <div className="absolute top-16 inset-x-0 px-6 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xs px-4 py-2 rounded-xl border border-slate-800 text-white font-mono">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400">SCORE:</span>
                <span className="text-sm font-bold tabular-nums text-amber-300">{score}</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-slate-400">COINS:</span>
                <span className="text-sm font-bold tabular-nums text-yellow-300">{coins}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xs px-4 py-2 rounded-xl border border-slate-800 text-white font-mono flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-xs text-slate-400">SPEED:</span>
              <span className="text-sm font-bold tabular-nums text-rose-400">{speedKmh} km/h</span>
            </div>
          </div>
        )}

        {/* Mobile / Screen Touch Controls */}
        {gameState === 'playing' && (
          <div className="absolute bottom-6 inset-x-6 flex justify-between pointer-events-none z-20 sm:hidden">
            <div className="flex gap-2 pointer-events-auto">
              <button
                onTouchStart={() => (gameLoopRef.current.keys.left = true)}
                onTouchEnd={() => (gameLoopRef.current.keys.left = false)}
                className="w-14 h-14 rounded-2xl bg-slate-800/80 text-white text-lg font-bold border border-slate-700 active:bg-amber-600"
              >
                ◀
              </button>
              <button
                onTouchStart={() => (gameLoopRef.current.keys.right = true)}
                onTouchEnd={() => (gameLoopRef.current.keys.right = false)}
                className="w-14 h-14 rounded-2xl bg-slate-800/80 text-white text-lg font-bold border border-slate-700 active:bg-amber-600"
              >
                ▶
              </button>
            </div>
            <button
              onTouchStart={() => {
                gameLoopRef.current.keys.boost = true;
                playSound('boost');
              }}
              onTouchEnd={() => (gameLoopRef.current.keys.boost = false)}
              className="w-16 h-14 rounded-2xl bg-amber-600 text-white font-bold text-xs uppercase border border-amber-500 pointer-events-auto active:bg-amber-500"
            >
              Boost 🔥
            </button>
          </div>
        )}

        {/* Title Screen Modal */}
        {gameState === 'title' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/85 backdrop-blur-xs text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-500 text-white flex items-center justify-center font-bold text-4xl shadow-xl shadow-amber-500/20 mb-4 border border-amber-400">
              ந
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1">
              Chennai Cruiser 3D
            </h2>
            <p className="text-sm font-medium text-amber-400 mb-6">
              சென்னை மரினா கடற்கரை ஆட்டோ ரேஸ்
            </p>

            <div className="max-w-md bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 mb-8 space-y-2 text-left">
              <p>🛺 <strong>Steer:</strong> A / D or Left / Right arrow keys</p>
              <p>⚡ <strong>Turbo Boost:</strong> Spacebar or Up arrow key</p>
              <p>🪙 <strong>Objective:</strong> Collect gold coins and dodge red buses along Marina Beach promenade</p>
            </div>

            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START RIDE · தொடங்கு</span>
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xs text-center">
            <h2 className="text-3xl font-bold text-rose-500 mb-2">CRASH! விபத்து</h2>
            <p className="text-sm text-slate-300 mb-6">Nice attempt on Marina Beach road!</p>

            <div className="grid grid-cols-2 gap-4 max-w-xs w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 text-center font-mono">
              <div>
                <p className="text-xs text-slate-400">FINAL SCORE</p>
                <p className="text-xl font-bold text-amber-400 tabular-nums">{score}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">BEST</p>
                <p className="text-xl font-bold text-white tabular-nums">{highScore}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again · மீண்டும் விளையாடு</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700"
              >
                Back to Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
