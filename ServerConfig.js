var config = {
	include: [
		{name: 'ServerNetworkEvents', path: './gameClasses/ServerNetworkEvents'},
        {name: 'Orb', path: './gameClasses/Orb'},
        {name: 'Planetoid', path: './gameClasses/Planetoid'},
        {name: 'Bullet', path: './gameClasses/Bullet'},
		{name: 'Player', path: './gameClasses/Player'}

	],
	db: {
		type: 'mysql',
		host: 'localhost',
		user: 'superspace',
		pass: 'collabo',
		dbName: 'superspace'
	}
};

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = config; }