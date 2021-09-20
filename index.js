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

    case `${prefix}play`:
      execute(message, serverQueue);
      break;

    case `${prefix}passar`:
      skip(message, serverQueue);
      break;

    case `${prefix}skip`:
      skip(message, serverQueue);
      break;

    case `${prefix}fila`:
      seeQueue(message, serverQueue);
      break;

    case `${prefix}queue`:
      seeQueue(message, serverQueue);
      break;

    case `${prefix}parar`:
      stop(message, serverQueue);
      break;

    case `${prefix}stop`:
      stop(message, serverQueue);
      break;

    case `${prefix}help`:
      help(message);
      break;

    case `${prefix}limpar`:
      cleanQueue(message, serverQueue);
      break;

    case `${prefix}clear`:
      cleanQueue(message, serverQueue);
      break;

    case `${prefix}np`:
      nowPlaying(message, serverQueue);
      break;

    case `${prefix}ping`:
      pong(message);
      break;

    case `${prefix}v`:
      version(message);
      break;

    case `${prefix}pause`:
      pause(message, serverQueue);
      break;

    case `${prefix}resume`:
      resume(message, serverQueue);
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

  if (args.length > 2 || args.length == 1) {
    return message.channel.send(
      "Se atente, você precisa digitar um comando válido! Digite **!help** para ver a lista de comandos."
    );
  }

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "Ei macho, acorda! Tu precisa tá num canal de voz pra colocar música!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "Preciso ter permissão pra acessar esse canal."
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
    return message.channel.send(
      `A música **${song.title}** foi adicionada a fila.`
    );
  }
}

async function help(message) {
  return message.channel.send(`
Estes são os comandos que posso fazer:

${">>> "}${"`!tocar`"} ou ${"`!play`"} - Toca uma música a partir de um link do youtube.
${"`!passar`"} ou ${"`!skip`"} - Passa para a próxima música da fila de reprodução.
${"`!np`"} - Mostra a música que está tocando no momento.
${"`!parar`"} ou ${"`!stop`"} - Desconecta o bot.
${"`!fila`"} ou ${"`!queue`"} - Mostra todas as músicas na fila.
${"`!limpar`"} ou ${"`!clear`"} - Limpa a fila de reprodução.
${"`!help`"} - Mostra a lista de comandos
${"`!ping`"} - Pong!
`);
}

async function pong(message) {
  return message.channel.send(`**Pong!**`);
}

async function nowPlaying(message, serverQueue) {
  if (!serverQueue) {
    return message.channel.send(
      "Epa! Parece que não existem músicas na fila de reprodução!"
    );
  }
  return message.channel.send(
    `${">>> "}Tocando agora 🎶: **${serverQueue.songs[0].title}**`
  );
}

async function version(message) {
  return message.channel.send(`**v1.0.0**`);
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Mas tu é doido ou bebe gás? Tu precisa tá num canal de voz pra passar a música"
    );
  if (!serverQueue)
    return message.channel.send(
      "Epa! Parece que não existem músicas na fila de reprodução!"
    );
  serverQueue.connection.dispatcher.end();
}

function seeQueue(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.channel.send(
      "Oh bicho véi afolozado, tu precisa estar num **canal de voz** pra poder ver a lista"
    );
  }

  if (serverQueue === undefined) {
    return message.channel.send(
      "Epa! Parece que sua lista de reprodução está vazia."
    );
  }

  message.channel.send(`${"Estas são as músicas em fila de reprodução: "}
  ${serverQueue.songs
    .map((data, index) => {
      return `${index !== 0 ? "" : ">>> "}${"**"}${index + 1} - ${
        data.title
      }${"**"}${"\n\n"}`;
    })
    .join("")}
  `);
}

function stop(message, serverQueue) {
  if (serverQueue === undefined) {
    return message.channel.send("Eu não estou em execução");
  }

  if (!message.member.voice.channel)
    return message.channel.send(
      "Você precisa estar em um canal de voz para usar este comando."
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function pause(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.channel.send(
      "Você precisa estar em um canal de voz para usar este comando."
    );
  }
  if (!serverQueue) {
    return message.channel.send("Opa! Não há nenhuma música sendo tocada.");
  }
  if (serverQueue.connection.dispatcher.paused) {
    return message.channel.send("Opa! Essa música já está pausada!");
  }
  serverQueue.connection.dispatcher.pause();
  message.channel.send("A música foi pausada.");
}

function resume(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.channel.send(
      "Você precisa estar em um canal de voz para usar este comando."
    );
  }
  if (!serverQueue) {
    return message.channel.send("Opa! Não há nenhuma música sendo tocada.");
  }
  if (serverQueue.connection.dispatcher.resumed) {
    return message.channel.send("Opa! Essa música já está em execução!");
  }
  serverQueue.connection.dispatcher.resume();
  message.channel.send("A música em execução.");
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
  serverQueue.textChannel.send(`${">>> "}Tocando agora 🎶: **${song.title}**`);
}

function cleanQueue(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Você precisa estar em um canal de voz para limpar a lista o bot."
    );
  serverQueue.songs.splice(1, serverQueue.songs.length);
  return message.channel.send("A fila foi limpa com sucesso!");
}

client.login(token);
