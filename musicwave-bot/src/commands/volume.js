import { SlashCommandBuilder } from 'discord.js';
import { MusicPlayer } from '../structures/musicPlayer.js';

export const data = new SlashCommandBuilder()
  .setName('volume')
  .setDescription('🔊 Установить громкость')
  .addIntegerOption(option =>
    option
      .setName('уровень')
      .setDescription('Громкость от 0 до 100')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(100),
  );

export async function execute(interaction) {
  const player = MusicPlayer.get(interaction.guildId);

  if (!player) {
    return interaction.reply('❌ Бот не находится в голосовом канале.');
  }

  const volume = interaction.options.getInteger('уровень', true);
  const actualVolume = player.setVolume(volume);

  return interaction.reply(`🔊 Громкость установлена на **${actualVolume}%**`);
}