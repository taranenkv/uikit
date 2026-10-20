import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import styles from './UIPanGestureRecognizer.module.css';
import { UIPanGestureRecognizerContext } from './UIPanGestureRecognizer.context';
import type { CGPoint } from '../UICollectionViewLayout/UICollectionViewLayout.types';
import type {
  UIGestureRecognizerDelegate,
  UIGestureRecognizerState,
  UIPanGestureRecognizer as UIPanGestureRecognizerProtocol,
  UIPanGestureRecognizerAction,
  UIPanGestureRecognizerContextValue,
  UIPanGestureRecognizerProps,
  UIPanGestureRecognizerTracking,
} from './UIPanGestureRecognizer.types';

const RECOGNITION_DISTANCE = 8;
const VELOCITY_SAMPLE_WINDOW = 100;
const ZERO_POINT: CGPoint = { x: 0, y: 0 };

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function isActiveState(state: UIGestureRecognizerState): boolean {
  return state === 'began' || state === 'changed';
}

interface UIPanGestureRecognizerHandlers {
  action: UIPanGestureRecognizerAction | undefined;
  delegate: UIGestureRecognizerDelegate | undefined;
  isEnabled: boolean;
}

const UIPanGestureRecognizerRoot = forwardRef<HTMLDivElement, UIPanGestureRecognizerProps>(
  function UIPanGestureRecognizer(
    {
      action,
      delegate,
      isEnabled = true,
      cancelsTouchesInView = true,
      className,
      children,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onLostPointerCapture,
      onClickCapture,
      ...rest
    },
    ref
  ) {
    const viewRef = useRef<HTMLDivElement>(null);
    const trackingRef = useRef<UIPanGestureRecognizerTracking | null>(null);
    const stateRef = useRef<UIGestureRecognizerState>('possible');
    const shouldCancelClickRef = useRef(false);
    const handlersRef = useRef<UIPanGestureRecognizerHandlers>({ action, delegate, isEnabled });
    const [state, setState] = useState<UIGestureRecognizerState>('possible');

    useImperativeHandle(ref, () => viewRef.current as HTMLDivElement, []);

    useLayoutEffect(() => {
      handlersRef.current = { action, delegate, isEnabled };
    });

    const gestureRecognizer = useMemo<UIPanGestureRecognizerProtocol>(() => {
      const currentPoint = (): CGPoint => {
        const samples = trackingRef.current?.samples;

        return samples && samples.length > 0 ? samples[samples.length - 1].point : ZERO_POINT;
      };

      return {
        get state() {
          return stateRef.current;
        },
        get view() {
          return viewRef.current;
        },
        get isEnabled() {
          return handlersRef.current.isEnabled;
        },
        get numberOfTouches() {
          return trackingRef.current === null ? 0 : 1;
        },
        translation: () => {
          const tracking = trackingRef.current;

          if (!tracking) {
            return ZERO_POINT;
          }

          const point = currentPoint();

          return {
            x: point.x - tracking.origin.x + tracking.translationOffset.x,
            y: point.y - tracking.origin.y + tracking.translationOffset.y,
          };
        },
        setTranslation: (translation) => {
          const tracking = trackingRef.current;

          if (!tracking) {
            return;
          }

          const point = currentPoint();

          tracking.origin = point;
          tracking.translationOffset = translation;
        },
        velocity: () => {
          const samples = trackingRef.current?.samples ?? [];

          if (samples.length < 2) {
            return ZERO_POINT;
          }

          const first = samples[0];
          const last = samples[samples.length - 1];
          const elapsed = (last.timestamp - first.timestamp) / 1000;

          if (elapsed <= 0) {
            return ZERO_POINT;
          }

          return {
            x: (last.point.x - first.point.x) / elapsed,
            y: (last.point.y - first.point.y) / elapsed,
          };
        },
        location: () => {
          const view = viewRef.current;
          const point = currentPoint();

          if (!view) {
            return point;
          }

          const rect = view.getBoundingClientRect();

          return { x: point.x - rect.left, y: point.y - rect.top };
        },
      };
    }, []);

    const transition = (next: UIGestureRecognizerState) => {
      stateRef.current = next;
      setState(next);

      if (next === 'failed') {
        return;
      }

      handlersRef.current.action?.(gestureRecognizer);
    };

    const appendSample = (event: PointerEvent<HTMLDivElement>) => {
      const tracking = trackingRef.current;

      if (!tracking) {
        return;
      }

      const timestamp = event.timeStamp;

      tracking.samples.push({ point: { x: event.clientX, y: event.clientY }, timestamp });
      tracking.samples = tracking.samples.filter(
        (sample) => timestamp - sample.timestamp <= VELOCITY_SAMPLE_WINDOW
      );
    };

    const reset = () => {
      trackingRef.current = null;
      stateRef.current = 'possible';
      setState('possible');
    };

    const finish = (event: PointerEvent<HTMLDivElement>, next: 'ended' | 'cancelled') => {
      const tracking = trackingRef.current;

      if (!tracking || tracking.pointerId !== event.pointerId) {
        return;
      }

      if (isActiveState(stateRef.current)) {
        shouldCancelClickRef.current = next === 'ended' && cancelsTouchesInView;
        transition(next);
      }

      reset();
    };

    useEffect(() => {
      const view = viewRef.current;

      if (!view) {
        return undefined;
      }

      const handleTouchMove = (event: TouchEvent) => {
        if (isActiveState(stateRef.current) && event.cancelable) {
          event.preventDefault();
        }
      };

      view.addEventListener('touchmove', handleTouchMove, { passive: false });

      return () => {
        view.removeEventListener('touchmove', handleTouchMove);
      };
    }, []);

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event);

      if (!handlersRef.current.isEnabled || trackingRef.current !== null) {
        return;
      }

      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      const point = { x: event.clientX, y: event.clientY };

      shouldCancelClickRef.current = false;
      trackingRef.current = {
        pointerId: event.pointerId,
        origin: point,
        translationOffset: ZERO_POINT,
        samples: [{ point, timestamp: event.timeStamp }],
      };
    };

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(event);

      const tracking = trackingRef.current;

      if (!tracking || tracking.pointerId !== event.pointerId) {
        return;
      }

      appendSample(event);

      if (stateRef.current === 'failed') {
        return;
      }

      if (stateRef.current === 'possible') {
        const translation = gestureRecognizer.translation();

        if (Math.hypot(translation.x, translation.y) < RECOGNITION_DISTANCE) {
          return;
        }

        const shouldBegin =
          handlersRef.current.delegate?.gestureRecognizerShouldBegin?.(gestureRecognizer) ?? true;

        if (!shouldBegin) {
          transition('failed');
          return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        transition('began');
        return;
      }

      transition('changed');
    };

    const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
      onPointerUp?.(event);
      appendSample(event);
      finish(event, 'ended');
    };

    const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
      onPointerCancel?.(event);
      finish(event, 'cancelled');
    };

    const handleLostPointerCapture = (event: PointerEvent<HTMLDivElement>) => {
      onLostPointerCapture?.(event);
      finish(event, 'cancelled');
    };

    const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
      onClickCapture?.(event);

      if (!shouldCancelClickRef.current) {
        return;
      }

      shouldCancelClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    };

    const contextValue = useMemo<UIPanGestureRecognizerContextValue>(
      () => ({ state, gestureRecognizer }),
      [state, gestureRecognizer]
    );

    return (
      <UIPanGestureRecognizerContext.Provider value={contextValue}>
        <div
          {...rest}
          ref={viewRef}
          data-state={state}
          data-enabled={isEnabled}
          className={joinClassNames(styles.panGestureRecognizer, className)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handleLostPointerCapture}
          onClickCapture={handleClickCapture}>
          {children}
        </div>
      </UIPanGestureRecognizerContext.Provider>
    );
  }
);

UIPanGestureRecognizerRoot.displayName = 'UIPanGestureRecognizer';

export const UIPanGestureRecognizer = UIPanGestureRecognizerRoot;
