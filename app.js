var express = require('express');
var app = express();
var serv = require('http').Server(app);
PORT = process.env.PORT || 2000;

/* app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + 'client')); */

const clientPath = `${__dirname}/client`;
console.log(`Serving static files from path ${clientPath}`);

app.use(express.static(clientPath));

serv.listen(PORT);
console.log("Server listening at " + PORT);

var newuser;
var miliseconds = 0;
var SOCKET_LIST = {};
let lastKey = '';

//===================================================================================================
class Boundary {
    static width = 40
    static height = 40
    constructor({ position }) {
        this.position = position
        this.width = 40
        this.height = 40
    }

}

const map = [
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'],
    ['-', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '-', ' ', ' ', ' ', '-'],
    ['-', ' ', '-', ' ', '-', ' ', '-', ' ', ' ', ' ', '-', ' ', '-'],
    ['-', ' ', ' ', ' ', '-', ' ', ' ', ' ', '-', ' ', '-', ' ', '-'],
    ['-', ' ', '-', ' ', '-', ' ', '-', ' ', ' ', ' ', '-', ' ', '-'],
    ['-', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '-', ' ', ' ', ' ', '-'],
    ['-', ' ', '-', '-', ' ', '-', '-', ' ', ' ', ' ', '-', ' ', '-'],
    ['-', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '-', ' ', ' ', ' ', '-'],
    ['-', '-', '-', ' ', '-', ' ', '-', '-', '-', ' ', '-', ' ', '-'],
    ['-', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '-', ' ', '-', ' ', '-'],
    ['-', ' ', '-', '-', ' ', '-', '-', ' ', ' ', ' ', '-', ' ', '-'],
    ['-', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '-', ' ', ' ', ' ', '-'],
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
]

const boundaries = []

map.forEach((row, i) => {
    row.forEach((symbol, j) => {
        switch (symbol) {
            case '-':
                boundaries.push(new Boundary({
                    position: {
                        x: Boundary.width * j,
                        y: Boundary.height * i
                    }
                })
                )
                break
        }
    })
})


function circleColidesWithRectangle({ circle, rectangle }) {
    return (
        circle.y - circle.radius + circle.spdY
        <= rectangle.position.y + rectangle.height &&
        circle.x + circle.radius + circle.spdX
        >= rectangle.position.x &&
        circle.y + circle.radius + circle.spdY
        >= rectangle.position.y &&
        circle.x - circle.radius + circle.spdX
        <= rectangle.position.x + rectangle.width
    )
}


var Entity = function () {
    var self = {
        x: 60,
        y: 60,
        spdX: 0,
        spdY: 0,
        maxSpd: 4,
        radius: 19,
        id: "",
        //nickname: "adeline"
    }
    self.update = function () {
        self.updatePosition();
    }
    self.updatePosition = function () {

        //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++        
        boundaries.forEach((boundary) => {


            if (
                circleColidesWithRectangle({
                    circle: self,
                    rectangle: boundary
                })
            ) {

                self.spdX = 0
                self.spdY = 0


            }

        })

        //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        self.x += self.spdX;
        self.y += self.spdY;

    }
    return self;
}

var Player = function (id) {
    var self = Entity();
    self.id = id;
    self.number = "" + Math.floor(10 * Math.random());
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.radius = 19;
    self.collided = false;
    self.maxSpd = 4;
    self.nickname = "";
    self.timer = 0

    var super_update = self.update;
    self.update = function () {
        self.updateSpd();
        super_update();
    }

    self.updateSpd = function () {

        if (self.pressingRight && lastKey === 'd') { 
            for (let i = 0; i < boundaries.length; i++) {
                const boundary = boundaries[i];
                if (circleColidesWithRectangle({
                    circle: { ...self, spdX: self.maxSpd },
                    rectangle: boundary
                })) {
                    self.spdX = 0;
                    break;
                }
                else { self.spdX = self.maxSpd; }
            } 
        }

        else if (self.pressingLeft && lastKey === 'a') { 
            for (let i = 0; i < boundaries.length; i++) {
                const boundary = boundaries[i];
                if (circleColidesWithRectangle({
                    circle: { ...self, spdX: -self.maxSpd },
                    rectangle: boundary
                })) {
                    self.spdX = 0;
                    break;
                }
                else { self.spdX = -self.maxSpd; }
            } 
        }
        //else
        //{self.spdX = 0;}

        if (self.pressingUp && lastKey === 'w') {
            for (let i = 0; i < boundaries.length; i++) {
                const boundary = boundaries[i];
                if (circleColidesWithRectangle({
                    circle: { ...self, spdY: -self.maxSpd },
                    rectangle: boundary
                })) {
                    self.spdY = 0;
                    break;
                }
                else { self.spdY = -self.maxSpd; }
            }

        }

        else if (self.pressingDown && lastKey === 's') { 
            for (let i = 0; i < boundaries.length; i++) {
                const boundary = boundaries[i];
                if (circleColidesWithRectangle({
                    circle: { ...self, spdY: self.maxSpd },
                    rectangle: boundary
                })) {
                    self.spdY = 0;
                    break;
                }
                else { self.spdY = self.maxSpd; }
            } 
        }
        //else
        //{self.spdY = 0;}
    }
    Player.list[id] = self;
    return self;
}
Player.list = {};
Player.onConnect = function (socket) {
    var player = Player(socket.id);
    socket.on('newuser', function (data) {
        player.nickname = data;
    });
    socket.on('keyPress', function (data) {
        if (data.inputId === 'left') {
            player.pressingLeft = data.state;
            lastKey = 'a';
        }
        else if (data.inputId === 'right') {
            player.pressingRight = data.state;
            lastKey = 'd';
        }
        else if (data.inputId === 'up') {
            player.pressingUp = data.state;
            lastKey = 'w';
        }
        else if (data.inputId === 'down') {
            player.pressingDown = data.state;
            lastKey = 's';
        }
    });
    /* socket.on('collision', function() {
        
        player.collided = true;
        //player.spdX = 0;
        //player.spdY = 0;
        player.updatePosition();
        player.collided = false;
        
        
    }); */

}
Player.onDisconnect = function (socket) {
    delete Player.list[socket.id];
}
Player.update = function () {
    var pack = [];
    for (var i in Player.list) {
        var player = Player.list[i];
        player.update();
        //testCollision(player, boundaries);
        pack.push({
            x: player.x,
            y: player.y,
            number: player.number,
            spdX: player.spdX,
            spdY: player.spdY,
            //id: player.id,
            nick: player.nickname,
            //timer: player.timer
        });
        //console.log(newuser);
        //console.log(player.timer);
        //player.timer += 40;
    }

    return pack;

}

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    Player.onConnect(socket);
    socket.on('disconnect', function () {
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

    //socket.on('collision', function(x, y){});
});

setInterval(function () {
    var pack = Player.update();

    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack);
        //socket.emit('timer', miliseconds);
    }
    //miliseconds += 40;
    //console.log(miliseconds);


}, 1000 / 25);

/* const myFunc = () => {
    console.log("5 seconds past");
};

setTimeout(myFunc, 5000); */