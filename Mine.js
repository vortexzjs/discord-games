const { EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { disableButtons , getNumEmoji, formatMessage, ButtonBuilder } = require('../../utils/utils.js');
const { NumberConvert, UpdateMoneyWallet, Format, TransactionUpdate } = require('../../utils/functions.js');
const events = require('events');

module.exports = class Minesweeper extends events {
  constructor(options = {}) {

    if (!options.isSlashGame) options.isSlashGame = false;
    if (!options.message) throw new TypeError('NO_MESSAGE: No message option was provided.');
    if (typeof options.message !== 'object') throw new TypeError('INVALID_MESSAGE: message option must be an object.');
    if (typeof options.isSlashGame !== 'boolean') throw new TypeError('INVALID_COMMAND_TYPE: isSlashGame option must be a boolean.');


    if (!options.embed) options.embed = {};
    if (!options.embed.title) options.embed.title = 'Campo Minado';
    if (!options.embed.color) options.embed.color = '#5865F2';
    if (!options.embed.description) options.embed.description = 'Clique nos botões para revelar as minas.';

    if (!options.emojis) options.emojis = {};
    if (!options.emojis.flag) options.emojis.flag = '🚩';
    if (!options.emojis.mine) options.emojis.mine = '💣';

    if (!options.aposta) options.aposta = 0;
    if (!options.mines) options.mines = 1;
    if (!options.timeoutTime) options.timeoutTime = 60000;
    if (!options.winMessage) options.winMessage = 'Você ganhou o jogo! Você evitou com sucesso todas as minas.';
    if (!options.loseMessage) options.loseMessage = 'Você perdeu o jogo! Tome cuidado da próxima vez.';


    if (typeof options.embed !== 'object') throw new TypeError('INVALID_EMBED: embed option must be an object.');
    if (typeof options.embed.title !== 'string') throw new TypeError('INVALID_EMBED: embed title must be a string.');
    if (typeof options.embed.color !== 'string') throw new TypeError('INVALID_EMBED: embed color must be a string.');
    if (typeof options.embed.description !== 'string') throw new TypeError('INVALID_EMBED: embed description must be a string.');
    if (typeof options.emojis !== 'object') throw new TypeError('INVALID_EMOJIS: emojis option must be an object.');
    if (typeof options.emojis.flag !== 'string') throw new TypeError('INVALID_EMOJIS: flag emoji must be a string.');
    if (typeof options.emojis.mine !== 'string') throw new TypeError('INVALID_EMOJIS: mine emoji must be a string.');
    if (typeof options.mines !== 'number') throw new TypeError('INVALID_MINES: mines option must be a number.');
    if (typeof options.timeoutTime !== 'number') throw new TypeError('INVALID_TIME: Timeout time option must be a number.');
    if (typeof options.winMessage !== 'string') throw new TypeError('INVALID_MESSAGE: Win Message option must be a string.');
    if (typeof options.loseMessage !== 'string') throw new TypeError('INVALID_MESSAGE: Lose Message option must be a string.');
    if (options.mines < 1 || options.mines > 24) throw new RangeError('INVALID_MINES: mines option must be between 1 and 24.');
    if (options.playerOnlyMessage !== false) {
      if (!options.playerOnlyMessage) options.playerOnlyMessage = 'Este jogo é de: {player}, você não pode participar.';
      if (typeof options.playerOnlyMessage !== 'string') throw new TypeError('INVALID_MESSAGE: playerOnly Message option must be a string.');
    }

    
    super();
    this.options = options;
    this.message = options.message;
    this.emojis = options.emojis;
    this.saldo = 0;
    this.gameBoard = [];
    this.length = 5;

    for (let y = 0; y < this.length; y++) {
      for (let x = 0; x < this.length; x++) {
        this.gameBoard[y * this.length + x] = false;
      }
    }
  }


  async sendMessage(content) {
    if (this.options.isSlashGame) return await this.message.editReply(content);
    else return await this.message.channel.send(content);
  }


  async startGame() {
    if (this.options.isSlashGame || !this.message.author) {
      if (!this.message.deferred) await this.message.deferReply().catch(e => {});
      this.message.author = this.message.user;
      this.options.isSlashGame = true;
    }
    this.plantMines();
    // this.showFirstBlock();
    
    
    let mensagem = `
> **${this.options.embed.title}**
-${this.options.embed.description}

Você apostou: ${Format(this.options.aposta)} com ${this.options.mines} minas (${25 - this.options.mines} espaços livres)`
    
    const msg = await this.sendMessage({ content: `${mensagem}`, components: this.getComponents() });
    return this.handleButtons(msg);
  }
  
  handleButtons(msg) {
    const collector = msg.createMessageComponentCollector({ idle: this.options.timeoutTime });


    collector.on('collect', async btn => {
      await btn.deferUpdate().catch(e => {});
      if (btn.user.id !== this.message.author.id) {
        if (this.options.playerOnlyMessage) btn.followUp({ content: formatMessage(this.options, 'playerOnlyMessage'), ephemeral: true });
        return;
      }

      const x = parseInt(btn.customId.split('_')[1]);
      const y = parseInt(btn.customId.split('_')[2]);
      const index = (y * this.length + x);

      if (this.gameBoard[index] === true) return collector.stop();
      const mines = this.getMinesAround(x, y);
      this.gameBoard[index] = mines;

      if (this.foundAllMines()) return collector.stop();
      return await msg.edit({ components: this.getComponents() });
    })


    collector.on('end', async (_, reason) => {
      if (reason === 'user' || reason === 'idle') return this.gameOver(msg, this.foundAllMines());
    })
  }


  gameOver(msg, result) {
    const MinesweeperGame = { player: this.message.author, blocksTurned: this.gameBoard.filter(Number.isInteger).length };
    this.emit('gameOver', { result: (result ? 'win' : 'lose'), ...MinesweeperGame });
    
    for (let y = 0; y < this.length; y++) {
      for (let x = 0; x < this.length; x++) {
        const index = (y * this.length + x);
        if (this.gameBoard[index] !== true) this.gameBoard[index] = this.getMinesAround(x, y);
      }
    }
    
    let test = parseInt(this.saldo) * parseInt(this.options.aposta);
    
    let mensagem = `
> **${this.options.embed.title}**
-${this.options.embed.description}

Você apostou: ${Format(this.options.aposta)} com ${this.options.mines} minas (${25 - this.options.mines} espaços livres)

**${result ? this.options.winMessage + ` Você recebeu: ${Format(test)}` : this.options.loseMessage}**`
    
    if (result) {
      // Função que atualiza o dinheiro do usuário (Ganho)
      UpdateMoneyWallet(this.message, this.message.author, '+', test, `{emoji.entrada} {mensagem.mines.vitoria} | ${(test)}`);
    } else {
      // Função que atualiza o dinheiro do usuário (perdeu)
      UpdateMoneyWallet(this.message, this.message.author, '-', parseInt(this.options.aposta), `{emoji.saida} {mensagem.mines.derrota} | ${parseInt(this.options.aposta)}`);
    }
    
    return msg.edit({ content: `${mensagem}`, components: disableButtons(this.getComponents(true, result)) });
  }
  
  plantMines() {
    for (let i = 0; i <= (this.options.mines-1); i++) {
      const x = Math.floor(Math.random() * 5);
      const y = Math.floor(Math.random() * 5);
      const index = (y * this.length + x);

      if (this.gameBoard[index] !== true) this.gameBoard[index] = true;
      else i = (i - 1);
    }
  }

  getMinesAround(x, y) {
    let minesAround = 0;

    for (let row = - 1; row < 2; row++) {
      for (let col = - 1; col < 2; col++) {
        const block = { x: x + col, y: y + row };
        if (block.x < 0 || block.x >= 5 || block.y < 0 || block.y >= 5) continue;
        if (row === 0 && col === 0) continue;

        if (this.gameBoard[block.y * this.length + block.x] === true) minesAround += 1;
      }
    }
    return minesAround;
  }
  
  showFirstBlock() {
    const Blocks = [];

    for (let y = 0; y < this.length; y++) {
      for (let x = 0; x < this.length; x++) {
        if (this.gameBoard[y * this.length + x] === true) Blocks.push({ x, y });
      }
    }

    const emptyBlocks = Blocks.filter(b => !this.getMinesAround(b.x, b.y));
    const blocks = emptyBlocks.length ? emptyBlocks : Blocks;

    const rBlock = blocks[Math.floor(Math.random() * blocks.length)];
    this.gameBoard[rBlock.y * this.length + rBlock.x] = this.getMinesAround(rBlock.x, rBlock.y);
  }

  foundAllMines() {
    let found = true;
    for (let y = 0; y < this.length; y++) {
      for (let x = 0; x < this.length; x++) {
        if (this.gameBoard[y * this.length + x] === false) found = false;
      }
    }
    return found;
  }

  getComponents(showMines, found) {
    const components = [];
    let Mina = 1;
    
    for (let y = 0; y < this.length; y++) {
      const row = new ActionRowBuilder();
      for (let x = 0; x < this.length; x++) {

        const block = this.gameBoard[y * 5 + x];
        const isNumber = getNumEmoji(block || null);
        const displayMine = (block === true && showMines);
        // Block:
        // true - bomba
        // false - n aberto
        // 1 = aberto sem bomba
        // 2 = aberto com bomba
        
        /*displayMine
        false - N tem bomba
        true - bomba aberta
        undefined - tem bomba mas n abriu
        */
        
        // isNumber - Mostra o emoji do butao
        // console.log(`${Mina++} ${block}`);
        
        let percent = 0.20 * this.options.mines;
        
        this.saldo = percent;
        
        const btn = new ButtonBuilder()
        .setStyle(displayMine ? (found ? 'SUCCESS' : 'DANGER') : (isNumber || block === 0 ? 'SUCCESS' : 'SECONDARY'))
        .setCustomId('minesweeper_' + x + '_' + y)
        
        if (displayMine) btn.setEmoji(displayMine ? (found ? this.emojis.flag : this.emojis.mine) : isNumber)
        else if (block === 0) btn.setEmoji('💎');
        else isNumber || block === 0 ? btn.setEmoji('💎') : btn.setLabel('\u200b');
        
        row.addComponents(btn);
      }
      components.push(row);
    }
    
    return components;
  }
}
