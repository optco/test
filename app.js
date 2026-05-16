document.addEventListener("DOMContentLoaded", () => {
    // 1. Get the username from the URL path
    const path = window.location.pathname;
    // Removes leading slash and trailing slashes if they exist
    const username = path.replace(/^\/|\/$/g, '');

    const loadingEl = document.getElementById("loading");
    const contentEl = document.getElementById("profile-content");
    const errorEl = document.getElementById("error-content");

    // If it's the root domain with no user, display a placeholder or redirect
    if (!username || username === 'index.html') {
        loadingEl.classList.add("hidden");
        errorEl.querySelector("h1").innerText = "Welcome to The Attn";
        errorEl.querySelector("p").innerText = "Append a username to the URL to view a profile.";
        errorEl.classList.remove("hidden");
        return;
    }

    // 2. Fetch the user profile data
    fetch('./users.json')
        .then(response => {
            if (!response.ok) throw new Error("Failed to load user database.");
            return response.json();
        })
        .then(data => {
            const userData = data[username];

            if (userData) {
                // 3. Inject data into HTML elements
                document.getElementById("user-name").innerText = userData.name;
                document.getElementById("user-role").innerText = userData.role;
                document.getElementById("user-bio").innerText = userData.bio;
                document.getElementById("user-avatar").src = userData.avatar;
                document.getElementById("user-avatar").alt = `${userData.name}'s Avatar`;

                // Build links dynamically
                const linksContainer = document.getElementById("user-links");
                linksContainer.innerHTML = ""; // Clear loader/previous data
                
                userData.links.forEach(link => {
                    const a = document.createElement("a");
                    a.href = link.url;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.innerText = link.label;
                    linksContainer.appendChild(a);
                });

                // Show Content
                loadingEl.classList.add("hidden");
                contentEl.classList.remove("hidden");
                document.title = `${userData.name} | The Attn`;
            } else {
                // User doesn't exist in JSON
                showError();
            }
        })
        .catch(err => {
            console.error(err);
            showError();
        });

    function showError() {
        loadingEl.classList.add("hidden");
        errorEl.classList.remove("hidden");
    }
});