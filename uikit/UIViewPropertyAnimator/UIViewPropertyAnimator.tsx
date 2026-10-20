import { useEffect, useState } from 'react';
import gsap from 'gsap';
import type { CGPoint } from '../UICollectionViewLayout/UICollectionViewLayout.types';
import type {
  CGVector,
  UICubicControlPoints,
  UISpringPosition,
  UISpringTimingParametersConfiguration,
  UITimingCurveProvider,
  UITimingCurveType,
  UITimingFunction,
  UIViewAnimatingPosition,
  UIViewAnimatingState,
  UIViewAnimationCurve,
  UIViewPropertyAnimatorAnimations,
  UIViewPropertyAnimatorAnimationsBlock,
  UIViewPropertyAnimatorCompletion,
} from './UIViewPropertyAnimator.types';

const NEWTON_ITERATIONS = 8;
const BISECTION_ITERATIONS = 24;
const SOLVER_PRECISION = 1e-6;
const SETTLING_LOGARITHM = Math.log(1000);
const CRITICALLY_DAMPED_OMEGA = 9.23;
const MINIMUM_DAMPING_RATIO = 0.05;
const MINIMUM_NORMALIZED_DURATION = 0.0001;
const SPRING_SETTLING_THRESHOLD = 0.002;
const SPRING_SETTLING_STEP = 1 / 240;
const SPRING_SETTLED_WINDOW = 0.5;
const MAXIMUM_SPRING_SETTLING_DURATION = 10;
const MAXIMUM_BOUNCE = 0.99;
const MINIMUM_PERCEPTUAL_DURATION = 0.01;
const ZERO_VECTOR: CGVector = { dx: 0, dy: 0 };

