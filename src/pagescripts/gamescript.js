let word = wordFromServer;  // Mot à deviner
let score = scoreFromServer;  // Score actuel
let timeRemaining = timeLimitFromServer;  // Temps initial du jeu
let guessedLetters = [];  // Tableau pour les lettres déjà devinées    
let hintIntervalTime = hintIntervalTimeFromServer;

const allSuggestions = allServerSuggestions;

let hintRevealed = false;
let suggestionsVisible = false;

function isWordFullyRevealed() {
    for (let i = 0; i < word.length; i++) {
        if (!guessedLetters.includes(word[i])) {
            return false;
        }
    }
    return true;
}

// Affiche le mot avec les lettres déjà devinées
function updateWordDisplay() {
    let wordDisplay = '';
    for (let i = 0; i < word.length; i++) {
        if (guessedLetters.includes(word[i])) {
            wordDisplay += `<span class="letter">${word[i]}</span>`;
        } else {
            wordDisplay += `<span class="letter">_</span>`;
        }
    }
    document.getElementById('wordDisplay').innerHTML = wordDisplay;
}

document.getElementById("replayBtn").addEventListener("click", function() {
    location.reload();
});

// Met à jour le score et affiche un message si le mot est trouvé
function updateScoreAndCheckWin(letter) {
    letter = letter.toLowerCase();  // Convertir la lettre devinée en minuscule
    console.log(`Lettre devinée : "${letter}"`);  // Affiche la lettre devinée
    if (word.includes(letter)) {
        score += 5;
        guessedLetters.push(letter);
    } else if(score >= 5) {
        score -= 5;
    }        

    // Met à jour le score
    document.getElementById('score').textContent = score;

    if (suggestionsVisible) {
        updateSuggestionList();
    }

    // Vérifie si le joueur a trouvé le mot
    if (isWordFullyRevealed()) {
        // Afficher le message de victoire
        showGameResult("Félicitations ! Vous avez trouvé le mot.");
        clearInterval(timerInterval); // Arrêter le timer
        clearInterval(hintInterval);  // Arrêter la révélation des indices
        // Désactivation du formulaire et du bouton
        const form = document.getElementById("guessForm");
        const button = form.querySelector("button[type='submit']");
        button.disabled = true;
    }
}

// Fonction pour révéler une lettre inconnue toutes les X secondes
function revealHint() {
    let hiddenLetters = [];  // Tableau des indices des lettres non devinées
    for (let i = 0; i < word.length; i++) {
        if (!guessedLetters.includes(word[i])) {
            hiddenLetters.push(i);
        }
    }

    // Si il y a des lettres non devinées, on en révèle une aléatoirement
    if (hiddenLetters.length > 0) {
        const randomIndex = hiddenLetters[Math.floor(Math.random() * hiddenLetters.length)];
        const letterToReveal = word[randomIndex];
        guessedLetters.push(letterToReveal);  // Ajouter cette lettre à la liste des lettres devinées
        if(score >= 10) {
            score -= 10;  // Réduire le score de 10 points à chaque indice révélé
        }

        if (!hintRevealed) {
            hintRevealed = true;
            document.getElementById('suggestionIcon').style.display = 'block';
        }

        updateWordDisplay();  // Mettre à jour l'affichage
        if (suggestionsVisible) {
            updateSuggestionList();  // mettre à jour aussi après un indice révélé
        }
        document.getElementById('score').textContent = score;  // Mettre à jour l'affichage du score
        console.log(`Indice révélé : ${letterToReveal}, Score réduit de 10 points.`);

        // Vérifier si le mot est maintenant complet après avoir révélé une lettre
        if (isWordFullyRevealed()) {
            // Afficher le message de victoire
            showGameResult("Félicitations ! Vous avez trouvé le mot.");
            clearInterval(timerInterval); // Arrêter le timer
            clearInterval(hintInterval);  // Arrêter la révélation des indices
            // Désactivation du formulaire et du bouton
            const form = document.getElementById("guessForm");
            const button = form.querySelector("button[type='submit']");
            button.disabled = true;
        }
    }
}

