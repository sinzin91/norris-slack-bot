// bin/bot.js
//API token: xoxb-20687771329-eBf0ZZQSeL5zAE3rYwKzpbth

'use strict';

// import scraperbot
var ScraperBot = require('../lib/scraperbot');
 
var token = "xoxb-20687771329-eBf0ZZQSeL5zAE3rYwKzpbth";
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

// instantiate scraperbot
var scraperbot = new ScraperBot({
	token: token,
	dbPath: dbPath,
	name: name
});

// launch scraperbot
scraperbot.run();