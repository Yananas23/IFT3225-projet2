const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Word extends Model {}

Word.init(
  {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    word: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    lang: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "word",
    timestamps: false,
    modelName: "Word",
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: ["id"],
      },
    ],
  }
);


module.exports = Word;