// bin/bot.js

'use strict';

// import norrisbot
var NorrisBot = require('../lib/norrisbot');
 
var token = process.env.BOT_API_KEY;
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

// instantiate norrisbot
var norrisbot = new NorrisBot({
	token: token,
	dbPath: dbPath,
	name: name
});

// launch norrisbot
norrisbot.run();