const axios = require("axios");
require("dotenv").config();

// Créer une classe qui émule certaines fonctionnalités de Sequelize
class PHPBridge {
  constructor() {
    const endpoint = process.env.ENDPOINT || '/';
    this.endpoint = `${endpoint}db-bridge.php`;
    this.models = {};
  }

  async authenticate() {
    try {
      // Tester la connexion via le pont PHP
      const response = await axios.post(`${this.endpoint}?action=test`);
      if (response.data.success) {
        return true;
      }
      throw new Error(response.data.error || "Échec de l'authentification");
    } catch (error) {
      throw error;
    }
  }

  async query(sql, params = []) {
    try {
        const processedParams = params.map(param => {
        if (!isNaN(param)) {
            return Number(param);
        }
        return param;
      });
      
      const response = await axios.post(`${this.endpoint}?action=query`, {
          sql,
          params: processedParams
      });
      
      return response.data;
    } catch (error) {
        console.error("Erreur de requête SQL:", sql, params, error);
        return { data: [] }; // Retourner un objet avec data vide en cas d'erreur
    }
  }

  // Méthode pour obtenir l'ID inséré
  async getInsertId() {
    try {
      const response = await axios.post(`${this.endpoint}?action=lastInsertId`);
      return response.data.insertId;
    } catch (error) {
      throw error.response?.data?.error || error;
    }
  }

  async sync() {
    return true;
  }

  define(modelName, attributes, options) {
    const model = {
      tableName: modelName,
      attributes,
      options,
      
      findAll: async (conditions = {}) => {
        let sql = `SELECT * FROM ${modelName}`;
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
        let result = this.query(sql, params);
        return result.data;
      },
      
      findOne: async (conditions = {}) => {
        const results = await model.findAll(conditions);
        return results.length > 0 ? results[0] : null;
      },
      
      create: async (data) => {
        const fields = Object.keys(data).join(", ");
        const placeholders = Object.keys(data).map(() => "?").join(", ");
        const values = Object.values(data);
        
        const response = await this.query(
            `INSERT INTO ${modelName} (${fields}) VALUES (${placeholders})`,
            values
        );
        
        // Récupérer l'ID depuis la réponse de la requête
        const insertId = response.insertId || 0;
        return { id: insertId, ...data };
      },
      
      update: async (data, conditions) => {
        const sets = Object.keys(data).map(key => `${key} = ?`).join(", ");
        const values = [...Object.values(data)];
        
        let sql = `UPDATE ${modelName} SET ${sets}`;
        
        if (conditions && conditions.where) {
          sql += ' WHERE ';
          const clauses = [];
          
          for (const [key, value] of Object.entries(conditions.where)) {
            clauses.push(`${key} = ?`);
            values.push(value);
          }
          
          sql += clauses.join(' AND ');
        }

        let result = this.query(sql, values)
        return result.data;
      },
      
      destroy: async (conditions) => {
        let sql = `DELETE FROM ${modelName}`;
        const params = [];
        
        if (conditions && conditions.where) {
          sql += ' WHERE ';
          const clauses = [];
          
          for (const [key, value] of Object.entries(conditions.where)) {
            clauses.push(`${key} = ?`);
            params.push(value);
          }
          
          sql += clauses.join(' AND ');
        }
        
        let result = this.query(sql, params);
        return result.data;
      }
    };
    
    this.models[modelName] = model;
    return model;
  }
}

const sequelize = new PHPBridge();

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion à MySQL réussie via le pont PHP !");
    console.log(`Base de données: ${process.env.DB_NAME}`);
  } catch (error) {
    console.error("❌ Erreur de connexion :", error);
  }
}

testConnection();

module.exports = sequelize;