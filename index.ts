import * as DiscordJS from "discord.js";
import * as dotenv from "dotenv";
import * as knex from "knex";

import knexconfig from "./knexfile";
import average from "./utils/average";
import { emojiToNumber } from "./utils/emojiToNumber";
import { numberToEmoji } from "./utils/numberToEmoji";

const k = knex.knex(knexconfig);

dotenv.config();

const client = new DiscordJS.Client({
  intents: [
    DiscordJS.Intents.FLAGS.GUILD_MESSAGES,
    DiscordJS.Intents.FLAGS.GUILDS,
    DiscordJS.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
  partials: [
    // listen to reactions to messages sent before bot logged in
    "USER",
    "MESSAGE",
    "REACTION",
  ],
});

type Leaderboard = [string, number][];

/**
 * If czar id is set in env, adds it as critic_id to given filter object
 */
function withCzar(where: Record<string, any>) {
  if (process.env.CZAR) {
    return { ...where, critic_id: process.env.CZAR };
  }

  return where;
}

/**
 * People ordered by their average score
 */
async function makeLeaderboard(): Promise<Leaderboard> {
  const where: Record<string, any> = withCzar({
    removed: false,
  });

  const q = await k("grades")
    .select("chef_id")
    .where(where)
    .avg("grade as average")
    .groupBy("chef_id")
    .orderBy("average", "desc");
  return q.map(({ chef_id, average }) => [chef_id, average]);
}

/**
 * Attempts to fetch the name of the user with given id from Discord API
 */
async function userName(userId: string) {
  let name: string;
  try {
    const user = await client.users.fetch(userId);
    name = user.username;
  } catch (e) {
    name = `Unknown foodie (${userId})`;
  }
  return name;
}

/**
 * Get all grades given to the user with given id
 */
async function getGradesForChef(id: string): Promise<number[]> {
  const where: Record<string, any> = withCzar({
    chef_id: id,
    removed: false,
  });
  const q = await k.select("grade").from("grades").where(where);
  return q.map(({ grade }) => grade);
}

// name of the channel where bot will work
const FOOD_CHANNEL = "general";

function isFoodChannel(channel: DiscordJS.Message["channel"]) {
  return channel.type === "GUILD_TEXT" && channel.name === FOOD_CHANNEL;
}

// display leaderboard on request
client.on("messageCreate", async (message) => {
  if (
    isFoodChannel(message.channel) &&
    message.content.toLowerCase() === "leaderboard"
  ) {
    const leaderboard = (await makeLeaderboard()).slice(0, 5);
    const leaderboardText = await Promise.all(
      leaderboard.map(async ([uid, avg], index) => {
        const name = await userName(uid);
        return `${numberToEmoji(index + 1)}: ${name} ${avg.toFixed(1)}`;
      })
    );
    message.channel.send(`Foodie leaderboard:\n${leaderboardText.join("\n")}`);
  }
});

// record grade in db, announce average and leaderboard position change
client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.partial) {
    await reaction.fetch();
  }
  // @ts-ignore what in the goddamn
  const { id, username } = reaction.message.author;

  const num = emojiToNumber(reaction.emoji.name);
  if (
    reaction.message.attachments.size > 0 &&
    num !== null &&
    isFoodChannel(reaction.message.channel)
  ) {
    const leaderboardBefore = await makeLeaderboard();
    const indexOnLeaderboard = leaderboardBefore.findIndex(
      ([uid]) => uid === reaction.message.author?.id
    );
    const grades = await getGradesForChef(id);
    const averageBefore = leaderboardBefore[indexOnLeaderboard][1];
    const averageNow = average([...grades, num]);
    // save to db
    await k("grades").insert({
      critic_id: user.id,
      chef_id: id,
      guild_id: reaction.message.guildId,
      channel_id: reaction.message.channelId,
      message_id: reaction.message.id,
      grade: num,
    });

    // if some rando is giving grades, record them, but don't announce anything
    if (process.env.CZAR && user.id !== process.env.CZAR) {
      return;
    }

    // announce new average and improvement
    const hasAverageImproved = averageNow > averageBefore;
    let msg = `${username}, your average food grade is now ${averageNow.toFixed(
      1
    )}`;
    if (!isNaN(averageBefore)) {
      msg += `; ${
        hasAverageImproved ? "up" : "down"
      } from ${averageBefore.toFixed(1)}.`;
    }
    reaction.message.channel.send(msg);

    // announce if leaderboard position changed
    const previousRival =
      indexOnLeaderboard === -1
        ? leaderboardBefore[leaderboardBefore.length - 1]
        : leaderboardBefore[indexOnLeaderboard - 1];
    const previousRunnerup =
      indexOnLeaderboard === -1
        ? null
        : leaderboardBefore[indexOnLeaderboard + 1];
    if (previousRival && averageNow > previousRival[1]) {
      const rivalName = await userName(previousRival[0]);
      const rivalScore = previousRival[1].toFixed(1);
      reaction.message.channel.send(
        `${username} has surpassed ${rivalName} (${rivalScore}) on the leaderboard! 📈📈📈`
      );
    } else if (previousRunnerup && averageNow < previousRunnerup[1]) {
      const runnerupName = await userName(previousRunnerup[0]);
      const runnerupScore = previousRunnerup[1].toFixed(1);
      reaction.message.channel.send(
        `${username} has fallen behind ${runnerupName} (${runnerupScore}) on the leaderboard. 📉📉📉`
      );
    }
  }
});

// soft-remove grade in DB if one existed for the given message
client.on("messageReactionRemove", async (reaction, user) => {
  const num = emojiToNumber(reaction.emoji.name);
  if (reaction.partial) {
    await reaction.fetch();
  }

  const q = await k("grades").where({
    critic_id: user.id,
    message_id: reaction.message.id,
  });

  if (q.length > 0) {
    await k("grades")
      .where({
        critic_id: user.id,
        message_id: reaction.message.id,
        grade: num,
      })
      .update("removed", true);
  }
});

client.login(process.env.TOKEN);
