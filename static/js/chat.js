let username = localStorage.getItem("username") || "Guest";
let allUsers = [];

let socket = new WebSocket(
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.hostname + ":9000"
);


socket.onopen = function(){

    console.log("Connected to TrueOffice Server");

    socket.send(JSON.stringify({
        type: "join",
        username: username
    }));

};


socket.onmessage = function(event){

    let data;

    try{
        data = JSON.parse(event.data);
    }catch(error){
        console.error("Invalid server message:", event.data);
        return;
    }

    if(data.type === "history"){

        const box = document.getElementById("messages");

        if(box){
            box.innerHTML = "";

            if(Array.isArray(data.messages)){
                data.messages.forEach(function(message){
                    appendChatMessage(
                        message.username,
                        message.text,
                        message.created_at
                    );
                });
            }

            box.scrollTop = box.scrollHeight;
        }

        return;
    }

    if(data.type === "users"){

        updateOnlineUsers(data.users || []);

        if(Array.isArray(data.all_users)){
            window.officeUsers = data.all_users;
            renderDirectoryUsers(data.all_users);
        }

        return;
    }

    if(data.type === "message"){

        appendChatMessage(
            data.username,
            data.text,
            data.created_at
        );

        return;
    }

    if(data.type === "user_result"){

        if(data.success){
            loadDirectoryUsers();
        }

        console.log(data.message);

        return;
    }

    if(data.type === "system"){
        console.log(data.message);
        return;
    }
};


function addMessage(sender, text){

    if(!messagesBox){
        return;
    }


    const row = document.createElement("div");

    row.className = "msg-row";


    const avatar = document.createElement("div");

    avatar.className = "avatar blue";

    avatar.textContent =
        sender.charAt(0).toUpperCase();


    const content = document.createElement("div");

    content.className = "message-content";


    const meta = document.createElement("div");

    meta.className = "message-meta";


    const name = document.createElement("strong");

    name.textContent = sender;


    const time = document.createElement("span");

    time.textContent =
        new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });


    meta.appendChild(name);
    meta.appendChild(time);


    const bubble = document.createElement("div");

    bubble.className = "bubble";


    renderMessageText(bubble, text);


    content.appendChild(meta);
    content.appendChild(bubble);

    row.appendChild(avatar);
    row.appendChild(content);

    messagesBox.appendChild(row);

    messagesBox.scrollTop =
        messagesBox.scrollHeight;

}


function renderMessageText(element, text){

    const parts = text.split(/(@[A-Za-z0-9_-]+)/g);


    parts.forEach(function(part){

        if(part.startsWith("@")){

            const mention =
                document.createElement("span");

            mention.className = "mention";

            mention.textContent = part;

            mention.title =
                "Click to view " + part.slice(1);

            mention.addEventListener(
                "click",
                function(event){

                    event.stopPropagation();

                    showMentionProfile(
                        part.slice(1),
                        mention
                    );

                }
            );

            element.appendChild(mention);

        }else{

            element.appendChild(
                document.createTextNode(part)
            );

        }

    });

}



function appendChatMessage(sender, text, createdAt){

    const messagesBox =
        document.getElementById("messages");

    if(!messagesBox){
        return;
    }

    const row =
        document.createElement("div");

    row.className = "msg-row";

    const avatar =
        document.createElement("div");

    avatar.className = "avatar blue";

    avatar.textContent =
        String(sender || "?").charAt(0).toUpperCase();

    const content =
        document.createElement("div");

    content.className = "message-content";

    const meta =
        document.createElement("div");

    meta.className = "message-meta";

    const name =
        document.createElement("strong");

    name.textContent = sender || "Unknown";

    const time =
        document.createElement("span");

    let date;

    if(createdAt){
        date = new Date(
            createdAt.replace(" ", "T") + "Z"
        );
    }

    if(!date || isNaN(date.getTime())){
        date = new Date();
    }

    time.textContent =
        date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    meta.appendChild(name);
    meta.appendChild(time);

    const bubble =
        document.createElement("div");

    bubble.className = "bubble";

    renderMessageText(bubble, text || "");

    content.appendChild(meta);
    content.appendChild(bubble);

    row.appendChild(avatar);
    row.appendChild(content);

    messagesBox.appendChild(row);

    messagesBox.scrollTop =
        messagesBox.scrollHeight;
}

function sendMessage(){

    if(!socket ||
       socket.readyState !== WebSocket.OPEN){

        alert("Chat server se connection nahi hai.");

        return;

    }


    const input =
        document.getElementById("messageInput");

    if(!input){
        return;
    }

    const text =
        input.value.trim();


    if(text === ""){
        return;
    }


    socket.send(JSON.stringify({

        type: "message",

        text: text

    }));


    input.value = "";

}


