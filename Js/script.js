import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseurl = "https://dgjwxlugbrdwvwnlznff.supabase.co";
const supabasekey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnand4bHVnYnJkd3Z3bmx6bmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDU4NjQsImV4cCI6MjA4OTAyMTg2NH0.3BaOPr0QDW72moXv5aZeJh1rzq2hn0AqIR2CEZSS2sE";

const client = createClient(supabaseurl, supabasekey);

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