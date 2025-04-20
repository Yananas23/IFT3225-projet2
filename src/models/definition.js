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
  try {
    const key = Object.keys(where)[0];
    const value = Object.values(where)[0];
    
    const results = await sequelize.query(
      `SELECT * FROM definition WHERE ${key} = ?`, 
      [value]
    );
    
    return results && results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("Erreur dans Definition.findOne:", error);
    return null;
  }
};

Definition.findAll = async function(conditions = {}) {
  try{
    let sql = "SELECT * FROM definition";
    const params = [];
    
    if (conditions.where) {
      sql += ' WHERE ';
      const clauses = [];
      
      for (const [key, value] of Object.entries(conditions.where)) {
        clauses.push(`${key} = ?`);
        params.push(value);
      }
      
      sql += clauses.join(' AND ');
    }
    
    return await sequelize.query(sql, params);
  } catch (error) {
    console.error("Erreur dans Definition.findAll:", error);
    return null;
  }
};

Definition.findOrCreate = async function({ where }) {
  try {
    // D'abord, essayez de trouver l'enregistrement
    const existingRecord = await this.findOne({ where });
    
    // Si trouvé, retournez-le dans un tableau (pour compatibilité avec Sequelize)
    if (existingRecord) {
      return [existingRecord, false]; // false indique qu'il n'a pas été créé
    }
    
    // Sinon, créez un nouvel enregistrement
    const newRecord = await this.create(where);
    return [newRecord, true]; // true indique qu'il a été créé
  } catch (error) {
    console.error("Erreur dans findOrCreate:", error);
    throw error;
  }
};

Definition.create = async function(data) {
  const fields = Object.keys(data).join(", ");
  const placeholders = Object.keys(data).map(() => "?").join(", ");
  const values = Object.values(data);

  // Insertion
  await sequelize.query(
    `INSERT INTO definition (${fields}) VALUES (${placeholders})`,
    values
  );

  // Requête pour récupérer l'ID du dernier élément inséré avec ces valeurs
  const whereClause = Object.keys(data)
    .map(field => `${field} = ?`)
    .join(" AND ");

  const selectQuery = `
    SELECT id FROM definition 
    WHERE ${whereClause} 
    ORDER BY id DESC 
    LIMIT 1
  `;

  const results = await sequelize.query(selectQuery, values);

  const insertId = results?.data[0]['id'];

  return { id: insertId, ...data };
};


module.exports = Definition;