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

  // JIKA ADA SESI, KITA LAKUKAN VALIDASI GANDA KE DATABASE
  if (authContainer && session) {
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    // BUG FIX: Jika user di database sudah dihapus tapi sesi di browser masih nyangkut
    if (error || !profile) {
      console.warn(
        "Sesi tidak valid atau user telah dihapus. Memaksa logout...",
      );
      await supabaseClient.auth.signOut();
      window.location.href = "login.html";
      return;
    }

    const userName = profile.full_name || session.user.email.split("@")[0];
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
// 5. DAFTAR LAPORAN (PENCARIAN, FILTER, URUTAN, PAGINASI DINAMIS)
// ==========================================
async function setupDaftarLaporan() {
  const gridContainer = document.getElementById("reports-grid");
  if (!gridContainer) return; // Hanya jalankan di halaman daftar laporan

  let state = {
    search: "",
    categoryId: "all",
    type: "all",
    dateFilter: "all", // "all", "today", "week", atau format tanggal "YYYY-MM-DD"
    sortBy: "desc", // "desc" (terbaru), "asc" (terlama)
    page: 1,
    limit: 6,
    totalData: 0,
  };

  const UI = {
    searchInp: document.getElementById("search-input"),
    clearSearchBtn: document.getElementById("clear-search"),
    catContainer: document.getElementById("filter-kategori"),
    labelCat: document.getElementById("label-kategori"),
    labelJenis: document.getElementById("label-jenis"),
    labelTanggal: document.getElementById("label-tanggal"),
    labelUrutkan: document.getElementById("label-urutkan"),
    btnHariIni: document.getElementById("btn-filter-hari-ini"),
    btnMingguIni: document.getElementById("btn-filter-minggu-ini"),
    inpTanggal: document.getElementById("input-filter-tanggal"),
    btnReset: document.getElementById("btn-reset-filter"),
    infoHasil: document.getElementById("info-hasil"),
    countCurrent: document.getElementById("count-current"),
    countTotal: document.getElementById("count-total"),
    pagContainer: document.getElementById("pagination-container"),
  };

  // 1. Muat Opsi Kategori ke Dropdown
  const loadKategori = async () => {
    const { data } = await supabaseClient
      .from("categories")
      .select("*")
      .eq("is_active", true);
    let html = `<button data-value="all" class="filter-kat-opt w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 text-primary-dark">Semua Kategori</button>`;
    if (data) {
      data.forEach((cat) => {
        html += `<button data-value="${cat.id}" class="filter-kat-opt w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 text-text-primary">${cat.name}</button>`;
      });
    }
    UI.catContainer.innerHTML = html;

    // Pasang listener kategori
    document.querySelectorAll(".filter-kat-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.categoryId = btn.dataset.value;
        state.page = 1;
        UI.labelCat.innerText = btn.innerText;
        document.querySelectorAll(".filter-kat-opt").forEach((b) => {
          b.classList.remove("text-primary-dark");
          b.classList.add("text-text-primary");
        });
        btn.classList.add("text-primary-dark");
        if (activeDropdown) {
          activeDropdown.classList.add("opacity-0", "invisible");
          activeDropdown = null;
        }
        updateResetButton();
        fetchData();
      });
    });
  };

  // 2. Fetch Data Utama
  const fetchData = async () => {
    gridContainer.innerHTML = `<div class="col-span-full text-center py-10"><p class="text-text-secondary">Memuat data...</p></div>`;

    let query = supabaseClient
      .from("reports")
      .select(`*, categories(name), locations(name)`, { count: "exact" })
      .eq("status", "active");

    // Filter Search
    if (state.search) query = query.ilike("item_name", `%${state.search}%`);

    // Filter Kategori
    if (state.categoryId !== "all")
      query = query.eq("category_id", state.categoryId);

    // Filter Jenis
    if (state.type !== "all") query = query.eq("type", state.type);

    // Filter Tanggal berdasarkan created_at
    if (state.dateFilter !== "all") {
      const today = new Date();
      if (state.dateFilter === "today") {
        query = query.gte(
          "created_at",
          today.toISOString().split("T")[0] + "T00:00:00Z",
        );
      } else if (state.dateFilter === "week") {
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte("created_at", lastWeek.toISOString());
      } else {
        // Tanggal spesifik
        query = query
          .gte("created_at", state.dateFilter + "T00:00:00Z")
          .lt("created_at", state.dateFilter + "T23:59:59Z");
      }
    }

    // Urutkan
    query = query.order("created_at", { ascending: state.sortBy === "asc" });

    // Paginasi
    const from = (state.page - 1) * state.limit;
    const to = from + state.limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      gridContainer.innerHTML = `<div class="col-span-full text-center text-danger py-10">Gagal memuat data.</div>`;
      return;
    }

    state.totalData = count || 0;
    renderGrid(data);
    renderPagination();
  };

  // 3. Render Card
  const renderGrid = (data) => {
    if (data.length === 0) {
      gridContainer.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><i data-feather="inbox" class="w-8 h-8 text-gray-400"></i></div>
        <h3 class="text-lg font-bold text-text-primary mb-1">Belum ada laporan yang tersedia</h3>
        <p class="text-sm text-text-secondary">Cobalah mengubah filter pencarian Anda.</p>
      </div>`;
      UI.infoHasil.classList.add("hidden");
      if (typeof feather !== "undefined") feather.replace();
      return;
    }

    gridContainer.innerHTML = data
      .map((report) => {
        const isLost = report.type === "lost";
        const dateObj = new Date(report.event_at);
        const formattedDate = dateObj.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const fallbackImg =
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5YXUigGfVdNtNMxlAAs6CnJnRW3qUR0I86vaIWN9YuyqfTX3NCpCLhI_-&s=10";

        return `
        <div class="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-md shadow-sm">
          <div class="flex items-center gap-1.5 mb-3">
            <span class="w-2 h-2 rounded-full ${isLost ? "bg-danger" : "bg-success"}"></span>
            <span class="text-xs font-bold ${isLost ? "text-danger" : "text-success"} uppercase tracking-wider">${isLost ? "Barang Hilang" : "Barang Ditemukan"}</span>
          </div>
          <img src="${report.photo_url || fallbackImg}" alt="${report.item_name}" class="w-full h-44 object-cover rounded-xl mb-5 bg-surface" />
          <h3 class="text-lg font-bold text-text-primary truncate mb-3">${report.item_name}</h3>
          <div class="flex items-center gap-2 text-xs text-gray-500 mb-2"><i data-feather="tag" class="w-3.5 h-3.5"></i> ${report.categories?.name || "Lainnya"}</div>
          <div class="flex items-center gap-2 text-xs text-gray-500 mb-2"><i data-feather="map-pin" class="w-3.5 h-3.5"></i> ${report.locations?.name || "Tidak diketahui"}</div>
          <div class="flex items-center gap-2 text-xs text-gray-500 mb-4"><i data-feather="calendar" class="w-3.5 h-3.5"></i> ${formattedDate}</div>
          <p class="text-xs text-gray-500 line-clamp-2 mb-6 leading-relaxed">${report.description_public || "-"}</p>
          <a href="detail-laporan.html?id=${report.id}" class="mt-auto w-full border border-gray-200 text-text-primary font-semibold py-2.5 rounded-xl text-center hover:border-primary-dark hover:text-primary-dark transition text-sm block">Lihat Detail</a>
        </div>
      `;
      })
      .join("");

    UI.infoHasil.classList.remove("hidden");
    UI.countCurrent.innerText = data.length;
    UI.countTotal.innerText = state.totalData;
    if (typeof feather !== "undefined") feather.replace();
  };

  // 4. Render Paginasi
  const renderPagination = () => {
    const totalPages = Math.ceil(state.totalData / state.limit);
    if (totalPages <= 1) {
      UI.pagContainer.classList.add("hidden");
      return;
    }

    UI.pagContainer.classList.remove("hidden");
    let html = `
      <button onclick="changePage(${state.page - 1})" class="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 ${state.page === 1 ? "text-gray-300 cursor-not-allowed" : "text-text-secondary hover:bg-surface"} transition" ${state.page === 1 ? "disabled" : ""}>
        <i data-feather="chevron-left" class="w-4 h-4"></i>
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button onclick="changePage(${i})" class="w-10 h-10 flex items-center justify-center rounded-xl font-semibold transition ${i === state.page ? "bg-primary-dark text-white shadow-sm" : "text-text-secondary hover:bg-surface"}">
          ${i}
        </button>
      `;
    }

    html += `
      <button onclick="changePage(${state.page + 1})" class="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 ${state.page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-text-secondary hover:bg-surface"} transition" ${state.page === totalPages ? "disabled" : ""}>
        <i data-feather="chevron-right" class="w-4 h-4"></i>
      </button>
    `;
    UI.pagContainer.innerHTML = html;
    if (typeof feather !== "undefined") feather.replace();
  };

  window.changePage = (newPage) => {
    const totalPages = Math.ceil(state.totalData / state.limit);
    if (newPage >= 1 && newPage <= totalPages) {
      state.page = newPage;
      fetchData();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // 5. Setup Listeners
  let searchTimeout;
  UI.searchInp.addEventListener("input", (e) => {
    state.search = e.target.value;
    state.page = 1;
    UI.clearSearchBtn.classList.toggle("hidden", state.search.length === 0);
    updateResetButton();
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchData, 500); // Debounce 500ms
  });

  UI.clearSearchBtn.addEventListener("click", () => {
    UI.searchInp.value = "";
    state.search = "";
    state.page = 1;
    UI.clearSearchBtn.classList.add("hidden");
    updateResetButton();
    fetchData();
  });

  // Listener Jenis
  document.querySelectorAll(".filter-jenis-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.type = btn.dataset.value;
      state.page = 1;
      UI.labelJenis.innerText = btn.innerText;
      document.querySelectorAll(".filter-jenis-opt").forEach((b) => {
        b.classList.remove("text-primary-dark");
        b.classList.add("text-text-primary");
      });
      btn.classList.add("text-primary-dark");
      if (activeDropdown) {
        activeDropdown.classList.add("opacity-0", "invisible");
        activeDropdown = null;
      }
      updateResetButton();
      fetchData();
    });
  });

  // Listener Urutkan
  document.querySelectorAll(".filter-urutkan-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sortBy = btn.dataset.value;
      state.page = 1;
      UI.labelUrutkan.innerText = btn.innerText;
      document.querySelectorAll(".filter-urutkan-opt").forEach((b) => {
        b.classList.remove("text-primary-dark");
        b.classList.add("text-text-primary");
      });
      btn.classList.add("text-primary-dark");
      if (activeDropdown) {
        activeDropdown.classList.add("opacity-0", "invisible");
        activeDropdown = null;
      }
      fetchData(); // Tidak perlu trigger reset button karena ini cuma urutan
    });
  });

  // Listener Tanggal
  const setTanggal = (val, label) => {
    state.dateFilter = val;
    state.page = 1;
    UI.labelTanggal.innerText = label;
    if (activeDropdown) {
      activeDropdown.classList.add("opacity-0", "invisible");
      activeDropdown = null;
    }
    updateResetButton();
    fetchData();
  };

  UI.btnHariIni.addEventListener("click", () =>
    setTanggal("today", "Hari ini"),
  );
  UI.btnMingguIni.addEventListener("click", () =>
    setTanggal("week", "Minggu ini"),
  );
  UI.inpTanggal.addEventListener("change", (e) => {
    if (e.target.value) setTanggal(e.target.value, e.target.value);
  });

  // Tombol Reset
  const updateResetButton = () => {
    const isFiltered =
      state.search ||
      state.categoryId !== "all" ||
      state.type !== "all" ||
      state.dateFilter !== "all";
    UI.btnReset.classList.toggle("hidden", !isFiltered);
  };

  UI.btnReset.addEventListener("click", () => {
    state = {
      ...state,
      search: "",
      categoryId: "all",
      type: "all",
      dateFilter: "all",
      page: 1,
    };
    UI.searchInp.value = "";
    UI.clearSearchBtn.classList.add("hidden");
    UI.labelCat.innerText = "Semua Kategori";
    UI.labelJenis.innerText = "Semua Jenis";
    UI.labelTanggal.innerText = "Semua Waktu";
    UI.inpTanggal.value = "";
    document
      .querySelectorAll(".filter-kat-opt, .filter-jenis-opt")
      .forEach((b) => {
        b.dataset.value === "all"
          ? b.classList.add("text-primary-dark")
          : b.classList.remove("text-primary-dark");
      });
    updateResetButton();
    fetchData();
  });

  // Init
  await loadKategori();
  fetchData();
}

// ==========================================
// 6. LOGIKA HALAMAN PROFIL
// ==========================================
// ==========================================
// 6. LOGIKA HALAMAN PROFIL
// ==========================================
async function setupProfilPage() {
  const formProfil = document.getElementById("form-profil");
  if (!formProfil) return; // Hanya jalankan jika ada di halaman profil

  const fileInput = document.getElementById("profil-foto");
  const avatarImg = document.getElementById("avatar-image");
  const avatarInit = document.getElementById("avatar-initial");
  const btnHapusAvatar = document.getElementById("btn-hapus-avatar");
  const waInput = document.getElementById("profil-wa");
  const btnSubmit = document.getElementById("btn-submit-profil");
  const notifBox = document.getElementById("profil-notif");

  // Input Nama dan Email
  const namaInput = document.getElementById("profil-nama");
  const emailInput = document.getElementById("profil-email");

  let isPhotoRemoved = false; // Flag penanda jika user klik Hapus Foto

  // A. Ambil Data Profil Saat Ini
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) return;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (profile) {
    // 1. Isi Nama dan Email
    if (namaInput)
      namaInput.value = profile.full_name || session.user.email.split("@")[0];
    if (emailInput) emailInput.value = session.user.email;

    // 2. Tampilkan WA
    if (profile.whatsapp) {
      let waStr = profile.whatsapp.toString();
      if (waStr.startsWith("0")) waStr = waStr.substring(1);
      if (waStr.startsWith("62")) waStr = waStr.substring(2);
      waInput.value = waStr;
    }

    // 3. Tampilkan Foto
    if (profile.photo_url) {
      avatarImg.src = profile.photo_url;
      avatarImg.classList.remove("hidden");
      avatarInit.classList.add("hidden");
      btnHapusAvatar.classList.remove("hidden");
    } else {
      avatarInit.innerText = (profile.full_name || session.user.email)
        .charAt(0)
        .toUpperCase();
    }
  }

  // B. Preview Foto Lokal Saat Upload
  let newPhotoFile = null;
  fileInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      newPhotoFile = file;
      isPhotoRemoved = false; // Batalkan niat hapus jika upload baru
      avatarImg.src = URL.createObjectURL(file);
      avatarImg.classList.remove("hidden");
      avatarInit.classList.add("hidden");
      btnHapusAvatar.classList.remove("hidden");
    }
  });

  // C. Tombol Hapus Foto (Tong Sampah)
  btnHapusAvatar.addEventListener("click", function () {
    if (
      confirm(
        "Hapus foto profil? Anda harus klik 'Simpan Perubahan' agar foto benar-benar terhapus.",
      )
    ) {
      fileInput.value = ""; // Kosongkan input file
      newPhotoFile = null;
      isPhotoRemoved = true; // Tandai untuk dihapus di database

      avatarImg.src = "";
      avatarImg.classList.add("hidden");
      btnHapusAvatar.classList.add("hidden");
      avatarInit.classList.remove("hidden");
    }
  });

  // D. Simpan Perubahan ke Supabase
  formProfil.addEventListener("submit", async (e) => {
    e.preventDefault();
    notifBox.classList.add("hidden");
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Menyimpan...";

    try {
      let finalPhotoUrl = profile.photo_url;

      // Jika user klik hapus foto, URL jadi null
      if (isPhotoRemoved) {
        finalPhotoUrl = null;
      }
      // Jika ada upload foto baru
      else if (newPhotoFile) {
        const fileExt = newPhotoFile.name.split(".").pop();
        const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;

        const { error: uploadErr } = await supabaseClient.storage
          .from("avatars")
          .upload(fileName, newPhotoFile, { upsert: true });

        if (uploadErr) throw new Error("Gagal mengunggah foto profil.");

        const { data: publicUrlData } = supabaseClient.storage
          .from("avatars")
          .getPublicUrl(fileName);

        finalPhotoUrl = publicUrlData.publicUrl;
      }

      // Format ulang WA
      let finalWa = waInput.value.trim();
      if (finalWa.startsWith("0")) finalWa = finalWa.substring(1);
      finalWa = "62" + finalWa;

      // Update tabel profiles
      const { error: updateErr } = await supabaseClient
        .from("profiles")
        .update({
          whatsapp: finalWa,
          photo_url: finalPhotoUrl,
        })
        .eq("id", session.user.id);

      if (updateErr) throw updateErr;

      // Notifikasi Berhasil (Snackbar)
      notifBox.innerText = "Profil berhasil diperbarui!";
      notifBox.className =
        "mb-6 p-4 rounded-xl text-sm font-semibold border bg-success-soft text-on-success-soft border-green-200 block";

      checkAuthState(); // Refresh nama/foto di navbar
    } catch (error) {
      notifBox.innerText = error.message || "Terjadi kesalahan saat menyimpan.";
      notifBox.className =
        "mb-6 p-4 rounded-xl text-sm font-semibold border bg-danger-soft text-on-danger-soft border-red-200 block";
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerText = "Simpan Perubahan";
      setTimeout(() => notifBox.classList.add("hidden"), 4000);
    }
  });
}

// ==========================================
// 7. LOGIKA RIWAYAT LAPORAN (DINAMIS)
// ==========================================
async function setupRiwayatLaporan() {
  const panelHilang = document.getElementById("panel-hilang");
  const panelTemuan = document.getElementById("panel-temuan");
  if (!panelHilang || !panelTemuan) return;

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) return;

  // Render Skeleton UI
  const skeleton = `<div class="text-center py-10"><p class="text-text-secondary">Memuat data...</p></div>`;
  panelHilang.innerHTML = skeleton;
  panelTemuan.innerHTML = skeleton;

  try {
    // A. Ambil semua laporan user (lost & found)
    const { data: myReports, error } = await supabaseClient
      .from("reports")
      .select(`*, locations(name)`)
      .eq("reporter_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const lostReports = myReports.filter((r) => r.type === "lost");
    const foundReports = myReports.filter((r) => r.type === "found");

    // B. RENDER LAPORAN KEHILANGAN (LOST)
    if (lostReports.length === 0) {
      panelHilang.innerHTML = `<div class="text-center py-10 bg-surface rounded-xl border border-gray-200"><p class="text-text-secondary">Anda belum membuat laporan kehilangan.</p></div>`;
    } else {
      let lostHtml = "";
      for (const report of lostReports) {
        // Cek status klaim dari user ini
        const { data: claims } = await supabaseClient
          .from("claims")
          .select("status")
          .eq("lost_report_id", report.id)
          .limit(1);

        let badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="search" class="w-3.5 h-3.5"></i> Sedang Dicari</span>`;

        if (claims && claims.length > 0) {
          const status = claims[0].status;
          if (status === "pending") {
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-warning-soft text-on-warning-soft text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="clock" class="w-3.5 h-3.5"></i> Menunggu Verifikasi</span>`;
          } else if (status === "approved") {
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-primary-soft text-on-primary-soft text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="package" class="w-3.5 h-3.5"></i> Pengembalian Diproses</span>`;
          } else if (status === "completed") {
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-success-soft text-success text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="check-circle" class="w-3.5 h-3.5"></i> Selesai Dikembalikan</span>`;
          }
        } else {
          // Jika belum ada klaim, cek potensi kecocokan di tabel matches
          const { data: matches } = await supabaseClient
            .from("matches")
            .select("id")
            .eq("lost_report_id", report.id)
            .limit(1);

          if (matches && matches.length > 0) {
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-info-soft text-on-info-soft text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="sparkles" class="w-3.5 h-3.5"></i> Potensi Kecocokan</span>`;
          }
        }

        const dateStr = new Date(report.event_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const fallbackImg =
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5YXUigGfVdNtNMxlAAs6CnJnRW3qUR0I86vaIWN9YuyqfTX3NCpCLhI_-&s=10";

        lostHtml += `
          <div class="bg-white border border-gray-200 rounded-[20px] p-4 flex flex-col sm:flex-row gap-5 hover:border-gray-300 transition-all hover:shadow-sm">
            <img src="${report.photo_url || fallbackImg}" alt="Foto" class="w-full sm:w-[160px] h-[120px] object-cover rounded-xl shrink-0 bg-surface" />
            <div class="flex-grow flex flex-col justify-center">
              <h3 class="text-lg font-bold text-text-primary truncate max-w-[250px] md:max-w-[400px] mb-1.5">${report.item_name}</h3>
              <div class="flex items-center gap-3 text-sm text-text-secondary mb-3">
                <span class="flex items-center gap-1"><i data-feather="calendar" class="w-3.5 h-3.5"></i> ${dateStr}</span>
                <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                <span class="flex items-center gap-1"><i data-feather="map-pin" class="w-3.5 h-3.5"></i> ${report.locations?.name || "Tidak diketahui"}</span>
              </div>
              <div>${badgeHtml}</div>
            </div>
            <div class="sm:border-l border-gray-100 sm:pl-5 flex flex-col justify-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
              <a href="detail-laporan.html?id=${report.id}" class="w-full sm:w-auto text-center border border-gray-200 hover:bg-surface text-text-primary font-semibold py-2.5 px-6 rounded-xl transition text-sm block">Lihat Laporan</a>
            </div>
          </div>
        `;
      }
      panelHilang.innerHTML = lostHtml;
    }

    // C. RENDER LAPORAN PENEMUAN (FOUND)
    if (foundReports.length === 0) {
      panelTemuan.innerHTML = `<div class="text-center py-10 bg-surface rounded-xl border border-gray-200"><p class="text-text-secondary">Anda belum membuat laporan penemuan.</p></div>`;
    } else {
      let foundHtml = "";
      for (const report of foundReports) {
        // Cek status klaim yang MASUK ke laporan temuan ini
        const { data: claims } = await supabaseClient
          .from("claims")
          .select("status")
          .eq("found_report_id", report.id)
          .limit(1);

        let badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="clock" class="w-3.5 h-3.5"></i> Menunggu Pemilik</span>`;
        let actionBtn = `<a href="detail-laporan.html?id=${report.id}" class="w-full sm:w-auto text-center border border-gray-200 hover:bg-surface text-text-primary font-semibold py-2.5 px-6 rounded-xl transition text-sm block">Lihat Laporan</a>`;

        if (claims && claims.length > 0) {
          const status = claims[0].status;
          if (status === "pending") {
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-warning-soft text-on-warning-soft text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="alert-circle" class="w-3.5 h-3.5"></i> Menunggu Verifikasi</span>`;
            actionBtn = `<a href="tinjau-klaim.html?id=${report.id}" class="w-full sm:w-auto text-center bg-primary-dark hover:bg-primary-pressed text-white font-semibold py-2.5 px-6 rounded-xl transition text-sm shadow-sm block">Tinjau Klaim</a>`;
          } else if (status === "approved") {
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-primary-soft text-on-primary-soft text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="package" class="w-3.5 h-3.5"></i> Pengembalian Diproses</span>`;
          } else if (status === "completed") {
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-success-soft text-success text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="check-circle" class="w-3.5 h-3.5"></i> Selesai Dikembalikan</span>`;
          }
        }

        const dateStr = new Date(report.event_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const fallbackImg =
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5YXUigGfVdNtNMxlAAs6CnJnRW3qUR0I86vaIWN9YuyqfTX3NCpCLhI_-&s=10";

        foundHtml += `
          <div class="bg-white border border-gray-200 rounded-[20px] p-4 flex flex-col sm:flex-row gap-5 hover:border-gray-300 transition-all hover:shadow-sm">
            <img src="${report.photo_url || fallbackImg}" alt="Foto" class="w-full sm:w-[160px] h-[120px] object-cover rounded-xl shrink-0 bg-surface" />
            <div class="flex-grow flex flex-col justify-center">
              <h3 class="text-lg font-bold text-text-primary truncate max-w-[250px] md:max-w-[400px] mb-1.5">${report.item_name}</h3>
              <div class="flex items-center gap-3 text-sm text-text-secondary mb-3">
                <span class="flex items-center gap-1"><i data-feather="calendar" class="w-3.5 h-3.5"></i> ${dateStr}</span>
                <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                <span class="flex items-center gap-1"><i data-feather="map-pin" class="w-3.5 h-3.5"></i> ${report.locations?.name || "Tidak diketahui"}</span>
              </div>
              <div>${badgeHtml}</div>
            </div>
            <div class="sm:border-l border-gray-100 sm:pl-5 flex flex-col justify-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
              ${actionBtn}
            </div>
          </div>
        `;
      }
      panelTemuan.innerHTML = foundHtml;
    }

    if (typeof feather !== "undefined") feather.replace();
  } catch (error) {
    console.error(error);
    panelHilang.innerHTML = `<div class="text-center py-10 text-danger border border-red-200 bg-danger-soft rounded-xl">Gagal memuat data laporan.</div>`;
    panelTemuan.innerHTML = `<div class="text-center py-10 text-danger border border-red-200 bg-danger-soft rounded-xl">Gagal memuat data laporan.</div>`;
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
  setupDaftarLaporan();
  setupProfilPage();
  setupRiwayatLaporan();
});
