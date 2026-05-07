import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { MusicPlayer } from '../structures/musicPlayer.js';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('📋 Показать очередь треков');

export async function execute(interaction) {
  const player = MusicPlayer.get(interaction.guildId);

  if (!player || player.queue.length === 0) {
    return interaction.reply('📋 Очередь пуста. Добавь треки с помощью `/play`');
  }

  const currentTrack = player.getCurrentTrack();
  const totalTracks = player.queue.length;
  const remaining = player.queue.slice(player.currentIndex + 1);

  const embed = new EmbedBuilder()
    .setTitle('📋 Очередь треков')
    .setColor(0x5865F2);

  if (currentTrack) {
    embed.addFields({
      name: '🎵 Сейчас играет',
      value: `[${currentTrack.title}](${currentTrack.url})`,
    });
  }

  if (remaining.length > 0) {
    const queueList = remaining
      .slice(0, 10)
      .map((track, i) => `${i + 1}. [${track.title}](${track.url})`)
      .join('\n');

    embed.addFields({
      name: `⏭ Далее (${remaining.length} треков)`,
      value: queueList,
    });

    if (remaining.length > 10) {
      embed.setFooter({ text: `И ещё ${remaining.length - 10} треков...` });
    }
  }

  embed.addFields({ name: '📊 Всего', value: `${totalTracks} треков`, inline: true });

  return interaction.reply({ embeds: [embed] });
}