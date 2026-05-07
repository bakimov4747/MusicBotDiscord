import { SlashCommandBuilder } from 'discord.js';
import { MusicPlayer } from '../structures/musicPlayer.js';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('▶️ Продолжить воспроизведение');

export async function execute(interaction) {
  const player = MusicPlayer.get(interaction.guildId);

  if (!player) {
    return interaction.reply('❌ Бот не находится в голосовом канале.');
  }

  const resumed = player.resume();

  if (!resumed) {
    return interaction.reply('❌ Воспроизведение не на паузе. Используй `/pause` чтобы поставить на паузу.');
  }

  return interaction.reply('▶️ Воспроизведение продолжено!');
}