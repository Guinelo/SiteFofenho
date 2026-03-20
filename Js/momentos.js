import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
    "https://nvjtpcgemgtginudzhuh.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52anRwY2dlbWd0Z2ludWR6aHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzcwOTcsImV4cCI6MjA4OTU1MzA5N30.weKoS-Ucasf126enYAjU6cDFGFBr9UgWXE493ZQYgz8"
);

const currentUserId = Number(localStorage.getItem("userId"));
const userName = localStorage.getItem("userName");

if (!currentUserId) window.location.href = "login.html";

const targetUserId = currentUserId === 1 ? 2 : 1;

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

const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const captionInput = document.getElementById("caption");
const postBtn = document.getElementById("postBtn");
const momentosDiv = document.getElementById("momentos");

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return preview.style.display = "none";

    const reader = new FileReader();
    reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = "block";
    };
    reader.readAsDataURL(file);
});

postBtn.onclick = async () => {
    const file = imageInput.files[0];
    const caption = captionInput.value;
    if (!file) return alert("Escolha uma imagem!");

    const safeName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9.]/g, "_");
    const fileName = Date.now() + "-" + safeName;

    const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, file, {
            metadata: { owner: currentUserId.toString() }
        });

    if (uploadError) return alert("Erro ao enviar imagem");

    const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

    const nowUTC = new Date().toISOString();

    const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
            image_url: urlData.publicUrl,
            caption,
            created_by: currentUserId,
            file_name: fileName,
            created_at: nowUTC
        })
        .select()
        .single();

    if (postError) return alert("Erro ao salvar post");

    const { error: linkError } = await supabase
        .from("user_posts")
        .insert({
            user_id: targetUserId,
            post_id: post.id
        });

    if (linkError) return alert("Erro ao enviar para o usuário");

    imageInput.value = "";
    preview.style.display = "none";
    captionInput.value = "";

    alert("Enviado ❤️");

    carregarMeusMomentos();
};

async function carregarMeusMomentos() {
    try {
        const { data, error } = await supabase
            .from("user_posts")
            .select(`
                post_id,
                posts (
                    id,
                    image_url,
                    caption,
                    created_at,
                    created_by,
                    file_name
                )
            `)
            .order("created_at", { ascending: false, foreignTable: "posts" });

        if (error) throw error;

        momentosDiv.innerHTML = "<h2>Seus momentos enviados:</h2>";

        const meusPosts = data.filter(item => item.posts.created_by === currentUserId);

        if (!meusPosts || meusPosts.length === 0) {
            momentosDiv.innerHTML += "<p>Você ainda não enviou nada.</p>";
            return;
        }

        meusPosts.forEach((item) => {
            const post = item.posts;
            const card = document.createElement("div");
            card.classList.add("momento-card");

            card.innerHTML = `
                <img src="${post.image_url}" width="250">
                <p>${post.caption}</p>
                <small>${new Date(post.created_at).toLocaleString()}</small>
            `;

            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("delete-btn");
            deleteBtn.innerHTML = `
                <span class="material-symbols-outlined">delete</span>
                Excluir
            `;

            deleteBtn.style.marginTop = "5px";

            deleteBtn.onclick = async () => {
                if (!confirm("Tem certeza que deseja apagar?")) return;
                await deletarPost(post.id, post.file_name, card);
            };

            card.appendChild(deleteBtn);
            momentosDiv.appendChild(card);
        });

        aplicarAnimacaoScroll();

    } catch (err) {
        console.error(err);
        momentosDiv.innerHTML = "<p>Erro ao carregar seus momentos.</p>";
    }
}

async function deletarPost(postId, fileName, cardElement) {
    try {
        if (!fileName) {
            console.error("fileName não definido para este post");
            alert("Erro ao apagar: arquivo não encontrado");
            return;
        }

        const { error: relError } = await supabase
            .from("user_posts")
            .delete()
            .eq("post_id", postId);
        if (relError) throw relError;

        const { error: postError } = await supabase
            .from("posts")
            .delete()
            .eq("id", postId);
        if (postError) throw postError;

        const { data: listData, error: listError } = await supabase
            .storage
            .from("images")
            .list();

        if (listError) throw listError;

        const fileExists = listData.some(f => f.name === fileName);
        if (!fileExists) {
            console.warn("Arquivo não encontrado no bucket, ignorando remoção");
        } else {
            const { error: storageError } = await supabase
                .storage
                .from("images")
                .remove([fileName]);
            if (storageError) throw storageError;
        }

        cardElement.remove();
        alert("Post apagado com sucesso!");

    } catch (err) {
        console.error("Erro ao deletar post:", err);
        alert("Erro ao apagar o post");
    }
}

carregarMeusMomentos();

function aplicarAnimacaoScroll() {
    const elementos = document.querySelectorAll(".momento-card, .date-separator");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15
    });

    elementos.forEach(el => observer.observe(el));
}

function animarPostBox() {
    const box = document.querySelector(".post-box");
    if (!box) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                box.classList.add("show");
                obs.unobserve(box);
            }
        });
    }, {
        threshold: 0.2
    });

    observer.observe(box);
}

animarPostBox();