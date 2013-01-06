/*global exports,module,window */
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

		this.x0 = this.pointFrom.x;
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
		ctx.updateXY(pointFrom);
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

	// Parses given ASCII art string into a list of figures.
	function parseASCIIArt(string) {
		var lines = string.split('\n'),
			height = lines.length,
			width = lines.reduce(function (w, line) { return Math.max(w, line.length); }, 0),
		// Matrix containing ASCII art.
			data = [],
		// Converts line's character to the direction of line's growth.
			dir = { "-": new Point(1, 0), "|": new Point(0, 1)},
			figures = [], // List of extracted figures.
			x,
			y,
			line;

		// Convert strings into a matrix of characters.
		for (y = 0; y < height; y += 1) {
			line = lines[y];
			data[y] = [];
			for (x = 0; x < line.length; x += 1) {
				data[y][x] = line[x];
			}
			for (x = line.length; x < width; x += 1) {
				data[y][x] = " ";
			}
		}

		// Get a character from the array or null if we are out of bounds.
		// Useful in places where we inspect character's neighbors and peek
		// out of bounds for boundary characters.
		function atP(point) {
			return (0 <= point.y && point.y < height && 0 <= point.x && point.x < width) ?
					data[point.y][point.x] :
					null;
		}

		// Returns true if the character can be part of the line.
		function isPartOfLine(point) {
			var c = atP(point);
			return c === "|" || c === "-" || c === "+" || c === "~" || c === "!";
		}

		// If character represents a color modifier returns CSS color.
		function toColor(point) {
			switch (atP(point)) {
				case "~":
				case "!":
					return "#666";
				default:
					return null;
			}
		}

		// Returns true if character is a line ending decoration.
		function isLineEnding(point) {
			var c = atP(point);
			return c === "*" || c === "<" || c === ">" || c === "^" || c === "v";
		}

		// Finds a character that belongs to unextracted line.
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

		// Erases character that belongs to the extracted line.
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

		// Erases the given extracted line.
		function erase(line) {
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

		// Extract a single line and erase it from the ascii art matrix.
		function extractLine() {
			var ch = findLineChar(),
				d,
				x1,
				y1,
				color,
				start,
				end,
				line;

			// if the char is not found, return false so that the while (extractLine()) will stop
			if (typeof ch === 'undefined') {
				return false;
			}

			d = dir[data[ch.y][ch.x]];

			// Find line's start by advancing in the opposite direction.
			color = null;
			while (isPartOfLine(new Point(ch.x - d.x, ch.y - d.y))) {
				ch.x -= d.x;
				ch.y -= d.y;
				if (color === null) {
					color = toColor(ch);
				}
			}

			start = null;
			if (isLineEnding(new Point(ch.x - d.x, ch.y - d.y))) {
				// Line has a decorated start. Extract is as well.
				ch.x -= d.x;
				ch.y -= d.y;
				start = (data[ch.y][ch.x] === "*") ? "circle" : "arrow";
			}

			// Find line's end by advancing forward in the given direction.
			x1 = ch.x;
			y1 = ch.y;
			while (isPartOfLine(new Point(x1 + d.x, y1 + d.y))) {
				x1 += d.x;
				y1 += d.y;
				if (color === null) {
					color = toColor(new Point(x1, y1));
				}
			}

			end = null;
			if (isLineEnding(new Point(x1 + d.x, y1 + d.y))) {
				// Line has a decorated end. Extract it.
				x1 += d.x;
				y1 += d.y;
				end = (data[y1][x1] === "*") ? "circle" : "arrow";
			}

			// Create line object and erase line from the ascii art matrix.
			line = new Line(new Point(ch.x, ch.y), start,
							new Point(x1, y1), end,
							color === null ? "black" : color);
			figures.push(line);
			erase(line);

			// Adjust line start and end to accomodate for arrow endings.
			// Those should not intersect with their targets but should touch them
			// instead. Should be done after erasure to ensure that erase deletes
			// arrowheads.
			if (start === "arrow") {
				line.pointFrom.x -= d.x;
				line.pointFrom.y -= d.y;
			}

			if (end === "arrow") {
				line.pointTo.x += d.x;
				line.pointTo.y += d.y;
			}

			return true;
		}

		// Extract all non space characters that were left after line extraction
		// as text objects.
		function extractText() {
			var y,
				x,
				start,
				end,
				text,
				prev,
				color;
			for (y = 0; y < height; y += 1) {
				for (x = 0; x < width; x += 1) {
					if (data[y][x] !== ' ') {

						// Find the end of the text annotation by searching for a space.
						start = x;
						end = x;
						while ((end < width) && (data[y][end] !== ' ')) {
							end += 1;
						}

						//get the text
						text = data[y].slice(start, end).join('');

						// Check if it can be concatenated with a previously found text annotation.
						prev = figures[figures.length - 1];
						if ((prev instanceof Text) && (prev.x0 + prev.text.length + 1) === start) {
							// If they touch concatenate them.
							prev.text = prev.text + text;
						} else {
							// Look for grey color matching modifiers.
							color = "black";
							if (text[0] === "\\" && text[text.length - 1] === "\\") {
								text = text.substring(1, text.length - 1);
								color = "#666";
							}
							figures.push(new Text(new Point(x, y), text, color));
						}
						x = end;
					}
				}
			}
		}

		while (extractLine()) {
			// Extract all lines and erase them
		}

		// Extract all text that is left
		extractText();

		return figures;

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

	// calculate a shaky arrowhead coords at the (x1, y1) as an ending
	// for the line from (x0, y0) to (x1, y1).
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

	// monkey-patch the context with our methods
	function enhanceCtx(ctx) {

		var endPoint = new Point(0, 0);

		function updateEndPoint(newPoint) {
			endPoint = newPoint;
		}

		function lineTo(mainPoint) {
			var lineCoords = getShakyLinePoints(endPoint, mainPoint);

			// Draw a bezier curve through the calculated coords
			ctx.moveTo(endPoint.x, endPoint.y);
			ctx.bezierCurveTo(lineCoords.from.x, lineCoords.from.y, lineCoords.to.x, lineCoords.to.y, mainPoint.x, mainPoint.y);

			// update local x0 and y0
			updateEndPoint(mainPoint);
		}

		// Draw a shaky bulb (used for line endings).
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

		// Draw a shaky arrowhead at the (x1, y1) as an ending
		// for the line from (x0, y0) to (x1, y1).
		function arrowhead(pointFrom, pointTo) {
			var arrowCoords = getArrowHeadCoords(pointFrom, pointTo);

			ctx.beginPath();
			updateEndPoint(arrowCoords.from);
			lineTo(pointTo);
			ctx.stroke();

			ctx.beginPath();
			updateEndPoint(arrowCoords.to);
			lineTo(pointTo);
			ctx.stroke();
		}

		ctx.updateXY = updateEndPoint;
		ctx.lineTo = lineTo;
		ctx.bulb = bulb;
		ctx.arrowhead = arrowhead;

		return ctx;

	}

	// calc the width and height of the drawing surface for the given array of figures
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

	// Draw a diagram from the ascii art contained in the string variable.
	function drawDiagram(text, canvas) {
		var figures = parseASCIIArt(text),
			ctx = canvas.getContext("2d"),

		// determine the width and height of the canvas element
			canvasWH = getCanvasWH(figures);

		canvas.width = canvasWH.width + 10;
		canvas.height = canvasWH.height + 10;

		// set context style
		ctx.lineWidth = 3;

		// for nodejs use this font should be installed as a system font
		// until https://github.com/LearnBoost/node-canvas/pull/231 is resolved
		ctx.font = "20pt 'Gloria Hallelujah'";
		ctx.textBaseline = "middle";

		// replace our context with the enhanced one (that has methods for drawing bulb and shakyline)
		ctx = enhanceCtx(ctx);

		// and draw all figures on it
		figures.forEach(function (figure) {
			figure.draw(ctx);
		});
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