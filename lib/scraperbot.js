'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

/**
 * Constructor function. It accepts a settings object which should contain the following keys:
 *      token : the API token of the bot (mandatory)
 *      name : the name of the bot (will default to "scraperbot")
 *      dbPath : the path to access the database (will default to "data/scraperbot.db")
 *
 * @param {object} settings
 * @constructor
 *
 * @author Tenzin <sinzin91@gmail.com>
 */
var ScraperBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'scraperbot';
    this.dbPath = settings.dbPath || path.resolve(__dirname, '..', 'data', 'scraperbot.db');

    this.user = null;
    this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(ScraperBot, Bot);

/**
 * Run the bot
 * @public
 */
ScraperBot.prototype.run = function () {
    ScraperBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};

/**
 * On Start callback, called when the bot connects to the Slack server and access the channel
 * @private
 */
ScraperBot.prototype._onStart = function () {
    this._loadBotUser();
    this._connectDb();
    this._firstRunCheck();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
ScraperBot.prototype._onMessage = function (message) {
    var r = /\d+/;
    console.log(message);
    console.log(message.text);

    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
        !this._isFromScraperBot(message) &&
        this._isAskingForAttachedScrapers(message)
    ) {
        var store_id = message.text.match(r);
        console.log(store_id); 
        this._replyWithScraperIds(message, store_id);
    }

    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
        !this._isFromScraperBot(message) &&
        this._isAskingForScraperID(message)
    ) {
        var store_id = message.text.match(r);
        console.log(store_id); 
        this._replyWithScraperId(message, store_id);
    }

};

/**
 * Replyes to a message with a random Joke
 * @param {object} originalMessage
 * @private
 */
ScraperBot.prototype._replyWithRandomJoke = function (originalMessage) {
    var self = this;
    self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var channel = self._getChannelById(originalMessage.channel);
        self.postMessageToChannel(channel.name, record.joke, {as_user: true});
        self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
    });
};

ScraperBot.prototype._replyWithScraperIds = function (originalMessage, name) {
    var self = this;
    self.db.all('SELECT id FROM external_crawl_sites WHERE name = ?', name, function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        // output all of the attached scrapers
        console.log(record);
        var scrapers = JSON.stringify(record);
        console.log(scrapers);


        var channel = self._getChannelById(originalMessage.channel);
        self.postMessageToChannel(channel.name, scrapers, {as_user: true});
    });
};

ScraperBot.prototype._replyWithScraperId = function (originalMessage, store_id) {
    var self = this;
    self.db.all('SELECT id FROM external_crawl_settings WHERE store_id = ?', store_id, function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        // output all of the attached scrapers
        console.log(record);
        var scrapers = JSON.stringify(record);
        console.log(scrapers);


        var channel = self._getChannelById(originalMessage.channel);
        self.postMessageToChannel(channel.name, scrapers, {as_user: true});
    });
};

/**
 * Loads the user object representing the bot
 * @private
 */
ScraperBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

/**
 * Open connection to the db
 * @private
 */
ScraperBot.prototype._connectDb = function () {
    if (!fs.existsSync(this.dbPath)) {
        console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
        process.exit(1);
    }

    this.db = new SQLite.Database(this.dbPath);
};

/**
 * Check if the first time the bot is run. It's used to send a welcome message into the channel
 * @private
 */
ScraperBot.prototype._firstRunCheck = function () {
    var self = this;
    self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var currentTime = (new Date()).toJSON();

        // this is a first run
        if (!record) {

            self._welcomeMessage();
            return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
        }

        // updates with new last running time
        self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
    });
};

/**
 * Sends a welcome message in the channel
 * @private
 */
ScraperBot.prototype._welcomeMessage = function () {
    this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?' +
        '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `' + this.name + '` to invoke me!',
        {as_user: true});
};

/**
 * Util function to check if a given real time message object represents a chat message
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ScraperBot.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};

/**
 * Util function to check if a given real time message object is directed to a channel
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ScraperBot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C';
};

/**
 * Util function to check if a given real time message is mentioning Chuck Norris or the scraperbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ScraperBot.prototype._isMentioningChuckNorris = function (message) {
    return message.text.toLowerCase().indexOf('chuck norris') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

/**
 * Util function to check if user is asking for scrapers attached to store_id
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ScraperBot.prototype._isAskingForAttachedScrapers = function (message) {
    return message.text.toLowerCase().indexOf('attached scrapers') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

/**
 * Util function to check if user is asking for ID of scraper name
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ScraperBot.prototype._isAskingForScraperID = function (message) {
    return message.text.toLowerCase().indexOf('scraper ID of') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

/**
 * Util function to check if a given real time message has been sent by the scraperbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ScraperBot.prototype._isFromScraperBot = function (message) {
    return message.user === this.user.id;
};

/**
 * Util function to get the name of a channel given its id
 * @param {string} channelId
 * @returns {Object}
 * @private
 */
ScraperBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

module.exports = ScraperBot;