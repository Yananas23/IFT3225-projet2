const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Joueur extends Model {}

Joueur.init(
  {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    pseudo: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "penser à le hacher"
    },
    game: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    win: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    loged: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
      comment: "1 = admin"
    }
  },
  {
    sequelize,
    tableName: "joueur",
    timestamps: false,
    modelName: "Joueur",
  }
);

module.exports = Joueur;
