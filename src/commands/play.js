import { SlashCommandBuilder } from 'discord.js';
import { MusicPlayer } from '../structures/musicPlayer.js';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('🎵 Найти и воспроизвести трек')
  .addStringOption(option =>
    option
      .setName('запрос')
      .setDescription('Название трека или ссылка на YouTube')
      .setRequired(true),
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) {
    return interaction.editReply('❌ Ты должен находиться в голосовом канале!');
  }

  const query = interaction.options.getString('запрос', true);

  // Получаем или создаём плеер для этой гильдии
  let player = MusicPlayer.get(interaction.guildId);

  if (!player) {
    player = new MusicPlayer(interaction.guildId, voiceChannel, interaction.channel);
    MusicPlayer.set(interaction.guildId, player);

    const connected = await player.connect();
    if (!connected) {
      MusicPlayer.delete(interaction.guildId);
      return interaction.editReply('❌ Не удалось подключиться к голосовому каналу.');
    }
  } else if (player.voiceChannel.id !== voiceChannel.id) {
    // Если плеер есть, но в другом канале — переподключаемся
    player.voiceChannel = voiceChannel;
    player.textChannel = interaction.channel;
    player.destroy();

    player = new MusicPlayer(interaction.guildId, voiceChannel, interaction.channel);
    MusicPlayer.set(interaction.guildId, player);

    const connected = await player.connect();
    if (!connected) {
      MusicPlayer.delete(interaction.guildId);
      return interaction.editReply('❌ Не удалось подключиться к голосовому каналу.');
    }
  } else {
    // Обновляем текстовый канал, если нужно
    player.textChannel = interaction.channel;
  }

  const tracks = await player.addToQueue(query);

  if (!tracks || tracks.length === 0) {
    return interaction.editReply('❌ Ничего не найдено по твоему запросу.');
  }

  if (tracks.length === 1) {
    const track = tracks[0];
    const mins = Math.floor(track.duration / 60);
    const secs = track.duration % 60;
    return interaction.editReply(
      `✅ Добавлен трек **[${track.title}](${track.url})** (${mins}:${secs.toString().padStart(2, '0')})`,
    );
  }

  return interaction.editReply(`✅ Добавлено **${tracks.length}** треков из плейлиста!`);
}