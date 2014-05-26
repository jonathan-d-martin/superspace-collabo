var Player = IgeEntityBox2d.extend({
	classId: 'Player',

	init: function () {
		IgeEntity.prototype.init.call(this);

		var self = this;

		this.drawBounds(false);

		// Rotate to point upwards
		this.controls = {
			left: false,
			right: false,
			thrust: false
		};

		if (ige.isServer) {
			this.addComponent(IgeVelocityComponent);

		}

		if (!ige.isServer) {
			self.texture(ige.client.textures.ship)
			.width(20)
			.height(20);

            var tex = new IgeTexture('./assets/OrbTexture.js');
		}





		// Define the data sections that will be included in the stream
		this.streamSections(['transform', 'score']);
	},

	/**
	 * Override the default IgeEntity class streamSectionData() method
	 * so that we can check for the custom1 section and handle how we deal
	 * with it.
	 * @param {String} sectionId A string identifying the section to
	 * handle data get / set for.
	 * @param {*=} data If present, this is the data that has been sent
	 * from the server to the client for this entity.
	 * @return {*}
	 */
	streamSectionData: function (sectionId, data) {
		// Check if the section is one that we are handling
		if (sectionId === 'score') {
			// Check if the server sent us data, if not we are supposed
			// to return the data instead of set it
			if (data) {
				// We have been given new data!
				this._score = data;
			} else {
				// Return current data
				return this._score;
			}
		} else {
			// The section was not one that we handle here, so pass this
			// to the super-class streamSectionData() method - it handles
			// the "transform" section by itself
			return IgeEntity.prototype.streamSectionData.call(this, sectionId, data);
		}
	},

	/**
	 * Called every frame by the engine when this entity is mounted to the
	 * scenegraph.
	 * @param ctx The canvas context to render to.
	 */
	tick: function (ctx) {
		/* CEXCLUDE */
		if (ige.isServer) {
			if (this.controls.left) {
				this.rotateBy(0, 0, Math.radians(-0.02 * ige._tickDelta));
			}

			if (this.controls.right) {
				this.rotateBy(0, 0, Math.radians(0.02 * ige._tickDelta));
			}

			if (this.controls.thrust) {
				this.velocity.byAngleAndPower(this._rotate.z + Math.radians(-90), 0.1);
			} else {
				this.velocity.x(0);
				this.velocity.y(0);
			}
		}
		/* CEXCLUDE */

		if (!ige.isServer) {

            ige.input.on('mouseDown', function(event, mouseX, mouseY, which) {
                if (which == 1 && mouseY<-200) {
                    //the left mouse button was clicked or a touch happened
                    ige.network.send('playerControlThrustDown');


                    //var myent = new IgeEntityBox2d();
                    var myent = new Orb();
                    myent.mount(ige.client.scene1);
                    //myent.scaleTo(0.2,0.2,0.2);
                    //var worldrot = this._worldRotationZ;
                    //var worldRot = self.screenPosition();
                    myent
                        .addComponent(IgeVelocityComponent)
                        //.translate
                        //.velocity.x(-0.01)
                        //.velocity.y(0.01)
                        //.velocity.byAngleAndPower(Math.radians(worldRot), 0.1)
                        .velocity.byAngleAndPower(Math.radians(mouseX-90), 0.1)
                        .width(1)
                        .height(1)
                        .streamMode(1)
                        //.translateTo(self._translate.x, self._translate.y, 0);
                        //.box2dBody({
                        //    type: 'dynamic',
                        //    bullet: 'true',
                        //    gravitic: false
                        //})

                        /*.box2dBody({
                            type: 'dynamic',
                            linearDamping: 0.0,
                            angularDamping: 0.05,
                            allowSleep: true,
                            bullet: true,
                            gravitic: false,
                            fixedRotation: false,
                            fixtures: [
                                {
                                    density: 1,
                                    filter: {
                                        categoryBits: 0x0100,
                                        maskBits: 0xffff
                                    },
                                    shape: {
                                        type: 'circle'
                                    }
                                }
                            ]
                        });*/

                    //myent.texture(ige.client.textures.orb);
                    //ige.network.send('orbEntity');

                }
            });

            ige.input.on('mouseDown', function(event, mouseX, mouseY, which) {
                if (mouseX < 150 && mouseY > -200) {
                    //the left mouse button was clicked or a touch happened
                    ige.network.send('playerControlLeftDown');
                }
            });

            ige.input.on('mouseUp', function(event, mouseX, mouseY, which) {
                if (mouseX < 150 && mouseY > -200) {
                    //the left mouse button was clicked or a touch happened
                    ige.network.send('playerControlLeftUp');
                }
            });

            ige.input.on('mouseDown', function(event, mouseX, mouseY, which) {
                if (mouseX > 150 && mouseY > -200) {
                    //the left mouse button was clicked or a touch happened
                    ige.network.send('playerControlRightDown');
                }
            });

            ige.input.on('mouseUp', function(event, mouseX, mouseY, which) {
                if (mouseX > 150 && mouseY > -200) {
                    //the left mouse button was clicked or a touch happened
                    ige.network.send('playerControlRightUp');
                }
            });



            ige.input.on('mouseUp', function(event, mouseX, mouseY, which) {
                if (which == 1) {
                    //the left mouse button was clicked or a touch happened
                    ige.network.send('playerControlThrustUp');
                }
            });




			if (ige.input.actionState('left')) {
				if (!this.controls.left) {
					// Record the new state
					this.controls.left = true;

					// Tell the server about our control change
					ige.network.send('playerControlLeftDown');
				}
			} else {
				if (this.controls.left) {
					// Record the new state
					this.controls.left = false;

					// Tell the server about our control change
					ige.network.send('playerControlLeftUp');
				}
			}

			if (ige.input.actionState('right')) {
				if (!this.controls.right) {
					// Record the new state
					this.controls.right = true;

					// Tell the server about our control change
					ige.network.send('playerControlRightDown');
				}
			} else {
				if (this.controls.right) {
					// Record the new state
					this.controls.right = false;

					// Tell the server about our control change
					ige.network.send('playerControlRightUp');
				}
			}

			if (ige.input.actionState('thrust')) {
				if (!this.controls.thrust) {
					// Record the new state
					this.controls.thrust = true;

					// Tell the server about our control change
					ige.network.send('playerControlThrustDown');
				}
			} else {
				if (this.controls.thrust) {
					// Record the new state
					this.controls.thrust = false;

					// Tell the server about our control change
					ige.network.send('playerControlThrustUp');
				}
			}
		}

		// Call the IgeEntity (super-class) tick() method
		IgeEntity.prototype.tick.call(this, ctx);
	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Player; }