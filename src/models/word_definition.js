// - word_definition.js : Modèle pour gérer les relations entre les mots et leurs définitions dans la base de données.
const sequelize = require("../config/database");
const Word = require("./word");
const Definition = require("./definition");

// Création d'un modèle "word_definition" avec l'émulation PHPBridge
const WordDefinition = sequelize.define("word_definition", {
  "w-id": "INTEGER",
  "d-id": "INTEGER"
});

// Méthodes spécifiques pour le modèle WordDefinition
WordDefinition.findOne = async function({ where }) {
  try {
    const whereClause = Object.entries(where)
      .map(([key, value]) => `\`${key}\` = ?`)
      .join(" AND ");
    
    const results = await sequelize.query(
      `SELECT * FROM word_definition WHERE ${whereClause}`,
      Object.values(where)
    );
    
    return results && results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("Erreur dans WordDefinition.findOne:", error);
    return null;
  }
};

WordDefinition.findOrCreate = async function({ where }) {
  try {
    // Vérifiez d'abord que les IDs existent et sont valides
    if (!where['w-id'] || !where['d-id'] || where['w-id'] === '0' || where['d-id'] === '0') {
      throw new Error("IDs invalides pour word_definition");
    }
    
    const existingRecord = await this.findOne({ where });
    
    if (existingRecord) {
      return [existingRecord, false];
    }
    
    const newRecord = await this.create(where);
    return [newRecord, true];
  } catch (error) {
    console.error("Erreur dans WordDefinition.findOrCreate:", error);
    throw error;
  }
};

WordDefinition.create = async function(data) {
  const fields = Object.keys(data).map(k => `\`${k}\``).join(", ");
  const placeholders = Object.keys(data).map(() => "?").join(", ");
  const values = Object.values(data);
  
  await sequelize.query(
    `INSERT INTO word_definition (${fields}) VALUES (${placeholders})`,
    values
  );
  
  return data; // Pour cette table avec clés primaires composites, pas besoin de récupérer un ID
};

module.exports = WordDefinition;