export interface RoleUpdate {
  added: string[];
  removed: string[];
  previousRoles: Record<string, boolean | null>;
  newRoles: Record<string, boolean | null>;
}

export interface RoleRecord {
  [key: string]: boolean | null | Date | string;
  createdAt: Date;
  updatedAt: Date;
  discordId: string;
  discordName: string;
  buxDao5: boolean | null;
  aiBitbotsHolder: boolean | null;
  fckedCatzHolder: boolean | null;
  moneyMonstersHolder: boolean | null;
  buxBuilder: boolean | null;
} 