import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const GoogleIcon = (props: IconProps) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
    />
  </svg>
);

export const MailIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

export const LockIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
    <path d="M8 10.5V7.75A4 4 0 0 1 12 3.75a4 4 0 0 1 4 4v2.75" />
    <path d="M12 14.5v2" />
  </svg>
);

export const EyeIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M3 3l18 18" />
    <path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17.3 17.3 0 0 1-2.1 2.8" />
    <path d="M6.3 7.8A17.6 17.6 0 0 0 2.5 12S6 18 12 18a9.6 9.6 0 0 0 3.4-.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M4 12h16" />
    <path d="m14 6 6 6-6 6" />
  </svg>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M20 12H4" />
    <path d="m10 6-6 6 6 6" />
  </svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const ChevronUpIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="m18 15-6-6-6 6" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const FlameIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 2.8s5.6 4.1 5.6 9.1a5.6 5.6 0 1 1-11.2 0c0-2.1 1-3.9 2.1-5.2.4 1.7 1.4 2.6 2.3 2.6 0-2.6 1.2-5 1.2-6.5Z" />
  </svg>
);

export const ShieldIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 3 4.5 6v5.5c0 4.4 3.2 7.8 7.5 9.5 4.3-1.7 7.5-5.1 7.5-9.5V6L12 3Z" />
    <path d="m9 12 2.1 2.1L15.5 9.7" />
  </svg>
);

export const ChartIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
  </svg>
);

export const SparkIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.6 5.6l2.5 2.5M15.9 15.9l2.5 2.5M18.4 5.6l-2.5 2.5M8.1 15.9l-2.5 2.5" />
  </svg>
);

export const LogoutIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="m10 17 5-5-5-5" />
    <path d="M15 12H3" />
  </svg>
);

export const CalendarIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M8 3v3M16 3v3M3 9.5h18" />
  </svg>
);

export const PencilIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M4 20h4L19.5 8.5a2.12 2.12 0 0 0-3-3L5 17v3Z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
);

export const SlidersIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
    <path d="M1 14h6M9 8h6M17 16h6" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M4 7h16" />
    <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
    <path d="m6.5 7 .8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const GripIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

export const AlertIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V13" />
    <path d="M12 16.5h.01" />
  </svg>
);
