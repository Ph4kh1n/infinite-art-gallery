'use client';

import { useRef, useEffect, memo, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useCameraContext } from '@/lib/CameraContext';
import { LayoutItem } from '@/lib/types';

interface AnimatedImageProps {
  item: LayoutItem;
  onClick: (item: LayoutItem) => void;
}

function AnimatedImageInner({ item, onClick }: AnimatedImageProps) {
  const { cameraRef, viewportRef } = useCameraContext();
  const divRef = useRef<HTMLDivElement>(null);

  const displayWidth = item.artwork.width * item.scale;
  const displayHeight = item.artwork.height * item.scale;
  const rot = item.rotation;

  const cam = cameraRef.current;
  const vp = viewportRef.current;
  const initScaledW = displayWidth * cam.zoom;
  const initScaledH = displayHeight * cam.zoom;
  const initSx = (item.position.x - cam.x * item.parallaxDepth) * cam.zoom;
  const initSy = (item.position.y - cam.y * item.parallaxDepth) * cam.zoom;
  const initFx = vp.width / 2 + initSx - initScaledW / 2;
  const initFy = vp.height / 2 + initSy - initScaledH / 2;

  const initInView =
    initFx + initScaledW > -200 &&
    initFx < vp.width + 200 &&
    initFy + initScaledH > -200 &&
    initFy < vp.height + 200;

  const hoverScale = useMotionValue(1);
  const springScale = useSpring(hoverScale, { stiffness: 300, damping: 20 });
  const hoverRotate = useMotionValue(0);
  const springRotate = useSpring(hoverRotate, { stiffness: 200, damping: 15 });
  const hoverBrightness = useMotionValue(1);
  const springBrightness = useSpring(hoverBrightness, { stiffness: 200, damping: 20 });

  const handleHoverStart = useCallback(() => {
    hoverScale.set(1.05);
    hoverRotate.set(rot * 0.3);
    hoverBrightness.set(1.1);
  }, [hoverScale, hoverRotate, hoverBrightness, rot]);

  const handleHoverEnd = useCallback(() => {
    hoverScale.set(1);
    hoverRotate.set(0);
    hoverBrightness.set(1);
  }, [hoverScale, hoverRotate, hoverBrightness]);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;

    function updatePosition(time: number) {
      const el = divRef.current;
      if (!el) return;
      const cam = cameraRef.current;
      const vp = viewportRef.current;

      const scaledW = displayWidth * cam.zoom;
      const scaledH = displayHeight * cam.zoom;

      const sx = (item.position.x - cam.x * item.parallaxDepth) * cam.zoom;
      const sy = (item.position.y - cam.y * item.parallaxDepth) * cam.zoom;
      const fx = vp.width / 2 + sx - scaledW / 2;
      const fy = vp.height / 2 + sy - scaledH / 2;

      const inView =
        fx + scaledW > -200 &&
        fx < vp.width + 200 &&
        fy + scaledH > -200 &&
        fy < vp.height + 200;

      if (inView) {
        el.style.display = 'block';
        el.style.width = scaledW + 'px';
        el.style.height = scaledH + 'px';
        el.style.opacity = String(item.opacity);
        el.style.transform = `translate3d(${fx}px, ${fy}px, 0) rotate(${rot}deg)`;
      } else {
        el.style.display = 'none';
      }

      requestAnimationFrame(updatePosition);
    }

    const rafId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(rafId);
  }, [cameraRef, viewportRef, displayWidth, displayHeight, item, rot]);

  const brightnessFilter = useTransform(springBrightness, (b) => `brightness(${b})`);

  if (!initInView) return null;

  return (
    <div
      ref={divRef}
      className="absolute top-0 left-0 will-change-transform"
      style={{
        zIndex: item.zIndex,
        width: initScaledW,
        height: initScaledH,
        transform: `translate3d(${initFx}px, ${initFy}px, 0) rotate(${rot}deg)`,
        opacity: item.opacity,
      }}
    >
      <motion.div
        className="w-full h-full overflow-hidden cursor-pointer"
        style={{ borderRadius: 4, scale: springScale, rotate: springRotate }}
        onClick={() => onClick(item)}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        data-hoverable
      >
        <motion.img
          src={item.artwork.src}
          alt={item.artwork.title}
          className="w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
          loading="lazy"
          style={{ filter: brightnessFilter }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white text-xs font-mono tracking-wider uppercase">
              {item.artwork.title}
            </p>
            <p className="text-white/60 text-[10px] font-mono mt-1">
              {item.artwork.artist} &middot; {item.artwork.year}
            </p>
          </div>
        </div>
      </motion.div>

      <div
        className="absolute -inset-1 pointer-events-none"
        style={{
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 6,
        }}
      />
    </div>
  );
}

export const AnimatedImage = memo(AnimatedImageInner);
