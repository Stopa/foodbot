# foodbot

![2.0:_ avocado](https://badgen.net/badge/release/AVOCADO/568203)

Simple discord bot that tallies up the number-reactions on messages with attachments in a given channel and displays leaderboard of average food grades per user

# Setup

1. Make a `.env` file based on `example.env` and supply the needed data
  * `TOKEN` - your discord api token
  * `DATABASE_HOST` and other DB stuff - hopefully self-explanatory
  * `CZAR` - the discord user id of the main food critic. Grades given by others will be recorded, but will not be announced (FOR NOW)
2. Create the database and run migrations:

    ```bash
    npm run migrate
    ```

3. Compile bot (optional, but TS in runtime gives you nothing):

    ```bash
    npm run build
    ```

4. Start the bot:

    ```bash
    npm run start
   ```

6. then you

## Then you what

then you

<img width="383" alt="image" src="https://user-images.githubusercontent.com/408256/163557895-51bf2e18-c9a6-45b5-9725-d20f0465a84f.png">
<img width="266" alt="image" src="https://user-images.githubusercontent.com/408256/163557919-6599c8b3-50e9-45d8-9e89-ddf92a0fa1ce.png">

# Versioning

[Semantic versioning](https://semver.org) makes perfect sense when you're building something with an API that needs to be consumed by other software projects.
For user-facing stuff, like this bot, not so much. (Feel free to @ me about this)

THUSLY, Foodbot will get major version upgrades whenever I decide it's a big upgrade and minor versions when it's changed but "not so much".
Also each major version will get a codename, because it's more fun that way.
