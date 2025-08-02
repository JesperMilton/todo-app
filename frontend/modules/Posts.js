export default class Posts {
    static showAllposts() {
        const urlParams = new URLSearchParams(window.location.search);
        const listId = urlParams.get('listId');

        fetch(`api/lists/${listId}/posts`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = 'login.html';
                    }
                    throw new Error('Fetch failed');
                }
                return response.json();
            })
            .then(posts => {
                const container = document.getElementById("todo-list");
                let html = "";
                posts.forEach(post => {
                    html += `
                    <li class="todo">
                        <input type="checkbox" id="${post.id}" ${post.completed == 1 ? 'checked' : ''}>
                        <label class="custom-checkbox" for="${post.id}">
                            <svg fill="transparent" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                                <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                            </svg>
                        </label>
                        <label for="${post.id}" class="todo-text">
                            ${post.post_name}
                            <div class="post-details">
                                <span class="creator">Created by: ${post.display_name}</span>
                                <span class="karma-value">Karma: ${post.karma_value}</span>
                                <span>${post.completed_by_name}</span>
                            </div>
                        </label>
                        <button class="delete-button" data-post-id="${post.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                            </svg>
                        </button>
                    </li>
                    `;
                });
                container.innerHTML = html;

                document.querySelectorAll(".delete-button").forEach(button => {
                    button.addEventListener("click", function () {
                        const postId = this.getAttribute('data-post-id');
                        Posts.deletePost(postId);
                    });
                });

                document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.addEventListener('change', function () {
                        const postId = this.id;
                        const isCompleted = this.checked ? 1 : 0;

                        fetch(`api/posts/${postId}/complete`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                completed: isCompleted
                            })
                        })
                            .then(response => {
                                if (!response.ok) {
                                    if (response.status === 401) {
                                        window.location.href = 'login.html';
                                    }
                                    throw new Error('Fetch failed');
                                }
                                return response.json();
                            })
                            .then(data => {
                                if (data && data.success) {
                                    Posts.showAllposts();
                                }
                            })
                            .catch(error => {
                                console.log('Error updating post:', error);
                                this.checked = !this.checked;
                            });
                    });
                });
            })
            .catch(error => console.log(error));
    }

    static deletePost(postId) {
        fetch(`api/posts/${postId}/delete`, {
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
                this.showAllposts();
            })
            .catch(error => console.log('Error deleting post:', error));
    }
}