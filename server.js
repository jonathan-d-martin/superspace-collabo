var Server = IgeClass.extend({
	classId: 'Server',
	Server: true,

	init: function (options) {
		var self = this;
        serverScore = 0;
		ige.timeScale(1);

		// Define an object to hold references to our player entities
		this.players = {};
        this.orbs = [];
        this.fixedorbs = [];

		// Add the server-side game methods / event handlers
		this.implement(ServerNetworkEvents);

        ige.addComponent(IgeBox2dComponent)
            .box2d.sleep(true)
            //.box2d.gravity(0, 1)
            .box2d.createWorld()
            .box2d.mode(0)
            .box2d.start();

		// Add the networking component
		ige.addComponent(IgeNetIoComponent)
			// Start the network server
			.network.start(7610, function () {
            //.network.start(2000, function () {
				// Networking has started so start the game engine
				ige.start(function (success) {
					// Check if the engine started successfully
					if (success) {
                        // Create some network commands we will need
                        ige.network.define('playerEntity', self._onPlayerEntity);
                        ige.network.define('chatJoin', self._onChatJoin);
                        ige.network.define('chatMessage', self._onChatMessage);
                        ige.network.define('scored');
                        ige.network.define('updateScore');
                        ige.network.define('code', self._onCode);
                        ige.network.define('orbEntity', self._onOrbEntity);
                        ige.network.define('bulletEntity', self._onBulletEntity);
                        ige.network.define('playerControlLeftDown', self._onPlayerLeftDown);
                        ige.network.define('playerControlRightDown', self._onPlayerRightDown);
                        ige.network.define('playerControlThrustDown', self._onPlayerThrustDown);

                        ige.network.define('playerControlLeftUp', self._onPlayerLeftUp);
                        ige.network.define('playerControlRightUp', self._onPlayerRightUp);
                        ige.network.define('playerControlThrustUp', self._onPlayerThrustUp);
						
						ige.network.define('playerShoot', self._onPlayerShoot);

                        ige.network.on('connect', self._onPlayerConnect); // Defined in ./gameClasses/ServerNetworkEvents.js
                        ige.network.on('disconnect', self._onPlayerDisconnect); // Defined in ./gameClasses/ServerNetworkEvents.js

                        // Add the network stream component
                        ige.network.addComponent(IgeStreamComponent)
                            .stream.sendInterval(30) // Send a stream update once every 30 milliseconds
                            .stream.start(); // Start the stream

                        // Accept incoming network connections
                        ige.network.acceptConnections(true);

						// Create chat buffer
						self.chatBuffer = [];
						
                        // Create the scene
                        self.mainScene = new IgeScene2d()
                            .id('mainScene');

                        // Create the scene
                        self.scene1 = new IgeScene2d()
                            .id('scene1')
                            .mount(self.mainScene);

                        // Create the main viewport and set the scene
                        // it will "look" at as the new scene1 we just
                        // created above
                        self.vp1 = new IgeViewport()
                            .id('vp1')
                            .autoSize(true)
                            .scene(self.mainScene)
                            .drawBounds(true)
                            .mount(ige);
						
                        //var tex = new IgeTexture('./assets/OrbTexture.js');
						
						self.score = 0;
						
						for(var i = 0; i < 10; i++) {
							scale = 1 + Math.random();
							var orb3 = new Orb(scale)
								.translateTo((Math.random()-0.5)*2000, (Math.random()-0.5)*2000, 0)
								.rotateTo(0,0,Math.radians(Math.random()*360))
						}

                        var fixedorb1 = new FixedOrb(1)
                            .rotateTo(0,0,Math.radians(Math.random()*360))
                            .translateTo(100, 100, 0);

                        var fixedorb2 = new FixedOrb(1)
                        .rotateTo(0,0,Math.radians(Math.random()*360))
                        .translateTo(500, -500, 0)

                        var fixedorb3 = new FixedOrb(1)
                            .rotateTo(0,0,Math.radians(Math.random()*360))
                            .translateTo(1000, -1000, 0)

                        var fixedorb4 = new FixedOrb(1)
                            .rotateTo(0,0,Math.radians(Math.random()*360))
                            .translateTo(-300, -1200, 0)

                        var fixedorb5 = new FixedOrb(1)
                            .rotateTo(0,0,Math.radians(Math.random()*360))
                            .translateTo(-700, -500, 0)

						ige.box2d.contactListener(
							// Listen for when contact's begin
							function (contact) {
								var A = contact.igeEntityA();
								var B = contact.igeEntityB();
                                //var C = contact.igeEntityC();
								//console.log('Contact begins between', contact.igeEntityA()._id, 'and', contact.igeEntityB()._id);
								if(A.category() == 'orb' && B.category() == 'bullet') {
									A.exploding = true;
									B.destroy();
									ige.network.send('scored', '+'+A.pointWorth+' points!', B.sourceClient);
                                    console.log('contact with bullet');
								}
                                else if(A.category() == 'orb' && B.category() == 'ship') {
                                    A.exploding = true;
                                    B.destroy();
                                    ige.network.send('scored', '+'+A.pointWorth+' points!', B.sourceClient);
                                    console.log('contact with ship');
                                }


							},
							// Listen for when contact's end
							function (contact) {
								//console.log('Contact ends between', contact.igeEntityA()._id, 'and', contact.igeEntityB()._id);
							}
						);

					}
				});
			});
	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Server; }