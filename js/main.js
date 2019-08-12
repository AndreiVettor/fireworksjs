
// GLOBAL VARIABLES
var canvas = document.getElementById('mainCanvas');
var ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var screen_width = canvas.offsetWidth;
var screen_height = canvas.offsetHeight;

var objects = [];
var colors = [
	{r:33, 	g:150,  b:243},
	{r:156, g:39, 	b:176},
	{r:233, g:30, 	b:99},
	{r:76,	g:175, 	b:80},
	{r:255,	g:152,  b:0},
	{r:255,	g:255,  b:255} ];
	
var lastFrame = 0;


// CONSTANTS
var particle_size = 6;
var trail_interval = 0; //ms
var particle_size_variance = 0.05;
var particle_drag = 0.02;
var particle_force_variance = 0.09;
var lifespan_variance = 0.1;
var particle_amount = 64;
var firework_force_variance = 0.3;
var firework_lifetime = 4000;
var firework_size_variance = 0.1;
var firework_force = 4;
var alpha_decay = 1;

var gravity = 0.0012;

var PI_4 = Math.PI * 4;


// CLASSES
class Particle {
	constructor(position, force, lifeSpan, color, 
		trailColor = null, trailing = false, size = particle_size) {
		this.position = position;
		this.size = size + getRandom() * particle_size_variance * size;
		this.color = color;
		this.trailColor = trailColor;
		this.alpha = 1;

		this.enabled = true;
		
		this.lifeSpan = lifeSpan;
		this.lifeSpanTimer = 0;
		
		this.force = force;
		this.drag = particle_drag;
		
		this.trailInterval = trail_interval;
		this.trailTimer = 0;
		
		this.trailing = trailing;
		this.trails = [];
	}
	
	spawnTrail() {
		this.trails.push(new Particle(
			{x:this.position.x, y:this.position.y},
			{x:0,y:0},
			this.lifeSpan - this.lifeSpanTimer,
			this.trailColor,
			null,
			false,
			this.size * 0.66));
	}
	
	draw(ctx) {
		if(this.trailing) {
			for(var i = 0; i < this.trails.length; i++) {
				this.trails[i].draw(ctx);
			}
		}

		if(this.enabled) {
			ctx.fillStyle = 'rgba(' + this.color.r
				+ ',' + this.color.g
				+ ',' + this.color.b 
				+ ',' + this.alpha + ')';
			ctx.fillRect(this.position.x, this.position.y, this.size, this.size);
		}
	}
	
	update(deltaTime) {
		if(this.enabled) {
			this.position.x += this.force.x;
			this.position.y += this.force.y;
			
			this.force.x -= this.force.x * this.drag;
			this.force.y -= this.force.y * this.drag;
			
			this.force.y += this.size * gravity;
			
			this.lifeSpanTimer += deltaTime;

			// TODO: Make a table in order to reduce performance hit
			this.alpha = 2 - Math.exp(alpha_decay * (this.lifeSpanTimer + 1) / this.lifeSpan);
			if(this.alpha <= 0.00) {
				//this.enabled = false;
			}
		}

		if(this.trailing) {
			this.trailTimer += deltaTime;
			if(this.trailTimer > this.trailInterval) {
				this.spawnTrail();
				this.trailTimer -= this.trailInterval;
			}
		}
		
		if(this.trailing) {
			for(var i = 0; i < this.trails.length; i++) {
				this.trails[i].update(deltaTime);
			}
		}
	}
}

class Firework {
	constructor(position, size, force, lifeSpan) {
		this.position = position;
		this.size = size + getRandom() * firework_size_variance * size;
		this.force = force + getRandom() * firework_force_variance * force;
		
		this.lifeSpan = lifeSpan + getRandom() * lifespan_variance * lifeSpan;
		this.lifeSpanTimer = 0;
		
		this.particles = [];
		this.color = Math.round((colors.length - 1) * Math.random());
		this.trailingColor = Math.round((colors.length - 1) * Math.random());
		
		this.initialize();
	}
	
	initialize() {
		for(var i = 0; i < this.size; i++) {
			var k = Math.random() * PI_4;
			var x = Math.cos(k);
			var y = Math.sin(k);
			
			x += getRandom() * particle_force_variance;
			y += getRandom() * particle_force_variance;
			
			this.particles.push(new Particle(
				{x:this.position.x,y:this.position.y},
				{x:this.force * x,y:this.force * y},
				this.lifeSpan,
				colors[this.color],
				colors[this.trailingColor],
				true,
				particle_size));
		}
	}
	
	update(deltaTime) {
		this.lifeSpanTimer += deltaTime;

		if(this.lifeSpanTimer > this.lifeSpan) {
			objects.splice(objects.indexOf(this), 1);
		}
		
		for(var i = 0; i < this.particles.length; i++) {
			this.particles[i].update(deltaTime);
		}
	}
	
	draw(ctx) {
		for(var i = 0; i < this.particles.length; i++) {
			this.particles[i].draw(ctx);
		}
	}
}

function getRandom() {
	return Math.random() * 2 - 1;
}

function gameLoop(timestamp, ctx) {
	let deltaTime = timestamp - lastFrame;
	
	update(deltaTime);
	
	draw(ctx);
	
	lastFrame = timestamp;
	window.requestAnimationFrame(function(timestamp) {
		gameLoop(timestamp, ctx);
	});
}

function update(deltaTime) {
	for(var i = 0; i < objects.length; i++) {
		objects[i].update(deltaTime);
	}
}

function draw(ctx) {
	ctx.clearRect(0, 0, screen_width, screen_height);
	
	// Black Background
	ctx.fillStyle = 'rgb(5, 5, 5)';
	ctx.fillRect(0, 0, screen_width, screen_height);
	
	for(var i = 0; i < objects.length; i++) {
		objects[i].draw(ctx);
	}
}

function main() {
	// Main Code
	
	window.requestAnimationFrame(function(timestamp) {
		gameLoop(timestamp, ctx);
	});
}

document.addEventListener('click', function(event) {
	objects.push(new Firework(
		{x:event.clientX, y:event.clientY},
		particle_amount,
		firework_force,
		firework_lifetime));
});

main();