"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicStory } from "@/lib/stories";
import { storyCtaHref } from "@/lib/stories";
import { advanceStoryIndex, retreatStoryIndex } from "@/lib/story-viewer";
import { optimizedImageUrl } from "@/lib/image";


interface HomeStoriesProps {
  stories: PublicStory[];
}

export function HomeStories({ stories }: HomeStoriesProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 for current segment
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const holdTimeoutRef = useRef<number | null>(null);
  const holdingRef = useRef(false);

  const activeStories = useMemo(() => stories.filter((s) => s && s.image), [stories]);
  const current = activeStories[index];

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const clearHoldTimeout = useCallback(() => {
    if (holdTimeoutRef.current != null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }, []);

  const closeViewer = useCallback(() => {
    stopRaf();
    clearHoldTimeout();
    holdingRef.current = false;
    setPaused(false);
    setProgress(0);
    elapsedRef.current = 0;
    setOpen(false);
  }, [clearHoldTimeout, stopRaf]);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= activeStories.length) {
        closeViewer();
        return;
      }
      stopRaf();
      elapsedRef.current = 0;
      setProgress(0);
      setIndex(nextIndex);
    },
    [activeStories.length, closeViewer, stopRaf]
  );

  const goNext = useCallback(() => {
    const next = advanceStoryIndex(index, activeStories.length);
    if (next == null) {
      closeViewer();
    } else {
      goTo(next);
    }
  }, [activeStories.length, closeViewer, goTo, index]);

  const goPrev = useCallback(() => {
    const prev = retreatStoryIndex(index, activeStories.length);
    goTo(prev);
  }, [activeStories.length, goTo, index]);

  const openAt = useCallback((i: number) => {
    setIndex(i);
    setProgress(0);
    elapsedRef.current = 0;
    setPaused(false);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open || !current) return;

    if (paused) {
      stopRaf();
      return;
    }

    const durationMs = Math.max(1, current.duration || 5) * 1000;
    startRef.current = performance.now() - elapsedRef.current;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      elapsedRef.current = elapsed;
      const p = Math.min(1, elapsed / durationMs);
      setProgress(p);
      if (p >= 1) {
        const next = advanceStoryIndex(index, activeStories.length);
        if (next == null) {
          closeViewer();
        } else {
          elapsedRef.current = 0;
          setProgress(0);
          setIndex(next);
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => stopRaf();
  }, [open, current, paused, index, activeStories.length, closeViewer, stopRaf]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, closeViewer, goNext, goPrev]);

  if (activeStories.length === 0) return null;

  const onPointerDown = (_e: React.PointerEvent) => {
    // Start hold-to-pause after short delay; quick tap will navigate.
    clearHoldTimeout();
    holdingRef.current = false;
    holdTimeoutRef.current = window.setTimeout(() => {
      holdingRef.current = true;
      setPaused(true);
    }, 180);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const wasHolding = holdingRef.current;
    clearHoldTimeout();
    holdingRef.current = false;
    if (wasHolding) {
      setPaused(false);
      return;
    }
    // Treat as tap navigation based on horizontal position.
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.33) {
      goPrev();
    } else if (x > rect.width * 0.67) {
      goNext();
    }
    // middle third: no-op tap
  };

  const onPointerCancel = () => {
    const wasHolding = holdingRef.current;
    clearHoldTimeout();
    holdingRef.current = false;
    if (wasHolding) setPaused(false);
  };

  const ctaHref = current ? storyCtaHref(current) : null;
  const ctaLabel =
    current?.linkType === "product"
      ? "Ver producto"
      : current?.linkType === "offer"
        ? "Ver oferta"
        : null;

  return (
    <>
      <section className="container mx-auto px-4 pt-2 sm:px-6 lg:px-4" aria-label="Historias">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {activeStories.map((story, i) => (
            <button
              key={story.id}
              type="button"
              onClick={() => openAt(i)}
              className="relative h-44 w-28 shrink-0 snap-start overflow-hidden rounded-xl border bg-muted text-left sm:h-52 sm:w-32 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Abrir historia: ${story.name || "Historia"}`}
            >
              <Image
                src={optimizedImageUrl(story.image, 400)}
                alt={story.name || "Historia"}
                fill
                sizes="128px"
                className="object-cover"
                priority={i < 4}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-2">
                <p className="line-clamp-2 text-xs font-medium leading-tight text-white sm:text-sm">
                  {story.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {open && current && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          role="dialog"
          aria-modal="true"
          aria-label={current.name || "Historia"}
        >
          <div className="relative flex h-full w-full max-w-md flex-col sm:max-w-lg">
            {/* Progress bars */}
            <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
              {activeStories.map((s, i) => {
                const value = i < index ? 1 : i === index ? progress : 0;
                return (
                  <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                    <div
                      className="h-full rounded-full bg-white transition-[width] duration-75 ease-linear"
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={closeViewer}
              className="absolute right-2 top-8 z-30 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Cerrar historia"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Media + tap zones */}
            <div
              className="relative flex-1 select-none"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onPointerLeave={onPointerCancel}
            >
              {current.image ? (
                <Image
                  src={optimizedImageUrl(current.image, 1200)}
                  alt={current.name || "Historia"}
                  fill
                  sizes="(max-width: 768px) 100vw, 512px"
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-neutral-900" />
              )}

              {/* Gradient for legibility */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Name bottom-left */}
              <div className="pointer-events-none absolute bottom-24 left-4 right-4 z-10 sm:bottom-28">
                <p className="text-lg font-semibold text-white drop-shadow sm:text-xl">
                  {current.name}
                </p>
              </div>

              {/* Prev/Next hint buttons for accessibility/click targets */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white/90 hover:bg-black/50"
                aria-label="Historia anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white/90 hover:bg-black/50"
                aria-label="Siguiente historia"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Bottom CTA / reactions area (reactions wired in Task 5) */}
            <div className="absolute inset-x-0 bottom-0 z-20 space-y-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {ctaHref && ctaLabel && (
                <div className="flex justify-center">
                  <Link
                    href={ctaHref}
                    className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black shadow hover:bg-white/90"
                    onClick={closeViewer}
                  >
                    {ctaLabel}
                  </Link>
                </div>
              )}
              <div id="story-reactions-slot" data-story-id={current.id} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
