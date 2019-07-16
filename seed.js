require('dotenv/config');

module.exports = {
	"undefined": process.env.DB_CONNECTION_STRING,
	"dev": "localhost/DEV_DB_NAME",
	"prod": "localhost/PROD_DB_NAME"
}