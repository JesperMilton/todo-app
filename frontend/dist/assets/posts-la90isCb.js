import{L as f}from"./Lists-C0fT-GpV.js";/* empty css              */class d{static showAllposts(){const o=new URLSearchParams(window.location.search).get("listId");fetch(`api/lists/${o}/posts`).then(a=>{if(!a.ok)throw a.status===401&&(window.location.href="login.html"),new Error("Fetch failed");return a.json()}).then(a=>{const i=document.getElementById("todo-list");let h="";a.forEach(t=>{h+=`
                    <li class="todo">
                        <input type="checkbox" id="${t.id}" ${t.completed==1?"checked":""}>
                        <label class="custom-checkbox" for="${t.id}">
                            <svg fill="transparent" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                                <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                            </svg>
                        </label>
                        <label for="${t.id}" class="todo-text">
                            ${t.post_name}
                            <div class="post-details">
                                <span class="creator">Created by: ${t.display_name}</span>
                                <span class="karma-value">Karma: ${t.karma_value}</span>
                                <span>${t.completed_by_name}</span>
                            </div>
                        </label>
                        <button class="delete-button" data-post-id="${t.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                            </svg>
                        </button>
                    </li>
                    `}),i.innerHTML=h,document.querySelectorAll(".delete-button").forEach(t=>{t.addEventListener("click",function(){const c=this.getAttribute("data-post-id");d.deletePost(c)})}),document.querySelectorAll('input[type="checkbox"]').forEach(t=>{t.addEventListener("change",function(){const c=this.id,m=this.checked?1:0;fetch(`api/posts/${c}/complete`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({completed:m})}).then(e=>{if(!e.ok)throw e.status===401&&(window.location.href="login.html"),new Error("Fetch failed");return e.json()}).then(e=>{e&&e.success&&d.showAllposts()}).catch(e=>{console.log("Error updating post:",e),this.checked=!this.checked})})})}).catch(a=>console.log(a))}static deletePost(s){fetch(`api/posts/${s}/delete`,{method:"POST"}).then(o=>{if(!o.ok)throw o.status===401&&(window.location.href="login.html"),new Error("Fetch failed");return o.json()}).then(o=>{this.showAllposts()}).catch(o=>console.log("Error deleting post:",o))}}var w=()=>{const s=new URLSearchParams(window.location.search).get("listId"),o=document.getElementById("listCon");d.showAllposts(),f.showSpecList(s,o),document.getElementById("inviteBtn").addEventListener("click",()=>{window.alert(`https://melab.lnu.se/~Jm224an/todo-app/api/lists/${s}/join`)});const i=document.getElementById("modal");document.getElementById("openBtn").addEventListener("click",()=>{i.classList.add("open")}),i.addEventListener("click",n=>{n.target===i&&c()}),document.getElementById("closeModalBtn").addEventListener("click",()=>{const n=document.getElementById("text-input").value.trim(),r=document.getElementById("number-input").value;n!==""&&(fetch(`api/lists/${s}/posts`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({post_name:n,karma_value:r})}).then(l=>{if(!l.ok)throw l.status===401&&(window.location.href="login.html"),new Error("Fetch failed");return l.json()}).then(l=>{document.getElementById("text-input").value="",document.getElementById("number-input").value=1,d.showAllposts()}).catch(l=>console.log(l)),c())});function c(){i.classList.remove("open")}const m=document.getElementById("openParBtn"),e=document.getElementById("leaderBoard"),u=document.getElementById("leaderBoardList");m.addEventListener("click",()=>{e.classList.add("open"),fetch(`api/${s}/leaderboard`).then(n=>{if(!n.ok)throw n.status===401&&(window.location.href="login.html"),new Error("Fetch failed");return n.json()}).then(n=>{let r="";n.forEach(l=>{r+=`
                <li>${l.display_name}, ${l.total_karma}</li>
            `}),u.innerHTML=r})}),e.addEventListener("click",n=>{console.log(n.target),n.target===e&&p()});function p(){e.classList.remove("open")}};w();