const ANIMATION_CURVE_CONTROL_POINTS: Record<UIViewAnimationCurve, UICubicControlPoints> = {
  easeInOut: { controlPoint1: { x: 0.42, y: 0 }, controlPoint2: { x: 0.58, y: 1 } },
  easeIn: { controlPoint1: { x: 0.42, y: 0 }, controlPoint2: { x: 1, y: 1 } },
  easeOut: { controlPoint1: { x: 0, y: 0 }, controlPoint2: { x: 0.58, y: 1 } },
  linear: { controlPoint1: { x: 0, y: 0 }, controlPoint2: { x: 1, y: 1 } },
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function createCubicBezierTimingFunction(
  controlPoint1: CGPoint,
  controlPoint2: CGPoint
): UITimingFunction {
  const cx = 3 * controlPoint1.x;
  const bx = 3 * (controlPoint2.x - controlPoint1.x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * controlPoint1.y;
  const by = 3 * (controlPoint2.y - controlPoint1.y) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDerivativeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  const solveX = (x: number) => {
    let t = x;

    for (let iteration = 0; iteration < NEWTON_ITERATIONS; iteration += 1) {
      const error = sampleX(t) - x;

      if (Math.abs(error) < SOLVER_PRECISION) {
        return t;
      }

      const derivative = sampleDerivativeX(t);

      if (Math.abs(derivative) < SOLVER_PRECISION) {
        break;
      }

      t -= error / derivative;
    }

    let lower = 0;
    let upper = 1;
    t = x;

    for (let iteration = 0; iteration < BISECTION_ITERATIONS; iteration += 1) {
      const value = sampleX(t);

      if (Math.abs(value - x) < SOLVER_PRECISION) {
        return t;
      }

      if (x > value) {
        lower = t;
      } else {
        upper = t;
      }

      t = (lower + upper) / 2;
    }

    return t;
  };

  return (progress) => {
    if (progress <= 0) {
      return 0;
    }

    if (progress >= 1) {
      return 1;
    }

    return sampleY(solveX(progress));
  };
}

function createSpringTimingFunction(
  dampingRatio: number,
  normalizedVelocity: number
): UITimingFunction {
  const zeta = clamp(dampingRatio, MINIMUM_DAMPING_RATIO, 1);

  if (zeta >= 1) {
    const omega = CRITICALLY_DAMPED_OMEGA;

    return (progress) => {
      if (progress <= 0) {
        return 0;
      }

      if (progress >= 1) {
        return 1;
      }

      return 1 - Math.exp(-omega * progress) * (1 + (omega - normalizedVelocity) * progress);
    };
  }

  const omega = SETTLING_LOGARITHM / zeta;
  const dampedOmega = omega * Math.sqrt(1 - zeta * zeta);

  return (progress) => {
    if (progress <= 0) {
      return 0;
    }

    if (progress >= 1) {
      return 1;
    }

    const envelope = Math.exp(-zeta * omega * progress);

    return (
      1 -
      envelope *
        (Math.cos(dampedOmega * progress) +
          ((zeta * omega - normalizedVelocity) / dampedOmega) * Math.sin(dampedOmega * progress))
    );
  };
}

function createSpringPosition(
  angularFrequency: number,
  dampingRatio: number,
  initialVelocity: number
): UISpringPosition {
  const omega = angularFrequency;
  const zeta = Math.max(dampingRatio, 0);

  if (Math.abs(zeta - 1) < 1e-6) {
    return (time) => 1 - Math.exp(-omega * time) * (1 + (omega - initialVelocity) * time);
  }

  if (zeta < 1) {
    const dampedOmega = omega * Math.sqrt(1 - zeta * zeta);

    return (time) =>
      1 -
      Math.exp(-zeta * omega * time) *
        (Math.cos(dampedOmega * time) +
          ((zeta * omega - initialVelocity) / dampedOmega) * Math.sin(dampedOmega * time));
  }

  const root = omega * Math.sqrt(zeta * zeta - 1);
  const fastRate = -zeta * omega + root;
  const slowRate = -zeta * omega - root;
  const fastCoefficient = (-initialVelocity - slowRate) / (fastRate - slowRate);
  const slowCoefficient = 1 - fastCoefficient;

  return (time) =>
    1 - (fastCoefficient * Math.exp(fastRate * time) + slowCoefficient * Math.exp(slowRate * time));
}

function computeSettlingDuration(position: UISpringPosition): number {
  let lastUnsettledTime = 0;

  for (
    let time = SPRING_SETTLING_STEP;
    time <= MAXIMUM_SPRING_SETTLING_DURATION;
    time += SPRING_SETTLING_STEP
  ) {
    if (Math.abs(1 - position(time)) > SPRING_SETTLING_THRESHOLD) {
      lastUnsettledTime = time;
    } else if (time - lastUnsettledTime > SPRING_SETTLED_WINDOW) {
      break;
    }
  }

  return lastUnsettledTime + SPRING_SETTLING_STEP;
}

export class UICubicTimingParameters implements UITimingCurveProvider {
  readonly timingCurveType: UITimingCurveType;
  readonly animationCurve: UIViewAnimationCurve;
  readonly controlPoint1: CGPoint;
  readonly controlPoint2: CGPoint;

  constructor(animationCurve?: UIViewAnimationCurve);
  constructor(controlPoint1: CGPoint, controlPoint2: CGPoint);
  constructor(
    animationCurveOrControlPoint1: UIViewAnimationCurve | CGPoint = 'easeInOut',
    controlPoint2?: CGPoint
  ) {
    if (typeof animationCurveOrControlPoint1 === 'string') {
      const controlPoints = ANIMATION_CURVE_CONTROL_POINTS[animationCurveOrControlPoint1];

      this.timingCurveType = 'builtin';
      this.animationCurve = animationCurveOrControlPoint1;
      this.controlPoint1 = controlPoints.controlPoint1;
      this.controlPoint2 = controlPoints.controlPoint2;
      return;
    }

    this.timingCurveType = 'cubic';
    this.animationCurve = 'easeInOut';
    this.controlPoint1 = animationCurveOrControlPoint1;
    this.controlPoint2 = controlPoint2 ?? { x: 1, y: 1 };
  }

  makeTimingFunction(): UITimingFunction {
    return createCubicBezierTimingFunction(this.controlPoint1, this.controlPoint2);
  }
}

export class UISpringTimingParameters implements UITimingCurveProvider {
  readonly timingCurveType: UITimingCurveType = 'spring';
  readonly dampingRatio: number;
  readonly initialVelocity: CGVector;
  readonly mass: number | null;
  readonly stiffness: number | null;
  readonly damping: number | null;
  readonly settlingDuration: number | undefined;

  private readonly springPosition: UISpringPosition | null;

  constructor(dampingRatio?: number, initialVelocity?: CGVector);
  constructor(configuration: UISpringTimingParametersConfiguration);
  constructor(
    dampingRatioOrConfiguration: number | UISpringTimingParametersConfiguration = 1,
    initialVelocity: CGVector = ZERO_VECTOR
  ) {
    if (typeof dampingRatioOrConfiguration === 'number') {
      this.dampingRatio = dampingRatioOrConfiguration;
      this.initialVelocity = initialVelocity;
      this.mass = null;
      this.stiffness = null;
      this.damping = null;
      this.settlingDuration = undefined;
      this.springPosition = null;
      return;
    }

    const configuration = dampingRatioOrConfiguration;
    const velocity = configuration.initialVelocity ?? ZERO_VECTOR;

    if ('stiffness' in configuration) {
      this.mass = configuration.mass;
      this.stiffness = configuration.stiffness;
      this.damping = configuration.damping;
    } else {
      const bounce = clamp(configuration.bounce ?? 0, -MAXIMUM_BOUNCE, MAXIMUM_BOUNCE);
      const angularFrequency =
        (2 * Math.PI) / Math.max(configuration.duration, MINIMUM_PERCEPTUAL_DURATION);
      const dampingRatio = bounce >= 0 ? 1 - bounce : 1 / (1 + bounce);

      this.mass = 1;
      this.stiffness = angularFrequency * angularFrequency;
      this.damping = 2 * dampingRatio * angularFrequency;
    }

    const angularFrequency = Math.sqrt(this.stiffness / this.mass);

    this.dampingRatio = this.damping / (2 * Math.sqrt(this.stiffness * this.mass));
    this.initialVelocity = velocity;
    this.springPosition = createSpringPosition(
      angularFrequency,
      this.dampingRatio,
      Math.hypot(velocity.dx, velocity.dy)
    );
    this.settlingDuration = computeSettlingDuration(this.springPosition);
  }

  makeTimingFunction(duration: number): UITimingFunction {
    const springPosition = this.springPosition;
    const settlingDuration = this.settlingDuration;

    if (springPosition && settlingDuration !== undefined) {
      return (progress) => {
        if (progress <= 0) {
          return 0;
        }

        if (progress >= 1) {
          return 1;
        }

        return springPosition(progress * settlingDuration);
      };
    }

    const velocity = Math.hypot(this.initialVelocity.dx, this.initialVelocity.dy);

    return createSpringTimingFunction(this.dampingRatio, velocity * duration);
  }
}

export class UIViewPropertyAnimator {
  readonly duration: number;
  readonly timingParameters: UITimingCurveProvider;
  readonly isInterruptible = true;
  scrubsLinearly = true;

  private timeline: gsap.core.Timeline;
  private driver: gsap.core.Tween | null = null;
  private readonly completions: UIViewPropertyAnimatorCompletion[] = [];
  private readonly progressProxy = { value: 0 };
  private currentState: UIViewAnimatingState = 'inactive';
  private reversed = false;

  constructor(
    duration: number,
    timingParameters: UITimingCurveProvider = new UICubicTimingParameters('easeInOut'),
    animations?: UIViewPropertyAnimatorAnimationsBlock
  ) {
    this.duration = Math.max(timingParameters.settlingDuration ?? duration, 0);
    this.timingParameters = timingParameters;
    this.timeline = UIViewPropertyAnimator.makeTimeline();

    if (animations) {
      this.addAnimations(animations);
    }
  }

  static runningPropertyAnimator(
    duration: number,
    delay: number,
    timingParameters: UITimingCurveProvider,
    animations: UIViewPropertyAnimatorAnimationsBlock,
    completion?: UIViewPropertyAnimatorCompletion
  ): UIViewPropertyAnimator {
    const animator = new UIViewPropertyAnimator(duration, timingParameters, animations);

    if (completion) {
      animator.addCompletion(completion);
    }

    animator.startAnimation(delay);

    return animator;
  }

  private static makeTimeline(): gsap.core.Timeline {
    const timeline = gsap.timeline({ paused: true });

    timeline.set({}, {}, 1);

    return timeline;
  }

  get state(): UIViewAnimatingState {
    return this.currentState;
  }

  get isRunning(): boolean {
    return this.driver !== null;
  }

  get isReversed(): boolean {
    return this.reversed;
  }

  set isReversed(isReversed: boolean) {
    if (this.reversed === isReversed) {
      return;
    }

    this.reversed = isReversed;

    if (this.driver !== null) {
      this.drive(this.timingParameters, 1, 0);
    }
  }

  get fractionComplete(): number {
    return this.timeline.progress();
  }

  set fractionComplete(fractionComplete: number) {
    if (this.currentState === 'stopped') {
      return;
    }

    this.stopDriver();
    this.currentState = 'active';

    const fraction = clamp(fractionComplete, 0, 1);
    const progress = this.scrubsLinearly
      ? fraction
      : this.timingParameters.makeTimingFunction(this.duration)(fraction);

    this.timeline.progress(clamp(progress, 0, 1));
  }

  addAnimations(animations: UIViewPropertyAnimatorAnimationsBlock, delayFactor = 0): void {
    const start = this.timeline.progress();
    const position = start + (1 - start) * clamp(delayFactor, 0, 1);
    const remaining = Math.max(1 - position, MINIMUM_NORMALIZED_DURATION);

    const resolveDuration = (duration: gsap.TweenVars['duration']) =>
      typeof duration === 'number' ? clamp(duration, 0, 1) * remaining : remaining;

    const builder: UIViewPropertyAnimatorAnimations = {
      to: (targets, vars) => {
        this.timeline.to(
          targets,
          { ease: 'none', ...vars, duration: resolveDuration(vars.duration) },
          position
        );
      },
      fromTo: (targets, fromVars, toVars) => {
        this.timeline.fromTo(
          targets,
          fromVars,
          { ease: 'none', ...toVars, duration: resolveDuration(toVars.duration) },
          position
        );
      },
      set: (targets, vars) => {
        this.timeline.set(targets, vars, position);
      },
    };

    animations(builder);
  }

  addCompletion(completion: UIViewPropertyAnimatorCompletion): void {
    this.completions.push(completion);
  }

  startAnimation(afterDelay = 0): void {
    if (this.currentState === 'stopped') {
      return;
    }

    this.currentState = 'active';
    this.drive(this.timingParameters, 1, afterDelay);
  }

  pauseAnimation(): void {
    if (this.currentState === 'stopped') {
      return;
    }

    this.currentState = 'active';
    this.stopDriver();
  }

  continueAnimation(timingParameters?: UITimingCurveProvider | null, durationFactor = 1): void {
    if (this.currentState === 'stopped') {
      return;
    }

    this.currentState = 'active';
    this.drive(timingParameters ?? this.timingParameters, durationFactor, 0);
  }

  stopAnimation(withoutFinishing: boolean): void {
    this.stopDriver();

    if (!withoutFinishing) {
      this.currentState = 'stopped';
      return;
    }

    this.timeline.kill();
    this.timeline = UIViewPropertyAnimator.makeTimeline();
    this.reversed = false;
    this.currentState = 'inactive';
  }

  finishAnimation(finalPosition: UIViewAnimatingPosition): void {
    if (this.currentState !== 'stopped') {
      return;
    }

    if (finalPosition === 'start') {
      this.timeline.progress(0);
    }

    if (finalPosition === 'end') {
      this.timeline.progress(1);
    }

    this.currentState = 'inactive';
    this.notifyCompletions(finalPosition);
  }

  private drive(
    timingParameters: UITimingCurveProvider,
    durationFactor: number,
    delay: number
  ): void {
    this.stopDriver();

    const from = this.timeline.progress();
    const to = this.reversed ? 0 : 1;
    const distance = Math.abs(to - from);
    const factor = Math.max(durationFactor, 0);
    const duration =
      timingParameters.settlingDuration !== undefined
        ? timingParameters.settlingDuration * factor
        : this.duration * distance * factor;

    if (distance === 0 || duration === 0) {
      this.timeline.progress(to);
      this.finish();
      return;
    }

    this.progressProxy.value = from;
    this.driver = gsap.to(this.progressProxy, {
      value: to,
      duration,
      delay,
      ease: timingParameters.makeTimingFunction(duration),
      onUpdate: () => {
        this.timeline.progress(clamp(this.progressProxy.value, 0, 1));
      },
      onComplete: () => {
        this.driver = null;
        this.timeline.progress(to);
        this.finish();
      },
    });
  }

  private finish(): void {
    this.currentState = 'inactive';
    this.notifyCompletions(this.reversed ? 'start' : 'end');
  }

  private notifyCompletions(finalPosition: UIViewAnimatingPosition): void {
    [...this.completions].forEach((completion) => completion(finalPosition));
  }

  private stopDriver(): void {
    this.driver?.kill();
    this.driver = null;
  }
}

export function useUIViewPropertyAnimator(
  makePropertyAnimator: () => UIViewPropertyAnimator
): UIViewPropertyAnimator {
  const [propertyAnimator] = useState(makePropertyAnimator);

  useEffect(
    () => () => {
      if (propertyAnimator.isRunning) {
        propertyAnimator.pauseAnimation();
      }
    },
    [propertyAnimator]
  );

  return propertyAnimator;
}
