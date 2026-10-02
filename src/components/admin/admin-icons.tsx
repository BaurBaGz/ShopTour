// Иконки меню админки и кабинета магазина (контурные, 24×24, цвет — currentColor)
type IconProps = { className?: string };

const base = {
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const HomeIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

export const StoreIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M4 9h16l-1.5-5h-13zM4 9v11h16V9M9 20v-6h6v6" />
    <path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" />
  </svg>
);

export const TagIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
    <circle cx="8" cy="8" r="1.5" />
  </svg>
);

export const GridIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const ImageIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m21 16-5-5-8 8" />
  </svg>
);

export const ChartIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M4 4v16h16" />
    <path d="m7 15 4-4 3 3 5-6" />
  </svg>
);

export const UsersIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
  </svg>
);

export const ExternalIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

export const PanelIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </svg>
);

export const MenuIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const BagIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" />
    <path d="M9 8V7a3 3 0 0 1 6 0v1" />
  </svg>
);

export const PercentIcon = ({ className }: IconProps) => (
  <svg className={className} {...base}>
    <path d="M19 5 5 19" />
    <circle cx="7" cy="7" r="2.5" />
    <circle cx="17" cy="17" r="2.5" />
  </svg>
);
