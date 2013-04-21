var canvasID = 'game-main';
var canvas = document.getElementById(canvasID);
var context = canvas.getContext('2d');
var WIDTH = canvas.width;
var HEIGHT = canvas.height;
var sfd = {};
sfd.balloons = [];
var clockCount;
var last_time;

sfd.imageFiles = {
	balloon: 'images/balloon.png',
	badBalloon: 'images/bad-balloon.png'
};

sfd.JSONFiles = [
	'script/data.json'
];

function load() {
	loadFiles();
	bindEvents();

	clockCount = 0;

	setInterval(getFPS, 1000);
}

function getFPS() {
	document.getElementById('fps').textContent = sfd.fps;
}

function createBalloons() {	
	var i = 0;
	var balloons = sfd.balloons;

	for (i = 0; i < sfd.balloonCount; i++) {
		balloons[i] = createBalloon();
	}
}

function createBalloon() {
	var radius;
	var centerX;
	var typeSelectionChance = 0.1 + 0.4 * (sfd.balloonCount - 1) / (sfd.balloonCount + 4);
	var balloonType = Math.random() < typeSelectionChance ? 'poisonous' : 'normal';
	var leastRadius = 40;
	var maxRadius = 70;

	sfd.numOfBalloonsCreated++;

	radius = leastRadius + ~~((maxRadius - leastRadius) * Math.random());
	centerX = (~~(WIDTH * Math.random()) % (WIDTH - 2*radius)) + radius;

	if (sfd.balloonPool.length) {
		var balloon = sfd.balloonPool.pop();

		balloon.reset({
			radius: radius,
			centerX: centerX,
			speed: ~~(Math.random()*15) + 10,
			type: balloonType
		});

		return balloon;
	}
	return new sfd.Balloon({
		radius: radius,
		centerX: centerX,
		speed: ~~(Math.random()*15) + 10,
		type: balloonType
	});
}

function drawBalloons() {
	var i;
	var balloons = sfd.balloons;
	var cur_time = new Date;
	
	sfd.fps = 1e3 / (cur_time - last_time);	//fps
	last_time = cur_time;

	if (!(sfd.numOfBalloonsCreated % 10)) {
		sfd.balloonCount += 1;
	}

	// Fill the removed balloons with the new one
	if (balloons.length != sfd.balloonCount) {
		for (i = 0; i < sfd.balloonCount - balloons.length; i++) {
			balloons.push( createBalloon() );
		}
	}

	for (i = 0; i < balloons.length; i++) {
		balloons[i].moveUp(clockCount);
		if (balloons[i].centerY + balloons[i].height < 0) {
			var liftedBalloon = balloons.splice(i, 1)[0];	//remove balloon from the queue
			sfd.balloonPool.push(liftedBalloon);
			if (liftedBalloon.type == "normal") {	// balloon is missed
				sfd.missedBalloons += 1;
				document.querySelector('#life-' + sfd.missedBalloons).className += ' cross';

				if (sfd.missedBalloons >= 3) {
					stopGame();
					return;
				}
			}
		}
	}

	context.clearRect(0, 0, WIDTH, HEIGHT);
	for (i = 0; i < balloons.length; i++) {
		balloons[i].draw('image');
	}

	sfd.animationId = window.requestAnimationFrame(drawBalloons);
	clockCount = clockCount % 60 + 1;
}

function init() {
	sfd.balloonCount = 1;
	sfd.missedBalloons = 0;
	sfd.numOfBalloonsCreated = 0;
	sfd.balloonPool = [];
	updateScore(0);
	var lifeDisplayElems = document.querySelectorAll('.life');
	for (var i = 0; i < lifeDisplayElems.length; i++) {
		lifeDisplayElems.item(i).classList.remove('cross');
	}

	createBalloons();
	last_time = new Date();
	window.cancelAnimationFrame(sfd.animationId);
	sfd.animationId = window.requestAnimationFrame(drawBalloons);
	document.getElementById('start-screen').className = '';
}

