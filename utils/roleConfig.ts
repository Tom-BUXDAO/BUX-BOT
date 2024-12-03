import { CollectionName } from '../types/collections';

interface WhaleConfig {
  threshold: number;
  roleId: string | undefined;
}

interface CollectionConfig {
  holder: string | undefined;
  whale?: WhaleConfig;
}

export const NFT_THRESHOLDS = {
  'Money Monsters 3D': {
    holder: process.env.MONEY_MONSTERS3D_ROLE_ID,
    whale: {
      roleId: process.env.MONEY_MONSTERS3D_WHALE_ROLE_ID,
      threshold: Number(process.env.MONEY_MONSTERS3D_WHALE_THRESHOLD)
    }
  },
  'AI BitBots': {
    holder: process.env.AI_BITBOTS_ROLE_ID,
    whale: {
      roleId: process.env.AI_BITBOTS_WHALE_ROLE_ID,
      threshold: Number(process.env.AI_BITBOTS_WHALE_THRESHOLD)
    }
  },
  'FCKED CATZ': {
    holder: process.env.FCKED_CATZ_ROLE_ID,
    whale: {
      roleId: process.env.FCKED_CATZ_WHALE_ROLE_ID,
      threshold: Number(process.env.FCKED_CATZ_WHALE_THRESHOLD)
    }
  },
  'Money Monsters': {
    holder: process.env.MONEY_MONSTERS_ROLE_ID,
    whale: {
      roleId: process.env.MONEY_MONSTERS_WHALE_ROLE_ID,
      threshold: Number(process.env.MONEY_MONSTERS_WHALE_THRESHOLD)
    }
  },
  'CelebCatz': {
    holder: process.env.CELEBCATZ_ROLE_ID
  },
  'Candy Bots': {
    holder: process.env.CANDY_BOTS_ROLE_ID
  },
  'Doodle Bots': {
    holder: process.env.DOODLE_BOTS_ROLE_ID
  },
  'Energy Apes': {
    holder: process.env.ENERGY_APES_ROLE_ID
  },
  'RJCTD Bots': {
    holder: process.env.RJCTD_BOTS_ROLE_ID
  },
  'Squirrels': {
    holder: process.env.SQUIRRELS_ROLE_ID
  },
  'Warriors': {
    holder: process.env.WARRIORS_ROLE_ID
  }
} as const;

export const BUX_THRESHOLDS = [
  {
    threshold: Number(process.env.BUX_BEGINNER_THRESHOLD),
    roleId: process.env.BUX_BEGINNER_ROLE_ID
  },
  {
    threshold: Number(process.env.BUX_BUILDER_THRESHOLD),
    roleId: process.env.BUX_BUILDER_ROLE_ID
  },
  {
    threshold: Number(process.env.BUX_SAVER_THRESHOLD),
    roleId: process.env.BUX_SAVER_ROLE_ID
  },
  {
    threshold: Number(process.env.BUX_BANKER_THRESHOLD),
    roleId: process.env.BUX_BANKER_ROLE_ID
  }
] as const;

export const BUXDAO_5_ROLE_ID = process.env.BUXDAO_5_ROLE_ID;

export const MAIN_COLLECTIONS = [
  'Money Monsters',
  'Money Monsters 3D',
  'CelebCatz',
  'FCKED CATZ',
  'AI BitBots'
] as const;

export type CollectionName = keyof typeof NFT_THRESHOLDS; 