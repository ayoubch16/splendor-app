export interface NavItem {
  displayName?: string;
  divider?: boolean;
  iconName?: string;
  navCap?: string;
  route?: string;
  children?: NavItem[];
  chip?: boolean;
  chipContent?: string;
  chipClass?: string;
  external?: boolean;
  subItemIcon?: boolean;
  /** Si défini, l'item n'est visible que pour les utilisateurs ayant l'un de ces rôles. */
  roles?: string[];
}