function updateOnlineUsers(users){

    onlineUsers = Array.isArray(users) ? users : [];

    console.log("Mention users updated:", onlineUsers);

    const list = document.getElementById("userList");
    const count = document.getElementById("onlineCount");
    const status = document.getElementById("onlineStatus");

    if(count){
        count.textContent = users.length;
    }

    if(status){
        status.innerHTML =
            '<span class="status-dot"></span> ' +
            users.length +
            ' member' +
            (users.length === 1 ? '' : 's') +
            ' online';
    }

    if(!list){
        return;
    }

    list.innerHTML = "";

    users.forEach(function(user, index){

        const row = document.createElement("div");
        row.className = "user";

        const avatar = document.createElement("div");
        avatar.className =
            "avatar " +
            ["purple","blue","green","orange"][index % 4];

        avatar.textContent =
            user.charAt(0).toUpperCase();

        const info = document.createElement("div");
        info.className = "user-info";

        const name = document.createElement("strong");
        name.textContent = user;

        const state = document.createElement("small");
        state.textContent =
            user === username ? "You • Available" : "Available";

        info.appendChild(name);
        info.appendChild(state);

        const dot = document.createElement("i");
        dot.className = "online";

        row.appendChild(avatar);
        row.appendChild(info);
        row.appendChild(dot);

        list.appendChild(row);
    });

    console.log("Online users:", users);
}


