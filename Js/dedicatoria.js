import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://nvjtpcgemgtginudzhuh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52anRwY2dlbWd0Z2ludWR6aHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzcwOTcsImV4cCI6MjA4OTU1MzA5N30.weKoS-Ucasf126enYAjU6cDFGFBr9UgWXE493ZQYgz8";
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const currentUserId = Number(localStorage.getItem("userId"));
const userName = localStorage.getItem("userName");

if (!currentUserId) window.location.href = "index.html";

document.getElementById("welcome").textContent = `Olá, ${userName}`;
document.getElementById("logout").onclick = () => {
    localStorage.removeItem("profile");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    window.location.href = "index.html";
};

const video = document.getElementById("bg-video");
const source = document.getElementById("bg-source");
const root = document.documentElement;

if (currentUserId == 1) {
    source.src = "../assets/video/wallpaper1.mp4";

    root.style.setProperty('--cor-borda', '#00aaff');
    root.style.setProperty('--cor-fundo', 'rgba(0, 170, 255, 0.1)');
    root.style.setProperty('--cor-glow', 'rgba(0, 170, 255, 0.6)');
} else {
    source.src = "../assets/video/wallpaper2.mp4";

    root.style.setProperty('--cor-borda', '#a855f7');
    root.style.setProperty('--cor-fundo', 'rgba(168, 85, 247, 0.1)');
    root.style.setProperty('--cor-glow', 'rgba(168, 85, 247, 0.6)');
}

video.load();
video.play();

const input = document.getElementById("songName");
const results = document.getElementById("results");
const selected = document.getElementById("selectedSong");
const searchBtn = document.getElementById("searchBtn");

async function getDestinatarioId() {
    try {
        const { data, error } = await supabaseClient
            .from("profiles")
            .select("parceiro")
            .eq("id", currentUserId)
            .single();

        if (error || !data) {
            console.error("Erro ao buscar parceiro:", error);
            return null;
        }

        const id = Number(data.parceiro);

        if (isNaN(id)) {
            console.error("Parceiro não é um ID válido:", data.parceiro);
            return null;
        }

        return id;
    } catch (err) {
        console.error("Erro na função getDestinatarioId:", err);
        return null;
    }
}

searchBtn.addEventListener("click", async () => {
    const query = input.value.trim();
    results.innerHTML = "";
    if (!query) return;

    try {
        const response = await fetch(`https://spotify-api-93ud.onrender.com/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            console.error("Erro na resposta do servidor:", response.status);
            return;
        }

        const tracks = await response.json();

        if (!tracks || tracks.length === 0) {
            results.innerHTML = "<p>Nenhuma música encontrada.</p>";
            return;
        }

        tracks.forEach((track, index) => {
            const item = document.createElement("div");
            item.classList.add("resultItem");

            item.style.opacity = "0";
            item.style.transform = "translateY(20px)";

            item.innerHTML = `
        <img src="${track.image}" width="50">
        <div>
            <strong>${track.name}</strong><br>
            ${track.artists.join(", ")}
        </div>
    `;

            item.addEventListener("click", () => showSong(track));

            results.appendChild(item);

            setTimeout(() => {
                item.style.transition = "all 0.4s ease";
                item.style.opacity = "1";
                item.style.transform = "translateY(0)";
            }, index * 100);
        });

    } catch (error) {
        console.error("Erro ao buscar músicas:", error);
    }
});

async function showSong(track) {
    const cover = document.getElementById("albumCover");
    const artist = document.getElementById("songArtist");
    const player = document.getElementById("player");

    cover.src = track.image;
    cover.style.display = "block";

    artist.textContent = track.artists.join(", ");

    player.src = `https://open.spotify.com/embed/track/${track.id}`;
    player.style.display = "block";

    results.innerHTML = "";

    animarElemento(selected, 0);
    animarElemento(cover, 100);
    animarElemento(artist, 200);
    animarElemento(player, 300);

    const oldBtn = document.getElementById("dedicateBtn");
    if (oldBtn) oldBtn.remove();

    const toUserId = await getDestinatarioId();

    const dedicateButton = document.createElement("button");
    dedicateButton.id = "dedicateBtn";
    dedicateButton.textContent = toUserId ? `Dedicar para parceiro(a)` : "Dedicar";
    dedicateButton.addEventListener("click", () => dedicateSong(track, toUserId));

    selected.appendChild(dedicateButton);
}

async function dedicateSong(track, toUserId) {
    if (!toUserId) {
        alert("Não foi possível determinar o destinatário.");
        return;
    }

    try {
        const { error: deleteError } = await supabaseClient
            .from("dedications")
            .delete()
            .eq('from_user_id', currentUserId);

        if (deleteError) throw deleteError;

        const { data, error } = await supabaseClient
            .from("dedications")
            .insert([{
                from_user_id: currentUserId,
                to_user_id: toUserId,
                song_id: track.id,
                song_name: track.name,
                song_artists: track.artists.join(", "),
                song_image: track.image
            }]);

        console.log("toUserId:", toUserId, typeof toUserId);
        console.log("track:", track);

        if (error) throw error;

        alert(`"${track.name}" dedicada para o parceiro!`);
    } catch (err) {
        console.error("Erro ao dedicar música:", err);
        alert("Erro ao dedicar música. Veja o console.");
    }
}

function animarElemento(el, delay = 0) {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";

    setTimeout(() => {
        el.style.transition = "all 0.4s ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
    }, delay);
}