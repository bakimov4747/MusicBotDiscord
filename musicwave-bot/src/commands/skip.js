import { SlashCommandBuilder } from 'discord.js';
import { MusicPlayer } from '../structures/musicPlayer.js';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('⏭️ Пропустить текущий трек');

export async function execute(interaction) {
  const player = MusicPlayer.get(interaction.guildId);

  if (!player || !player.isPlaying) {
    return interaction.reply('❌ Сейчас ничего не играет.');
  }

  player.skip();
  return interaction.reply('⏭️ Трек пропущен!');
}