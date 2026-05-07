import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MusicPlayer } from '../structures/musicPlayer.js';

export const data = new SlashCommandBuilder()
  .setName('nowplaying')
  .setDescription('📺 Показать информацию о текущем треке');

export async function execute(interaction) {
  const player = MusicPlayer.get(interaction.guildId);

  if (!player || !player.isPlaying) {
    return interaction.reply('❌ Сейчас ничего не играет.');
  }

  const track = player.getCurrentTrack();
  if (!track) {
    return interaction.reply('❌ Сейчас ничего не играет.');
  }

  const embed = new EmbedBuilder()
    .setTitle('🎵 Сейчас играет')
    .setDescription(`[${track.title}](${track.url})`)
    .setColor(0x5865F2)
    .addFields(
      { name: '🔊 Громкость', value: `${player.volume}%`, inline: true },
      { name: '📋 Очередь', value: `${player.queue.length - player.currentIndex - 1} треков`, inline: true },
    );

  if (track.duration) {
    const mins = Math.floor(track.duration / 60);
    const secs = track.duration % 60;
    embed.addFields({ name: '⏱ Длительность', value: `${mins}:${secs.toString().padStart(2, '0')}`, inline: true });
  }

  if (track.thumbnail) {
    embed.setThumbnail(track.thumbnail);
  }

  return interaction.reply({ embeds: [embed] });
}