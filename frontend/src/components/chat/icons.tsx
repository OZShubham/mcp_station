import React from 'react';
 
interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}
 
const Svg: React.FC<IconProps> = ({ size = 20, className, children, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
);
 
export const PlusIcon = (p: IconProps) => <Svg {...p}><path d="M5 12h14" /><path d="M12 5v14" /></Svg>;
export const ChatBubbleIcon = (p: IconProps) => <Svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>;
export const UserIcon = (p: IconProps) => <Svg {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Svg>;
export const CopyIcon = (p: IconProps) => <Svg {...p}><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></Svg>;
export const MenuIcon = (p: IconProps) => <Svg {...p}><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></Svg>;
export const XIcon = (p: IconProps) => <Svg {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Svg>;
export const TrashIcon = (p: IconProps) => <Svg {...p}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></Svg>;
export const ThumbUpIcon = (p: IconProps) => <Svg {...p}><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3z" /></Svg>;
export const ThumbUpIconSolid = (p: IconProps) => <Svg {...p} fill="currentColor"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3z" /></Svg>;
export const ThumbDownIcon = (p: IconProps) => <Svg {...p}><path d="M7 14V2" /><path d="M15 18.12 14 14H9.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 11.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3z" /></Svg>;
export const ThumbDownIconSolid = (p: IconProps) => <Svg {...p} fill="currentColor"><path d="M7 14V2" /><path d="M15 18.12 14 14H9.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 11.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3z" /></Svg>;
export const CheckCircleIcon = (p: IconProps) => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Svg>;
export const DocumentTextIcon = (p: IconProps) => <Svg {...p}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></Svg>;
export const DownloadIcon = (p: IconProps) => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></Svg>;
export const TableIcon = (p: IconProps) => <Svg {...p}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="3" x2="21" y1="15" y2="15" /><line x1="12" x2="12" y1="3" y2="21" /></Svg>;
export const ChevronDownIcon = (p: IconProps) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const PaperclipIcon = (p: IconProps) => <Svg {...p}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></Svg>;
export const XCircleIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></Svg>;
export const StopIcon = (p: IconProps) => <Svg {...p}><rect width="18" height="18" x="3" y="3" rx="2" /></Svg>;
export const PencilIcon = (p: IconProps) => <Svg {...p}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></Svg>;
export const RefreshIcon = (p: IconProps) => <Svg {...p}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></Svg>;
export const SunIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></Svg>;
export const MoonIcon = (p: IconProps) => <Svg {...p}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></Svg>;
export const SparklesIcon = (p: IconProps) => <Svg {...p}><path d="M12 3V21M3 12H21M8 8L16 16M16 8L8 16" strokeWidth="2" /></Svg>;
export const BotIcon = (p: IconProps) => <Svg {...p}><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></Svg>;
export const TerminalIcon = (p: IconProps) => <Svg {...p}><polyline points="4 17 10 11 4 5" /><line x1="12" x2="20" y1="19" y2="19" /></Svg>;
 