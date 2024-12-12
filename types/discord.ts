export interface RoleUpdate {
  added: string[];
  removed: string[];
  previousRoles: Record<string, any>;
  newRoles: Record<string, any>;
} 