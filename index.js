const DiscordJS = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const client = new DiscordJS.Client({
    intents: [
        DiscordJS.Intents.FLAGS.GUILD_MESSAGES,DiscordJS.Intents.FLAGS.GUILDS,DiscordJS.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

function emojiToNumber(emoji) {
    switch (emoji) {
        case '1️⃣':
            return 1;
        case '2️⃣':
            return 2;
        case '3️⃣':
            return 3;
        case '4️⃣':
            return 4;
        case '5️⃣':
            return 5;
        case '6️⃣':
            return 6;
        case '7️⃣':
            return 7;
        case '8️⃣':
            return 8;
        case '9️⃣':
            return 9;
        case '🔟':
            return 10;
        default:
            return null;
    }
}

function numberToEmoji(num) {
    switch (num) {
        case 1:
            return '1️⃣';
        case 2:
            return '2️⃣';
        case 3:
            return '3️⃣';
        case 4:
            return '4️⃣';
        case 5:
            return '5️⃣';
        case 6:
            return '6️⃣';
        case 7:
            return '7️⃣';
        case 8:
            return '8️⃣';
        case 9:
            return '9️⃣';
        case 10:
            return '🔟';
        default:
            return null;
    }
}

function average(array) {
    if (!array) return 0;
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum / array.length;
}

// replace with food when ready
const FOOD_CHANNEL = 'food';

let db = {};

// on start read previously cached data from file
client.on('ready',() => {
    console.log('the bot is ready');
    fs.readFile('./db.json', 'utf8', (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        db = JSON.parse(data);
    });
});

// display leaderboard on request
client.on('messageCreate', (message) => {
    if (message.content === 'leaderboard') {
        const leaderboard = Object.entries(db).map(([uid,nums]) => [uid, average(nums)]).sort((a,b) => b[1] - a[1]).slice(0,5);
        message.channel.send(`Foodie leaderboard:\n${leaderboard.map(([uid,avg], index) => `${numberToEmoji(index+1)}: ${client.users.cache.get(uid)?.username} ${avg.toFixed(1)}`).join('\n')}`);
    }
});

client.on('messageReactionAdd', (message,user) => {
    const num = emojiToNumber(message.emoji.name);
    if (message.message.author && message.message.attachments.size > 0 && num !== null && message.message.channel.type === 'GUILD_TEXT' && message.message.channel.name === FOOD_CHANNEL) {
        const averageBefore = average(db[message.message.author.id]);
        Object.assign(db, {
            [message.message.author.id]: [...(db[message.message.author.id] || []), num]
        });
        const averageNow = average(db[message.message.author.id]);
        const better = averageNow > averageBefore;
        let msg = `Your average food grade is now ${averageNow}`;
        if (!isNaN(averageBefore)) {
            msg += `; ${better ? 'up' : 'down'} from ${averageBefore}.`
        }
        message.message.channel.send(msg);
        fs.writeFile('./db.json', JSON.stringify(db), (err) => {
            if (err) {
                console.error(err);
            }
        });
    }
})

client.login(process.env.TOKEN);