document.addEventListener(
    "DOMContentLoaded",
    function(){

        const messageInput =
            document.getElementById("messageInput");

        if(!messageInput){
            return;
        }

        messageInput.addEventListener(
            "keydown",
            function(event){

                const box =
                    document.getElementById(
                        "mentionSuggestions"
                    );

                const options =
                    box
                        ? box.querySelectorAll(
                            ".mention-option"
                        )
                        : [];

                const mentionOpen =
                    box &&
                    box.style.display === "block" &&
                    options.length > 0;


                /* Mention navigation */

                if(mentionOpen &&
                   event.key === "ArrowDown"){

                    event.preventDefault();
                    event.stopImmediatePropagation();

                    mentionActiveIndex =
                        (mentionActiveIndex + 1) %
                        options.length;

                    updateMentionActiveOption();

                    return;
                }


                if(mentionOpen &&
                   event.key === "ArrowUp"){

                    event.preventDefault();
                    event.stopImmediatePropagation();

                    mentionActiveIndex =
                        mentionActiveIndex <= 0
                            ? options.length - 1
                            : mentionActiveIndex - 1;

                    updateMentionActiveOption();

                    return;
                }


                if(mentionOpen &&
                   event.key === "Enter" &&
                   mentionActiveIndex >= 0){

                    event.preventDefault();
                    event.stopImmediatePropagation();

                    selectMention(
                        mentionActiveIndex
                    );

                    return;
                }


                if(mentionOpen &&
                   event.key === "Escape"){

                    event.preventDefault();
                    event.stopImmediatePropagation();

                    box.style.display = "none";
                    mentionActiveIndex = -1;

                    return;
                }


                /* Normal Enter = send message */

                if(event.key === "Enter"){

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

    }
);


function logout(){

    localStorage.removeItem("username");

    window.location = "/";

}


/* =========================
   @MENTION SYSTEM
========================= */

let onlineUsers = [];


function showMentionSuggestions(){

    const box =
        document.getElementById("mentionSuggestions");

    if(!box){
        return;
    }

    
    const input =
        document.getElementById("messageInput");

    if(!input){
        return;
    }

    const value = input.value;

    const match = value.match(/@([A-Za-z0-9_-]*)$/);

    if(!match){

        box.style.display = "none";

        return;
    }


    const query =
        match[1].toLowerCase();


    /* Remove duplicate / empty usernames */
    const uniqueUsers =
        [...new Set(
            onlineUsers
                .filter(function(user){
                    return typeof user === "string" &&
                           user.trim() !== "";
                })
                .map(function(user){
                    return user.trim();
                })
        )];


    const matches =
        uniqueUsers.filter(function(user){

            const name = user.toLowerCase();

            if(!query){
                return true;
            }

            // Normal partial match: @rah -> Rahul
            if(name.includes(query)){
                return true;
            }

            // Forgiving match: @raah -> Rahul
            let qi = 0;

            for(let i = 0; i < name.length && qi < query.length; i++){

                if(name[i] === query[qi]){
                    qi++;
                }

            }

            return qi === query.length;

        });


    if(matches.length === 0){

        box.innerHTML =
            '<div class="mention-empty">' +
            'No users found' +
            '</div>';

        box.style.display = "block";

        mentionActiveIndex = -1;

        return;
    }


    /* Keep keyboard selection while refreshing suggestions */
    if(
        mentionActiveIndex >= matches.length
    ){
        mentionActiveIndex =
            matches.length - 1;
    }

    box.innerHTML = "";

    box.style.display = "block";

    matches.forEach(function(user, index){

        const option =
            document.createElement("div");

        option.className =
            "mention-option";

        if(index === mentionActiveIndex){
            option.classList.add("active");
        }


        const avatar =
            document.createElement("div");

        avatar.className =
            "mention-avatar";

        avatar.textContent =
            user.charAt(0).toUpperCase();


        const info =
            document.createElement("div");


        const name =
            document.createElement("strong");

        name.textContent =
            user;


        const status =
            document.createElement("small");

        status.textContent =
            "Online";


        info.appendChild(name);
        info.appendChild(status);


        option.appendChild(avatar);
        option.appendChild(info);


        option.addEventListener(
            "click",
            function(){

                const value =
                    input.value;

                const match =
                    value.match(
                        /@[A-Za-z0-9_-]*$/
                    );

                if(match){

                    const start =
                        match.index;

                    const replacement =
                        "@" + user + " ";

                    input.value =
                        value.slice(0, start) +
                        replacement;

                    const cursor =
                        start + replacement.length;

                    input.setSelectionRange(
                        cursor,
                        cursor
                    );

                }

                box.style.display =
                    "none";

                mentionActiveIndex = -1;

                input.focus();

            }
        );


        box.appendChild(option);

    });


    box.style.display = "block";

}



/* =========================
   MENTION KEYBOARD NAVIGATION
========================= */

let mentionActiveIndex = -1;

function updateMentionActiveOption(){

    const options =
        document.querySelectorAll(".mention-option");

    options.forEach(function(option){
        option.classList.remove("active");
    });

    if(
        mentionActiveIndex >= 0 &&
        options[mentionActiveIndex]
    ){

        const active =
            options[mentionActiveIndex];

        active.classList.add("active");

        active.scrollIntoView({
            block: "nearest"
        });

    }
}

function selectMention(index){

    const box =
        document.getElementById("mentionSuggestions");

    const messageInput =
        document.getElementById("messageInput");

    if(!box || !messageInput){
        return;
    }

    const options =
        box.querySelectorAll(".mention-option");

    if(!options[index]){
        return;
    }

    const user =
        options[index]
            .querySelector("strong")
            ?.textContent;

    if(!user){
        return;
    }

    messageInput.value =
        messageInput.value.replace(
            /@[A-Za-z0-9_-]*$/,
            "@" + user + " "
        );

    box.style.display = "none";

    mentionActiveIndex = -1;

    messageInput.focus();
}


const originalUpdateOnlineUsers =
    updateOnlineUsers;


updateOnlineUsers = function(users){

    onlineUsers = users || [];

    originalUpdateOnlineUsers(users);

};


document.addEventListener("DOMContentLoaded", function(){

    const mentionInput =
        document.getElementById("messageInput");

    if(mentionInput){

        mentionInput.addEventListener(
            "input",
            showMentionSuggestions
        );

        mentionInput.addEventListener(
            "keyup",
            showMentionSuggestions
        );

    }

});


document.addEventListener(
    "click",
    function(event){

        const box =
            document.getElementById(
                "mentionSuggestions"
            );

        if(!box){
            return;
        }

        const messageInput =
            document.getElementById("messageInput");

        if(
            event.target !== messageInput &&
            !box.contains(event.target)
        ){

            box.style.display =
                "none";

        }

    }
);



/* =========================
   CLICKABLE MENTION PROFILE
========================= */

function showMentionProfile(username, target){

    let old =
        document.getElementById(
            "mentionProfilePopup"
        );

    if(old){
        old.remove();
    }

    const popup =
        document.createElement("div");

    popup.id =
        "mentionProfilePopup";

    popup.className =
        "mention-profile-popup";

    const avatar =
        document.createElement("div");

    avatar.className =
        "mention-profile-avatar";

    avatar.textContent =
        username.charAt(0).toUpperCase();

    const info =
        document.createElement("div");

    const name =
        document.createElement("strong");

    name.textContent =
        username;

    const status =
        document.createElement("small");

    status.innerHTML =
        '<span class="mention-online-dot"></span> Online';

    info.appendChild(name);
    info.appendChild(status);

    popup.appendChild(avatar);
    popup.appendChild(info);

    document.body.appendChild(popup);

    const rect =
        target.getBoundingClientRect();

    popup.style.left =
        Math.max(
            10,
            rect.left
        ) + "px";

    popup.style.top =
        (rect.bottom + 8) + "px";

    setTimeout(function(){

        document.addEventListener(
            "click",
            function closeMentionPopup(event){

                if(!popup.contains(event.target)){

                    popup.remove();

                    document.removeEventListener(
                        "click",
                        closeMentionPopup
                    );

                }

            }
        );

    }, 0);

}

/* =========================
   MORE MENU
========================= */

document.addEventListener("DOMContentLoaded", function(){

    const moreBtn =
        document.getElementById("moreMenuBtn");

    const moreMenu =
        document.getElementById("moreMenu");

    const logoutBtn =
        document.getElementById("logoutMenuBtn");


    if(!moreBtn || !moreMenu){
        return;
    }


    moreBtn.addEventListener("click", function(event){

        event.stopPropagation();

        moreMenu.classList.toggle("show");

    });


    document.addEventListener("click", function(event){

        if(
            !moreMenu.contains(event.target) &&
            event.target !== moreBtn
        ){

            moreMenu.classList.remove("show");

        }

    });


    if(logoutBtn){

        logoutBtn.addEventListener("click", function(){

            moreMenu.classList.remove("show");

            logout();

        });

    }

});


/* =========================
   ADD USER
========================= */

document.addEventListener("DOMContentLoaded", function(){

    const moreBtn = document.getElementById("moreMenuBtn");
    const menu = document.getElementById("moreMenu");

    const addBtn = document.getElementById("addUserBtn");
    const modal = document.getElementById("addUserModal");
    const closeBtn = document.getElementById("closeAddUser");
    const cancelBtn = document.getElementById("cancelAddUser");
    const saveBtn = document.getElementById("saveNewUser");

    const nameInput = document.getElementById("newUsername");
    const errorBox = document.getElementById("addUserError");

    function closeModal(){
        if(modal){
            modal.classList.remove("show");
        }

        if(nameInput){
            nameInput.value = "";
        }

        if(errorBox){
            errorBox.textContent = "";
        }
    }

    if(addBtn){
        addBtn.addEventListener("click", function(){
            menu.classList.remove("show");

            modal.classList.add("show");

            setTimeout(function(){
                nameInput.focus();
            }, 50);
        });
    }

    if(closeBtn){
        closeBtn.addEventListener("click", closeModal);
    }

    if(cancelBtn){
        cancelBtn.addEventListener("click", closeModal);
    }

    if(modal){
        modal.addEventListener("click", function(event){
            if(event.target === modal){
                closeModal();
            }
        });
    }

    async function saveUser(){

        const name = nameInput.value.trim();

        errorBox.textContent = "";

        if(!name){
            errorBox.textContent = "Name is required.";
            nameInput.focus();
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = "Adding...";

        try{

            const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: name
                })
            });

            const data = await response.json();

            if(!response.ok){
                throw new Error(data.error || "Unable to add user");
            }

            /*
             * Permanent directory update.
             * Online users will still come from WebSocket.
             * The directory is separate from online status.
             */
            if(typeof loadDirectoryUsers === "function"){
                loadDirectoryUsers();
            }

            if(!onlineUsers.includes(data.username)){
                onlineUsers.push(data.username);
            }

            showMentionSuggestions();

            closeModal();

            console.log("User added:", data.username);

        }catch(error){

            console.error("Add user error:", error);

            errorBox.textContent =
                error.message || "Unable to add user.";

        }finally{

            saveBtn.disabled = false;
            saveBtn.textContent = "Add User";

        }
    }

    if(saveBtn){
        saveBtn.addEventListener("click", saveUser);
    }

    if(nameInput){
        nameInput.addEventListener("keydown", function(event){
            if(event.key === "Enter"){
                event.preventDefault();
                saveUser();
            }
        });
    }

});


