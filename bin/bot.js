// bin/bot.js

'use strict';

// import scraperbot
var ScraperBot = require('../lib/scraperbot');
 
var token = process.env.SCRAPERBOT_TOKEN;
var dbPath = "data/external_crawl_settings.db";
var name = process.env.BOT_NAME;

// instantiate scraperbot
var scraperbot = new ScraperBot({
	token: token,
	dbPath: dbPath,
	name: name
});

// launch scraperbot
scraperbot.run();