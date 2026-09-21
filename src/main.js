const SUPABASE_URL = "https://lkirrwcajisknzshdxop.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0KCurhCXb3YEFDeXTRw-OQ_kefVS921";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 1. MANAJEMEN SESI & OTENTIKASI NAVBAR
// ==========================================
async function checkAuthState() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  const authContainer = document.getElementById("navbar-auth");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  // Sinkonisasi nama file 'ajukan-klaim.html' dengan huruf K
  const protectedPages = [
    "profil.html",
    "riwayat.html",
    "lapor-hilang.html",
    "lapor-temuan.html",
    "tinjau-klaim.html",
    "ajukan-klaim.html",
  ];

  if (!session) {
    if (protectedPages.includes(currentPage)) {
      window.location.href = "login.html";
      return;
    }
    if (authContainer) {
      authContainer.innerHTML = `
        <a href="register.html" class="text-primary-dark border border-primary-dark hover:bg-primary-soft font-semibold py-2.5 px-6 rounded-lg transition text-sm">Daftar</a>
        <a href="login.html" class="bg-primary-dark hover:bg-primary-pressed text-white font-semibold py-2.5 px-6 rounded-lg transition text-sm">Masuk</a>
      `;
    }
    return;
  }

  if (authContainer) {
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    const userName = profile?.full_name || session.user.email.split("@")[0];
    const initial = userName.charAt(0).toUpperCase();

    authContainer.innerHTML = `
      <div class="flex items-center gap-4">
        <button class="relative text-gray-500 hover:text-primary-dark transition p-1 focus:outline-none">
          <i data-feather="bell" class="w-5 h-5"></i>
          <span class="absolute top-1 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-white"></span>
        </button>
        <div class="w-px h-6 bg-gray-200"></div>
        <a href="profil.html" class="flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-primary-dark transition">
          <div class="w-8 h-8 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-xs">${initial}</div>
          <span class="hidden sm:block">${userName}</span>
        </a>
        <button id="btn-logout" class="text-xs text-danger font-semibold border border-danger-soft px-3 py-1.5 rounded-lg hover:bg-danger-soft transition ml-2">Keluar</button>
      </div>
    `;

    if (typeof feather !== "undefined") feather.replace();

    document
      .getElementById("btn-logout")
      ?.addEventListener("click", async () => {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
      });

    if (currentPage === "profil.html") {
      const namaInput = document.querySelector('input[value="Raka M."]');
      const emailInput = document.querySelector(
        'input[value="raka@upnjatim.ac.id"]',
      );
      if (namaInput) namaInput.value = userName;
      if (emailInput) emailInput.value = session.user.email;
    }
  }
}

// ==========================================
// 2. REGISTER & LOGIN FORMS
// ==========================================
function setupAuthForms() {
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("reg-name").value.trim();
      const nim = document.getElementById("reg-nim").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-password").value;
      const errorBox = document.getElementById("reg-error");
      const btnSubmit = document.getElementById("btn-submit");

      errorBox.classList.add("hidden");
      if (!email.toLowerCase().endsWith(".ac.id")) {
        errorBox.innerText =
          "Pendaftaran wajib menggunakan email akademisi (.ac.id)";
        errorBox.classList.remove("hidden");
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.innerHTML = "<span>Mendaftarkan...</span>";

      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, nim_nip: nim } },
        });
        if (error) throw error;

        if (data.user) {
          await supabaseClient
            .from("profiles")
            .insert([{ id: data.user.id, full_name: name, email: email }]);
        }

        alert("Pendaftaran berhasil! Silakan masuk.");
        window.location.href = "login.html";
      } catch (err) {
        errorBox.innerText = err.message || "Terjadi kesalahan saat mendaftar.";
        errorBox.classList.remove("hidden");
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = "<span>Daftar Sekarang</span>";
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      const errorBox = document.getElementById("login-error");
      const btnLogin = document.getElementById("btn-login");

      errorBox.classList.add("hidden");
      btnLogin.disabled = true;
      btnLogin.innerHTML = "<span>Memproses...</span>";

      try {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "index.html";
      } catch (err) {
        errorBox.innerText = "Email atau kata sandi salah.";
        errorBox.classList.remove("hidden");
      } finally {
        btnLogin.disabled = false;
        btnLogin.innerHTML = "<span>Masuk</span>";
      }
    });
  }
}

