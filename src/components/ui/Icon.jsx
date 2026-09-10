import {
  Shield,
  Camera,
  Menu,
  X,
  Star,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  Plus,
  Minus,
  Trash2,
  Edit3,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Package,
  LogOut,
  Settings,
  Inbox,
  Flag,
  MessageSquare,
  ShoppingCart,
  Heart,
  User,
  Home,
  Grid,
  AlertTriangle,
  AlertCircle,
  Zap,
  Box,
  EyeOff,
  Loader2,
  Download,
  ArrowUp,
  ArrowDown
} from "lucide-react";

const iconMap = {
  shield: Shield,
  camera: Camera,
  menu: Menu,
  x: X,
  star: Star,
  check: Check,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  search: Search,
  filter: Filter,
  phone: Phone,
  mail: Mail,
  mapPin: MapPin,
  clock: Clock,
  externalLink: ExternalLink,
  plus: Plus,
  minus: Minus,
  trash: Trash2,
  edit: Edit3,
  eye: Eye,
  thumbsUp: ThumbsUp,
  thumbsDown: ThumbsDown,
  arrowLeft: ArrowLeft,
  package: Package,
  logOut: LogOut,
  settings: Settings,
  inbox: Inbox,
  flag: Flag,
  messageSquare: MessageSquare,
  shoppingCart: ShoppingCart,
  heart: Heart,
  user: User,
  home: Home,
  grid: Grid,
  alertTriangle: AlertTriangle,
  alertCircle: AlertCircle,
  zap: Zap,
  box: Box,
  eyeOff: EyeOff,
  loader: Loader2,
  download: Download,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown
};

export default function Icon({ name, size = 16, color = "currentColor", className = "" }) {
  const LucideIcon = iconMap[name];
  if (!LucideIcon) {
    return null;
  }
  return (
    <LucideIcon
      size={size}
      color={color}
      strokeWidth={1.75}
      className={className}
    />
  );
}
