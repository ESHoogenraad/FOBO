// Inline icons (from the design references). All are decorative: the button or text next to
// them carries the meaning.

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'aria-hidden': 'true',
};

export const CheckIcon = ({ size = 14, weight = 3 }) => (
  <svg width={size} height={size} stroke-width={weight} {...svgProps}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const SettingsIcon = () => (
  <svg width="20" height="20" stroke-width="1.8" {...svgProps}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
);

export const BackIcon = () => (
  <svg width="20" height="20" stroke-width="2" {...svgProps}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const CloseIcon = () => (
  <svg width="18" height="18" stroke-width="2" {...svgProps}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** Points down; turns up when `open`. */
export const ChevronIcon = ({ open = false }) => (
  <svg width="16" height="16" stroke-width="2" class={open ? 'chevron chevron-open' : 'chevron'} {...svgProps}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const AlertIcon = ({ size = 18 }) => (
  <svg width={size} height={size} stroke-width="2.2" {...svgProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6M12 17h.01" />
  </svg>
);

export const CrossIcon = ({ size = 18 }) => (
  <svg width={size} height={size} stroke-width="2.4" {...svgProps}>
    <path d="M7 7l10 10M17 7L7 17" />
  </svg>
);

export const QuestionIcon = ({ size = 18 }) => (
  <svg width={size} height={size} stroke-width="2" {...svgProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.3M12 17h.01" />
  </svg>
);

export const WrenchIcon = ({ size = 22 }) => (
  <svg width={size} height={size} stroke-width="2.2" {...svgProps}>
    <path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2z" />
  </svg>
);

/** "Log urge" on the bar: a note being written. */
export const NoteIcon = ({ size = 20 }) => (
  <svg width={size} height={size} stroke-width="2" {...svgProps}>
    <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
    <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);

/** "Cooldown" on the bar: wait a few days. */
export const HourglassIcon = ({ size = 20 }) => (
  <svg width={size} height={size} stroke-width="2" {...svgProps}>
    <path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />
  </svg>
);

/** "Buying it" at the end of a cooldown. */
export const CartIcon = ({ size = 20 }) => (
  <svg width={size} height={size} stroke-width="2" {...svgProps}>
    <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" />
    <circle cx="9.5" cy="20" r="1" />
    <circle cx="17" cy="20" r="1" />
  </svg>
);

/** "Dropping it": the cart, struck through. */
export const CartOffIcon = ({ size = 20 }) => (
  <svg width={size} height={size} stroke-width="2" {...svgProps}>
    <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" />
    <circle cx="9.5" cy="20" r="1" />
    <circle cx="17" cy="20" r="1" />
    <path d="M3 2l19 19" />
  </svg>
);

export const ArrowUpIcon = ({ size = 22 }) => (
  <svg width={size} height={size} stroke-width="2.4" {...svgProps}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);
