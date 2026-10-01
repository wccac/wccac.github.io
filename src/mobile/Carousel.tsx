import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type PropsWithChildren,
} from "react";

export type CarouselProps = PropsWithChildren<{
  className?: string;
  contentClassName?: string;
  ariaLabel?: string;
  showScrollbar?: boolean;
  draggingEnabled?: boolean;
  /** Center a complete item after release. Omit for free-scrolling rails. */
  snap?: "center";
  snapItemSelector?: string;
}>;

const physics = {
  friction: 2.1,
  velocityScale: 890,
  velocityTolerance: 18,
  bounceTension: 200,
  bounceFriction: 40,
  overdragScale: 0.5,
  maxOverdrag: 96,
  sampleWindow: 100,
  dragThreshold: 8,
  snapTension: 420,
  snapFriction: 29,
  snapProjection: 0.14,
} as const;

type Sample = { value: number; time: number };
type DragSession = {
  pointerId: number;
  startPrimary: number;
  startCross: number;
  startOffset: number;
  lastOffset: number;
  captured: boolean;
  dragged: boolean;
};

export function Carousel({
  className,
  contentClassName,
  ariaLabel,
  showScrollbar = false,
  draggingEnabled = true,
  snap,
  snapItemSelector,
  children,
}: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<DragSession | null>(null);
  const samplesRef = useRef<Sample[]>([]);
  const frameRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const overdragRef = useRef(0);
  const suppressClickRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [overdrag, setOverdrag] = useState(0);
  const [thumb, setThumb] = useState({ visible: false, offset: 0, size: 0 });

  const offset = useCallback((node: HTMLDivElement) => node.scrollLeft, []);
  const setOffset = useCallback((node: HTMLDivElement, value: number) => {
    node.scrollLeft = value;
  }, []);
  const clientSize = useCallback((node: HTMLDivElement) => node.clientWidth, []);
  const scrollSize = useCallback((node: HTMLDivElement) => node.scrollWidth, []);
  const maxOffset = useCallback((node: HTMLDivElement) => Math.max(0, scrollSize(node) - clientSize(node)), [clientSize, scrollSize]);

  const stopMotion = useCallback(() => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = null;
  }, []);
  const setRubberBand = useCallback((value: number) => {
    const next = Math.max(-physics.maxOverdrag, Math.min(physics.maxOverdrag, value));
    overdragRef.current = next;
    setOverdrag(next);
  }, []);

  const updateThumb = useCallback((visible = true) => {
    if (!showScrollbar || !scrollRef.current) return;
    const node = scrollRef.current;
    const viewport = clientSize(node);
    const content = scrollSize(node);
    const enabled = content > viewport + 2;
    const size = enabled ? Math.max(36, (viewport / content) * viewport) : 0;
    const track = Math.max(0, viewport - size - 8);
    const progress = offset(node) / Math.max(1, content - viewport);
    setThumb({ visible: visible && enabled, size, offset: enabled ? 4 + progress * track : 0 });
  }, [clientSize, offset, scrollSize, showScrollbar]);

  const springBack = useCallback((initialVelocity = 0) => {
    stopMotion();
    let position = overdragRef.current;
    let velocity = Math.max(-1400, Math.min(1400, initialVelocity));
    let previous: number | null = null;
    const tick = (time: number) => {
      const seconds = Math.min(0.034, ((previous === null ? 16 : time - previous) || 16) / 1000);
      previous = time;
      velocity += (-physics.bounceTension * position - physics.bounceFriction * velocity) * seconds;
      position += velocity * seconds;
      if (Math.abs(position) < 0.5 && Math.abs(velocity) < 0.5) {
        setRubberBand(0);
        frameRef.current = null;
        return;
      }
      setRubberBand(position);
      frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick);
  }, [setRubberBand, stopMotion]);

  const momentum = useCallback((node: HTMLDivElement, initialVelocity: number) => {
    let velocity = initialVelocity;
    let previous: number | null = null;
    const tick = (time: number) => {
      const seconds = (previous === null ? 16 : Math.min(34, time - previous)) / 1000;
      previous = time;
      velocity *= Math.exp(-physics.friction * seconds);
      if (Math.abs(velocity) < physics.velocityTolerance) {
        frameRef.current = null;
        updateThumb(true);
        return;
      }
      const next = offset(node) + velocity * seconds;
      const maximum = maxOffset(node);
      if (next < 0 || next > maximum) {
        setOffset(node, Math.max(0, Math.min(maximum, next)));
        // Match MobileScroll's edge convention: positive displacement at the
        // leading edge, negative displacement at the trailing edge.
        setRubberBand((next < 0 ? -next : maximum - next) * physics.overdragScale);
        springBack(velocity * physics.overdragScale);
        return;
      }
      setOffset(node, next);
      updateThumb(true);
      frameRef.current = window.requestAnimationFrame(tick);
    };
    if (Math.abs(velocity) >= physics.velocityTolerance) frameRef.current = window.requestAnimationFrame(tick);
  }, [maxOffset, offset, setOffset, setRubberBand, springBack, updateThumb]);

  const snapToCenter = useCallback((node: HTMLDivElement, initialVelocity = 0) => {
    if (snap !== "center") return;
    const track = node.firstElementChild;
    if (!track) return;
    const items = snapItemSelector
      ? Array.from(track.querySelectorAll<HTMLElement>(snapItemSelector))
      : Array.from(track.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
    if (items.length === 0) return;
    stopMotion();
    setRubberBand(0);
    let position = offset(node);
    const projected = position + Math.max(-node.clientWidth * 0.6, Math.min(node.clientWidth * 0.6, initialVelocity * physics.snapProjection));
    const targets = items.map((item) => Math.max(0, Math.min(maxOffset(node), item.offsetLeft - (node.clientWidth - item.offsetWidth) / 2)));
    let target = targets.reduce((best, candidate) => Math.abs(candidate - projected) < Math.abs(best - projected) ? candidate : best, targets[0]);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(target - position) < 0.5) {
      setOffset(node, target);
      updateThumb(true);
      return;
    }
    let velocity = Math.max(-1600, Math.min(1600, initialVelocity));
    let previous: number | null = null;
    let lastWrittenOffset = position;
    const tick = (time: number) => {
      // Infinite collections recenter their duplicate items without animation.
      // Carry that external translation into the spring instead of pulling it
      // back toward an obsolete absolute scroll position.
      const externalShift = offset(node) - lastWrittenOffset;
      if (Math.abs(externalShift) > 1) {
        position += externalShift;
        target = Math.max(0, Math.min(maxOffset(node), target + externalShift));
      }
      const seconds = Math.min(0.025, (previous === null ? 16 : time - previous) / 1000);
      previous = time;
      velocity += ((target - position) * physics.snapTension - velocity * physics.snapFriction) * seconds;
      position += velocity * seconds;
      if (Math.abs(target - position) < 0.4 && Math.abs(velocity) < 3) {
        setOffset(node, target);
        frameRef.current = null;
        updateThumb(true);
        return;
      }
      setOffset(node, position);
      lastWrittenOffset = offset(node);
      updateThumb(true);
      frameRef.current = window.requestAnimationFrame(tick);
    };
    frameRef.current = window.requestAnimationFrame(tick);
  }, [maxOffset, offset, setOffset, setRubberBand, snap, snapItemSelector, stopMotion, updateThumb]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const onScroll = () => {
      updateThumb(true);
      if (snap !== "center" || sessionRef.current || frameRef.current !== null) return;
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
      // Also settle a horizontal trackpad gesture and programmatic selection.
      // A single runtime owns this motion; consumers must not add CSS snapping.
      settleTimerRef.current = window.setTimeout(() => snapToCenter(node), 130);
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const parent = node.parentElement?.closest<HTMLElement>(".mobile-scroll");
      if (!parent || parent.scrollHeight <= parent.clientHeight) return;
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? parent.clientHeight : 1;
      const before = parent.scrollTop;
      parent.scrollTop += event.deltaY * unit;
      // overflow containment belongs to the carousel's horizontal axis only.
      // Forward vertical wheel input immediately, without requiring a click or
      // waiting for the current item to settle first.
      if (parent.scrollTop !== before) event.preventDefault();
    };
    let previousWidth = node.clientWidth;
    let previousContentWidth = node.scrollWidth;
    const observer = new ResizeObserver(() => {
      updateThumb(false);
      const resized = previousWidth !== node.clientWidth || previousContentWidth !== node.scrollWidth;
      previousWidth = node.clientWidth;
      previousContentWidth = node.scrollWidth;
      // Initial observation is not a resize: consumers may still be placing an
      // infinite collection on its starting cycle. On later resizes, let their
      // own layout/selection correction finish before checking the new center.
      if (!resized || snap !== "center" || sessionRef.current || frameRef.current !== null) return;
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(() => {
        if (!sessionRef.current && frameRef.current === null) snapToCenter(node);
      }, 130);
    });
    node.addEventListener("scroll", onScroll, { passive: true });
    node.addEventListener("wheel", onWheel, { passive: false });
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    updateThumb(false);
    return () => {
      node.removeEventListener("scroll", onScroll);
      node.removeEventListener("wheel", onWheel);
      observer.disconnect();
      stopMotion();
    };
  }, [snap, snapToCenter, stopMotion, updateThumb]);

  const primary = (event: ReactPointerEvent<HTMLDivElement>) => event.clientX;
  const cross = (event: ReactPointerEvent<HTMLDivElement>) => event.clientY;
  const record = (value: number) => {
    const time = performance.now();
    samplesRef.current = [...samplesRef.current, { value, time }].filter((sample) => time - sample.time <= physics.sampleWindow);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const node = scrollRef.current;
    if (!draggingEnabled || !node || sessionRef.current || !event.isPrimary || maxOffset(node) <= 2 || (event.pointerType === "mouse" && event.button !== 0)) return;
    stopMotion();
    samplesRef.current = [];
    record(primary(event));
    setRubberBand(0);
    suppressClickRef.current = false;
    sessionRef.current = { pointerId: event.pointerId, startPrimary: primary(event), startCross: cross(event), startOffset: offset(node), lastOffset: offset(node), captured: false, dragged: false };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const node = scrollRef.current;
    const session = sessionRef.current;
    if (!node || !session || session.pointerId !== event.pointerId) return;
    const delta = primary(event) - session.startPrimary;
    const crossDelta = cross(event) - session.startCross;
    if (!session.dragged) {
      // Keep the gesture pending until it clears tap slop. Pointer-down and
      // these early moves must bubble so a parent MobileScroll can still win.
      if (Math.max(Math.abs(delta), Math.abs(crossDelta)) < physics.dragThreshold) return;
      if (Math.abs(crossDelta) > Math.abs(delta)) {
        // The cross axis won. Abandon this session without capturing or
        // canceling the event so the parent can handle this move and release.
        sessionRef.current = null;
        return;
      }
      // The scroller owns the gesture from this move onward. Capture keeps
      // delivery stable outside its bounds; stopping propagation prevents the
      // parent from accumulating vertical drift or release momentum.
      event.currentTarget.setPointerCapture(event.pointerId);
      session.captured = true;
    }
    event.preventDefault();
    event.stopPropagation();
    session.dragged = true;
    setDragging(true);
    suppressClickRef.current = true;
    record(primary(event));
    session.startOffset += offset(node) - session.lastOffset;
    const desired = session.startOffset - delta;
    const maximum = maxOffset(node);
    setOffset(node, Math.max(0, Math.min(maximum, desired)));
    session.lastOffset = offset(node);
    setRubberBand(desired < 0 ? -desired * physics.overdragScale : desired > maximum ? -(desired - maximum) * physics.overdragScale : 0);
    updateThumb(true);
  };

  const finish = (event: ReactPointerEvent<HTMLDivElement>) => {
    const node = scrollRef.current;
    const session = sessionRef.current;
    if (!node || !session || session.pointerId !== event.pointerId) return;
    if (session.captured && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (event.type !== "pointercancel") record(primary(event));
    const samples = samplesRef.current;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const velocity = first && last ? -((last.value - first.value) / Math.max(1, last.time - first.time)) * physics.velocityScale : 0;
    sessionRef.current = null;
    setDragging(false);
    if (session.dragged) event.preventDefault();
    if (!session.dragged) return;
    if (snap === "center") snapToCenter(node, event.type === "pointercancel" ? 0 : velocity);
    else if (Math.abs(overdragRef.current) > 0.1) springBack(velocity * physics.overdragScale);
    else momentum(node, velocity);
  };

  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const style = { "--mobile-carousel-overdrag": `${overdrag}px`, overscrollBehaviorY: "auto" } as CSSProperties;
  const thumbStyle = { width: thumb.size, transform: `translateX(${thumb.offset}px)` };

  return (
    <div
      ref={scrollRef}
      className={`mobile-carousel ${className ?? ""}`}
      data-dragging={dragging}
      data-overscroll={overdrag.toFixed(2)}
      aria-label={ariaLabel}
      role={ariaLabel ? "region" : undefined}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onClickCapture={onClickCapture}
    >
      <div className={`mobile-carousel-content ${contentClassName ?? ""}`}>{children}</div>
      {showScrollbar ? (
        <div className="mobile-carousel-scrollbar" data-visible={thumb.visible} aria-hidden="true">
          <div className="mobile-carousel-scrollbar-thumb" style={thumbStyle} />
        </div>
      ) : null}
    </div>
  );
}
