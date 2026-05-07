import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} from '@discordjs/voice';
import play from 'play-dl';
import { EmbedBuilder } from 'discord.js';

// Хранилище плееров для каждой гильдии
const players = new Map();

class MusicPlayer {
  constructor(guildId, voiceChannel, textChannel) {
    this.guildId = guildId;
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.queue = [];
    this.currentIndex = 0;
    this.volume = 50;
    this.audioPlayer = createAudioPlayer();
    this.connection = null;
    this.isPlaying = false;
    this.loop = false;

    this._setupListeners();
  }

  static get(guildId) {
    return players.get(guildId);
  }

  static set(guildId, player) {
    players.set(guildId, player);
  }

  static delete(guildId) {
    players.delete(guildId);
  }

  _setupListeners() {
    this.audioPlayer.on(AudioPlayerStatus.Playing, () => {
      this.isPlaying = true;
    });

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.isPlaying = false;
      this._playNext();
    });

    this.audioPlayer.on('error', (error) => {
      console.error(`❌ AudioPlayer ошибка на ${this.guildId}:`, error.message);
      this.isPlaying = false;
      this._playNext();
    });
  }

  async connect() {
    try {
      this.connection = joinVoiceChannel({
        channelId: this.voiceChannel.id,
        guildId: this.guildId,
        adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
      });

      this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          this.destroy();
        }
      });

      this.connection.subscribe(this.audioPlayer);
      return true;
    } catch (error) {
      console.error('❌ Ошибка подключения к голосовому каналу:', error);
      return false;
    }
  }

  async addToQueue(query) {
    let tracks = [];

    try {
      // Проверяем, ссылка это или поисковый запрос
      const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;
      if (urlPattern.test(query)) {
        // Ссылка на YouTube
        if (query.includes('playlist')) {
          const playlist = await play.playlist_info(query);
          const videos = await playlist.all_videos();
          for (const video of videos) {
            tracks.push({
              title: video.title,
              url: video.url,
              duration: video.durationInSec,
              thumbnail: video.thumbnails?.[0]?.url || null,
            });
          }
        } else {
          const video = await play.video_info(query);
          tracks.push({
            title: video.video_details.title,
            url: video.video_details.url,
            duration: video.video_details.durationInSec,
            thumbnail: video.video_details.thumbnails?.[0]?.url || null,
          });
        }
      } else {
        // Поисковый запрос
        const results = await play.search(query, { limit: 1 });
        if (results.length === 0) return null;

        const video = await play.video_info(results[0].url);
        tracks.push({
          title: video.video_details.title,
          url: video.video_details.url,
          duration: video.video_details.durationInSec,
          thumbnail: video.video_details.thumbnails?.[0]?.url || null,
        });
      }

      this.queue.push(...tracks);

      if (!this.isPlaying) {
        await this._playCurrent();
      }

      return tracks;
    } catch (error) {
      console.error('❌ Ошибка добавления трека:', error);
      return null;
    }
  }

  async _playCurrent() {
    if (this.queue.length === 0 || this.currentIndex >= this.queue.length) {
      this.isPlaying = false;
      return;
    }

    const track = this.queue[this.currentIndex];

    try {
      const stream = await play.stream(track.url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true,
      });

      resource.volume.setVolume(this.volume / 100);
      this.audioPlayer.play(resource);
      this.isPlaying = true;

      // Отправляем уведомление о треке
      const embed = new EmbedBuilder()
        .setTitle('🎵 Сейчас играет')
        .setDescription(`[${track.title}](${track.url})`)
        .setColor(0x5865F2);

      if (track.duration) {
        const mins = Math.floor(track.duration / 60);
        const secs = track.duration % 60;
        embed.addFields({ name: '⏱ Длительность', value: `${mins}:${secs.toString().padStart(2, '0')}`, inline: true });
      }

      if (track.thumbnail) {
        embed.setThumbnail(track.thumbnail);
      }

      embed.setFooter({ text: `Трек ${this.currentIndex + 1} из ${this.queue.length}` });

      if (this.textChannel) {
        await this.textChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('❌ Ошибка воспроизведения трека:', error);
      this._playNext();
    }
  }

  _playNext() {
    if (this.loop && this.currentIndex < this.queue.length) {
      this._playCurrent();
      return;
    }

    this.currentIndex++;
    if (this.currentIndex < this.queue.length) {
      this._playCurrent();
    } else {
      this.isPlaying = false;
      if (this.textChannel) {
        this.textChannel.send('✅ Очередь закончилась. Добавь ещё треки с `/play`');
      }
    }
  }

  skip() {
    if (!this.isPlaying) return false;
    this.audioPlayer.stop();
    return true;
  }

  pause() {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Playing) return false;
    this.audioPlayer.pause();
    return true;
  }

  resume() {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Paused) return false;
    this.audioPlayer.unpause();
    return true;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, vol));
    const resource = this.audioPlayer.state.resource;
    if (resource && resource.volume) {
      resource.volume.setVolume(this.volume / 100);
    }
    return this.volume;
  }

  getCurrentTrack() {
    if (this.queue.length === 0 || this.currentIndex >= this.queue.length) return null;
    return this.queue[this.currentIndex];
  }

  destroy() {
    this.audioPlayer.stop();
    if (this.connection) {
      this.connection.destroy();
    }
    MusicPlayer.delete(this.guildId);
    this.queue = [];
    this.isPlaying = false;
  }
}

export { MusicPlayer, players };