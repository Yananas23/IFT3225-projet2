const Word = require("./word");
const Definition = require("./definition");
const WordDefinition = require("./word_definition");
const Joueur = require("./joueur");

function initModels() {
  Word.getDefinitions = async function(wordId) {
    const sequelize = require("../config/database");
    return sequelize.query(
      `SELECT d.* FROM definition d 
       JOIN word_definition wd ON d.id = "wd.d-id"
       WHERE "wd.w-id" = ?`,
      [wordId]
    );
  };
  
  Definition.getWords = async function(definitionId) {
    const sequelize = require("../config/database");
    return sequelize.query(
      `SELECT w.* FROM word w 
       JOIN word_definition wd ON w.id = "wd.w-id" 
       WHERE "wd.d-id" = ?`,
      [definitionId]
    );
  };

  return {Word, Definition, WordDefinition,  Joueur };
}

module.exports = initModels;