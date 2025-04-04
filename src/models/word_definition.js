const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Word_Definition extends Model {}

Word_Definition.init(
  {
    'w-id': {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "word",
        key: "id",
      },
    },
    'd-id': {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "definition",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "word_definition",
    timestamps: false,
    modelName: "Word_Definition",
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: ["w-id", "d-id"],
      }
    ],
  }
);

module.exports = Word_Definition;
