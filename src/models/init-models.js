const DataTypes = require("sequelize").DataTypes;
const _definition = require("./definition");
const _joueur = require("./joueur");
const _word = require("./word");
const _word_definition = require("./word_definition");

function initModels(sequelize) {
  const definition = _definition(sequelize, DataTypes);
  const joueur = _joueur(sequelize, DataTypes);
  const word = _word(sequelize, DataTypes);
  const word_definition = _word_definition(sequelize, DataTypes);

  definition.belongsToMany(word, { as: 'w-id_words', through: word_definition, foreignKey: "d-id", otherKey: "w-id" });
  word.belongsToMany(definition, { as: 'd-id_definitions', through: word_definition, foreignKey: "w-id", otherKey: "d-id" });
  word_definition.belongsTo(definition, { as: "d-", foreignKey: "d-id"});
  definition.hasMany(word_definition, { as: "word_definitions", foreignKey: "d-id"});
  word_definition.belongsTo(word, { as: "w-", foreignKey: "w-id"});
  word.hasMany(word_definition, { as: "word_definitions", foreignKey: "w-id"});

  return {
    definition,
    joueur,
    word,
    word_definition,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
