import {
  Home,
  MessagesSquare,
  Images,
  BookOpen,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Beranda", icon: Home, exact: true },
  { href: "/discussions", label: "Diskusi", icon: MessagesSquare },
  { href: "/gallery", label: "Galeri", icon: Images },
  { href: "/articles", label: "Artikel", icon: BookOpen },
  { href: "/promo", label: "Promo", icon: Megaphone },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
