#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "google.com";

var http = require('http');

var cheerioGetUrlData =  function(inUrl, cb) {

	var req = http.request(inUrl, cb); 

	req.on('error', function(e) {
  		console.log('problem with request: ' + e.message);
  		console.log('problem with request: ' + e.stack);
	});
	req.end();
};

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkUrl = function(url, checksfile) {

   // To collect complete response
   var urlData = "";

   // Callback function for http
   var callbackForHttp = function(res) {

   	// Callback function for data received, just append the response to urlData
	var callbackForData = function(data) {
		urlData = urlData + data;
	};

   	// Callback function for response end
	var callbackForEnd = function() {
		var out = {};
		$ = cheerio.load(urlData);
    		var checks = loadChecks(checksfile).sort();
    		for(var ii in checks) {
        		var present = $(checks[ii]).length > 0;
        		out[checks[ii]] = present;
    		}
    		var outJson = JSON.stringify(out, null, 4);
    		console.log(outJson);
	};

  	res.setEncoding('utf8');
  	res.on('data', callbackForData);
  	res.on('end', callbackForEnd);
    };
    cheerioGetUrlData(url, callbackForHttp);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file [html_file]', 'Path to index.html')
        .option('-u, --url [url]', 'url to the website')
        .parse(process.argv);
	
    if ( typeof program.file != "undefined" ) {
	assertFileExists(program.file)
    	var checkJson = checkHtmlFile(program.file, program.checks);
    	var outJson = JSON.stringify(checkJson, null, 4);
    	console.log(outJson);
    } else if ( typeof program.url != "undefined" ) {
    	checkUrl(program.url, program.checks);
    } else {
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
