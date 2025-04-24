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
  try {
    const key = Object.keys(where)[0];
    const value = Object.values(where)[0];
    
    const results = await sequelize.query(
      `SELECT * FROM word WHERE ${key} = ?`, 
      [value]
    );
    
    // Toujours vérifier si results existe et a au moins un élément
    return results && results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("Erreur dans Word.findOne:", error);
    return null;
  }
}

Word.findAll = async function(options = {}) {
  try{
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
  } catch (error) {
    console.error("Erreur dans Word.findAll:", error);
    return null;
  }
};

Word.findOrCreate = async function({ where }) {
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

Word.create = async function(data) {
  const fields = Object.keys(data).join(", ");
  const placeholders = Object.keys(data).map(() => "?").join(", ");
  const values = Object.values(data);

  // Insertion
  await sequelize.query(
    `INSERT INTO word (${fields}) VALUES (${placeholders})`,
    values
  );

  // Générer la clause WHERE pour retrouver l'élément inséré
  const whereClause = Object.keys(data)
    .map(field => `${field} = ?`)
    .join(" AND ");

  const selectQuery = `
    SELECT id FROM word 
    WHERE ${whereClause} 
    ORDER BY id DESC 
    LIMIT 1
  `;

  const results = await sequelize.query(selectQuery, values);

  const insertId = results?.data[0]['id'];

  return { id: insertId, ...data };
};

Word.FindSuggestions = async function (targetWord, lang, maxResults = 100) {
  try {
    // Récupération de tous les mots qui ne sont pas égaux au mot cible
    const results = await sequelize.query(
      `SELECT word FROM word WHERE lang = ? AND word != ?`,
      [lang, targetWord]
    );
    
    const allWords = results?.data.map(row => row.word) || [];

    let lowercaseTargetWord = targetWord.toLowerCase();

    // Fonction pour vérifier si deux mots ont des lettres communes aux mêmes positions
    function countMatchingLettersAtSamePosition(a, b) {
      let count = 0;
      for (let i = 0; i < a.length; i++) {
        if (a[i] === b[i]) {
          count++;
        }
      }
      return count;
    }

    // Filtrer les mots qui ont la même longueur et qui partagent des lettres aux mêmes positions
    const filteredWords = allWords
      .filter(word => word.length === targetWord.length)  // Filtrer les mots de même longueur
      .map(word => ({
        word: word.toLowerCase(),
        score: countMatchingLettersAtSamePosition(word, targetWord) // Calculer le nombre de lettres communes aux mêmes positions
      }))
      .filter(item => item.score > 0) // On garde seulement ceux avec ≥1 lettre en commun au même emplacement
      .sort((a, b) => b.score - a.score) // Trier par pertinence
      .map(item => item.word) // Garder uniquement les mots
      .slice(0, maxResults); // Limiter le nombre de résultats

    if (filteredWords.length === 0) {
      return allWords.slice(0, maxResults).map(word => word.toLowerCase()); // Si rien trouvé, retourner quelques mots aléatoires en minuscule
    }

    return filteredWords;
  } catch (error) {
    console.error("Erreur dans FindSuggestions:", error);
    return [];
  }
};

/*
Word.FindSuggestions = async function (word, lang, letterList = []) {
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // échange
    }
    return array;
  }

  const regex = await Word.regex(word, letterList);
  let values = [regex, lang, word];
  let suggestions;

  const selectQuery = `
    SELECT * FROM word 
    WHERE word 
    COLLATE utf8mb4_general_ci 
    REGEXP ?
    AND lang = ? 
    AND not word = ?
  `;

  let results = await sequelize.query(selectQuery, values);
  results = results?.data;

  const words = results.map(item => item.word);

  const shuffleWords = shuffleArray(words);
  if (shuffleWords.length > 4){
    const reducedShuffle = shuffleWords.slice(0, 4);
    suggestion = shuffleArray(reducedShuffle);  
  } else {
    suggestion = shuffleArray(shuffleWords); 
  }

  return suggestions;
}
*/

Word.regex = async function (word, letterList = []) {
  let regex = "^";
  let gap = 0;

  for (let i = 0; i < word.length; i++) {
    const letter = word[i];
    if (letterList.includes(letter)) {
      if (i > 0) {
        regex += ".{" + gap + "}";
        gap = 0;
      }
      regex += letter;
    } else {
      gap += 1;
    }
  }

  if (gap > 0) {
    regex += ".{" + gap + "}";
  }
  
  regex += "$";
  return regex;
}

module.exports = Word;