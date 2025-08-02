import Posts from "./modules/Posts.js";
import Lists from "./modules/Lists.js";

var main = () => {

  const urlParams = new URLSearchParams(window.location.search);
  const listId = urlParams.get('listId');
  const listCon = document.getElementById("listCon");

  Posts.showAllposts();
  Lists.showSpecList(listId, listCon);

  const inviteBtn = document.getElementById("inviteBtn");

  inviteBtn.addEventListener("click", () => {
    window.alert(`https://melab.lnu.se/~Jm224an/todo-app/api/lists/${listId}/join`)
  });

  const modal = document.getElementById('modal');
  const openBtn = document.getElementById('openBtn');

  openBtn.addEventListener('click', () => {
    modal.classList.add('open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  const closeBtn = document.getElementById('closeModalBtn');

  closeBtn.addEventListener('click', () => {
    const postName = document.getElementById('text-input').value.trim();
    const karmaValue = document.getElementById('number-input').value;
    if (postName === '') return;

    fetch(`api/lists/${listId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_name: postName,
        karma_value: karmaValue
      })
    }).then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = 'login.html';
        }
        throw new Error('Fetch failed');
      }
      return response.json();
    })
      .then(data => {
        document.getElementById('text-input').value = '';
        document.getElementById('number-input').value = 1;
        Posts.showAllposts();

      })
      .catch(error => console.log(error));

    closeModal();
  });


  function closeModal() {
    modal.classList.remove('open');
  }

  const parBtn = document.getElementById("openParBtn");
  const leaderBoard = document.getElementById("leaderBoard");
  const leaderBoardList = document.getElementById("leaderBoardList");

  parBtn.addEventListener('click', () => {
    leaderBoard.classList.add('open');
    fetch(`api/${listId}/leaderboard`)
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = 'login.html';
          }
          throw new Error('Fetch failed');
        }
        return response.json();
      })
      .then(users => {
        let html = "";
        users.forEach(user => {
          html += `
                <li>${user.display_name}, ${user.total_karma}</li>
            `;
        });
        leaderBoardList.innerHTML = html;
      })

  });

  leaderBoard.addEventListener('click', (e) => {
    console.log(e.target);
    if (e.target === leaderBoard) {
      closeLModal();
    }
  });

  function closeLModal() {
    leaderBoard.classList.remove('open');
  }
}
main();