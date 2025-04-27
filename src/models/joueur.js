// - joueur.js : Modèle pour gérer les joueurs avec des fonctions de recherche, création et mise à jour.
const sequelize = require("../config/database");

// Création d'un modèle "joueur" avec l'émulation PHPBridge
const Joueur = sequelize.define("joueur", {
  id: "INTEGER",
  pseudo: "STRING",
  password: "STRING",
  game: "INTEGER",
  win: "INTEGER",
  score: "INTEGER",
  loged: "DATE",
  admin: "BOOLEAN"
});

// Méthodes spécifiques pour le modèle Joueur
Joueur.findOne = async function({ where }) {
  const results = await sequelize.query(
    `SELECT * FROM joueur WHERE ${Object.keys(where)[0]} = ?`, 
    [Object.values(where)[0]]
  );
  return results.length > 0 ? results[0] : null;
};

Joueur.findAll = async function(conditions = {}) {
  try{
    let sql = "SELECT * FROM joueur";
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
    console.error("Erreur dans Joueur.findAll:", error);
    return null;
  }
};

Joueur.create = async function(data) {
  const fields = Object.keys(data).join(", ");
  const placeholders = Object.keys(data).map(() => "?").join(", ");
  const values = Object.values(data);
  
  await sequelize.query(
    `INSERT INTO joueur (${fields}) VALUES (${placeholders})`,
    values
  );
  
  // Récupérer l'ID inséré et retourner l'objet créé
  const insertId = await sequelize.getInsertId();
  return { id: insertId, ...data };
};

Joueur.update = async function(updates, conditions) {
  const sets = Object.keys(updates).map(key => `${key} = ?`).join(", ");
  const values = [...Object.values(updates)];
  
  let sql = `UPDATE joueur SET ${sets}`;
  
  if (conditions && conditions.where) {
    sql += ' WHERE ';
    const clauses = [];
    
    for (const [key, value] of Object.entries(conditions.where)) {
      clauses.push(`${key} = ?`);
      values.push(value);
    }
    
    sql += clauses.join(' AND ');
  }
  
  return sequelize.query(sql, values);
};

module.exports = Joueur;