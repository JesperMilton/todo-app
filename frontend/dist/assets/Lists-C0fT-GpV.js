(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))e(t);new MutationObserver(t=>{for(const r of t)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&e(s)}).observe(document,{childList:!0,subtree:!0});function o(t){const r={};return t.integrity&&(r.integrity=t.integrity),t.referrerPolicy&&(r.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?r.credentials="include":t.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function e(t){if(t.ep)return;t.ep=!0;const r=o(t);fetch(t.href,r)}})();class n{static showAllLists(){fetch("api/lists").then(i=>{if(!i.ok)throw i.status===401&&(window.location.href="login.html"),new Error("Fetch failed");return i.json()}).then(i=>{const o=document.getElementById("listsContainer");o.innerHTML="",i.forEach(e=>{const t=document.createElement("a");t.href=`posts.html?listId=${e.id}`,t.innerHTML=`
                    <div class="listItem">
                        <div class="info">
                            <h1>${e.list_name}</h1>
                            <p>${e.display_name}</p>
                        </div>
                        <button class="delete-button" data-list-id="${e.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f">
                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                        </svg>
                        </button>
                        </div>
                    `,t.style.display="block",o.appendChild(t)}),document.querySelectorAll(".delete-button").forEach(e=>{e.addEventListener("click",function(t){t.stopPropagation(),t.preventDefault();const r=this.getAttribute("data-list-id");n.deleteList(r)})})}).catch(i=>console.log(i))}static deleteList(i){fetch(`api/lists/${i}/delete`,{method:"POST"}).then(o=>{if(!o.ok)throw o.status===401&&(window.location.href="login.html"),new Error("Fetch failed");return o.json()}).then(o=>{this.showAllLists()}).catch(o=>console.log("Error deleting lsit:",o))}static showSpecList(i,o){fetch(`api/lists/${i}`).then(e=>{if(!e.ok)throw e.status===401&&(window.location.href="login.html"),new Error("Fetch failed");return e.json()}).then(e=>{o.innerHTML="",o.innerHTML=`
                    <div class="listItem">
                        <div class="info">
                            <h1>${e.list_name}</h1>
                            <p>Created by: ${e.display_name}</p>
                        </div>
                    </div>
                    `})}}export{n as L};
