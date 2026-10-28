(() => {
  const API = window.VibelyAPI;
  const app = document.getElementById("app");
  const toastRegion = document.getElementById("toast-region");
  const state = { user: null, page: "home", feed: [], pageNumber: 1, hasMore: false, search: "", profile: null, notifications: [], selectedImage: null };
  const fallbackAvatars = ["#e5ddff", "#d9f5f2", "#ffe2ed", "#fff0d5", "#e2e9ff"];
  const initials = name => String(name || "V").split(/\s+/).slice(0, 2).map(s => s[0] || "").join("").toUpperCase();
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const avatar = (user, size = "") => `<div class="avatar ${size}">${user?.avatar ? `<img src="${escapeHTML(user.avatar)}" alt="">` : escapeHTML(initials(user?.name || user?.username))}</div>`;
  const icon = (name, cls = "") => `<i data-lucide="${name}"${cls ? ` class="${cls}"` : ""}></i>`;
  const dateLabel = value => {
    const date = new Date(value); if (Number.isNaN(date.getTime())) return "just now";
    const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now"; if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`; if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  const toast = (message, error = false) => {
    const el = document.createElement("div"); el.className = `toast${error ? " error" : ""}`; el.textContent = message;
    toastRegion.appendChild(el); setTimeout(() => el.remove(), 3200);
  };
  const refreshIcons = () => { if (window.lucide) window.lucide.createIcons(); };
  const run = async fn => { try { await fn(); } catch (error) { if (error.status === 401) { state.user = null; renderAuth("login"); } else toast(error.message || "Something went wrong.", true); } };
  const navItems = [
    ["home","house","Home"],["discover","compass","Discover"],["profile","user-round","My Profile"],["notifications","bell","Notifications"]
  ];
  function shell(content, title = "Your feed", subtitle = "A little inspiration for your day") {
    app.innerHTML = `<div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#" data-nav="home"><span class="brand-mark">v</span><span>vibely<em>.</em></span></a>
        <nav class="nav-list">${navItems.map(([id,ic,label]) => `<button class="nav-item ${state.page===id?"active":""}" data-nav="${id}">${icon(ic)}<span>${label}</span></button>`).join("")}</nav>
        <div class="nav-bottom"><button class="new-post-btn" data-action="focus-composer">${icon("plus")} &nbsp; Create a post</button>
          <div class="current-user-mini" data-nav="profile">${avatar(state.user,"small")}<div class="user-info"><strong>${escapeHTML(state.user.name)}</strong><small>@${escapeHTML(state.user.username)}</small></div>${icon("ellipsis")}</div>
          <button class="nav-item" data-action="logout">${icon("log-out")}<span>Log out</span></button>
        </div>
      </aside>
      <section class="main-column">
        <header class="topbar"><div class="page-heading"><h1>${escapeHTML(title)}</h1><p>${escapeHTML(subtitle)}</p></div>
          <div class="top-actions"><button class="icon-btn" data-nav="discover" aria-label="Search">${icon("search")}</button><button class="icon-btn" data-nav="notifications" aria-label="Notifications">${icon("bell")}</button></div>
        </header>
        ${content}
      </section>
      <aside class="right-column">
        <label class="search-box">${icon("search")}<input id="global-search" placeholder="Search people..." value="${escapeHTML(state.search)}"></label>
        <section class="card section-card"><div class="section-head"><h3>People to know</h3><a href="#" data-nav="discover">See all</a></div><div id="suggestions" class="suggested-list"><span class="muted">Finding your people…</span></div></section>
        <section class="card section-card"><div class="section-head"><h3>Community notes</h3>${icon("sparkles")}</div>
          <div class="trend"><span class="trend-number">01</span><div><strong>Make it meaningful</strong><small>Good conversations start with curiosity.</small></div></div>
          <div class="trend"><span class="trend-number">02</span><div><strong>Show up as you are</strong><small>Your corner of the internet, your way.</small></div></div>
          <div class="trend"><span class="trend-number">03</span><div><strong>Find your people</strong><small>Follow creators who inspire you.</small></div></div>
        </section><div class="footer-links"><span>About</span><span>Guidelines</span><span>Privacy</span><span>© Vibely 2026</span></div>
      </aside>
    </div><nav class="mobile-nav">${navItems.map(([id,ic,label])=>`<button class="${state.page===id?"active":""}" data-nav="${id}">${icon(ic)}<span>${label}</span></button>`).join("")}<button data-action="focus-composer">${icon("plus")}<span>Create</span></button></nav>`;
    refreshIcons(); loadSuggestions();
  }
  function renderAuth(mode = "login", errorText = "") {
    state.page = mode;
    app.innerHTML = `<div class="auth-page"><section class="auth-art">
      <a class="brand" href="#"><span class="brand-mark">v</span><span>vibely<em>.</em></span></a>
      <div><h1>Your people.<br>Your moments.<br><span>Your space.</span></h1><p>A little corner of the internet for the things you love and the people who get it.</p>
        <div class="floating-demo"><div style="display:flex;align-items:center;gap:10px">${avatar({name:"Maya Chen"},"small")}<div><strong style="font-size:12px">Maya Chen</strong><div style="color:#999db0;font-size:10px;margin-top:3px">@mayamakes</div></div><span style="margin-left:auto;color:#7157e8">✦</span></div><div class="demo-line"></div><div class="demo-line short"></div><div style="display:flex;gap:14px;color:#999db0;font-size:11px;margin-top:17px">♡ 128 &nbsp; ◯ 24 comments</div></div>
      </div><small style="color:#969bb0">A kinder kind of social · Made for connection</small></section>
      <section class="auth-form-side"><form id="auth-form" class="auth-form"><h2>${mode==="register"?"Create your space":"Welcome back"}</h2><p>${mode==="register"?"Your people are out there. Let's find them.":"Good to see you again. Pick up where you left off."}</p>
        ${mode==="register"?`<div class="field"><label for="name">Full name</label><input id="name" name="name" autocomplete="name" required maxlength="60" placeholder="e.g. Maya Chen"></div><div class="field"><label for="username">Username</label><input id="username" name="username" autocomplete="username" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_.]+" placeholder="yourname"></div><div class="field"><label for="email">Email address</label><input id="email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"></div>`:`<div class="field"><label for="login">Email or username</label><input id="login" name="login" autocomplete="username" required placeholder="you@example.com"></div>`}
        <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="${mode==="register"?"new-password":"current-password"}" minlength="8" required placeholder="At least 8 characters"></div>
        ${errorText?`<div class="form-error">${escapeHTML(errorText)}</div>`:""}<button class="primary-btn" type="submit">${mode==="register"?"Create account":"Log in"} &nbsp; ${icon("arrow-right")}</button>
        <div class="auth-switch">${mode==="register"?"Already have an account?":"New to Vibely?"} <button type="button" data-action="switch-auth">${mode==="register"?"Log in":"Create an account"}</button></div></form></section></div>`;
    refreshIcons();
    document.getElementById("auth-form").addEventListener("submit", async e => {
      e.preventDefault(); const form = new FormData(e.currentTarget); const button = e.currentTarget.querySelector("button[type=submit]");
      button.disabled = true; button.textContent = "Please wait…";
      try {
        const payload = Object.fromEntries(form.entries());
        const result = mode === "register" ? await API.post("/auth/register", payload) : await API.post("/auth/login", payload);
        state.user = result.user; state.page = "home"; await loadHome();
      } catch (error) { renderAuth(mode, error.message); }
    });
  }
  function renderPost(post) {
    const author = post.author || {};
    const liked = !!post.isLiked;
    return `<article class="card post-card" data-post="${post._id}">
      <header class="post-header">${avatar(author)}<div class="post-author"><strong>${escapeHTML(author.name || "Vibely member")}</strong><small>@${escapeHTML(author.username || "member")} · ${dateLabel(post.createdAt)}</small></div>
      ${String(author._id || author.id)===String(state.user.id) || String(author._id)===String(state.user.id) ? `<button class="post-menu" data-action="post-menu" data-id="${post._id}" aria-label="Post options">${icon("ellipsis")}</button>`:""}</header>
      ${post.text?`<p class="post-copy">${escapeHTML(post.text)}</p>`:""}
      ${post.imageUrl?`<img class="post-image" src="${escapeHTML(post.imageUrl)}" alt="Post attachment" loading="lazy">`:""}
      <div class="post-actions"><button class="post-action ${liked?"liked":""}" data-action="like" data-id="${post._id}">${icon("heart")}<span>${post.likesCount ?? post.likes?.length ?? 0}</span></button>
        <button class="post-action comments-action" data-action="comments" data-id="${post._id}">${icon("message-circle")}<span>${post.commentsCount ?? 0} comments</span></button>
        <span class="post-time">${dateLabel(post.createdAt)}</span></div></article>`;
  }
  function storyStrip() {
    const names = ["Your story","Ava","Jordan","Maya","Leo","Sofia"];
    return `<div class="stories">${names.map((name,i)=>`<div class="story"><div class="story-ring"><div class="avatar" style="background:${fallbackAvatars[i%fallbackAvatars.length]}">${i===0?icon("plus"):escapeHTML(name[0])}</div></div><span>${name}</span></div>`).join("")}</div>`;
  }
  function composer() {
    return `<section class="card composer" id="composer"><div class="composer-top">${avatar(state.user)}<textarea id="post-text" maxlength="1800" placeholder="What's on your mind, ${escapeHTML(state.user.name.split(" ")[0])}?"></textarea></div><div id="selected-file" class="selected-file hidden"></div>
      <div class="composer-bottom"><div class="composer-tools"><label class="tool-btn" for="post-image" style="cursor:pointer">${icon("image")} Photo</label><input id="post-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden"><button class="tool-btn" type="button" data-action="focus-composer">${icon("smile")} Feeling good</button></div><button class="primary-btn" data-action="publish">Share post</button></div></section>`;
  }
  async function loadHome() {
    state.page = "home"; state.pageNumber = 1;
    const result = await API.get("/posts?page=1&limit=10");
    state.feed = result.posts; state.hasMore = result.hasMore;
    renderHome();
  }
  function renderHome() {
    shell(`${storyStrip()}${composer()}<div id="feed">${state.feed.length?state.feed.map(renderPost).join(""):`<div class="card empty-state"><div class="empty-icon">${icon("sprout")}</div><h3>Your feed starts here</h3><p>Follow people who inspire you, or share the first little moment with your community.</p><button class="primary-btn" data-nav="discover">Find your people</button></div>`}</div>${state.hasMore?`<div style="text-align:center;padding:12px"><button class="secondary-btn" data-action="load-more">Load more posts</button></div>`:""}`, "Your feed", "A little inspiration for your day");
    const input = document.getElementById("post-image");
    input?.addEventListener("change", () => {
      const file = input.files[0]; const label = document.getElementById("selected-file");
      if (!file) { label.classList.add("hidden"); return; }
      if (!file.type.startsWith("image/") || file.size > 5*1024*1024) { input.value=""; toast("Choose an image under 5 MB.", true); return; }
      label.textContent = `Selected: ${file.name}`; label.classList.remove("hidden");
    });
  }
  async function loadSuggestions() {
    const container = document.getElementById("suggestions"); if (!container || !state.user) return;
    try {
      const {users} = await API.get("/users/suggested");
      if (!container.isConnected) return;
      container.innerHTML = users.length ? users.map(u=>`<div class="suggested-user">${avatar(u,"small")}<div class="user-info"><strong>${escapeHTML(u.name)}</strong><small>@${escapeHTML(u.username)}</small></div><button class="follow-mini" data-action="follow" data-id="${u.id}">Follow</button></div>`).join("") : `<p style="color:var(--muted);font-size:12px;line-height:1.6">You're all caught up. Search for people to follow.</p>`;
      refreshIcons();
    } catch (_) { container.innerHTML = `<span style="color:var(--muted);font-size:12px">Suggestions unavailable.</span>`; }
  }
  async function loadDiscover(q = "") {
    state.page = "discover"; state.search = q;
    let users = [];
    if (q.trim()) ({users} = await API.get(`/users/search?q=${encodeURIComponent(q.trim())}`));
    else ({users} = await API.get("/users/suggested"));
    shell(`<section class="card section-card"><label class="search-box" style="margin-bottom:20px">${icon("search")}<input id="discover-search" placeholder="Search names or usernames…" value="${escapeHTML(q)}"></label><div class="section-head"><h3>${q?"Search results":"People you may like"}</h3><span style="font-size:11px;color:var(--muted)">${users.length} people</span></div><div class="suggested-list">${users.length?users.map(u=>`<div class="suggested-user" style="padding:12px 0;border-bottom:1px solid var(--line)">${avatar(u)}<div class="user-info" data-profile="${escapeHTML(u.username)}" style="cursor:pointer"><strong>${escapeHTML(u.name)}</strong><small>@${escapeHTML(u.username)} · ${u.followersCount||0} followers</small>${u.bio?`<small style="margin-top:7px;white-space:normal">${escapeHTML(u.bio)}</small>`:""}</div><button class="follow-mini ${u.isFollowing?"following":""}" data-action="follow" data-id="${u.id}" data-following="${u.isFollowing}">${u.isFollowing?"Following":"Follow"}</button></div>`).join(""):`<div class="empty-state"><div class="empty-icon">${icon("users")}</div><h3>No people found yet</h3><p>Try another name or username.</p></div>`}</div></section>`, "Discover", "Meet people who make your corner brighter");
    const search = document.getElementById("discover-search"); search?.addEventListener("input", debounce(e=>run(()=>loadDiscover(e.target.value)), 300));
  }
  async function loadProfile(username = state.user.username) {
    state.page = username === state.user.username ? "profile" : "user-profile";
    const {user, posts} = await API.get(`/users/${encodeURIComponent(username)}`);
    state.profile = user;
    shell(`<section class="card" style="overflow:hidden"><div class="profile-cover">${user.coverImage?`<img src="${escapeHTML(user.coverImage)}" alt="">`:""}<div class="profile-avatar-wrap">${avatar(user,"large")}</div></div><div class="profile-details"><div class="profile-topline"><div class="profile-name"><h2>${escapeHTML(user.name)}</h2><p>@${escapeHTML(user.username)}</p></div>${user.username===state.user.username?`<button class="secondary-btn" data-action="edit-profile">${icon("pencil")} Edit profile</button>`:`<button class="primary-btn" data-action="follow" data-id="${user.id}" data-following="${user.isFollowing}">${user.isFollowing?"Following":"Follow"}</button>`}</div>
      ${user.bio?`<p class="profile-bio">${escapeHTML(user.bio)}</p>`:""}<div class="profile-meta">${user.location?`<span>${icon("map-pin")}${escapeHTML(user.location)}</span>`:""}${user.website?`<span>${icon("link")}<a href="${escapeHTML(user.website.startsWith("http")?user.website:"https://"+user.website)}" target="_blank" rel="noopener noreferrer">${escapeHTML(user.website)}</a></span>`:""}<span>${icon("calendar-days")} Joined ${new Date(user.createdAt).toLocaleDateString(undefined,{month:"short",year:"numeric"})}</span></div>
      <div class="profile-stats"><div><strong>${user.postsCount||posts.length}</strong><span>Posts</span></div><div><strong>${user.followersCount||0}</strong><span>Followers</span></div><div><strong>${user.followingCount||0}</strong><span>Following</span></div></div></div><div class="profile-tabs"><strong>Posts</strong><span>Moments</span></div></section>
      <div style="margin-top:18px" id="profile-posts">${posts.length?posts.map(p=>renderPost({...p,likesCount:p.likes?.length||0,commentsCount:0,isLiked:p.likes?.some(id=>String(id)===String(state.user.id))})).join(""):`<div class="card empty-state"><div class="empty-icon">${icon("camera")}</div><h3>No posts just yet</h3><p>When ${user.username===state.user.username?"you share a moment":escapeHTML(user.name.split(" ")[0])+" shares a moment"}, it'll show up here.</p></div>`}</div>`, user.username===state.user.username?"My profile":user.name, `@${user.username}`);
  }
  async function loadNotifications() {
    state.page = "notifications"; const {notifications, unreadCount} = await API.get("/notifications"); state.notifications = notifications;
    const body = notifications.length ? notifications.map(n=>{
      const actor=n.actor||{}, words={follow:"started following you",like:"liked your post",comment:"commented on your post"};
      return `<div class="notification-row ${n.read?"":"unread"}">${avatar(actor,"small")}<p><strong>${escapeHTML(actor.name||"Someone")}</strong> ${words[n.type]||"interacted with you"}<small>${dateLabel(n.createdAt)}</small></p>${n.read?"":'<span class="badge"></span>'}<button class="icon-btn" data-action="mark-read" data-id="${n._id}" aria-label="Mark read">${icon("check")}</button></div>`;
    }).join("") : `<div class="empty-state"><div class="empty-icon">${icon("bell")}</div><h3>All quiet for now</h3><p>When people connect with you, you'll see it here.</p></div>`;
    shell(`<section class="card section-card"><div class="section-head"><h3>Recent activity</h3>${unreadCount?`<button class="text-link" data-action="read-all">Mark all read</button>`:""}</div>${body}</section>`, "Notifications", "The little things happening around you");
  }
  function renderComments(post, comments) {
    return `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-label="Comments" data-modal-inner><div class="modal-head"><h2>Conversation</h2><button class="icon-btn" data-action="close-modal" aria-label="Close">${icon("x")}</button></div><div class="comment-list">${comments.length?comments.map(c=>`<div class="notification-row">${avatar(c.author,"small")}<p><strong>${escapeHTML(c.author?.name||"Member")}</strong> <span style="color:var(--muted)">@${escapeHTML(c.author?.username||"member")}</span><br>${escapeHTML(c.text)}<small>${dateLabel(c.createdAt)}</small></p>${String(c.author?._id)===String(state.user.id)?`<button class="icon-btn" data-action="delete-comment" data-id="${c._id}" aria-label="Delete comment">${icon("trash-2")}</button>`:""}</div>`).join(""):`<div class="empty-state"><h3>Start the conversation</h3><p>Be the first to leave a thoughtful comment.</p></div>`}</div><form id="comment-form" style="display:flex;gap:9px;margin-top:18px"><input name="text" required maxlength="500" placeholder="Write a comment…" style="flex:1;min-width:0;border:1px solid var(--line);border-radius:12px;padding:12px"><button class="primary-btn">Send</button></form></section></div>`;
  }
  function showModal(html) { document.body.insertAdjacentHTML("beforeend", html); refreshIcons(); }
  function editProfileModal() {
    const u=state.user;
    showModal(`<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" data-modal-inner><div class="modal-head"><h2>Edit your profile</h2><button class="icon-btn" data-action="close-modal">${icon("x")}</button></div><form id="profile-form"><div class="field"><label>Full name</label><input name="name" required maxlength="60" value="${escapeHTML(u.name)}"></div><div class="field"><label>Bio</label><textarea name="bio" maxlength="180" placeholder="A little about you…">${escapeHTML(u.bio||"")}</textarea></div><div class="field"><label>Location</label><input name="location" maxlength="80" value="${escapeHTML(u.location||"")}" placeholder="City, country"></div><div class="field"><label>Website</label><input name="website" maxlength="200" value="${escapeHTML(u.website||"")}" placeholder="yourwebsite.com"></div><div class="field"><label>Avatar image URL (optional)</label><input name="avatar" maxlength="500" value="${escapeHTML(u.avatar||"")}" placeholder="https://…"></div><div class="field"><label>Cover image URL (optional)</label><input name="coverImage" maxlength="500" value="${escapeHTML(u.coverImage||"")}" placeholder="https://…"></div><div class="modal-actions"><button type="button" class="secondary-btn" data-action="close-modal">Cancel</button><button class="primary-btn">Save changes</button></div></form></section></div>`);
  }
  function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer=setTimeout(()=>fn(...args),delay); }; }
  document.addEventListener("click", async e => {
    const nav = e.target.closest("[data-nav]"); if (nav) { e.preventDefault(); const target=nav.dataset.nav; await run(async()=>{ if(target==="home") await loadHome(); else if(target==="discover") await loadDiscover(); else if(target==="profile") await loadProfile(); else if(target==="notifications") await loadNotifications(); }); return; }
    const profileLink=e.target.closest("[data-profile]"); if(profileLink){await run(()=>loadProfile(profileLink.dataset.profile));return;}
    const el=e.target.closest("[data-action]"); if(!el)return; const action=el.dataset.action; const id=el.dataset.id;
    if(action==="switch-auth") return renderAuth(state.page==="register"?"login":"register");
    if(action==="logout") return run(async()=>{await API.post("/auth/logout",{});state.user=null;renderAuth("login");});
    if(action==="focus-composer"){document.getElementById("post-text")?.focus();return;}
    if(action==="publish") return run(async()=>{
      const text=document.getElementById("post-text")?.value||"";const file=document.getElementById("post-image")?.files[0];const fd=new FormData();fd.append("text",text);if(file)fd.append("image",file);
      el.disabled=true;el.textContent="Sharing…";
      try {const {post}=await API.upload("/posts",fd);state.feed.unshift(post);toast("Your post is live ✨");renderHome();}
      catch(error){toast(error.message,true);el.disabled=false;el.textContent="Share post";}
    });
    if(action==="like") return run(async()=>{
      const card=el.closest("[data-post]");const postId=id;const wasLiked=el.classList.contains("liked");
      const result=await (wasLiked?API.delete(`/posts/${postId}/like`):API.post(`/posts/${postId}/like`,{}));
      el.classList.toggle("liked",result.isLiked);el.querySelector("span").textContent=result.likesCount;
      const post=state.feed.find(p=>p._id===postId);if(post){post.isLiked=result.isLiked;post.likesCount=result.likesCount;}
    });
    if(action==="comments") return run(async()=>{const {post,comments}=await API.get(`/posts/${id}`);showModal(renderComments(post,comments));document.getElementById("comment-form").addEventListener("submit",async ev=>{ev.preventDefault();const text=new FormData(ev.currentTarget).get("text");try{await API.post(`/posts/${id}/comments`,{text});document.querySelector(".modal-backdrop")?.remove();toast("Comment added");if(state.page==="home")await loadHome();else await loadProfile();}catch(err){toast(err.message,true);}});});
    if(action==="delete-comment") return run(async()=>{if(!confirm("Delete this comment?"))return;await API.delete(`/posts/comments/${id}`);toast("Comment deleted");document.querySelector(".modal-backdrop")?.remove();});
    if(action==="post-menu") {showModal(`<div class="modal-backdrop" data-action="close-modal"><section class="modal" data-modal-inner><div class="modal-head"><h2>Post options</h2><button class="icon-btn" data-action="close-modal">${icon("x")}</button></div><p style="color:var(--muted)">You can delete this post. This also deletes its comments.</p><div class="modal-actions"><button class="secondary-btn" data-action="close-modal">Cancel</button><button class="primary-btn" style="background:var(--danger)" data-action="delete-post" data-id="${id}">Delete post</button></div></section></div>`);return;}
    if(action==="delete-post") return run(async()=>{if(!confirm("Delete this post permanently?"))return;await API.delete(`/posts/${id}`);document.querySelector(".modal-backdrop")?.remove();toast("Post deleted");if(state.page==="home")await loadHome();else await loadProfile();});
    if(action==="follow") return run(async()=>{
      const isFollowing=el.dataset.following==="true"||el.classList.contains("following");
      const result=await (isFollowing?API.delete(`/users/${id}/follow`):API.post(`/users/${id}/follow`,{}));
      toast(result.isFollowing?"You're connected ✨":"Unfollowed");
      if(state.page==="discover") await loadDiscover(document.getElementById("discover-search")?.value||"");
      else if(state.page==="profile"||state.page==="user-profile") await loadProfile(state.profile?.username||state.user.username);
      else await loadSuggestions();
    });
    if(action==="edit-profile") return editProfileModal();
    if(action==="close-modal"){if(el.classList.contains("modal-backdrop") && e.target!==el)return;el.closest(".modal-backdrop")?.remove();return;}
    if(action==="mark-read") return run(async()=>{await API.patch(`/notifications/${id}/read`,{});await loadNotifications();});
    if(action==="read-all") return run(async()=>{await API.patch("/notifications/read-all",{});await loadNotifications();});
    if(action==="load-more") return run(async()=>{const next=state.pageNumber+1;const {posts,hasMore}=await API.get(`/posts?page=${next}&limit=10`);state.pageNumber=next;state.feed.push(...posts);state.hasMore=hasMore;renderHome();});
  });
  document.addEventListener("submit", async e => {
    if(e.target.id==="profile-form"){e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());try{const result=await API.put("/users/me",data);state.user={...state.user,...result.user};document.querySelector(".modal-backdrop")?.remove();toast("Profile updated");await loadProfile();}catch(error){toast(error.message,true);}}
  });
  document.addEventListener("keydown", e=>{if(e.key==="Escape")document.querySelector(".modal-backdrop")?.remove();});
  document.addEventListener("input", debounce(e=>{
    if(e.target.id==="global-search" && e.target.value.trim().length>=1) {state.search=e.target.value;run(()=>loadDiscover(e.target.value));}
  },350));
  async function init(){
    try{const {user}=await API.get("/auth/me");state.user=user;await loadHome();}
    catch(_){renderAuth("login");}
  }
  init();
})();
