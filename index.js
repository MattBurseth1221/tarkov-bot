import { REST, Routes } from 'discord.js';
import { Client, Events, GatewayIntentBits, SlashCommandBuilder, Collection } from 'discord.js';
import { request, gql } from 'graphql-request';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commandBuilder = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Testing command builder'),
  async execute(interaction) {
    await interaction.reply('This is a test');
  }
}

const commands = [
  {
    name: 'goons',
    description: 'Where them goons at!?',
  },
  {
    name: 'epod',
    description: 'Secret Epod command!',
  },
  {
    name: 'items',
    description: 'Returns item information',
    options: [
      {
        name: 'item',
        description: 'Search for a specific item',
        type: 3,
        required: true,
      }
    ]
  }
];

const rest = new REST({ version: '10' }).setToken("MTIyMjM0MTQyOTM3MjY1MzU4OQ.GxFMal.vM1gXsK5ETUrIErk-u2nD2n2MZi3cu5ZmH2caI");

try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(Routes.applicationCommands("1222341429372653589"), { body: commands });
  // client.commands = new Collection();
  // client.commands.set('test', commandBuilder);

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  console.log(interaction.content);
  console.log('inter: ' + interaction.commandName); 

  if (interaction.commandName === 'goons') {
    const goonLocation = await getGoonLocation();

    const location = goonLocation['Current Map'][0];
    const time = goonLocation.Time[0];

    await interaction.reply(`The Goons are on ${location}, which was last reported on ${time}`);
  } else if (interaction.commandName === 'epod') {
    await interaction.reply(`Congrats! You've found the secret Epod command!`);
  } else if (interaction.commandName === 'items') {
    const item = interaction.options.getString('item');
    console.log(item);
    const itemInfo = await getItemInfo(item);
    
    if (itemInfo.length === 0) {
      await interaction.reply(`Item "${item}" was not found...`)
    } else {
      let reply = "";

      for (let i = 0; i < itemInfo.length; i++) {
        reply += itemInfo[i].name + " - ";

        const itemPrice = await getItemPricesById(itemInfo[i].id);
        let price;

        if (itemPrice.length === 0) {
          price = 'N/A';
        } else {
          price = itemPrice[0].price;
        }

        console.log('price: ' + price);

        reply += price;

        reply += '\n';
      }

      console.log('info: ' + reply);
      await interaction.reply(reply);
    }
    
  } else {
    console.log(interaction.commandName);
  }
});

async function getGoonLocation() {
    const goonInfo = await fetch('https://tarkovpal.com/api')
        .then((response) => response.json());

    console.log(goonInfo);
    return goonInfo;
}

async function getItemInfo(item) {
  const query = gql`
    {
      items(name: "${item}") {
        name
        id
      }
    }
  `

  const result = await request("https://api.tarkov.dev/graphql", query);

  console.log(result);

  return result.items;
}

async function getItemPricesById(id) {
  const query = gql`
    {
      historicalItemPrices(limit: 1, id: "${id}") {
        price
        priceMin
      }
    }
  `

  const result = await request("https://api.tarkov.dev/graphql", query);

  console.log(result);

  return result.historicalItemPrices;
}

client.login("MTIyMjM0MTQyOTM3MjY1MzU4OQ.GxFMal.vM1gXsK5ETUrIErk-u2nD2n2MZi3cu5ZmH2caI");