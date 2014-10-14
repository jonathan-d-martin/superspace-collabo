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
        this.planetoids = [];

		// Add the server-side game methods / event handlers
		this.implement(ServerNetworkEvents);

        ige.addComponent(IgeBox2dComponent)
            .box2d.sleep(true)
            .box2d.createWorld()
            .box2d.mode(0)
            .box2d.start();

		/* ------------------------------------------- *\
						Database
							
			Please create a mysql database called
			'superspace' to get this working
		\* ------------------------------------------- */
		ige.addComponent(IgeMySqlComponent, options.db).mysql.connect(function (err, db) {
			if (!err) {
				ige.mysql.query('SELECT * FROM users', function (err, rows, fields) {
					if (!err) { // users table found and successfully accessed
						var count = rows.length;
						console.log('*                      Database connection sucessful                         *');
						console.log('*'+Array(29-count.toString().length).join(" ")+''+count+' users have registered                          *');
						console.log('------------------------------------------------------------------------------');
					} else if(err.code == "ER_TABLEACCESS_DENIED_ERROR") { // user table found but permissions error
						console.log("Error while accessing users table, permission denied");
					} else if(err.code == "ER_NO_SUCH_TABLE") { // user table not found
						console.log("User table not found, creating it now");
						ige.mysql.query("CREATE TABLE `users` ( `id` INT NOT NULL AUTO_INCREMENT, `username` INT NULL, `password` TEXT NULL, `color` TEXT NULL DEFAULT NULL, PRIMARY KEY (`id`) ) COLLATE='utf8_bin' ENGINE=InnoDB;", function(err, rows, fields) {
							if(!err) {
								console.log("Users table created successfully!");
							}
							else {
								console.log('Error creating users table', err);
							}
						});
					}
					else {
						console.log('Error', err);
					}
				});
			} else {
				console.log(err);
			}
		});
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
                        ige.network.define('login', self._onLogin);
                        ige.network.define('playerEntity', self._onPlayerEntity);
                        ige.network.define('chatJoin', self._onChatJoin);
                        ige.network.define('chatMessage', self._onChatMessage);
                        ige.network.define('scored');
                        ige.network.define('updateScore');
                        ige.network.define('updateTouchScore');
                        ige.network.define('code', self._onCode);
                        ige.network.define('bulletEntity', self._onBulletEntity);
                        ige.network.define('playerControlLeftDown', self._onPlayerLeftDown);
                        ige.network.define('playerControlRightDown', self._onPlayerRightDown);
                        ige.network.define('playerControlThrustDown', self._onPlayerThrustDown);
                        ige.network.define('playerControlShootDown', self._onPlayerShootDown);

                        ige.network.define('playerControlLeftUp', self._onPlayerLeftUp);
                        ige.network.define('playerControlRightUp', self._onPlayerRightUp);
                        ige.network.define('playerControlThrustUp', self._onPlayerThrustUp);
                        ige.network.define('playerControlShootUp', self._onPlayerShootUp);

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
						
						/* ------------------------------------------- *\
											Create the scene
						\* ------------------------------------------- */
						
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
						
						/* ------------------------------------------- *\
										Spawn asteroids
						\* ------------------------------------------- */
						
						for(var i = 0; i < 10; i++) {
							scale = 1 + Math.random();
							var orb3 = new Orb(scale)
								.translateTo((Math.random()-0.5)*2000, (Math.random()-0.5)*2000, 0)
								.rotateTo(0,0,Math.radians(Math.random()*360))
						}
						
						/* ------------------------------------------- *\
										Spawn planetoids
						\* ------------------------------------------- */
						
                        self.spawnOrbs = function() {
                            new Planetoid(2.5)
                                .rotateTo(0, 0, Math.radians(Math.random() * 360))
                                .translateTo(200, 100, 0);

                            new Planetoid(2.5)
                                .rotateTo(0, 0, Math.radians(Math.random() * 360))
                                .translateTo(500, -500, 0);

                            new Planetoid(2.5)
                                .rotateTo(0, 0, Math.radians(Math.random() * 360))
                                .translateTo(1000, -1000, 0);

                            new Planetoid(2.5)
                                .rotateTo(0, 0, Math.radians(Math.random() * 360))
                                .translateTo(-300, -1200, 0);

                            new Planetoid(2.5)
                                .rotateTo(0, 0, Math.radians(Math.random() * 360))
                                .translateTo(-700, -500, 0);

                            new Planetoid(2.5)
                                .rotateTo(0, 0, Math.radians(Math.random() * 360))
                                .translateTo(-700, 1100, 0);

                        }
                        self.spawnOrbs();
						
						/* ------------------------------------------- *\
										Contact listeners
						\* ------------------------------------------- */
                        
						ige.box2d.contactListener(
							// Listen for when contact's begin
							function (contact) {
								var A = contact.igeEntityA();
								var B = contact.igeEntityB();
                                //var C = contact.igeEntityC();
								//console.log('Contact begins between', contact.igeEntityA()._id, 'and', contact.igeEntityB()._id);
								if(A.category() == 'planetoid' && B.category() == 'ship') {
									if(!A.touched) {
										B.score++;
										A.exploding = true;
										var tempScores = [];
										for (var i in self.players){
											tempScores.push(
												{'id' : self.players[i].id(), 'score' : self.players[i].score}
											);
										}
										ige.network.send('updateTouchScore', tempScores);
										console.log('contact with planetoid and ship');
									}
								}
                                else if (A.category() == 'orb' && B.category() == 'bullet') {
                                    A.exploding = true;
                                    B.destroy();
									ige.network.send('scored', '+'+A.pointWorth+' points!', B.sourceClient);
                                }
                                else if(A.category() == 'orb' && B.category() == 'ship') {
                                    A.exploding = true;
									B.exploding = true;
									//console.log(contact.igeEntityA.id());
									//console.log(contact.igeEntityB.id());
                                    ige.network.send('scored', '+'+A.pointWorth+' points!', B.sourceClient);
									console.log("contact with asteroid and ship");
								}
							},
							// Listen for when contact's end
							function (contact) {
							}
						);
						
						/* ------------------------------------------- *\
											Color randomiser
						\* ------------------------------------------- */
						
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