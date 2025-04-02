const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Word_Definition extends Model {}

class word_definition extends Sequelize.Model {
  static init(sequelize, DataTypes) {
  return super.init({
    'w-id': {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'word',
        key: 'id'
      }
    },
    'd-id': {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'definition',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'word_definition',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "w-id" },
          { name: "d-id" },
        ]
      },
      {
        name: "d-id",
        using: "BTREE",
        fields: [
          { name: "d-id" },
        ]
      },
    ]
  });
  }
}

module.exports = Word_Definition;