function loadFiles() {
	var size = objectSize(sfd.imageFiles) + objectSize(sfd.JSONFiles);
	var loadedSize = 0;
	var src;
	var i;

	//Load Images
	sfd.image = {};
	for (src in sfd.imageFiles) {
		if (sfd.imageFiles.hasOwnProperty(src)) {
			sfd.image[src] = loadImage(sfd.imageFiles[src], canWeInitiate);
		}
	}

	//Load JSON Files
	sfd.data = {};
	for (i = 0; i < sfd.JSONFiles.length; i++) {
		// $.extend(true, sfd.data, loadJSON());
		sfd.data = loadJSON(sfd.JSONFiles[i], canWeInitiate);
	}

	function canWeInitiate() {
		loadedSize += 1;

		if (loadedSize == size) {
			init();
		}
	}
}

function loadImage(src, callback) {
	var image;

	image = new Image();
	image.onload = callback;
	image.src = src;

	return image;
}

function loadJSON(src, callback) {
	var req = new XMLHttpRequest();
	req.open('GET', src, true);
	req.responseType = 'text';
	req.onreadystatechange = function () {
		if (this.readyState == 4) {
			if (this.status == 200) {
				callback();
				return JSON.parse(this.responseText);
			} else {	//Error in finding the file
				console.error("File not found");
			}
		}
	}
	req.send();
}

function bindEvents() {
	canvas.addEventListener('mousedown', function(e) {
		var rect = canvas.getBoundingClientRect();
		var clickX = e.clientX - rect.left;
		var clickY = e.clientY - rect.top;
		var data = context.getImageData(clickX, clickY, 1, 1).data;

		if ( isBalloonClicked(data) ) {
			console.log('Clicked');
			var balloonType = burstClickedBalloon({x: clickX, y: clickY});
			if (balloonType) {
				if (balloonType == "poisonous") {
					console.log('clicked poisonous');
					stopGame();
				} else {
					updateScore();
				}
			}
		} else {
			console.log('Not clicked');
		}
	}, false);

	document.querySelector('#start-button').addEventListener('mousedown', function(e) {
		this.classList.add('mousedown');
	}, false);

	document.querySelector('#start-button').addEventListener('mouseup', function(e) {
		this.classList.remove('mousedown');
		init();
	}, false);
}

function stopGame() {
	window.cancelAnimationFrame(sfd.animationId);
	document.getElementById('start-screen').className = 'top';

	sfd.balloonPool = [];
}

function objectSize(obj) {
	var size = 0;

	for (prop in obj) {
		if (obj.hasOwnProperty(prop)) { size++; }
	}

	return size;
}

function isBalloonClicked(data) {
	if (data[0] === 0 && data[1] === 0 && data[2] === 0) {
		return false;
	}

	return true;
}

function burstClickedBalloon(point) {
	var balloons = sfd.balloons;
	for (var i = balloons.length - 1; i >= 0; i--) {
		if ( balloons[i].isPointInside(point) ) {
			console.log ((i + 1) + 'th balloon burst');
			// remove it from the array
			// balloons[i] = balloons[balloons.length - 1];
			return balloons.splice(i, 1)[0].type;
		}
	}

	return false;
}

function updateScore(score) {
	if (score != undefined) {
		sfd.score = score;
	} else {
		sfd.score += 1;
	}
	document.querySelector('#score').textContent = sfd.score;
}

// RequestAnimationFrame: a browser API for getting smooth animations
window.requestAnimationFrame = (function() {
	return window.requestAnimationFrame 
		|| window.webkitRequestAnimationFrame 
		|| window.mozRequestAnimationFrame 
		|| window.oRequestAnimationFrame 
		|| window.msRequestAnimationFrame 
		|| function(callback) {
			 	window.setTimeout(callback, 1000 / 60);
			 };
})();

window.cancelAnimationFrame = (function() {
	return window.cancelAnimationFrame 
		|| window.webkitCancelAnimationFrame 
		|| window.mozCancelAnimationFrame 
		|| window.oCancelAnimationFrame 
		|| window.msCancelAnimationFrame 
		|| window.clearTimeout
})();
