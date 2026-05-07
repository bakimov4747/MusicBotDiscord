import { SlashCommandBuilder } from 'discord.js';
import { MusicPlayer } from '../structures/musicPlayer.js';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('⏸️ Поставить воспроизведение на паузу');

export async function execute(interaction) {
  const player = MusicPlayer.get(interaction.guildId);

  if (!player) {
    return interaction.reply('❌ Бот не находится в голосовом канале.');
  }

  const paused = player.pause();

  if (!paused) {
    return interaction.reply('❌ Воспроизведение уже на паузе или ничего не играет.');
  }

  return interaction.reply('⏸️ Воспроизведение приостановлено. Используй `/resume` чтобы продолжить.');
}