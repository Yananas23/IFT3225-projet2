const Word = require("./word");
const Definition = require("./definition");
const WordDefinition = require("./word_definition");
const Joueur = require("./joueur");

function initModels() {
    // Définition des relations
    Word.belongsToMany(Definition, { through: WordDefinition, foreignKey: "w-id", otherKey: "d-id" });
    Definition.belongsToMany(Word, { through: WordDefinition, foreignKey: "d-id", otherKey: "w-id" });

    WordDefinition.belongsTo(Word, { foreignKey: "w-id" });
    Word.hasMany(WordDefinition, { foreignKey: "w-id" });

    WordDefinition.belongsTo(Definition, { foreignKey: "d-id" });
    Definition.hasMany(WordDefinition, { foreignKey: "d-id" });

    return { Word, Definition, WordDefinition, Joueur };
}

module.exports = initModels;
