(function (window) {
	var arcAngleConst = 1/9;

	function Balloon(opts) {
		var radius = opts.radius;
		var centerX = (opts.centerX !== undefined) ? opts.centerX : WIDTH * Math.random();
		// var centerY = (opts.centerY !== undefined) ? opts.centerY : HEIGHT * Math.random();
		var speed = opts.speed || (15 * Math.random() + 10);
		var type = opts.type || ['normal', 'poisonous'][Math.round(Math.random())]; //normal or poisnous

		this.radius = opts.radius;
		this.speed = speed;
		this.width = 2 * radius;
		this.height = this.width + radius*Math.sin(Math.PI * arcAngleConst);
		this.centerX = centerX;
		this.centerY = HEIGHT + this.height;
		this.type = type;
	}

	Balloon.prototype.draw = function(type) {
		type = type || 'arc';
		
		if (type == 'image') {
			drawUsingImage(this);
		} else {
			drawUsingArc(this);
		}
	}

	Balloon.prototype.moveUp = function (framesElapsed) {
		this.centerY -= (10 * (this.speed / sfd.fps));
	}

	Balloon.prototype.isPointInside = function (point) {
		var distFromCenter = Math.sqrt(
			Math.pow(point.x - this.centerX, 2) +
			Math.pow(point.y - this.centerY, 2)
		);
		var area = Math.PI * Math.pow(distFromCenter, 2);
		var balloonArea = Math.PI * Math.pow(this.radius, 2);

		if (balloonArea < area) {
			return false;
		}

		return true;
	}

	Balloon.prototype.reset = function(opts) {
		this.radius = opts.radius;
		this.speed = opts.speed;
		this.width = 2 * opts.radius;
		this.height = this.width + opts.radius*Math.sin(Math.PI * arcAngleConst);
		this.centerX = opts.centerX;
		this.centerY = HEIGHT + this.height;
		this.type = opts.type;
	}

	sfd.Balloon = Balloon;

	// Private functions starts from here

	function radialGradiant (obj) {
		var type = obj.type;
		var grd = context.createRadialGradient(
			obj.centerX + obj.radius / 2,
			obj.centerY - obj.radius / 2,
			5,
			obj.centerX + obj.radius / 2,
			obj.centerY - obj.radius / 2,
			(5/3)*obj.radius
		);

		if (type == "normal") {
			// light blue
			grd.addColorStop(0, '#B0D2FF');
			// dark blue
			grd.addColorStop(1, '#004CB3');
		} else if (type == "poisonous") {
			// light red
			grd.addColorStop(0, '#FF7C7C');
			// dark red
			grd.addColorStop(1, '#E63333');
		}

		return grd;
	}

	function drawUsingArc(obj) {
		var arcStartPoint = {
			x: obj.centerX + obj.radius * Math.cos(Math.PI * arcAngleConst),
			y: obj.centerY + obj.radius * Math.sin(Math.PI * arcAngleConst)
		};
		var arcEndPoint = {
			x: obj.centerX + obj.radius * Math.cos(Math.PI * (1 - arcAngleConst)),
			y: obj.centerY + obj.radius * Math.sin(Math.PI * (1 - arcAngleConst))
		};
		
		//Add radial gradiant to the balloon (makes rendering slow)
		context.fillStyle = radialGradiant(obj);
		// context.fillStyle = ('#004CB3');
		context.lineWidth = 1;
		context.strokeStyle = 'rgba(0, 76, 179, 0.2)';

		//Draw upper-half
		context.beginPath();
		context.arc(
			obj.centerX, obj.centerY,
			obj.radius,
			Math.PI * arcAngleConst, (1 - arcAngleConst) * Math.PI,
			true
		);
		context.fill();
		context.stroke();

		//Draw lower-half
		context.beginPath();
		context.moveTo(arcStartPoint.x, arcStartPoint.y - 1);
		var controlX = (arcStartPoint.x + arcEndPoint.x) / 2;
		var controlY = arcStartPoint.y + (obj.radius * 2);
		context.quadraticCurveTo(controlX, controlY, arcEndPoint.x, arcEndPoint.y - 1);
		context.fill();
		context.stroke();
		
		//Draw balloon opening
		context.save();
		context.scale(1, 0.65);
		context.fillStyle = '#515861';
		context.beginPath();
		context.arc(controlX, (controlY + arcStartPoint.y) / (2 * 0.65), 5, 0, 2*Math.PI, false);
		context.fill();
		context.stroke();
		context.restore();
	}

	function drawUsingImage(obj) {
		var balloonImage;
		if (obj.type == "normal") {
			balloonImage = sfd.image.balloon;
		} else if (obj.type == "poisonous") {
			balloonImage = sfd.image.badBalloon;
		}
		var width = 2 * obj.radius;
		var height = width * (balloonImage.height / balloonImage.width);
		context.drawImage(balloonImage, obj.centerX - width/2, obj.centerY - height/2, width, height);
	}
	
})(window);