/* Load permanent office directory */

async function loadDirectoryUsers(){

    try{

        const response =
            await fetch("/api/users");

        const data =
            await response.json();

        if(!Array.isArray(data.users)){
            return;
        }

        window.officeUsers =
            Array.from(new Set(data.users || []));

        console.log(
            "Office directory:",
            window.officeUsers
        );

        console.log(
            "Office directory:",
            window.officeUsers
        );

    }catch(error){

        console.error(
            "Directory load failed:",
            error
        );

    }

}

document.addEventListener(
    "DOMContentLoaded",
    loadDirectoryUsers
);


/* =========================
   TRUEOFFICE FINAL SEARCH
========================= */

(function(){

    function getAllUsers(){
        return Array.from(
            new Set(window.officeUsers || onlineUsers || [])
        ).sort(function(a,b){
            return a.localeCompare(b);
        });
    }

    function searchEverything(query){

        query = String(query || "").trim().toLowerCase();

        const resultBox =
            document.getElementById("searchResults");

        if(!resultBox){
            return;
        }

        if(!query){
            resultBox.classList.remove("show");
            resultBox.innerHTML = "";
            return;
        }

        const users = getAllUsers().filter(function(user){
            return user.toLowerCase().includes(query);
        });

        const messages =
            Array.from(
                document.querySelectorAll("#messages .msg-row")
            ).filter(function(row){
                return row.textContent.toLowerCase().includes(query);
            });

        resultBox.innerHTML = "";

        users.slice(0, 10).forEach(function(user){

            const item =
                document.createElement("div");

            item.className = "search-result";

            const name =
                document.createElement("strong");

            name.textContent = "👤 " + user;

            const info =
                document.createElement("small");

            info.textContent =
                "Office member • click to mention";

            item.appendChild(name);
            item.appendChild(info);

            item.addEventListener("click", function(){

                const input =
                    document.getElementById("messageInput");

                if(input){

                    input.value =
                        input.value.replace(
                            /@[A-Za-z0-9_-]*$/,
                            "@" + user + " "
                        );

                    input.focus();
                }

                resultBox.classList.remove("show");
                resultBox.innerHTML = "";
            });

            resultBox.appendChild(item);
        });

        messages.slice(0, 10).forEach(function(row){

            const item =
                document.createElement("div");

            item.className = "search-result";

            const text =
                row.querySelector(".bubble");

            const name =
                row.querySelector(".message-meta strong");

            const title =
                document.createElement("strong");

            title.textContent =
                "💬 " +
                (name ? name.textContent : "Message");

            const info =
                document.createElement("small");

            info.textContent =
                text ? text.textContent.trim() : "";

            item.appendChild(title);
            item.appendChild(info);

            item.addEventListener("click", function(){

                row.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                resultBox.classList.remove("show");
            });

            resultBox.appendChild(item);
        });

        if(!resultBox.children.length){

            const empty =
                document.createElement("div");

            empty.className = "search-empty";
            empty.textContent = "No results found";

            resultBox.appendChild(empty);
        }

        resultBox.classList.add("show");
    }


    document.addEventListener(
        "DOMContentLoaded",
        function(){

            const search =
                document.getElementById("globalSearch");

            const headerSearch =
                document.getElementById("headerSearchBtn");

            if(search){

                search.addEventListener(
                    "input",
                    function(){
                        searchEverything(search.value);
                    }
                );

                search.addEventListener(
                    "keydown",
                    function(event){

                        if(event.key === "Escape"){

                            search.value = "";
                            searchEverything("");
                            search.blur();
                        }
                    }
                );
            }

            if(headerSearch && search){

                headerSearch.addEventListener(
                    "click",
                    function(){

                        search.focus();

                        search.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest"
                        });
                    }
                );
            }
        }
    );

})();


