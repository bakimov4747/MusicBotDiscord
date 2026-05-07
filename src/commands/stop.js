import { SlashCommandBuilder } from 'discord.js';
import { MusicPlayer } from '../structures/musicPlayer.js';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('🛑 Остановить воспроизведение и выйти из голосового канала');

export async function execute(interaction) {
  const player = MusicPlayer.get(interaction.guildId);

  if (!player) {
    return interaction.reply('❌ Бот не находится в голосовом канале.');
  }

  player.destroy();
  return interaction.reply('🛑 Воспроизведение остановлено. Бот вышел из голосового канала.');
}