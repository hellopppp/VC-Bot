var Discord = require('discord.js');
var ffmpegbin = require('ffmpeg-binaries');
var ffmpeg = require('ffmpeg');
var logger = require('winston');
var auth = require('./auth.json');
var settings = require('./settings.json');
var {Wit,log} = require('node-wit');
var WitSpeech = require('node-witai-speech');
var opus = require('node-opus');

var dispatcher = '';
var Channel = '';
var voiceReceiver = '';

var handleMessage = async () => {
    bot.on('message', message => {
        var str = new String();
        if (message.content.charAt(0) === settings.prefix) {
            str = message.content.substring(1);
            //Enter Bot Commands Here
            //Join Voice Channel
            if (str.includes("volume"))
            {
              var vol = new String();
              vol = str.substring(str.indexOf('e')+1);
              volFloat = parseFloat(vol)/100;
              handleVolume(volFloat);
            }
            switch (str) {
                case "join":
                    try {
                        Channel = message.member.voiceChannel
                        Channel.join()
                            .then(connection => {
                                console.log('Connected!')
                                voiceReceiver = connection.createReceiver();
                                message.channel.send("I'm Listening!");
                            })
                            .catch(console.error);
                    }
                    catch (e)
                    {
                        message.reply(message.member + " is not in a Voice Channel!");
                        console.log(e);
                    }
                    break;
                case "leave":
                  try{
                    Channel = message.member.voiceChannel;
                    Channel.leave();
                    message.channel.send("Goodbye!");
                  }
                  catch (e)
                  {
                    console.log(e);
                  }
                  break;
                case "pause":
                  try{
                    Channel = message.member.voiceChannel;
                    dispatcher.pause();
                    message.channel.send("Pausing Playback");
                  }
                  catch (e)
                  {
                    console.log(e);
                  }
                  break;
                  case "resume":
                  try{
                    Channel = message.member.voiceChannel;
                    dispatcher.resume();
                    message.channel.send("Resuming Playback");
                  }
                  catch (e){
                    console.log(e)
                  }
                  break;
            }
          }
        }
        )
}

async function decodeVoice (){

}

async function handleSummon (){

}

async function finalCommand (){

}

async function handleVolume(volume){
    try{
      dispatcher.setVolume(volume);
    }
    catch (e){
      console.log(e);
    }
}

//Logger Settings
//logger.remove(logger.transports.Console);
//logger.add(logger.transports.Console,{
//  colorize: true
//});

//logger.level = 'debug';

//Initialize Wit Client
var witClient = new Wit({
    accessToken: auth.witai_token
})

//Initialize DC bot
var bot = new Discord.Client({
    token: auth.discord_token,
    autorun: true
});

bot.login(auth.discord_token);

bot.on('ready', () => {
    console.log('Logged in as %s - %s\n', bot.username, bot.id);
});
//////////////////////////////////////////
handleMessage();