/* =========================
   WEBSOCKET AUTO RECONNECT
========================= */

(function(){

    let reconnectTimer = null;

    function reconnect(){

        if(
            socket &&
            (
                socket.readyState === WebSocket.OPEN ||
                socket.readyState === WebSocket.CONNECTING
            )
        ){
            return;
        }

        clearTimeout(reconnectTimer);

        reconnectTimer = setTimeout(
            function(){

                console.log(
                    "TrueOffice: reconnecting..."
                );

                try{

                    socket =
                        new WebSocket(
                            (location.protocol === "https:" ? "wss://" : "ws://") +
                            location.hostname + ":9000"
                        );

                    socket.onopen = function(){

                        console.log(
                            "TrueOffice: WebSocket connected"
                        );

                        socket.send(JSON.stringify({
                            type: "join",
                            username: username
                        }));
                    };

                    socket.onclose = function(){
                        console.log(
                            "TrueOffice: disconnected"
                        );
                        reconnect();
                    };

                    socket.onerror = function(){
                        try{
                            socket.close();
                        }catch(e){}
                    };

                }catch(error){

                    console.error(
                        "Reconnect failed:",
                        error
                    );

                    reconnect();
                }

            },
            2000
        );
    }

    document.addEventListener(
        "visibilitychange",
        function(){

            if(!document.hidden){
                reconnect();
            }
        }
    );

})();


/* =========================
   DIRECTORY -> MENTIONS
========================= */

window.addEventListener(
    "load",
    function(){

        if(typeof loadDirectoryUsers === "function"){
            loadDirectoryUsers();
        }
    }
);

