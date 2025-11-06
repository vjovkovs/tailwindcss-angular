import { 
  animate, 
  state, 
  style, 
  transition, 
  trigger,
  AnimationTriggerMetadata,
  query,
  stagger,
  group
} from '@angular/animations';

/**
 * Fade in/out animation with improved performance and accessibility
 * Uses transform3d to trigger GPU acceleration
 */
export const fadeInOut: AnimationTriggerMetadata = trigger('fadeInOut', [
  transition(':enter', [
    style({ 
      opacity: 0,
      transform: 'translate3d(0, 0, 0)' // GPU acceleration
    }), 
    animate('300ms ease-out', style({ 
      opacity: 1,
      transform: 'translate3d(0, 0, 0)'
    }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ 
      opacity: 0,
      transform: 'translate3d(0, 0, 0)'
    }))
  ])
]);

/**
 * Slide and fade animation with configurable options
 * @param options Animation configuration options
 */
export interface SlideAnimationOptions {
  duration?: number;
  easing?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: string;
}

export function slideInOut(options: SlideAnimationOptions = {}): AnimationTriggerMetadata {
  const {
    duration = 300,
    easing = 'ease-out',
    direction = 'left',
    distance = '100px'
  } = options;

  const getTransform = (dir: string, dist: string, isEnter: boolean) => {
    const multiplier = isEnter ? -1 : 1;
    switch (dir) {
      case 'right':
        return `translate3d(${multiplier * parseInt(dist)}px, 0, 0)`;
      case 'up':
        return `translate3d(0, ${multiplier * parseInt(dist)}px, 0)`;
      case 'down':
        return `translate3d(0, ${multiplier * -parseInt(dist)}px, 0)`;
      default: // left
        return `translate3d(${multiplier * -parseInt(dist)}px, 0, 0)`;
    }
  };

  return trigger('slideInOut', [
    state('in', style({ 
      opacity: 1, 
      transform: 'translate3d(0, 0, 0)' 
    })),
    transition(':enter', [
      style({ 
        opacity: 0, 
        transform: getTransform(direction, distance, true)
      }),
      animate(`${duration}ms ${easing}`, style({ 
        opacity: 1, 
        transform: 'translate3d(0, 0, 0)' 
      }))
    ]),
    transition(':leave', [
      animate(`${duration * 0.75}ms ${easing.replace('out', 'in')}`, style({ 
        opacity: 0, 
        transform: getTransform(direction, distance, false)
      }))
    ])
  ]);
}

/**
 * Scale animation for modal/dialog appearances
 */
export const scaleInOut: AnimationTriggerMetadata = trigger('scaleInOut', [
  transition(':enter', [
    style({ 
      opacity: 0,
      transform: 'scale3d(0.8, 0.8, 1) translate3d(0, 0, 0)'
    }),
    animate('250ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ 
      opacity: 1,
      transform: 'scale3d(1, 1, 1) translate3d(0, 0, 0)'
    }))
  ]),
  transition(':leave', [
    animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ 
      opacity: 0,
      transform: 'scale3d(0.8, 0.8, 1) translate3d(0, 0, 0)'
    }))
  ])
]);

/**
 * List stagger animation for animating multiple items
 */
export const listStagger: AnimationTriggerMetadata = trigger('listStagger', [
  transition('* <=> *', [
    query(':enter', [
      style({ 
        opacity: 0, 
        transform: 'translate3d(0, 30px, 0)' 
      }),
      stagger('80ms', [
        animate('300ms ease-out', style({ 
          opacity: 1, 
          transform: 'translate3d(0, 0, 0)' 
        }))
      ])
    ], { optional: true }),
    query(':leave', [
      stagger('50ms', [
        animate('200ms ease-in', style({ 
          opacity: 0, 
          transform: 'translate3d(0, -30px, 0)' 
        }))
      ])
    ], { optional: true })
  ])
]);

/**
 * Height expand/collapse animation
 */
export const expandCollapse: AnimationTriggerMetadata = trigger('expandCollapse', [
  state('collapsed', style({ 
    height: '0px', 
    opacity: 0,
    overflow: 'hidden'
  })),
  state('expanded', style({ 
    height: '*', 
    opacity: 1,
    overflow: 'visible'
  })),
  transition('collapsed <=> expanded', [
    group([
      animate('300ms ease-out', style({ height: '{{height}}' })),
      animate('200ms 100ms ease-out', style({ opacity: '{{opacity}}' }))
    ])
  ])
]);

/**
 * Rotate animation (useful for icons, arrows, etc.)
 */
export function rotateAnimation(degrees: number = 180): AnimationTriggerMetadata {
  return trigger('rotate', [
    state('default', style({ transform: 'rotate(0deg)' })),
    state('rotated', style({ transform: `rotate(${degrees}deg)` })),
    transition('default <=> rotated', [
      animate('200ms ease-out')
    ])
  ]);
}

/**
 * Improved flyInOut with better performance and options
 * @deprecated Use slideInOut instead for better performance and flexibility
 */
export function flyInOut(duration = 0.3): AnimationTriggerMetadata {
  console.warn('flyInOut is deprecated. Use slideInOut for better performance and flexibility.');
  
  return trigger('flyInOut', [
    state('in', style({ 
      opacity: 1, 
      transform: 'translate3d(0, 0, 0)' 
    })),
    transition('void => *', [
      style({ 
        opacity: 0, 
        transform: 'translate3d(-100%, 0, 0)' 
      }), 
      animate(`${duration}s ease-out`)
    ]),
    transition('* => void', [
      animate(`${duration * 0.75}s ease-in`, style({ 
        opacity: 0, 
        transform: 'translate3d(100%, 0, 0)' 
      }))
    ])
  ]);
}

/**
 * Prebuilt animation configurations for common use cases
 */
export const ANIMATION_PRESETS = {
  // Quick animations for buttons, small elements
  quick: {
    duration: 150,
    easing: 'ease-out'
  },
  
  // Standard animations for most UI elements  
  standard: {
    duration: 300,
    easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)'
  },
  
  // Slower animations for large elements, modals
  slow: {
    duration: 500,
    easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
  }
} as const;

/**
 * Utility function to create custom fade animations with presets
 */
export function createFadeAnimation(preset: keyof typeof ANIMATION_PRESETS = 'standard'): AnimationTriggerMetadata {
  const config = ANIMATION_PRESETS[preset];
  
  return trigger('customFade', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate(`${config.duration}ms ${config.easing}`, style({ opacity: 1 }))
    ]),
    transition(':leave', [
      animate(`${config.duration * 0.75}ms ${config.easing}`, style({ opacity: 0 }))
    ])
  ]);
}