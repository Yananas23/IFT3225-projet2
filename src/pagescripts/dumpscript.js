// - dumpscript.js : script pour le modèle dump.ejs
document.addEventListener("DOMContentLoaded", function () {
    let table = new DataTable('#definitionsTable', {
      paging: true,             // Active la pagination
      pageLength: serverStep,           // Définit le nombre d'éléments par page
      lengthMenu: [5, 10, 20, 50, 100], // Options pour le nombre d'éléments par page
      searching: true,          // Active la barre de recherche
      info: true,               // Affiche les informations sur le nombre d'entrées
      stateSave: false,
    });
  });