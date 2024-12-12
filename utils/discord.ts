import { Client, GatewayIntentBits } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

let discordClient: Client | null = null;

export const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);
export const GUILD_ID = process.env.DISCORD_GUILD_ID;

export async function getDiscordClient() {
  if (!discordClient) {
    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
      ]
    });

    await discordClient.login(process.env.DISCORD_BOT_TOKEN);
  }

  return discordClient;
}

export async function getMemberRoles(discordId: string): Promise<string[]> {
  try {
    const member = await rest.get(
      Routes.guildMember(GUILD_ID!, discordId)
    ) as { roles: string[] };
    
    return member.roles;
  } catch (error) {
    console.error('Error fetching member roles:', error);
    return [];
  }
} 