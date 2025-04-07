const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Definition extends Model {}

Definition.init(
  {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    definition: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "definition",
    timestamps: false,
    modelName: "Definition",
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

module.exports = Definition;
