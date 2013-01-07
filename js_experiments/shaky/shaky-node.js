/*global process,console,require,__dirname,Buffer */


// Make sure we got two file names on the command line.
if (process.argv.length < 4) {
	console.log('Usage: node ' + process.argv[1] + ' TextFileName ImageFileName.png');
	process.exit(1);
}

// Read the file and print its contents.
var fs = require('fs'),
	inputFileName = process.argv[2],
	outputFileName = process.argv[3];

fs.readFile(inputFileName, 'utf8', function(err, data) {
	"use strict";
	if (err) {
		throw err;
	}

	// process read info as ASCII-representation of the image, parse and draw the image and
	// save data to the png file
	fs.writeFile('image.png', processData(data));

});


// takes a string of text and returns a buffer of image data
function processData(inputData) {
	"use strict";

	var Canvas = require('canvas'),
		canvas = new Canvas(200,200),
		shaky = require('./shaky.js');

	// draw the diagram on the specified canvas
	shaky.drawDiagram(inputData, canvas);

	// take the base64-encoded representation of the drawn image
	var dataURI = canvas.toDataURL();

	// stripping data:image/png;base64, from the encoded image's string
	var pureEncodedData = dataURI.substring(dataURI.indexOf("base64,") + 7);

	// put the encoded data into memory buffer
	return new Buffer(pureEncodedData, 'base64');

}