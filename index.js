const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");

const client = new Discord.Client();

const queue = new Map();

client.once("ready", () => {
  console.log("Ready!");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async (message) => {
  const command = message.content.split(" ")[0];
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  switch (command) {
    case `${prefix}tocar`:
      execute(message, serverQueue);
      break;

    case `${prefix}passar`:
      skip(message, serverQueue);
      break;

    case `${prefix}fila`:
      seeQueue(message, serverQueue);
      break;

    case `${prefix}parar`:
      stop(message, serverQueue);
      break;

    case `${prefix}help`:
      help(message);
      break;

    default:
      message.channel.send(
        "Meu fih tá ficando broco é!? Manda um comando válido ai!"
      );
      break;
  }
});

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "Ei macho, acorda! Tu precisa tá num canal de voz pra colocar música!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url,
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    console.log(serverQueue.songs);
    return message.channel.send(`${song.title} foi adicionada na fila.`);
  }
}

async function help(message) {
  return message.channel.send(`
!tocar - Toca uma música a partir de um link do youtube.
!passar - Passa para a próxima lista da fila.
!parar - Limpa a fila, e desconecta o bot.
!fila - Mostra todas as músicas na fila.
!help - Mostra a lista de comandos
`);
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Mas tu é doido ou bebe gás? Tu precisa tá num canal de voz pra passar a música"
    );
  if (!serverQueue)
    return message.channel.send("Opa! Essa música não pode ser avançada.");
  serverQueue.connection.dispatcher.end();
}

function seeQueue(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Oh bicho véi afolozado, tu precisa estar num **canal de voz** pra poder ver a lista"
    );
  serverQueue.songs.map((data, index) => {
    return message.channel.send(`${index + 1} - ${data.title}`);
  });
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", (error) => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

client.login(token);
