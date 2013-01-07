/*global exports:true,module,window */
(function (global){
	"use strict";

	// needs ES5: Array.prototype.reduce and Array.prototype.forEach
	if ("undefined" === typeof [].reduce || "undefined" === typeof [].forEach) {
		throw new ReferenceError("Array.prototype.reduce and Array.prototype.forEach are expected");
	}

	/**
	*	Creates new Point instance where both x and y coordinates are recalculated for the cell size
	*	@param {Point} oldPoint base point
	*	@return {Point}
	*/
	function calcPoint(oldPoint) {

		// Size in pixels for a single character cell of ASCII art.
		var CELL_SIZE = 15;

		return new Point(oldPoint.x * CELL_SIZE + (CELL_SIZE / 2), oldPoint.y * CELL_SIZE + (CELL_SIZE / 2));
	}

	/**
	*	Auxiliary Point class used during parsing
	*	@constructor
	*	@this {Point}
	*	@param {number} x coordinate x
	*	@param {number} y coordinate y
	*/
	function Point(x, y) {
		this.x = x;
		this.y = y;
	}

	/**
	*	Line is formed by starting and ending points with the given color and decoration at the start and end.
	*	@constructor
	*	@this {Line}
	*	@param {Point} pointFrom
	*	@param {string} start start arrow ending type (currently only "circle" or "arrow")
	*	@param {Point} pointTo
	*	@param {string} end end arrow ending type (currently only "circle" or "arrow")
	*	@param {string} color
	*/
	function Line(pointFrom, start, pointTo, end, color) {
		this.start = start;
		this.pointFrom = pointFrom;
		this.pointTo = pointTo;
		this.end = end;
		this.color = color;
	}

	/**
	*	Draws a line with a corresponding ending type
	*	@param {CanvasRenderingContext2D} ctx
	*/
	Line.prototype.draw = function (ctx) {

		/**
		 *	draws a line ending of certain type
		 *	@param {CanvasRenderingContext2D} ctx
		 *	@param {string} type arrow ending type (currently only "circle" or "arrow")
		 *	@param {Point} pointFrom
		 *	@param {Point} pointTo
		 */
		function drawLineEnding(ctx, type, pointFrom, pointTo) {
			switch (type) {
				case "circle":
					ctx.bulb(pointTo);
					break;

				case "arrow":
					ctx.arrowhead(pointFrom, pointTo);
					break;
			}
		}

		// calc the points and draw line from one to another
		var pointFrom = calcPoint(this.pointFrom),
			pointTo = calcPoint(this.pointTo);
		ctx.strokeStyle = this.color;
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.setEndPoint(pointFrom);
		ctx.lineTo(pointTo);
		ctx.stroke();

		//and then draw line ending for this line
		drawLineEnding(ctx, this.start, pointTo, pointFrom);
		drawLineEnding(ctx, this.end, pointFrom, pointTo);
	};

	/**
	 *	Text annotation at the specified coordinates with the given color.
	 *	@constructor
	 *	@this {Text}
	 *	@param {Point} point
	 *	@param {string} text a string of text
	 *	@param {string} color text colour
	 */
	function Text(point, text, color) {
		this.point = point;
		this.text = text;
		this.color = color;
	}

	/**
	 *	Draws text at corresponding coords and with specified colour
	 *	@param {CanvasRenderingContext2D} ctx
	 */
	Text.prototype.draw = function (ctx) {
		var calcedPoint = calcPoint(this.point);
		ctx.fillStyle = this.color;
		ctx.fillText(this.text, calcedPoint.x, calcedPoint.y);
	};

	/**
	 *	Parses given ASCII art string into a list of figures.
	 *	@param {string} text ascii graphics text
	 *	@return {array} array of Text or Line objects
	 */
	function parseASCIIArt(text) {
		var lines = text.split('\n'),
			height = lines.length,
			// maximum line width
			width = lines.reduce(function (w, line) { return Math.max(w, line.length); }, 0),
			// Converts line's character to the direction of line's growth.
			possibleDirections = { "-": new Point(1, 0), "|": new Point(0, 1)},
			x1,
			y1,
			currentChar,
			currentDirection,
			currentLine,
			color,
			start,
			end,
		// Matrix containing ASCII art.
			data = [],
		// List of extracted figures.
			figures = [];

		// Convert strings into a matrix of characters.
		lines.forEach(function(currentLine, y) { data[y] = currentLine.split(''); });

		/**
		 *	Every loop iteration extracts a single line and erases it from the ascii art matrix.
		 */
		while(typeof (currentChar = findLineChar()) !== 'undefined') {

			currentDirection = possibleDirections[data[currentChar.y][currentChar.x]];

			// Find line's start by advancing in the opposite direction.
			color = null;
			while (isPartOfLine(new Point(currentChar.x - currentDirection.x, currentChar.y - currentDirection.y))) {
				currentChar.x -= currentDirection.x;
				currentChar.y -= currentDirection.y;
				if (color === null) {
					color = toColor(currentChar);
				}
			}

			// if current line has decorated start, extract it.
			start = null;
			if (isLineEnding(new Point(currentChar.x - currentDirection.x, currentChar.y - currentDirection.y))) {
				currentChar.x -= currentDirection.x;
				currentChar.y -= currentDirection.y;
				start = (data[currentChar.y][currentChar.x] === "*") ? "circle" : "arrow";
			}

			// Find line's end by advancing forward in the given direction.
			x1 = currentChar.x;
			y1 = currentChar.y;
			while (isPartOfLine(new Point(x1 + currentDirection.x, y1 + currentDirection.y))) {
				x1 += currentDirection.x;
				y1 += currentDirection.y;
				if (color === null) {
					color = toColor(new Point(x1, y1));
				}
			}

			// if current line has decorated end, extract it.
			end = null;
			if (isLineEnding(new Point(x1 + currentDirection.x, y1 + currentDirection.y))) {
				x1 += currentDirection.x;
				y1 += currentDirection.y;
				end = (data[y1][x1] === "*") ? "circle" : "arrow";
			}

			// Create line object, put it in the resulting list and erase line from the ascii art matrix.
			currentLine = new Line(
				new Point(currentChar.x, currentChar.y), start,
				new Point(x1, y1), end,
				color === null ? "black" : color);
			figures.push(currentLine);
			erase(currentLine);

			// Adjust line start and end to accommodate for arrow endings.
			// Those should not intersect with their targets but should touch them
			// instead. Should be done after erasure to ensure that erase deletes
			// arrowheads.
			if (start === "arrow") {
				currentLine.pointFrom.x -= currentDirection.x;
				currentLine.pointFrom.y -= currentDirection.y;
			}

			if (end === "arrow") {
				currentLine.pointTo.x += currentDirection.x;
				currentLine.pointTo.y += currentDirection.y;
			}

		}

		// Extract all non space characters that were left after line extraction as text objects.
		data.forEach(function(currentLine, y){
			var x,
				start,
				end,
				text,
				prev,
				color;
			for (x = 0; x < currentLine.length; x += 1) {
				if (currentLine[x] !== ' ') {

					// Find the end of the text annotation by searching for a space.
					start = end = x;
					while ((end < currentLine.length) && (currentLine[end] !== ' ')) {
						end += 1;
					}

					//get the word from the array
					text = currentLine.slice(start, end).join('');

					// Check if it can be concatenated with a previously found text annotation.
					prev = figures[figures.length - 1];

					// only if previous figure item is of type Text and it's near to current text
					if ((prev instanceof Text) && (prev.point.x + prev.text.length + 1) === start) {
						// If they touch concatenate them.
						prev.text = prev.text + text;
					} else {

						// Look for grey color matching modifiers.
						color = "black";
						if (text[0] === "\\" && text[text.length - 1] === "\\") {
							text = text.substring(1, text.length - 1);
							color = "#666";
						}

						//add text figure to the resulting array
						figures.push(new Text(new Point(x, y), text, color));
					}

					// proceed from the next character after current word
					x = end;
				}
			}
		});

		return figures;

		/**
		 *	Erases the given extracted line.
		 *	@todo: maybe refactor as it's used only in extractLine loop
		 *	@param {Line} line to erase
		 *	@return {void}
		 */
		function erase(line) {

			/**
			 *	Erases character that belongs to the extracted line.
			 *	@param {Point} point
			 *	@param {number} dx
			 *	@param {number} dy
			 *	@return {void}
			 */
			function eraseChar(point, dx, dy) {
				switch (atP(point)) {
					case "|":
					case "-":
					case "*":
					case ">":
					case "<":
					case "^":
					case "v":
					case "~":
					case "!":
						data[point.y][point.x] = " ";
						return;
					case "+":
						dx = 1 - dx;
						dy = 1 - dy;

						data[point.y][point.x] = " ";
						switch (atP(new Point(point.x - dx, point.y - dy))) {
							case "|":
							case "!":
							case "+":
								data[point.y][point.x] = "|";
								return;
							case "-":
							case "~":
							case "+":
								data[point.y][point.x] = "-";
								return;
						}

						switch (atP(new Point(point.x + dx, point.y + dy))) {
							case "|":
							case "!":
							case "+":
								data[point.y][point.x] = "|";
								return;
							case "-":
							case "~":
							case "+":
								data[point.y][point.x] = "-";
								return;
						}
						return;
				}
			}

			var dx = line.pointFrom.x !== line.pointTo.x ? 1 : 0,
				dy = line.pointFrom.y !== line.pointTo.y ? 1 : 0,
				x = line.pointFrom.x + dx,
				y = line.pointFrom.y + dy,
				x_ = line.pointTo.x - dx,
				y_ = line.pointTo.y - dy;

			if (dx !== 0 || dy !== 0) {
				while (x <= x_ && y <= y_) {
					eraseChar(new Point(x,y), dx, dy);
					x += dx;
					y += dy;
				}
				eraseChar(line.pointFrom, dx, dy);
				eraseChar(line.pointTo, dx, dy);
			} else {
				eraseChar(line.pointFrom, dx, dy);
			}

		}

		/**
		 *	Finds a character that belongs to unextracted line.
		 *	@todo: maybe refactor as it's only used in extractLine loop and uses height/width/data parent scope vars
		 *	@return {Point} point or undefined if not found
		 */
		function findLineChar() {
			var x, y;
			for (y = 0; y < height; y += 1) {
				for (x = 0; x < width; x += 1) {
					if (data[y][x] === '|' || data[y][x] === '-') {
						return new Point(x, y);
					}
				}
			}
			return undefined;
		}

		/**
		 *	Get a character from the array or null if we are out of bounds.
		 *	Useful in places where we inspect character's neighbors and peek out of bounds for boundary characters.
		 *	@param {Point} point
		 *	@return {string} character or null if out of bounds
		 */
		function atP(point) {
			return (0 <= point.y && point.y < height && 0 <= point.x && point.x < width) ?
					data[point.y][point.x] :
					null;
		}

		/**
		 *	Returns true if the character can be part of the line.
		 *	@param {Point} point
		 *	@return {boolean}
		 */
		function isPartOfLine(point) {
			var c = atP(point);
			return c === "|" || c === "-" || c === "+" || c === "~" || c === "!";
		}

		/**
		 *	Returns true if character is a line ending decoration.
		 *	@param {Point} point
		 *	@return {boolean}
		 */
		function isLineEnding(point) {
			var c = atP(point);
			return c === "*" || c === "<" || c === ">" || c === "^" || c === "v";
		}

		/**
		 *	If character represents a color modifier returns CSS color and null otherwise
		 *	@param {Point} point
		 *	@return {string} colour representation or null
		 */
		function toColor(point) {
			switch (atP(point)) {
				case "~":
				case "!":
					return "#666";
				default:
					return null;
			}
		}

	}

	/**
	 *	Calculates shaky line points between two points
	 *	@param {Point} pointFrom
	 *	@param {Point} pointTo
	 *	@return {object} from:Point to:Point two points where the line will be "attracted" to
	 */
	function getShakyLinePoints(pointFrom, pointTo) {
		// Let v = (dx, dy) be a vector between points pointFrom and pointTo
		var dx = pointTo.x - pointFrom.x,
			dy = pointTo.y - pointFrom.y,

		// Let l be the length of v.
			l = Math.sqrt(dx * dx + dy * dy),

		// Now we need to pick two random points that are placed
		// on different sides of the line that passes through
		// pointTo and P_2 and not very far from it if length of
		// pointTo P_2 is small.
			K = Math.sqrt(l) / 1.5,
			k1 = Math.random(),
			k2 = Math.random(),
			l3 = Math.random() * K,
			l4 = Math.random() * K;

		// returned values will be used to draw a bezier curve through
		// points pointFrom, P_3, P_4, pointTo.
		// Selection of P_3 and P_4 makes line "jerk" a little
		// between them but otherwise it will be mostly straight thus
		// creating illusion of being hand drawn.
		return {
			from: new Point(pointFrom.x + dx * k1 + dy / l * l3,
							pointFrom.y + dy * k1 - dx / l * l3),
			to: new Point(pointFrom.x + dx * k2 - dy / l * l4,
							pointFrom.y + dy * k2 + dx / l * l4)
		};
	}

	/**
	 *	Calculates a shaky arrowhead coords at the pointTop as an ending for the line from pointFrom to pointTo
	 *	@param {Point} pointFrom
	 *	@param {Point} pointTo
	 *	@return {object} from:Point to:Point two points for the arrow head
	 */
	function getArrowHeadCoords(pointFrom, pointTo) {
		var dx = pointFrom.x - pointTo.x,
			dy = pointFrom.y - pointTo.y,
			l = 20,
			alpha,
			alpha3,
			alpha4;

		alpha = Math.atan(dy / dx);
		if (dy === 0) {
			alpha = dx < 0 ? -Math.PI : 0;
		}

		alpha3 = alpha + 0.5;
		alpha4 = alpha - 0.5;

		return {
			from: new Point(pointTo.x + l * Math.cos(alpha3), pointTo.y + l * Math.sin(alpha3)),
			to: new Point(pointTo.x + l * Math.cos(alpha4), pointTo.y + l * Math.sin(alpha4))
		};

	}

	/**
	 *	Monkeypatches the canvas 2d context with our methods
	 *	@param {CanvasRenderingContext2D} ctx
	 *	@return {CanvasRenderingContext2D} patched context
	 */
	function enhanceCtx(ctx) {

		var endPoint = new Point(0, 0);

		/**
		 * public setter for the the private endPoint
		 * @public (exported as ctx.setEndPoint method)
		 */
		function setEndPoint(newPoint) {
			endPoint = newPoint;
		}

		/**
		 * Draws a bezier curve through the calculated coordinates
		 * @public (exported as ctx.lineTo method)
		 */
		function lineTo(mainPoint) {
			var lineCoords = getShakyLinePoints(endPoint, mainPoint);

			// Draw a bezier curve through the calculated coords
			ctx.moveTo(endPoint.x, endPoint.y);
			ctx.bezierCurveTo(lineCoords.from.x, lineCoords.from.y, lineCoords.to.x, lineCoords.to.y, mainPoint.x, mainPoint.y);

			setEndPoint(mainPoint);
		}

		/**
		 * Draws a shaky bulb (used for line endings)
		 * @public (exported as ctx.bulb method)
		 */
		function bulb(coords) {
			var i;
			function fuzziness() {
				return Math.random() * 2 - 1;
			}

			for (i = 0; i < 3; i += 1) {
				ctx.beginPath();
				ctx.arc(coords.x + fuzziness(), coords.y + fuzziness(), 5, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.fill();
			}
		}

		/**
		 * Draws a shaky arrowhead at the pointTo as an ending for the line from pointFrom to pointTo
		 * @public (exported as ctx.arrowhead method)
		 */
		function arrowhead(pointFrom, pointTo) {
			var arrowCoords = getArrowHeadCoords(pointFrom, pointTo);

			ctx.beginPath();
			setEndPoint(arrowCoords.from);
			lineTo(pointTo);
			ctx.stroke();

			ctx.beginPath();
			setEndPoint(arrowCoords.to);
			lineTo(pointTo);
			ctx.stroke();
		}

		ctx.setEndPoint = setEndPoint;
		ctx.lineTo = lineTo;
		ctx.bulb = bulb;
		ctx.arrowhead = arrowhead;

		return ctx;

	}

	/**
	 *	Calculates the width and height of the drawing surface for the given array of figures
	 *	@param {array} figures
	 *	@return {object} object a-la {width: int, height: int}
	 */
	function getCanvasWH(figures) {
		var width = 0,
			height = 0;
		figures.forEach(function (figure) {
			var point;
			if (figure instanceof Line) {
				point = calcPoint(figure.pointTo);
				width = Math.max(width, point.x + 1);
				height = Math.max(height, point.y + 1);
			}
		});
		return {
			width: width,
			height: height
		};
	}

	/**
	 *	Draws a diagram from the ascii art contained in the string variable.
	 *	@public exported
	 *	@param {string} text ASCII-based graphics
	 *	@param {canvas} canvas canvas object reference
	 */
	function drawDiagram(text, canvas) {
		var figures, ctx, canvasWH, canvasClass;

		if ('undefined' === typeof text || 'undefined' === typeof canvas) {
			throw new TypeError('drawDiagram must be called with a string and canvas as parameters');
		}

		if ('[object String]' !== Object.prototype.toString.call(text)) {
			throw new TypeError('drawDiagram needs a string as its first parameter');
		}

		// node-canvas creates canvas with [[Class]] == [object Canvas] while browsers - with [object HTMLCanvasElement]
		canvasClass = Object.prototype.toString.call(canvas);
		if ( ('[object Canvas]' !== canvasClass && '[object HTMLCanvasElement]' !== canvasClass) ||
			!('getContext' in canvas)) {
			throw new TypeError('drawDiagram needs a canvas element as its second parameter');
		}

		figures = parseASCIIArt(text);
		ctx = canvas.getContext("2d");

		// determine the width and height of the canvas element
		canvasWH = getCanvasWH(figures);

		canvas.width = canvasWH.width + 10;
		canvas.height = canvasWH.height + 10;

		// set context style
		ctx.lineWidth = 3;

		// for nodejs this font should be installed as a system font
		// until https://github.com/LearnBoost/node-canvas/pull/231 is resolved
		ctx.font = "20pt 'Gloria Hallelujah'";
		ctx.textBaseline = "middle";

		// replace our context with the enhanced one (that has methods for drawing bulb and shakyline)
		ctx = enhanceCtx(ctx);

		// and draw all figures on it
		figures.forEach(function (figure) { figure.draw(ctx); });
	}

	// export mechanism is inspired by underscore.js
	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			exports = module.exports = drawDiagram;
		}
		exports.drawDiagram = drawDiagram;
	} else {
		window.drawDiagram = drawDiagram;
	}

}(this));