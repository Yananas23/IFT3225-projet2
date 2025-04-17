// definition.js adapté pour PHPBridge
const sequelize = require("../config/database");

// Création d'un modèle "definition" avec l'émulation PHPBridge
const Definition = sequelize.define("definition", {
  id: "INTEGER",
  definition: "TEXT",
  source: "STRING"
});

// Méthodes spécifiques pour le modèle Definition
Definition.findOne = async function({ where }) {
  const results = await sequelize.query(
    `SELECT * FROM definition WHERE ${Object.keys(where)[0]} = ?`, 
    [Object.values(where)[0]]
  );
  return results.length > 0 ? results[0] : null;
};

Definition.findOrCreate = async function({ where }) {
  const existingDefinition = await this.findOne({ where });
  
  if (existingDefinition) {
    return [existingDefinition, false];
  }
  
  const newDefinition = await this.create(where);
  return [newDefinition, true];
};

Definition.create = async function(data) {
  const fields = Object.keys(data).join(", ");
  const placeholders = Object.keys(data).map(() => "?").join(", ");
  const values = Object.values(data);
  
  await sequelize.query(
    `INSERT INTO definition (${fields}) VALUES (${placeholders})`,
    values
  );
  
  // Récupérer l'ID inséré et retourner l'objet créé
  const insertId = await sequelize.getInsertId();
  return { id: insertId, ...data };
};

module.exports = Definition;