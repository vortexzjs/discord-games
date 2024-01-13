const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js')
const MatchPairs = require('../../utils/games/MatchPairs.js');


module.exports = {
  name: 'memória',
  description: '⌊😂 Diversão⌉ Brinque de jogo da memoria.',
  options: [
    {
      name: 'tema',
      description: 'Selecione o tema de seu jogo da memória.',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: "🥭 Comidas",
          value: "comidas",
        },
        {
          name: "🇧🇷 Bandeiras",
          value: "bandeiras",
        },
        {
          name: "🐮 Animais",
          value: "animais",

        },
        {
          name: "⚽ Esportes",
          value: "esportes",

        },
        {
          name: "🏎 Carros",
          value: "carros",

        },
      ],
    }
  ],

  run: async (client, interaction, args, colors, database, emoji) => {
    
    const emojis = interaction.options.getString('tema');
    
    let emotes = [],
        Nome = '';
    
    switch (emojis) {
      case 'comidas':
        emotes = ['🍉', '🍇', '🍊', '🥭', '🍎', '🍏', '🥝', '🥥', '🍓', '🫐', '🍍', '🥕', '🥔']
        Nome = 'Comidas';
        break;
        
      case 'bandeiras':
        emotes = ['🇧🇷', '🇧🇫', '🇨🇴', '🇨🇳', '🇫🇮', '🇦🇲', '🇦🇽', '🇦🇨', '🇬🇬', '🇬🇸', '🇯🇪', '🇯🇵', '🇮🇱']
        Nome = 'Bandeiras';
        break;
        
      case 'animais':
        emotes = ['🐶', '🐱', '🐭', '🐹', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸']
        Nome = 'Animais';
        break;
        
      case 'esportes':
        emotes = ['⚽', '🏀', '🏈', '⚾', '🥎', '🏐', '🏉', '🎱', '🥏', '🏓', '🏸', '🏒', '⛳'];
        Nome = 'Esportes'
        break;
        
      case 'carros':
        emotes = ['🚔', '🚗', '🚙', '🛺', '🚌', '🚕', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚛'];
        Nome = 'Carros'
        break;
    }
    
    const Game = new MatchPairs({
      message: interaction,
      isSlashGame: true,
      winMessage: `Você ganhou!, Virou um total de: \`{tilesTurned}\` peças.`,
      loseMessage: `Você perdeu, Virou um total de: \`{tilesTurned}\` peças.`,
      embed: {
          title: '``Jogo da memória``',
          color: colors,
          description: `> Tema: **${Nome}**\nClique nos botões para combinar emojis com seus pares!`,
      },
      timeoutTime: 6000,
      emojis: emotes,
    });

    Game.startGame();
    
  }
}
