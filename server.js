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
        this.fixedorbreds = [];
        this.fixedorbzs = [];

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
                        ige.network.define('updateTouchScore');
                        ige.network.define('code', self._onCode);
                        ige.network.define('orbEntity', self._onOrbEntity);
                        ige.network.define('fixedorbEntity', self._onFixedOrbEntity);
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

                        var fixedorbrad = 1.0;

                        self.spawnOrbs = function() {
                            new FixedOrb(fixedorbrad)
                                .rotateTo(0, 0, Math.radians(Math.random() * 360))
                                .translateTo(100, 100, 0);


                            new FixedOrb(fixedorbrad)
                                .rotateTo(0, 0, Math.radians(Math.random() * 360))
                                .translateTo(500, -500, 0);

                            new FixedOrb(fixedorbrad)
                                .rotateTo(0, 0, Math.radians(Math.random() * 360))
                                .translateTo(1000, -1000, 0);

                            new FixedOrb(fixedorbrad)
                                .rotateTo(0, 0, Math.radians(Math.random() * 360))
                                .translateTo(-300, -1200, 0);

                            new FixedOrb(fixedorbrad)
                                .rotateTo(0, 0, Math.radians(Math.random() * 360))
                                .translateTo(-700, -500, 0);

                            new FixedOrb(fixedorbrad)
                                .rotateTo(0, 0, Math.radians(Math.random() * 360))
                                .translateTo(-700, 1100, 0);

                        }



                        self.spawnOrbs();

                        new FixedOrbz(2)
                            .streamMode(1)
                            //.translateTo(this._translate.x - -this._geometry.x + this._geometry.x * this.scale, this._translate.y, 0);
                            .rotateTo(0, 0, Math.radians(Math.random() * 360))
                            .translateTo(0, 0, 0);

                        new FixedOrbRed(2)
                            .streamMode(1)
                            //.translateTo(this._translate.x - -this._geometry.x + this._geometry.x * this.scale, this._translate.y, 0);
                            .rotateTo(0, 0, Math.radians(Math.random() * 360))
                            .translateTo(500, 500, 0);

                        new FixedOrbRed(2)
                            .streamMode(1)
                            //.translateTo(this._translate.x - -this._geometry.x + this._geometry.x * this.scale, this._translate.y, 0);
                            .rotateTo(0, 0, Math.radians(Math.random() * 360))
                            .translateTo(-500, -500, 0);

                        
						ige.box2d.contactListener(
							// Listen for when contact's begin
							function (contact) {
								var A = contact.igeEntityA();
								var B = contact.igeEntityB();
                                //var C = contact.igeEntityC();
								//console.log('Contact begins between', contact.igeEntityA()._id, 'and', contact.igeEntityB()._id);
								if(A.category() == 'fixedorb' && B.category() == 'ship') {
                                //if(contact.igeEitherCategory('fixedorb') &&  contact.igeEitherCategory('ship')){



                                    B.score++;
                                    //console.log(B.score);
									//A.exploding = true; turned off exploding for now
									//B.destroy();
                                    var tempScores = [];
                                    /*for (var i in self.players){
										console.log(i);
										console.log(self.players[i]);
                                            tempScores.push(
                                                {'id' : i, 'score' : self.players[i].score}
                                            );

                                    }*/

                                    console.log(contact);
                                    // Check if it is our sensor
                                    //if (contact.m_fixtureA.IsSensor() || contact.m_fixtureB.IsSensor()) {
                                    //if (A.IsSensor() || B.IsSensor()) {

                                        console.log("sensor contact")
                                        // Sensor has collided, attach orb to ship!
                                        // Set carrying orb
                                        //self.player.carryOrb(contact.igeEntityByCategory('fixedorb'), contact);
                                        B.carryOrb(contact.igeEntityByCategory('fixedorb'), contact);


                                    //}






                                    ige.network.send('updateTouchScore', tempScores);

                                    //if (self.fixedorbs[] = 0){
                                        //console.log(self.fixedorbs.length);
                                    //}
                                    //console.log('contact with bullet');
                                    console.log('contact with fixed orb and ship');
                                    //var fixedorb7 = new Orb(5.5);
                                        //.rotateTo(0,0,Math.radians(Math.random()*360))
                                        //.translateTo(-700, 1100, 0);
								}
                                //else if (!self.player._carryingOrb && contact.igeEitherCategory('fixedorb') && contact.igeEitherCategory('ship')) {

                                else if (A.category() == 'orb' && B.category() == 'bullet') {
                                    //console.log('contact with fixedorb');
                                    //var fixedorb_checkin = new FixedOrbz(1)
                                    //    .rotateTo(0,0,Math.radians(Math.random()*360))
                                    //    .translateTo(0, 0, 0);

                                    //oldpoint = new IgePoint3d();

                                    A.exploding = true;
                                    B.destroy();
                                    ige.network.send('scored', '+'+A.pointWorth+' points!', B.sourceClient);
                                    //console.log('contact with ship');
                                }
                                else if (A.category() == 'fixedorb' && B.category() == 'fixedorb') {
                                    //console.log('contact with fixedorb');
                                    //var fixedorb_checkin = new FixedOrbz(1)
                                    //    .rotateTo(0,0,Math.radians(Math.random()*360))
                                    //    .translateTo(0, 0, 0);

                                    //oldpoint = new IgePoint3d();
                                    A.carryOrb(contact.igeEntityByCategory('fixedorb'), contact);
                                    //A.exploding = true;
                                    //B.destroy();
                                    //ige.network.send('scored', '+'+A.pointWorth+' points!', B.sourceClient);
                                    //console.log('contact with ship');
                                }
                                else if (A.category() == 'fixedorb' && B.category() == 'fixedorbred') {
                                    //console.log('contact with fixedorb');
                                    //var fixedorb_checkin = new FixedOrbz(1)
                                    //    .rotateTo(0,0,Math.radians(Math.random()*360))
                                    //    .translateTo(0, 0, 0);

                                    //oldpoint = new IgePoint3d();
                                    A.carryOrb(contact.igeEntityByCategory('fixedorb'), contact);
                                    //A.exploding = true;
                                    //B.destroy();
                                    //ige.network.send('scored', '+'+A.pointWorth+' points!', B.sourceClient);
                                    //console.log('contact with ship');
                                }
                                else if (A.category() == 'fixedorb' && B.category() == 'fixedorbz') {
                                    //console.log('contact with fixedorb');
                                    //var fixedorb_checkin = new FixedOrbz(1)
                                    //    .rotateTo(0,0,Math.radians(Math.random()*360))
                                    //    .translateTo(0, 0, 0);

                                    //oldpoint = new IgePoint3d();

                                    //A.exploding = true;
                                    A.destroy();
                                    ige.network.send('scored', '+'+A.pointWorth+' points!', B.sourceClient);
                                    //console.log('contact with ship');
                                }
                                else if(A.category() == 'orb' && B.category() == 'ship') {
                                    A.exploding = true;
                                    B.destroy();
                                    ige.network.send('scored', '+'+A.pointWorth+' points!', B.sourceClient);
                                    console.log('contact with orb and ship');
                                    //console.log(B);

                                setTimeout(function(){
									var oldColor = B.color;
									ige.server.players[B.clientID] = new Player(B.clientID)
										.streamMode(1)
										.translateTo(-400,0,0)
										//.scaleTo(1,1,1)
										.rotateTo(0,0,Math.radians(90))
										.mount(ige.server.scene1);
									
									ige.server.players[B.clientID].color = oldColor;
									
                                     ige.network.send('playerEntity', ige.server.players[B.clientID].id(), B.clientID);
                                     //ige.network.send('updateScore', ige.server.score, clientId);
                                },2000);

                                }



							},
							// Listen for when contact's end
							function (contact) {
								//console.log('Contact ends between', contact.igeEntityA()._id, 'and', contact.igeEntityB()._id);
							}
						);
						
						self.floatToRgb = function(val) {
							self.colorStops = [
								[255,0,0],
								[255,255,0],
								[0,255,0],
								[0,255,255],
								[0,0,255],
								[255,0,255]
							];
							if(val > 1) { val = val % 1; }
							var fromStop = Math.floor(val*(self.colorStops.length-1));
							var toStop = Math.ceil(val*(self.colorStops.length-1));
							var stopPercentage = (val - 1 / (self.colorStops.length-1) * fromStop) * (self.colorStops.length-1);
							var colors = [0,0,0];
							if(fromStop == toStop) { colors[0] = self.colorStops[fromStop][0]; colors[1] = self.colorStops[fromStop][1]; colors[2] = self.colorStops[fromStop][2]; }
							else {
								colors[0] = Math.round((self.colorStops[toStop][0]-self.colorStops[fromStop][0])*stopPercentage)+self.colorStops[fromStop][0];
								colors[1] = Math.round((self.colorStops[toStop][1]-self.colorStops[fromStop][1])*stopPercentage)+self.colorStops[fromStop][1];
								colors[2] = Math.round((self.colorStops[toStop][2]-self.colorStops[fromStop][2])*stopPercentage)+self.colorStops[fromStop][2];
							}
							return 'rgba('+colors[0]+','+colors[1]+','+colors[2]+',1)';
						}
						
					}
				});
			});
	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Server; }