import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://nvjtpcgemgtginudzhuh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52anRwY2dlbWd0Z2ludWR6aHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzcwOTcsImV4cCI6MjA4OTU1MzA5N30.weKoS-Ucasf126enYAjU6cDFGFBr9UgWXE493ZQYgz8";

const client = createClient(supabaseUrl, supabaseKey);

async function carregarPerfis() {

    const { data, error } = await client
        .from("profiles")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    const container = document.getElementById("profiles");
    container.innerHTML = "";

    data.forEach(profile => {

        const card = document.createElement("div");
        card.className = "profile";

        card.innerHTML = `
            <img src="${profile.avatar_url}?t=${Date.now()}" class="avatar">
            <p class="name">${profile.name}</p>
            <button class="editBtn">Editar</button>
        `;

        card.querySelector("img").onclick = () => {
            localStorage.setItem("userId", profile.id);
            localStorage.setItem("userName", profile.name);
            window.location.href = "home.html";
        };

        card.querySelector(".editBtn").onclick = (e) => {
            e.stopPropagation();
            localStorage.setItem("editProfileId", profile.id);
            window.location.href = "editarPerfil.html";
        };

        container.appendChild(card);

    });

}

carregarPerfis();