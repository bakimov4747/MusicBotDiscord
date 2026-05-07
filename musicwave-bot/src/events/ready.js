export const name = 'ready';
export const once = true;

export function execute(client) {
  console.log(`✅ ${client.user.tag} онлайн! 🎵`);
  client.user.setActivity('/play — включи музыку', { type: 2 });
}