const express = require("express");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource
} = require("@discordjs/voice");
const googleTTS = require("google-tts-api");

/* KEEP ALIVE SERVER (Railway) */
const app = express();
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(3000);

/* DISCORD CLIENT */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* SLASH COMMANDS */
const commands = [
  new SlashCommandBuilder()
    .setName("join")
    .setDescription("Bot joins your voice channel"),

  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Bot speaks text in VC")
    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Text to speak")
        .setRequired(true)
    )
];

/* BOT READY */
client.once("ready", async () => {
  console.log("✅ Bot is online");

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );
});

/* SLASH COMMAND HANDLER */
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const vc = interaction.member.voice.channel;
  if (!vc) {
    return interaction.reply({
      content: "❌ Join a voice channel first",
      ephemeral: true
    });
  }

  if (interaction.commandName === "join") {
    joinVoiceChannel({
      channelId: vc.id,
      guildId: vc.guild.id,
      adapterCreator: vc.guild.voiceAdapterCreator
    });

    return interaction.reply("✅ Joined voice channel");
  }

  if (interaction.commandName === "say") {
    const text = interaction.options.getString("text");
    const url = googleTTS.getAudioUrl(text, {
      lang: "en",
      slow: false
    });

    const connection = joinVoiceChannel({
      channelId: vc.id,
      guildId: vc.guild.id,
      adapterCreator: vc.guild.voiceAdapterCreator
    });

    const player = createAudioPlayer();
    const resource = createAudioResource(url);

    connection.subscribe(player);
    player.play(resource);

    return interaction.reply("🗣 Speaking in VC");
  }
});

/* NORMAL CHAT REPLIES */
client.on("messageCreate", message => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();

  // If bot is mentioned
  if (message.mentions.has(client.user)) {
    return message.reply("👋 Hi! Try /say or say hello!");
  }

  // Custom text replies
  if (msg.includes("hello")) {
    return message.reply("Hello 😄");
  }

  if (msg.includes("how are you")) {
    return message.reply("I'm good 🤖");
  }

  if (msg === "ping") {
    return message.reply("pong 🏓");
  }
});

/* LOGIN */
client.login(process.env.TOKEN);
