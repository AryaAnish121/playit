require('dotenv').config();
const { Say } = require('say');
const say = new Say('win32');
const mongoose = require('mongoose');
const lyricsFinder = require('lyrics-finder');
const { Client } = require('discord.js');
const { v4 } = require('uuid');
const client = new Client();
const path = require('path');

mongoose.connect('mongodb://localhost:27017/playit');

const lyricsSchema = new mongoose.Schema({
  song: String,
  location: String,
});

const Lyrics = mongoose.model('lyrics', lyricsSchema);

const PREFIX = '!play';

const playMusic = async (artist, title) => {
  let lyrics = await lyricsFinder(artist, title);
  return lyrics;
};

client.on('message', (message) => {
  if (message.content.startsWith(PREFIX)) {
    if (message.content === '!play stop') {
      const { voice } = message.member;
      if (!voice.channelID) {
        message.reply('You should be in a voice channel');
        return;
      }
      voice.channel.leave();
    } else {
      const { voice } = message.member;
      if (!voice.channelID) {
        message.reply('You should be in a voice channel');
        return;
      }
      const [artist, song] = message.content
        .replace(PREFIX, '')
        .trim()
        .split(',');
      if ((!artist, !song)) {
        message.reply('Format should be ```!play <aritst>, <song>``` ');
      } else {
        Lyrics.findOne({ song: `${artist}/${song}` }, async (err, result) => {
          if (err) {
            console.log(err);
          } else {
            if (!result) {
              const textLyrics = await playMusic(artist, song);
              const songLocaltion = v4();
              await say.export(
                textLyrics,
                null,
                null,
                `songs/${songLocaltion}.wav`,
                (err) => {
                  if (err) {
                    return console.error(err);
                  }
                  const songLyrics = new Lyrics({
                    song: `${artist}/${song}`,
                    location: `songs/${songLocaltion}.wav`,
                  });
                  songLyrics.save((err) => {
                    if (err) {
                      console.log(err);
                    } else {
                      voice.channel
                        .join()
                        .then((connection) => {
                          connection.play(
                            path.join('./songs/' + songLocaltion + '.wav')
                          );
                          message.reply(':thumbsup: Done..');
                        })
                        .catch((err) => console.log(err));
                    }
                  });
                }
              );
            } else {
              voice.channel
                .join()
                .then((connection) => {
                  connection.play('./' + result.location);
                  message.reply(':thumbsup: Done..');
                })
                .catch((err) => console.log(err));
            }
          }
        });
      }
    }
  }
});

client.on('ready', () => {
  console.log('ready');
});

client.login(process.env.BOT_TOKEN);