// ==========================================
// 3. MASTER DATA & UPLOAD
// ==========================================
async function loadMasterData() {
  const catSelect = document.getElementById("lap-kategori");
  const locSelect = document.getElementById("lap-lokasi");
  if (!catSelect && !locSelect) return;

  try {
    const [categoriesRes, locationsRes] = await Promise.all([
      supabaseClient.from("categories").select("*").eq("is_active", true),
      supabaseClient.from("locations").select("*").eq("is_active", true),
    ]);

    if (catSelect && categoriesRes.data) {
      categoriesRes.data.forEach((cat) => {
        catSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
      });
    }

    if (locSelect && locationsRes.data) {
      locationsRes.data.forEach((loc) => {
        locSelect.innerHTML += `<option value="${loc.id}">${loc.name} (${loc.zone_name})</option>`;
      });
    }
  } catch (err) {
    console.error("Gagal memuat master data:", err.message);
  }
}

async function uploadPhotoToStorage(fileInputElement) {
  const file = fileInputElement.files[0];
  if (!file) return null;

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error } = await supabaseClient.storage
    .from("item_photos")
    .upload(fileName, file);
  if (error) throw error;

  const { data: publicUrlData } = supabaseClient.storage
    .from("item_photos")
    .getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

// ==========================================
// 4. LOGIKA FORM LAPORAN (HILANG & TEMUAN)
// ==========================================
function setupReportForms() {
  const formHilang = document.getElementById("form-lapor-hilang");
  const formTemuan = document.getElementById("form-lapor-temuan");

  // 1. Batasi Input Tanggal (Mencegah input tahun 202020 atau masa depan)
  const dateInput = document.getElementById("lap-tanggal");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.max = today; // Maksimal hari ini
    dateInput.min = "2024-01-01"; // Minimal tahun 2024
  }

  // 2. Logika Preview Foto & Hapus Foto
  const fileInput = document.getElementById("lap-foto");
  const previewContainer = document.getElementById("foto-preview-container");
  const previewLink = document.getElementById("foto-preview-link");
  const btnHapusFoto = document.getElementById("btn-hapus-foto");

  if (fileInput && previewContainer) {
    fileInput.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        // Buat URL sementara untuk preview di tab baru
        const fileURL = URL.createObjectURL(file);
        previewLink.href = fileURL;
        previewLink.textContent = file.name;

        previewContainer.classList.remove("hidden");
        previewContainer.classList.add("flex");
        if (typeof feather !== "undefined") feather.replace();
      } else {
        previewContainer.classList.add("hidden");
        previewContainer.classList.remove("flex");
      }
    });

    btnHapusFoto.addEventListener("click", function () {
      fileInput.value = ""; // Kosongkan input file
      previewContainer.classList.add("hidden");
      previewContainer.classList.remove("flex");
    });
  }

  // 3. Event Listener Submit
  if (formHilang) {
    formHilang.addEventListener("submit", async (e) => {
      e.preventDefault();
      await submitReport("lost", formHilang, "lap-error", "btn-submit-laporan");
    });
  }

  if (formTemuan) {
    formTemuan.addEventListener("submit", async (e) => {
      e.preventDefault();
      await submitReport(
        "found",
        formTemuan,
        "lap-error",
        "btn-submit-laporan",
      );
    });
  }
}

async function submitReport(type, formElement, errorBoxId, btnId) {
  const errorBox = document.getElementById(errorBoxId);
  const btnSubmit = document.getElementById(btnId);
  if (errorBox) errorBox.classList.add("hidden");

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = "<span>Menyimpan...</span>";

  try {
    let photoUrl = null;
    const fileInput = document.getElementById("lap-foto");
    if (fileInput && fileInput.files.length > 0) {
      photoUrl = await uploadPhotoToStorage(fileInput);
    }

    const payload = {
      type: type,
      reporter_id: session.user.id,
      item_name: document.getElementById("lap-nama").value.trim(),
      category_id: document.getElementById("lap-kategori").value,
      location_id: document.getElementById("lap-lokasi").value || null,
      detail_location: document
        .getElementById("lap-detail-lokasi")
        .value.trim(),
      event_at: `${document.getElementById("lap-tanggal").value}T${document.getElementById("lap-waktu").value}:00Z`,
      description_public: document.getElementById("lap-deskripsi").value.trim(),
      photo_url: photoUrl,
      status: "active",
    };

    const { error } = await supabaseClient.from("reports").insert([payload]);
    if (error) throw error;

    // REDIRECT PASTI KE HALAMAN RIWAYAT
    window.location.href = "riwayat.html";
  } catch (err) {
    if (errorBox) {
      errorBox.innerText = err.message || "Gagal menyimpan laporan.";
      errorBox.classList.remove("hidden");
    }
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = "<span>Kirim Laporan</span>";
  }
}

// ==========================================
// INISIALISASI
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  checkAuthState();
  setupAuthForms();
  loadMasterData();
  setupReportForms();
});
