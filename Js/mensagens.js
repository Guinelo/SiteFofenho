import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://nvjtpcgemgtginudzhuh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52anRwY2dlbWd0Z2ludWR6aHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzcwOTcsImV4cCI6MjA4OTU1MzA5N30.weKoS-Ucasf126enYAjU6cDFGFBr9UgWXE493ZQYgz8";
const supabase = createClient(supabaseUrl, supabaseKey);

const currentUserId = Number(localStorage.getItem("userId"));
const userName = localStorage.getItem("userName");

if (!currentUserId) window.location.href = "login.html";

document.getElementById("welcome").textContent = `Olá, ${userName}`;
document.getElementById("logout").onclick = () => {
    localStorage.removeItem("profile");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    window.location.href = "login.html";
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

const messagesList = document.getElementById("messagesList");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

async function loadSentMessages() {
    try {
        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("from_user_id", currentUserId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Erro ao carregar mensagens enviadas:", error);
            return;
        }

        messagesList.innerHTML = data
            .map(msg => `
                <div class="message">
                    <div class="message-text">
                        <strong>De ${msg.user_name}:</strong> ${msg.content}
                    </div>

                    <div class="message-footer">
                        <span class="timestamp">${new Date(msg.created_at).toLocaleString()}</span>
                        <button class="delete-btn" data-id="${msg.id}">Apagar</button>
                    </div>
                </div>
            `).join("");

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", () => {
                const id = button.getAttribute("data-id");
                deleteMessage(id);
            });
        });

        animarMensagens();

    } catch (err) {
        console.error("Erro ao carregar mensagens enviadas:", err);
    }
}

messageForm.onsubmit = async (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    if (!content) return;

    const toUserId = currentUserId === 1 ? 2 : 1;

    try {
        const { error } = await supabase.from("messages").insert([
            {
                from_user_id: currentUserId,
                to_user_id: toUserId,
                user_name: userName,
                content
            }
        ]);

        if (error) {
            console.error("Erro ao enviar mensagem:", error);
            return;
        }

        messageInput.value = "";
        loadSentMessages();
    } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
    }
};

window.deleteMessage = async (id) => {
    const confirmDelete = confirm("Tem certeza que deseja apagar esta mensagem?");
    if (!confirmDelete) return;

    try {
        const { error } = await supabase
            .from("messages")
            .delete()
            .eq("id", id)
            .eq("from_user_id", currentUserId);

        if (error) {
            console.error("Erro ao apagar mensagem:", error);
            return;
        }

        loadSentMessages();
    } catch (err) {
        console.error("Erro ao apagar mensagem:", err);
    }
};

loadSentMessages();
animarContainerMensagens();

function animarContainerMensagens() {
    const container = document.querySelector(".messages-container");
    if (!container) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                container.classList.add("show");
                obs.unobserve(container);
            }
        });
    }, { threshold: 0.2 });

    observer.observe(container);
}

function animarMensagens() {
    const mensagens = document.querySelectorAll(".message");

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    mensagens.forEach(msg => observer.observe(msg));
}