// Fonction pour afficher le résultat du jeu
function showGameResult(message) {
    const resultMessage = document.getElementById('resultMessage');
    const gameResult = document.getElementById('gameResults');
    const finalScore = document.getElementById('finalScore');

    resultMessage.textContent = message;  // Mettre à jour le message de résultat
    finalScore.textContent = score;  // Afficher le score final

    // Afficher la section du résultat
    gameResult.style.display = 'block';
}

const hintInterval = setInterval(revealHint, hintIntervalTime * 1000);  // Révéler une lettre toutes les hintIntervalTime secondes

// Gestion de la soumission du formulaire
document.getElementById('guessForm').addEventListener('submit', function(e) {
    e.preventDefault();  // Empêcher l'envoi du formulaire

    const letterInput = document.getElementById('letter');
    let letter = letterInput.value.trim().toLowerCase();  // Convertir la lettre saisie en minuscule

    if (letter && letter.length === 1 && !guessedLetters.includes(letter)) {
        updateScoreAndCheckWin(letter);
        updateWordDisplay();
    } else {
        alert("Veuillez entrer une lettre valide qui n'a pas encore été devinée.");
    }

    // Effacer l'input après chaque tentative
    letterInput.value = '';
    letterInput.focus();
});

const timerDisplay = document.getElementById('timer');
const timerInterval = setInterval(function() {
    timeRemaining--;
    timerDisplay.innerHTML = `⏳ Temps restant : <strong>${timeRemaining}</strong> secondes`;        

    // Fin du temps
    if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        timerDisplay.innerHTML = "⏰ Temps écoulé !";
        timerDisplay.style.color = "gray";

        // Désactivation du formulaire à la fin du temps
        const form = document.getElementById("guessForm");
        const button = form.querySelector("button[type='submit']");
        button.disabled = true;
        // Afficher le message de fin de partie
        showGameResult("Temps écoulé ! Vous avez perdu !");
        clearInterval(hintInterval);  // Arrêter la révélation des indices
    }
}, 1000);

function updateSuggestionList() {
    const listContainer = document.getElementById("suggestionList");
    listContainer.innerHTML = "";

    const lowerCaseWord = word.toLowerCase();
    const revealedPattern = word.split("").map((char, idx) =>
        guessedLetters.includes(char) ? char : null
    );

    // Filtrer les suggestions
    const filteredSuggestions = allSuggestions
        .map(w => w.toLowerCase())
        .filter(w =>
            w.length === word.length &&  // même longueur
            revealedPattern.every((char, idx) => !char || w[idx] === char)  // lettres connues aux bonnes positions
        );

    // Retirer le mot cible s’il est dans la liste
    const withoutTarget = filteredSuggestions.filter(w => w !== lowerCaseWord);

    // On sélectionne jusqu’à 4 suggestions + le mot cible (5 max)
    const selected = withoutTarget.slice(0, 4);
    selected.push(lowerCaseWord);

    // Mélanger les suggestions finales
    const finalSuggestions = selected.sort(() => Math.random() - 0.5);

    // Afficher les suggestions
    finalSuggestions.forEach(w => {
        const li = document.createElement("li");
        li.textContent = w;
        listContainer.appendChild(li);
    });
}

document.getElementById("suggestionIcon").addEventListener("click", function () {
    if (suggestionsVisible) return;

    if (score >= 20) {
        score -= 20;
        document.getElementById('score').textContent = score;
        suggestionsVisible = true;
        document.getElementById('suggestionBox').style.display = 'block';
        updateSuggestionList();
    } else {
        alert("Score insuffisant pour afficher des mots possibles!");
    }
});

// Initialiser l'affichage du mot
updateWordDisplay();