const { Sequelize } = require("sequelize");
require("dotenv").config();
const GSSAPIAuthPlugin = require('./gssapi-auth-plugin');


const sequelize = new Sequelize(
  process.env.DB_NAME,     
  process.env.DB_USER,     
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST, 
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      authPlugins: {
        'auth_gssapi_client': () => new GSSAPIAuthPlugin()
      },
      authSwitchHandler: function(data, cb) {
        if (data.pluginName === 'auth_gssapi_client') {
          const plugin = new GSSAPIAuthPlugin();
          plugin.authenticate({
            pluginData: data.pluginData,
            connection: this,
            hostname: process.env.DB_HOST
          }, cb);
        } else {
          return cb(new Error(`Méthode d'authentification non supportée: ${data.pluginName}`));
        }
      }
    }
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion à MySQL réussie !");
  } catch (error) {
    console.error("❌ Erreur de connexion :", error);
  }
}

testConnection();

module.exports = sequelize;