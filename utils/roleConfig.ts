interface WhaleConfig {
  threshold: number;
  roleId: string | undefined;
}

interface CollectionConfig {
  holder: string | undefined;
  whale?: WhaleConfig;
}

export const NFT_THRESHOLDS: Record<string, CollectionConfig> = {
  'ai_bitbots': {
    holder: process.env.AI_BITBOTS_ROLE_ID,
    whale: {
      threshold: Number(process.env.AI_BITBOTS_WHALE_THRESHOLD) || 10,
      roleId: process.env.AI_BITBOTS_WHALE_ROLE_ID
    }
  },
  'fcked_catz': {
    holder: process.env.FCKED_CATZ_ROLE_ID,
    whale: {
      threshold: Number(process.env.FCKED_CATZ_WHALE_THRESHOLD) || 25,
      roleId: process.env.FCKED_CATZ_WHALE_ROLE_ID
    }
  },
  'money_monsters': {
    holder: process.env.MONEY_MONSTERS_ROLE_ID,
    whale: {
      threshold: Number(process.env.MONEY_MONSTERS_WHALE_THRESHOLD) || 25,
      roleId: process.env.MONEY_MONSTERS_WHALE_ROLE_ID
    }
  },
  'money_monsters3d': {
    holder: process.env.MONEY_MONSTERS3D_ROLE_ID,
    whale: {
      threshold: Number(process.env.MONEY_MONSTERS3D_WHALE_THRESHOLD) || 25,
      roleId: process.env.MONEY_MONSTERS3D_WHALE_ROLE_ID
    }
  },
  'celebcatz': {
    holder: process.env.CELEBCATZ_ROLE_ID
  },
  'MM_top10': {
    holder: process.env.MM_TOP10_ROLE_ID
  },
  'MM3D_top10': {
    holder: process.env.MM3D_TOP10_ROLE_ID
  },
  'candy_bots': {
    holder: process.env.CANDY_BOTS_ROLE_ID
  },
  'doodle_bot': {
    holder: process.env.DOODLE_BOTS_ROLE_ID
  },
  'energy_apes': {
    holder: process.env.ENERGY_APES_ROLE_ID
  },
  'rjctd_bots': {
    holder: process.env.RJCTD_BOTS_ROLE_ID
  },
  'squirrels': {
    holder: process.env.SQUIRRELS_ROLE_ID
  },
  'warriors': {
    holder: process.env.WARRIORS_ROLE_ID
  }
};

export const BUX_THRESHOLDS = [
  {
    threshold: Number(process.env.BUX_BEGINNER_THRESHOLD) || 2500,
    roleId: process.env.BUX_BEGINNER_ROLE_ID
  },
  {
    threshold: Number(process.env.BUX_BUILDER_THRESHOLD) || 10000,
    roleId: process.env.BUX_BUILDER_ROLE_ID
  },
  {
    threshold: Number(process.env.BUX_SAVER_THRESHOLD) || 25000,
    roleId: process.env.BUX_SAVER_ROLE_ID
  },
  {
    threshold: Number(process.env.BUX_BANKER_THRESHOLD) || 50000,
    roleId: process.env.BUX_BANKER_ROLE_ID
  }
];

export const MAIN_COLLECTIONS = [
  'money_monsters',
  'money_monsters3d',
  'celebcatz',
  'fcked_catz',
  'ai_bitbots'
];

export const BUXDAO_5_ROLE_ID = process.env.BUXDAO_5_ROLE_ID; 