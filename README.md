# Rhythm-Bot | Wouter's fork

Simple little music bot to queue up and play youtube audio over discord voice channels.
Thanks to Malexion for the base code Basically used this project to learn new coding skills! Feel free to take a look around.

Note: This is not the bot listed here [https://rythmbot.co/](https://rythmbot.co/)

## Bot Commands

-   Show helpful info
    > `!help`
-   (toggle on/off) autoplay the first recommendation when queue is empty.
    > `!autoplay`
-   List all songs currently in queue.
    > `!list`
-   Move a song in queue. Usage: move [song index to move] [up / down / target destination].
    > `!move`
-   Search for a song and directly add it to the queue.
    > `!p`
-   Pause the player
    > `!pause`
-   Check if the bot is still alive.
    > `!ping`
-   Lists al songs currently in queue
    > `!q` or `!queue`
-   Remove a song from the queue. Usage: remove [song index].
    > `!remove`
-   Search for a song
    > `!search`
-   Skip the song
    > `!skip`
-   Stop the song
    > `!stop`

## Bot Hosting

### Unlisted dependencies

-   `Python2.7` This version is required for node-gyp I think?
-   `node-gyp` command line tool
-   `node.js` version 12.X.X or higher is required

### Installation

-   Install node latest stable release, this was built with node v12.16.1
-   For windows run `npm install --global --production --add-python-to-path windows-build-tools`
    -   Run `npm install node-gyp -g`
    -   Run `npm install`

### Configuration

-   Get a token string for your bot from by registering your bot here: [https://discordapp.com/developers](https://discordapp.com/developers)
    -   Create an invite link like this
        `https://discordapp.com/api/oauth2/authorize?client_id={ APPLICATION ID }&permissions=2159044672&scope=bot`
-   Open `bot-config.json` and replace the content between the quotes `"<BOT-TOKEN-HERE>"` with your bot token.
    -   In config you can add other settings, to see an example of the settings open `./src/bot/config.ts` and look at `DefaultBotConfig` and `BotConfig` for examples
-   Open `bot.log` if you're looking to debug errors

### Running the Application

-   Run `npm start`
