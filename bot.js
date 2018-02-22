var Discord = require('discord.js');
var ffmpegbin = require('ffmpeg-binaries');
var ffmpeg = require('ffmpeg');
var logger = require('winston');
var auth = require('./auth.json');
var settings = require('./settings.json');
var {Wit, log} = require('node-wit');

//Logger Settings
//logger.remove(logger.transports.Console);
//logger.add(logger.transports.Console,{
//  colorize: true
//});

//logger.level = 'debug';

//Initialize Wit Client
var witClient = new Wit({accessToken: auth.witai_token})

//Initialize DC bot
var bot = new Discord.Client({
  token: auth.discord_token,
  autorun: true
});

bot.login(auth.discord_token);

bot.on('ready', () =>
{
    console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

bot.on('message', message => {
  var str = new String();
  if(message.content.charAt(0) === settings.prefix)
  {
    str = message.content.substring(1);
    //Enter Bot Commands Here
    //Join Voice Channel
    if(str === 'join')
    {
      try {
        var Channel = message.member.voiceChannel
        Channel.join()
        .then(connection =>
          {
            console.log('Connected!')
            const voiceReceiver = connection.createReceiver();
            message.channel.send("I'm Listening!");

          })
        .catch(console.error);
      }
    catch (e) {
    message.reply(message.member + " is not in a Voice Channel!");
    console.log(e);
      }
    }
  }

});
