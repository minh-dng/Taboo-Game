// https://stackoverflow.com/a/8427954/14046889
let connect = require('connect');
let serveStatic = require('serve-static');

connect()
	.use(serveStatic(__dirname))
	.listen(8000, () => console.log('Server running on http://localhost:8000/'));