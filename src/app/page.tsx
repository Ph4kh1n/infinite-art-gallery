'use client';

import dynamic from 'next/dynamic';
import { CanvasScene } from '@/components/canvas/CanvasScene';
import { NavigationOverlay } from '@/components/ui/NavigationOverlay';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { Lightbox } from '@/components/ui/Lightbox';
import { AboutPanel } from '@/components/ui/AboutPanel';
import { ArchivePanel } from '@/components/ui/ArchivePanel';
import { GrainOverlay } from '@/components/effects/GrainOverlay';
import { MotionBlur } from '@/components/effects/MotionBlur';

const LoadingScreen = dynamic(
  () => import('@/components/ui/LoadingScreen').then((m) => ({ default: m.LoadingScreen })),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <LoadingScreen />
      <CanvasScene />
      <NavigationOverlay />
      <Lightbox />
      <AboutPanel />
      <ArchivePanel />
      <CustomCursor />
      <GrainOverlay />
      <MotionBlur />
    </main>
  );
}