var ServerNetworkEvents = {
	/**
	 * Is called when the network tells us a new client has connected
	 * to the server. This is the point we can return true to reject
	 * the client connection if we wanted to.
	 * @param data The data object that contains any data sent from the client.
	 * @param clientId The client id of the client that sent the message.
	 * @private
	 */
	_onPlayerConnect: function (socket) {
		// Don't reject the client connection
		return false;
	},

	_onPlayerDisconnect: function (clientId) {
		if (ige.server.players[clientId]) {
			// Remove the player from the game
			ige.server.players[clientId].destroy();

			// Remove the reference to the player entity
			// so that we don't leak memory
			delete ige.server.players[clientId];
		}
	},

	_onPlayerEntity: function (data, clientId) {
		if (!ige.server.players[clientId]) {
			ige.server.players[clientId] = new Player(clientId)
				.streamMode(1)
				.translateTo(0,-400,0)
				.mount(ige.server.scene1);
			
			ige.server.players[clientId].color = ige.server.floatToRgb(Math.random());
			// Tell the client to track their player entity
			ige.network.send('playerEntity', ige.server.players[clientId].id(), clientId);
			ige.network.send('updateScore', ige.server.score, clientId);
		}
	},

    _onOrbEntity: function (data, clientId) {
        /*if (!ige.server.orbs[clientId]) {
            ige.server.orbs[clientId] = new Orb(clientId)
                .streamMode(1)
                .mount(ige.server.scene1);

             //Tell the client to track their player entity
            ige.network.send('orbEntity', ige.server.orbs[clientId].id(), clientId);
        }*/
    },

    _onFixedOrbEntity: function (data, clientId) {
        /*if (!ige.server.fixedorbs[clientId]) {
            ige.server.fixedorbs[clientId] = new FixedOrb(clientId)
                .streamMode(1)
                .mount(ige.server.scene1);

            //Tell the client to track their player entity
            ige.network.send('fixedorbEntity', ige.server.fixedorbs[clientId].id(), clientId);
            console.log("fixedorb callback fired");
        }*/
    },

    _onBulletEntity: function (data, clientId) {
        if (!ige.server.bullets[clientId]) {
            ige.server.bullets[clientId] = new Bullet(clientId)
                .streamMode(1)
                .mount(ige.server.scene1);

            //Tell the client to track their player entity
            ige.network.send('bulletEntity', ige.server.bullets[clientId].id(), clientId);
        }
    },

	
	_onCode: function(data, clientId) {
		var player = ige.server.players[clientId];
		//console.log(player);
		try {
			eval(data);
		}
		catch(e) {
			console.log(e);
		}
	},

	_onChatJoin: function(data, clientId) {
		ige.network.send('chatJoin', ige.server.chatBuffer, clientId);
	},

	_onChatMessage: function(data, clientId) {
		var msg = {'time' : new Date(), 'message' : data, 'client' : clientId};
		ige.server.chatBuffer.push(msg);
		ige.network.send('chatMessage', msg);
	},

	_onPlayerLeftDown: function (data, clientId) {
		ige.server.players[clientId].controls.left = true;
	},

	_onPlayerLeftUp: function (data, clientId) {
		ige.server.players[clientId].controls.left = false;
	},

	_onPlayerRightDown: function (data, clientId) {
		ige.server.players[clientId].controls.right = true;
	},

	_onPlayerRightUp: function (data, clientId) {
		ige.server.players[clientId].controls.right = false;
	},

	_onPlayerThrustDown: function (data, clientId) {
		ige.server.players[clientId].controls.thrust = true;
	},

	_onPlayerThrustUp: function (data, clientId) {
		ige.server.players[clientId].controls.thrust = false;
	},
	
	_onPlayerShoot: function (data, clientId) {
		ige.server.players[clientId].shoot(clientId);
	}
};

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = ServerNetworkEvents; }