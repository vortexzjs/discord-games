const { ApplicationCommandType, ApplicationCommandOptionType, ButtonStyle, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { NumberConvert, UpdateMoneyWallet, Format } = require('../../utils/functions.js');
const Minesweeper = require('../../utils/games/Mine.js');

module.exports = {
  "name": "mines",
  "description": "⌊🎰 Apostas⌉ Evite as minas e dobre seu dinheiro.",
  "type": ApplicationCommandType.ChatInput,
  "options": [
    {
      name: "quantidade",
      type: ApplicationCommandOptionType.String,
      description: "Qual a quantia que você deseja apostar.",
      required: true,
    },
    {
      name: "minas",
      type: ApplicationCommandOptionType.Number,
      description: "Quantia de minas do tabuleiro.",
      required: false,
    }
  ],
  
  run: async (client, interaction, args, colors, database, emoji) => {
    
    if (!interaction.guild) return interaction.error(`Este comando deve ser utilizado em um servidor.`);
    
    let minas = interaction.options.getNumber("minas") || Math.floor(Math.random() * 7) + 5;
    
    return database.ref(`/economia/saldo/${interaction.user.id}`).once('value').then(async function(snapshot) {
      let carteira = (snapshot.val() && snapshot.val().carteira)
      if (carteira === undefined || carteira === null) carteira = 0;

      let banco = (snapshot.val() && snapshot.val().banco)
      if (banco === undefined || banco === null) banco = 0;

      let quantia = await interaction.options.getString('quantidade');
      let number = await NumberConvert(`${quantia}`);

      if (quantia == 'all' || quantia == 'tudo') number = carteira;
      else number = number;

      if (isNaN(number)) return interaction.error(`\`${quantia}\` não me parece um número válido.`)

      if (carteira < number) return interaction.error(`Você não possui o valor suficiente.`);

      if (number < 1000) return interaction.error(`O valor mínimo para aposta é de **${Format(1000)}**`)

      if (minas >= 8) return interaction.error(`O máximo de minas são 7`)
      if (minas < 5) return interaction.error(`O mínimo de minas são 5`)
      
      const Game = new Minesweeper({
        message: interaction,
        isSlashGame: true,
        embed: {
          title: 'Mines',
          color: colors,
          description: 'Tente retirar todas as joias sem clicar na bomba e perder tudo.'
        },
        emojis: { flag: '🚩', mine: '💣' },
        aposta: number,
        mines: minas,
        // timeoutTime: 60000,
        winMessage: 'Você ganhou! Você desviou de todas as minas.',
        loseMessage: '💥 BOOM, Você perdeu! Tente não cair na mina na proxima vez.',
        playerOnlyMessage: 'Apenas: {player} pode jogar.'
      });

      Game.startGame();
      
    })
  }
}
