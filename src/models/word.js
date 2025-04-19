// word.js adapté pour PHPBridge
const sequelize = require("../config/database");

// Création d'un modèle "word" avec l'émulation PHPBridge
const Word = sequelize.define("word", {
  id: "INTEGER",
  word: "STRING",
  lang: "STRING"
});

// Méthodes spécifiques pour le modèle Word
Word.findOne = async function({ where }) {
  const results = await sequelize.query(
    `SELECT * FROM word WHERE ${Object.keys(where)[0]} = ?`, 
    [Object.values(where)[0]]
  );
  return results.length > 0 ? results[0] : null;
};

Word.findAll = async function(options = {}) {
  let sql = "SELECT * FROM word";
  const params = [];
  
  if (options.where) {
    sql += " WHERE ";
    const clauses = [];
    
    for (const [key, value] of Object.entries(options.where)) {
      clauses.push(`${key} = ?`);
      params.push(value);
    }
    
    sql += clauses.join(" AND ");
  }
  
  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }
  
  if (options.offset !== undefined) {
    sql += ` OFFSET ${options.offset}`;
  }
  
  return sequelize.query(sql, params);
};

Word.findOrCreate = async function({ where }) {
  const existingWord = await this.findOne({ where });
  
  if (existingWord) {
    return [existingWord, false];
  }
  
  const newWord = await this.create(where);
  return [newWord, true];
};

Word.create = async function(data) {
  const fields = Object.keys(data).join(", ");
  const placeholders = Object.keys(data).map(() => "?").join(", ");
  const values = Object.values(data);
  
  await sequelize.query(
    `INSERT INTO word (${fields}) VALUES (${placeholders})`,
    values
  );
  
  // Récupérer l'ID inséré et retourner l'objet créé
  const insertId = await sequelize.getInsertId();
  return { id: insertId, ...data };
};

module.exports = Word;