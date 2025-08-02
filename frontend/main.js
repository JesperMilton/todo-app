import Lists from "./modules/Lists.js";

var main = () => {

  Lists.showAllLists();

  const createListBtn = document.getElementById("createListBtn");

  createListBtn.addEventListener("click", () => {
    const listName = document.getElementById("input-box").value.trim();
    if (listName === '') return;

    fetch('api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list_name: listName })
    })
      .then(response => {
        if (response.status === 401) {
          window.location.href = 'login.html';
          return;
        }
        
        if (!response.ok) {
          throw new Error('Error creating list');
        }

        return response.json();
      }).then(data => {
        document.getElementById('input-box').value = '';
          Lists.showAllLists();
        
      })
      .catch(error => console.log(error));
  });
}
main();

