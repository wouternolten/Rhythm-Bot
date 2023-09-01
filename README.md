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

You need to have [node.js](https://nodejs.org/en) installed in order for this bot to work.

### Installation

Run `npm install`

### Configuration

Minimal configuration:

1.  Get a token string for your bot from by registering your bot here: [https://discordapp.com/developers](https://discordapp.com/developers)

    -   Create an invite link like this
        `https://discordapp.com/api/oauth2/authorize?client_id={ APPLICATION ID }&permissions=2159044672&scope=bot`

2.  Copy `bot-config.example.json` to `bot-config.json`.
3.  Fill in the token from step 1 in MAIN_BOT_TOKEN
4.  Start playing!

### Running the Application

-   Run `npm start`

### BONUS: Autoplay

This bot has an autoplay functionality which makes use of the Spotify API. In order to use this, get your API key from [Spotify For Developers](https://developer.spotify.com/documentation/web-api#spotify-uris-and-ids). Fill in the client id and secret in the `bot-config.json` and switch the `autoplay` boolean to true. Enjoy the autoplay functionality!

### BONUS: Welcome tunes

Net to 'just' playing tunes, it can also play custom files for when someone joins the voice chat. In order for this to work, follow these steps:

1. Create a new token, just like in the Configuration section, but in step 3, add it in the `WELCOME_BOT_TOKEN`.
2. Set "useWelcomeBot" to true
3. Add usernames with their sounds under "soundfiles". For instance, filling in `"rick_astley": "nevergonnagiveyouup.wav"` will play the sound in `./data/sounds/nevergonnagiveyouup.wav` when user `"rick_astley"` joins.
4. There's also an `!aoe <number>` command. It was based on the Age Of Empires taunts in chat, hence the name. It'll search for the correct sound in `./data/sounds/age_taunts`. So, for instance, if a user types `!aoe 11`, it'll try to play a soundfile beginning with `11`.
5. Done!
