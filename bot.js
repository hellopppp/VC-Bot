var Discord = require('discord.js');
var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
var ffmpegbin = require('ffmpeg-binaries');

var ffmpeg = require('fluent-ffmpeg');
const fluentffmpeg = ffmpeg();
var logger = require('winston');
var auth = require('./auth.json');
var settings = require('./settings.json');

var speechToText = new SpeechToTextV1({
  iam_apikey:'WATSONAPIKEYHERE',
  url: 'https://gateway-wdc.watsonplatform.net/speech-to-text/api'
});

var ttsparams = {
    objectMode: false,
    'content_type': 'audio/mp3',
    //'content_type':'audio/ogg;codecs=opus',
    model: 'en-US_BroadbandModel',
    keywords: ['colorado', 'tornado', 'tornadoes'],
    'keywords_threshold': 0.5,
    'max_alternatives': 3
};


var {
    Wit,
    log
} = require('node-wit');
var WitSpeech = require('node-witai-speech');
var opus = require('node-opus');
var fs = require('fs');

var dispatcher = '';
var receiverCount = 0;
var snippetId = 0;
var count = 0;

var opusStreams = undefined;
var opusEncodeStream = new opus.Encoder(48000, 1, 480);
var connection = '';
const rate = 48100;
const framesize = 1500;
const channels = 2;

var lastChannel;
var lastMemberSpeaking;
var listeningMember;

var currentFileName;

var voiceRecogState = 0; //0 : Awaiting Summon //1: Awaiting Command

function handleVoiceEvent(user,name,event){
  console.log(name, event);
  if(name=='Data:')
  {
    if(voiceRecogState ==0)
    {
      lastChannel.send("I Heard: " + event);
      if ((event.contains('summon')||(event.contains('someone')||(event.contains('some in'))
      {
        voiceRecogState=1;
        lastChannel.send("Awaiting Command!");
      }
      else
      {
        voiceRecogState=0;
      }
    }

  }

}

function handleOutputFile(channel, member) {
  // use IDs instead of username cause some people have stupid emojis in their name
  const fileName = `./recordings/${channel.id}${member.id}${Date.now()}.pcm`;
  currentFileName = fileName;
  return fs.createWriteStream(fileName);
}

function createFileName(channel, member)
{
  const fileName = `./recordings/${channel.id}-${member.id}-${Date.now()}.pcm`;

}

async function handleMessage() {
    bot.on('message', message => {
        var str = new String();
        if (message.content.charAt(0) === settings.prefix) {
            str = message.content.substring(1);
            //Enter Bot Commands Here
            //Join Voice Channel
            if (str.includes("volume")) {
                var vol = new String();
                vol = str.substring(str.indexOf('e') + 1);
                volFloat =parseFloat(vol) / 100;
                handleVolume(volFloat);
            } else {
                switch (str) {
                    case "join":
                        try {
                            var Channel = message.member.voiceChannel;
                            lastChannel = message.channel;
                            Channel.join()
                              .then(conn => {
                                  const myVoiceReceiver = conn.createReceiver();
                                  console.log("Created Voice Receiver");
                                  receiverCount++;

                              conn.on('speaking', (user,speaking) =>
                              {
                                if(speaking)
                                {
                                  lastMemberSpeaking=user;
                                  if(myVoiceReceiver.destroyed)
                                  {
                                    myVoiceReceiver.recreate();
                                  }
                                  console.log("Listening to " + user.username);
                                  const audioStream = myVoiceReceiver.createPCMStream(user);
                                  console.log("created PCM stream")
                                  const outputStream = handleOutputFile(Channel,user);
                                  fs.writeFileSync(currentFileName+".mp3");
                                  audioStream.pipe(outputStream);
                                  outputStream.on("data", console.log);

                                  var ffmpegFileName = currentFileName.substr(1,currentFileName.length);

                                  audioStream.on('end',()=>{
                                    console.log(currentFileName);

                                  let proc = ffmpeg(currentFileName)
                                    .inputOptions([
                                      '-f s32le',
                                      '-ar 48k'
                                    ])
                                    .outputOptions([

                                    ])
                                    .on('end', function()
                                  {
                                    console.log("stopped listening");

                                    console.log("piping " +currentFileName);
                                    var recognizeStream = speechToText.recognizeUsingWebSocket(ttsparams);
                                    console.log("pushing"+currentFileName+".mp3");
                                    fs.createReadStream(currentFileName+".mp3").pipe(recognizeStream);

                                    recognizeStream.setEncoding('utf8');

                                    recognizeStream.on('data', function(event) { handleVoiceEvent(user,'Data:', event); });
                                    recognizeStream.on('error', function(event) { handleVoiceEvent('Error:', event); });
                                    recognizeStream.on('close', function(event) { handleVoiceEvent('Close:', event); });
                                  })
                                    .save(currentFileName+".mp3");


                                  })

                                }

                              }
                            )
                              });
                            console.log("Joined Channel");


                        } catch (e) {
                            message.reply(message.member + " is not in a Voice Channel!");
                            console.log(e);
                        }
                        break;
                    case "leave":
                        try {
                            Channel = message.member.voiceChannel;
                            Channel.leave();
                            message.channel.send("Goodbye!");
                        } catch (e) {
                            console.log(e);
                        }
                        break;
                    case "pause":
                        try {
                            Channel = message.member.voiceChannel;
                            dispatcher.pause();
                            message.channel.send("Pausing Playback");
                        } catch (e) {
                            console.log(e);
                        }
                        break;
                    case "resume":
                        try {
                            Channel = message.member.voiceChannel;
                            dispatcher.resume();
                            message.channel.send("Resuming Playback");
                        } catch (e) {
                            console.log(e)
                        }
                        break;
                }
            }

        }
    })
}



async function handleVoice(User, Buffer) {
    var voicePCMStream = voiceReceiver.createPCMStream(User);
    var WriteStream = fs.createWriteStream('voiceData' + snippetId);
    snippetId++;
    voicePCMStream.pipe(WriteStream)
    console.log("Receiving Voice from " + User)
}

async function finalCommand() {

}

async function handleVolume(volume) {
    try {
        dispatcher.setVolume(volume);
    } catch (e) {
        console.log(e);
    }
}


//Logger Settings
//logger.remove(logger.transports.Console);
//logger.add(logger.transports.Console,{
//  colorize: true
//});

//logger.level = 'debug';

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
