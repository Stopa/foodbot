import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('grades', (table) => {
    table.uuid('id').primary();

    table.string('critic_id').notNullable(); // id of the discord user who gave the grade
    table.string('chef_id').notNullable(); // id of the discord user who got the grade
    table.string('guild_id').notNullable(); // id of the guild the grade was given in
    table.string('channel_id').notNullable(); // id of the channel the grade was given in
    table.string('message_id').notNullable(); // id of the message the grade was given in
    table.integer('grade').notNullable().checkBetween([1,10]); // the grade given
    table.boolean('removed').notNullable().defaultTo(false); // whether the grade was removed

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('grades');
}

