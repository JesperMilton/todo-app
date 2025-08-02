export default class Lists {



    
    static showAllLists() {
        fetch('api/lists')
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = 'login.html';
                    }
                    throw new Error('Fetch failed');
                }
                return response.json();
            })
            .then(lists => {
                const container = document.getElementById('listsContainer');
                container.innerHTML = '';
                lists.forEach(list => {
                    const link = document.createElement('a');
                    link.href = `posts.html?listId=${list.id}`;
                    link.innerHTML = `
                    <div class="listItem">
                        <div class="info">
                            <h1>${list.list_name}</h1>
                            <p>${list.display_name}</p>
                        </div>
                        <button class="delete-button" data-list-id="${list.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                        </svg>
                        </button>
                        </div>
                    `;
                    link.style.display = 'block';
                    container.appendChild(link);
                });
                document.querySelectorAll(".delete-button").forEach(button => {
                    button.addEventListener("click", function (event) {
                        event.stopPropagation();
                        event.preventDefault();
                        const listId = this.getAttribute('data-list-id');
                        Lists.deleteList(listId);
                    })
                });
            })
            .catch(error => console.log(error));
    }

    static deleteList(listId) {
        fetch(`api/lists/${listId}/delete`, {
            method: 'POST'
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
                this.showAllLists();
            })
            .catch(error => console.log('Error deleting lsit:', error));
    }

    static showSpecList(listId, container) {
        fetch(`api/lists/${listId}`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = 'login.html';
                    }
                    throw new Error('Fetch failed');
                }
                return response.json();
            })
            .then(list => {
                container.innerHTML = '';
                container.innerHTML = `
                    <div class="listItem">
                        <div class="info">
                            <h1>${list.list_name}</h1>
                            <p>Created by: ${list.display_name}</p>
                        </div>
                    </div>
                    `;
            });
    }
}