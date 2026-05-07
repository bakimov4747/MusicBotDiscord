import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import config from './config.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Загрузка команд
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
  const command = await import(`file://${join(commandsPath, file)}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.log(`⚠️ Команда ${file} пропущена (нет data или execute)`);
  }
}

// Регистрация команд
const rest = new REST({ version: '10' }).setToken(config.token);

try {
  console.log('🔄 Регистрация slash-команд...');

  if (config.guildId && config.guildId !== 'ВСТАВЬ_ID_СЕРВЕРА_СЮДА') {
    // Регистрация на конкретном сервере (быстрая)
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );
    console.log(`✅ Команды зарегистрированы на сервере ${config.guildId}`);
  } else {
    // Глобальная регистрация (до 1 часа обновления)
    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands },
    );
    console.log('✅ Команды зарегистрированы глобально');
  }
} catch (error) {
  console.error('❌ Ошибка регистрации команд:', error);
}

// Загрузка событий
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = await import(`file://${join(eventsPath, file)}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Вход в систему
client.login(config.token);