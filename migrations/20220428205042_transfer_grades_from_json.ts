import { Knex } from "knex";
import fs from "fs/promises";
import dotenv from "dotenv";

import average from "../utils/average";

dotenv.config();

export async function up(knex: Knex): Promise<void> {
  let data: [string, number[]][];
  try {
    const res = await fs.readFile(__dirname + "/../db.json", {
      encoding: "utf8",
    });
    data = Object.entries(JSON.parse(res));
  } catch (err) {
    console.log("Can't read db.json, skipping");
    return;
  }

  return knex.transaction(async (trx) => {
    await trx.schema.alterTable("grades", async (table) => {
      await table.dropColumn("id");
      table.increments("id").primary();
      table.setNullable("guild_id");
      table.setNullable("channel_id");
      table.setNullable("message_id");
    });
    await trx("grades").insert(
      data.map(([foodieId, grades]) => ({
        critic_id: process.env.CZAR,
        chef_id: foodieId,
        grade: Math.round(average(grades)),
      }))
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("grades", (table) => {
    knex.transaction(async (trx) => {
      await trx("grades")
        .where({
          guild_id: null,
          channel_id: null,
          message_id: null,
        })
        .delete();

      await table.dropNullable("guild_id");
      await table.dropNullable("channel_id");
      await table.dropNullable("message_id");
      await table.dropColumn("id");
      await table.uuid("id").primary();
    });
  });
}
