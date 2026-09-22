/* INIT SUPABASE */
const SUPABASE_URL = "https://lkirrwcajisknzshdxop.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0KCurhCXb3YEFDeXTRw-OQ_kefVS921";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* PRE-AUTH CHECK (Cegah FOUC) */
(function blockUnauthorizedAccess() {
  try {
    const protectedPages = [
      "profil",
      "riwayat",
      "lapor-hilang",
      "lapor-temuan",
      "tinjau-klaim",
      "ajukan-claim",
      "notifikasi",
    ];
    let rawPage = window.location.pathname.split("/").pop() || "index";
    let currentPage = rawPage.split("?")[0].split("#")[0].replace(".html", "");
    const session = localStorage.getItem("sb-lkirrwcajisknzshdxop-auth-token");
    if (protectedPages.includes(currentPage) && !session)
      window.location.replace("login.html");
  } catch (e) {}
})();

/* HELPER SCROLL */
function scrollToElement(elementId) {
  const el = document.getElementById(elementId);
  if (el && !el.classList.contains("hidden")) {
    const y = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

/* AUTH NAVBAR & NOTIFIKASI DROPDOWN */
async function checkAuthState() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  const authContainer = document.getElementById("navbar-auth");
  const mobileAuthContainer = document.getElementById("mobile-navbar-auth");

  let rawPage = window.location.pathname.split("/").pop() || "index";
  let currentPage = rawPage.split("?")[0].split("#")[0].replace(".html", "");

  const protectedPages = [
    "profil",
    "riwayat",
    "lapor-hilang",
    "lapor-temuan",
    "tinjau-klaim",
    "ajukan-claim",
    "notifikasi",
  ];

  if (!session) {
    if (protectedPages.includes(currentPage)) {
      window.location.replace("login.html");
      return false;
    }

    if (authContainer)
      authContainer.innerHTML = `<a href="register.html" class="text-primary-dark border border-primary-dark hover:bg-primary-soft font-semibold py-2.5 px-6 rounded-lg transition text-sm">Daftar</a><a href="login.html" class="bg-primary-dark hover:bg-primary-pressed text-white font-semibold py-2.5 px-6 rounded-lg transition text-sm">Masuk</a>`;
    if (mobileAuthContainer)
      mobileAuthContainer.innerHTML = `<a href="register.html" class="text-center text-primary-dark border border-primary-dark hover:bg-primary-soft font-semibold py-3 px-6 rounded-xl transition text-base">Daftar</a><a href="login.html" class="text-center bg-primary-dark hover:bg-primary-pressed text-white font-semibold py-3 px-6 rounded-xl transition text-base">Masuk</a>`;
    return true;
  }

  if (session) {
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();
    if (error || !profile) {
      await supabaseClient.auth.signOut();
      window.location.replace("login.html");
      return false;
    }

    const userName = profile.full_name || session.user.email.split("@")[0];
    const initial = userName.charAt(0).toUpperCase();

    // SUNTIKAN UI POP UP NOTIFIKASI
    if (authContainer) {
      authContainer.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="relative flex items-center">
            <button id="notif-btn" class="relative text-gray-500 hover:text-primary-dark transition p-1 focus:outline-none">
              <i data-feather="bell" class="w-5 h-5"></i>
              <span id="notif-badge" class="hidden absolute top-0.5 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white"></span>
            </button>
            <div id="notif-dropdown" class="absolute top-full right-0 mt-4 w-[340px] bg-white border border-gray-200 rounded-2xl shadow-[0_16px_32px_0px_rgba(0,0,0,0.15)] opacity-0 invisible transform -translate-y-2 transition-all duration-300 z-[100] overflow-hidden flex flex-col">
              <div class="p-4 border-b border-gray-100 bg-surface flex justify-between items-center">
                <span class="font-extrabold text-text-primary text-[15px]">Notifikasi</span>
              </div>
              <div id="notif-dropdown-list" class="max-h-[320px] overflow-y-auto flex flex-col divide-y divide-gray-100">
                <div class="p-6 text-center text-xs text-text-secondary">Memuat...</div>
              </div>
              <a href="notifikasi.html" class="p-3.5 text-center text-[13px] text-primary-dark hover:bg-primary-soft font-bold border-t border-gray-100 block transition">Lihat Semua Notifikasi</a>
            </div>
          </div>
          <div class="w-px h-6 bg-gray-200"></div>
          <a href="profil.html" class="flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-primary-dark transition"><div class="w-8 h-8 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-xs">${initial}</div><span class="hidden sm:block">${userName}</span></a>
          <button id="btn-logout" class="text-xs text-danger font-semibold border border-danger-soft px-3 py-1.5 rounded-lg hover:bg-danger-soft transition ml-2">Keluar</button>
        </div>`;
    }

    if (mobileAuthContainer) {
      mobileAuthContainer.innerHTML = `
        <a href="notifikasi.html" class="flex items-center justify-between bg-surface p-4 rounded-xl border border-gray-100 mb-2 hover:border-primary-dark transition">
          <div class="flex items-center gap-3 text-text-primary font-bold"><i data-feather="bell" class="w-5 h-5 text-gray-500"></i> Notifikasi</div>
          <span id="mobile-notif-badge" class="hidden bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Baru</span>
        </a>
        <a href="profil.html" class="flex items-center gap-3 bg-surface p-3 rounded-xl border border-gray-100 mb-2">
          <div class="w-10 h-10 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center font-bold text-sm shrink-0">${initial}</div>
          <span class="font-bold text-text-primary truncate">${userName}</span>
        </a>
        <button id="btn-logout-mobile" class="w-full text-center text-danger font-semibold border border-danger-soft bg-danger-soft hover:bg-red-200 py-3 px-6 rounded-xl transition text-sm">Keluar Akun</button>
      `;
    }

    if (typeof feather !== "undefined") feather.replace();

    // INIT NOTIF DROPDOWN LOGIC
    initGlobalNotifications(session.user.id);

    const handleLogout = async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "login.html";
    };
    document
      .getElementById("btn-logout")
      ?.addEventListener("click", handleLogout);
    document
      .getElementById("btn-logout-mobile")
      ?.addEventListener("click", handleLogout);
    return true;
  }
}

/* GLOBAL NOTIFICATION DROPDOWN LOGIC */
async function initGlobalNotifications(userId) {
  const notifBtn = document.getElementById("notif-btn");
  const notifDropdown = document.getElementById("notif-dropdown");
  const notifBadge = document.getElementById("notif-badge");
  const notifList = document.getElementById("notif-dropdown-list");
  const mobileNotifBadge = document.getElementById("mobile-notif-badge");

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle("opacity-0");
      notifDropdown.classList.toggle("invisible");
      notifDropdown.classList.toggle("-translate-y-2");
      notifDropdown.classList.toggle("translate-y-0");
    });

    document.addEventListener("click", (e) => {
      if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.add("opacity-0", "invisible", "-translate-y-2");
        notifDropdown.classList.remove("translate-y-0");
      }
    });
  }

  try {
    const { data, error } = await supabaseClient
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    const unreadCount = data.filter((n) => !n.is_read).length;
    if (unreadCount > 0) {
      if (notifBadge) notifBadge.classList.remove("hidden");
      if (mobileNotifBadge) mobileNotifBadge.classList.remove("hidden");
    }

    if (!notifList) return;

    if (data.length === 0) {
      notifList.innerHTML = `<div class="p-8 text-center text-xs text-text-secondary flex flex-col items-center"><i data-feather="bell-off" class="w-6 h-6 text-gray-300 mb-2"></i>Belum ada notifikasi.</div>`;
      if (typeof feather !== "undefined") feather.replace();
      return;
    }

    notifList.innerHTML = data
      .map((n) => {
        const bgClass = n.is_read
          ? "bg-white hover:bg-surface"
          : "bg-info-soft/40 hover:bg-info-soft/70";
        const dotClass = n.is_read ? "hidden" : "block";
        const time = new Date(n.created_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });

        return `
        <a href="${n.link_url || "#"}" data-id="${n.id}" class="notif-item block p-4 transition relative ${bgClass}">
          <span class="${dotClass} w-2 h-2 rounded-full bg-info absolute top-5 right-4"></span>
          <div class="font-bold text-text-primary text-[13px] mb-1.5 pr-4">${n.title}</div>
          <div class="text-xs text-text-secondary mb-2 line-clamp-2 leading-relaxed">${n.message}</div>
          <div class="text-[10px] text-gray-400 font-semibold flex items-center gap-1"><i data-feather="clock" class="w-3 h-3"></i>${time} WIB</div>
        </a>
      `;
      })
      .join("");

    if (typeof feather !== "undefined") feather.replace();

    document.querySelectorAll(".notif-item").forEach((item) => {
      item.addEventListener("click", async (e) => {
        e.preventDefault();
        const href = item.getAttribute("href");
        const id = item.getAttribute("data-id");
        await supabaseClient
          .from("notifications")
          .update({ is_read: true })
          .eq("id", id);
        if (href && href !== "#") window.location.href = href;
      });
    });
  } catch (err) {
    console.error("Gagal memuat notif:", err);
  }
}

/* HALAMAN NOTIFIKASI FULL (PAGINASI) */
async function setupNotifikasiPage() {
  const listContainer = document.getElementById("notifikasi-list");
  const pagContainer = document.getElementById("notif-pagination-container");
  const notifBox = document.getElementById("notifikasi-snackbar");
  if (!listContainer) return;

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) return;

  let page = 1;
  const limit = 10;
  let totalData = 0;

  const fetchFullNotifs = async () => {
    listContainer.innerHTML = `<div class="p-10 text-center text-text-secondary">Memuat notifikasi...</div>`;
    try {
      const { data, count, error } = await supabaseClient
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, (page - 1) * limit + limit - 1);

      if (error) throw error;
      totalData = count || 0;

      if (data.length === 0) {
        listContainer.innerHTML = `<div class="p-16 text-center flex flex-col items-center justify-center"><div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><i data-feather="bell-off" class="w-8 h-8 text-gray-400"></i></div><h3 class="text-lg font-bold text-text-primary mb-1">Belum ada notifikasi</h3><p class="text-sm text-text-secondary">Aktivitas dan pembaruan akan muncul di sini.</p></div>`;
        pagContainer.classList.add("hidden");
        if (typeof feather !== "undefined") feather.replace();
        return;
      }

      listContainer.innerHTML = data
        .map((n) => {
          const bgClass = n.is_read
            ? "bg-white hover:bg-surface"
            : "bg-info-soft/30 hover:bg-info-soft/60";
          const dotClass = n.is_read ? "hidden" : "block";
          const time = new Date(n.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return `
          <a href="${n.link_url || "#"}" data-id="${n.id}" class="notif-page-item flex items-start gap-4 p-5 sm:p-6 transition relative ${bgClass}">
            <div class="w-10 h-10 rounded-full bg-primary-soft text-primary-dark flex items-center justify-center shrink-0 mt-1"><i data-feather="bell" class="w-5 h-5"></i></div>
            <div class="flex-grow pr-6">
              <h4 class="font-bold text-text-primary text-[15px] mb-1.5">${n.title}</h4>
              <p class="text-[14px] text-text-secondary mb-3 leading-relaxed">${n.message}</p>
              <div class="text-[11px] text-gray-400 font-semibold flex items-center gap-1.5"><i data-feather="clock" class="w-3.5 h-3.5"></i> ${time} WIB</div>
            </div>
            <span class="${dotClass} w-2.5 h-2.5 rounded-full bg-info absolute top-8 right-6"></span>
          </a>
        `;
        })
        .join("");

      if (typeof feather !== "undefined") feather.replace();
      renderPagination();

      document.querySelectorAll(".notif-page-item").forEach((item) => {
        item.addEventListener("click", async (e) => {
          e.preventDefault();
          const href = item.getAttribute("href");
          const id = item.getAttribute("data-id");
          await supabaseClient
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id);
          if (href && href !== "#") window.location.href = href;
        });
      });
    } catch (err) {
      listContainer.innerHTML = `<div class="p-10 text-center text-danger font-semibold">Gagal memuat notifikasi.</div>`;
    }
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalData / limit);
    if (totalPages <= 1) {
      pagContainer.classList.add("hidden");
      return;
    }
    pagContainer.classList.remove("hidden");

    let html = `<button onclick="changeNotifPage(${page - 1})" class="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 ${page === 1 ? "text-gray-300 cursor-not-allowed" : "text-text-secondary hover:bg-surface"} transition" ${page === 1 ? "disabled" : ""}><i data-feather="chevron-left" class="w-4 h-4"></i></button>`;
    for (let i = 1; i <= totalPages; i++)
      html += `<button onclick="changeNotifPage(${i})" class="w-10 h-10 flex items-center justify-center rounded-xl font-semibold transition ${i === page ? "bg-primary-dark text-white shadow-sm" : "text-text-secondary hover:bg-surface"}">${i}</button>`;
    html += `<button onclick="changeNotifPage(${page + 1})" class="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 ${page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-text-secondary hover:bg-surface"} transition" ${page === totalPages ? "disabled" : ""}><i data-feather="chevron-right" class="w-4 h-4"></i></button>`;
    pagContainer.innerHTML = html;
    if (typeof feather !== "undefined") feather.replace();
  };

  window.changeNotifPage = (newPage) => {
    const totalPages = Math.ceil(totalData / limit);
    if (newPage >= 1 && newPage <= totalPages) {
      page = newPage;
      fetchFullNotifs();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const btnMarkAll = document.getElementById("btn-confirm-mark-all");
  if (btnMarkAll) {
    btnMarkAll.addEventListener("click", async () => {
      hideModal("modal-mark-all");
      notifBox.classList.remove("hidden");
      notifBox.className =
        "mb-6 p-4 rounded-xl text-sm font-semibold border block bg-info-soft text-on-info-soft border-blue-200";
      notifBox.innerText = "Memproses...";
      scrollToElement("notifikasi-snackbar");
      try {
        const { error } = await supabaseClient
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", session.user.id)
          .eq("is_read", false);
        if (error) throw error;
        notifBox.className =
          "mb-6 p-4 rounded-xl text-sm font-semibold border block bg-success-soft text-on-success-soft border-green-200";
        notifBox.innerText = "Semua notifikasi berhasil ditandai sudah dibaca.";
        scrollToElement("notifikasi-snackbar");
        fetchFullNotifs();
        initGlobalNotifications(session.user.id);
      } catch (err) {
        notifBox.className =
          "mb-6 p-4 rounded-xl text-sm font-semibold border block bg-danger-soft text-on-danger-soft border-red-200";
        notifBox.innerText = "Gagal memproses: " + err.message;
        scrollToElement("notifikasi-snackbar");
      }
    });
  }
  fetchFullNotifs();
}

/* TOGGLE PASSWORD */
function setupPasswordToggle() {
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const input = document.getElementById(targetId);
      const icon = this.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.setAttribute("data-feather", "eye-off");
      } else {
        input.type = "password";
        icon.setAttribute("data-feather", "eye");
      }
      if (typeof feather !== "undefined") feather.replace();
    });
  });
}

/* AUTH FORMS */
function setupAuthForms() {
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("reg-name").value.trim(),
        nim = document.getElementById("reg-nim").value.trim(),
        email = document.getElementById("reg-email").value.trim(),
        password = document.getElementById("reg-password").value,
        errorBox = document.getElementById("reg-error"),
        btnSubmit = document.getElementById("btn-submit");
      errorBox.classList.add("hidden");

      if (!email.toLowerCase().endsWith(".ac.id")) {
        errorBox.innerText =
          "Pendaftaran wajib menggunakan email akademisi (.ac.id)";
        errorBox.classList.remove("hidden");
        scrollToElement("reg-error");
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
        if (data.user)
          await supabaseClient
            .from("profiles")
            .insert([{ id: data.user.id, full_name: name, email: email }]);

        errorBox.classList.remove("hidden", "text-danger");
        errorBox.classList.add(
          "text-success",
          "bg-success-soft",
          "p-3",
          "rounded-lg",
        );
        errorBox.innerText =
          "Pendaftaran berhasil! Mengarahkan ke halaman masuk...";
        scrollToElement("reg-error");
        setTimeout(() => (window.location.href = "login.html"), 2000);
      } catch (err) {
        errorBox.innerText = err.message || "Terjadi kesalahan saat mendaftar.";
        errorBox.classList.remove(
          "hidden",
          "text-success",
          "bg-success-soft",
          "p-3",
          "rounded-lg",
        );
        errorBox.classList.add("text-danger");
        scrollToElement("reg-error");
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = "<span>Daftar Sekarang</span>";
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim(),
        password = document.getElementById("login-password").value,
        errorBox = document.getElementById("login-error"),
        btnLogin = document.getElementById("btn-login");
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
        scrollToElement("login-error");
      } finally {
        btnLogin.disabled = false;
        btnLogin.innerHTML = "<span>Masuk</span>";
      }
    });
  }
}

/* MASTER DATA */
async function loadMasterData() {
  const catSelect = document.getElementById("lap-kategori"),
    locSelect = document.getElementById("lap-lokasi");
  if (!catSelect && !locSelect) return;

  try {
    const [categoriesRes, locationsRes] = await Promise.all([
      supabaseClient.from("categories").select("*").eq("is_active", true),
      supabaseClient.from("locations").select("*").eq("is_active", true),
    ]);
    if (catSelect && categoriesRes.data)
      categoriesRes.data.forEach(
        (cat) =>
          (catSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`),
      );
    if (locSelect && locationsRes.data)
      locationsRes.data.forEach(
        (loc) =>
          (locSelect.innerHTML += `<option value="${loc.id}">${loc.name} (${loc.zone_name})</option>`),
      );
  } catch (err) {
    console.error("Gagal memuat master data:", err.message);
  }
}

/* UPLOAD FOTO */
async function uploadPhotoToStorage(fileInputElement) {
  const file = fileInputElement.files[0];
  if (!file) return null;
  const fileExt = file.name.split(".").pop(),
    fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const { error } = await supabaseClient.storage
    .from("item_photos")
    .upload(fileName, file);
  if (error) throw error;
  const { data: publicUrlData } = supabaseClient.storage
    .from("item_photos")
    .getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

/* SUBMIT LAPORAN */
function setupReportForms() {
  const formHilang = document.getElementById("form-lapor-hilang"),
    formTemuan = document.getElementById("form-lapor-temuan"),
    dateInput = document.getElementById("lap-tanggal");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.max = today;
    dateInput.min = "2024-01-01";
  }

  const fileInput = document.getElementById("lap-foto"),
    previewContainer = document.getElementById("foto-preview-container"),
    previewLink = document.getElementById("foto-preview-link"),
    btnHapusFoto = document.getElementById("btn-hapus-foto");

  if (fileInput && previewContainer) {
    fileInput.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        previewLink.href = URL.createObjectURL(file);
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
      fileInput.value = "";
      previewContainer.classList.add("hidden");
      previewContainer.classList.remove("flex");
    });
  }

  if (formHilang)
    formHilang.addEventListener("submit", async (e) => {
      e.preventDefault();
      await submitReport("lost", formHilang, "lap-error", "btn-submit-laporan");
    });
  if (formTemuan)
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

async function submitReport(type, formElement, errorBoxId, btnId) {
  const errorBox = document.getElementById(errorBoxId),
    btnSubmit = document.getElementById(btnId);
  if (errorBox) errorBox.classList.add("hidden");
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = "<span>Memeriksa Profil...</span>";

  try {
    const { data: profileCheck, error: profileErr } = await supabaseClient
      .from("profiles")
      .select("whatsapp")
      .eq("id", session.user.id)
      .single();
    if (profileErr) throw new Error("Gagal memeriksa profil pengguna.");
    if (
      !profileCheck.whatsapp ||
      String(profileCheck.whatsapp).trim() === "" ||
      String(profileCheck.whatsapp).trim() === "62"
    )
      throw new Error(
        "PENTING: Harap lengkapi nomor WhatsApp Anda di halaman Profil terlebih dahulu sebelum membuat laporan, agar Anda dapat dihubungi.",
      );

    btnSubmit.innerHTML = "<span>Menyimpan...</span>";
    let photoUrl = null;
    const fileInput = document.getElementById("lap-foto");
    if (fileInput && fileInput.files.length > 0)
      photoUrl = await uploadPhotoToStorage(fileInput);

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
    window.location.href = "riwayat.html";
  } catch (err) {
    if (errorBox) {
      errorBox.innerText = err.message;
      errorBox.classList.remove("hidden");
      scrollToElement(errorBoxId);
    }
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = "<span>Kirim Laporan</span>";
  }
}

/* DAFTAR LAPORAN */
async function setupDaftarLaporan() {
  const gridContainer = document.getElementById("reports-grid");
  if (!gridContainer) return;

  let state = {
    search: "",
    categoryId: "all",
    type: "all",
    dateFilter: "all",
    sortBy: "desc",
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

  const loadKategori = async () => {
    const { data } = await supabaseClient
      .from("categories")
      .select("*")
      .eq("is_active", true);
    let html = `<button data-value="all" class="filter-kat-opt w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 text-primary-dark">Semua Kategori</button>`;
    if (data)
      data.forEach(
        (cat) =>
          (html += `<button data-value="${cat.id}" class="filter-kat-opt w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 text-text-primary">${cat.name}</button>`),
      );
    UI.catContainer.innerHTML = html;
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

  const fetchData = async () => {
    gridContainer.innerHTML = `<div class="col-span-full text-center py-10"><p class="text-text-secondary">Memuat data...</p></div>`;
    let query = supabaseClient
      .from("reports")
      .select(`*, categories(name), locations(name)`, { count: "exact" })
      .eq("status", "active");
    if (state.search) query = query.ilike("item_name", `%${state.search}%`);
    if (state.categoryId !== "all")
      query = query.eq("category_id", state.categoryId);
    if (state.type !== "all") query = query.eq("type", state.type);
    if (state.dateFilter !== "all") {
      const today = new Date();
      if (state.dateFilter === "today")
        query = query.gte(
          "created_at",
          today.toISOString().split("T")[0] + "T00:00:00Z",
        );
      else if (state.dateFilter === "week") {
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte("created_at", lastWeek.toISOString());
      } else
        query = query
          .gte("created_at", state.dateFilter + "T00:00:00Z")
          .lt("created_at", state.dateFilter + "T23:59:59Z");
    }
    query = query.order("created_at", { ascending: state.sortBy === "asc" });
    query = query.range(
      (state.page - 1) * state.limit,
      (state.page - 1) * state.limit + state.limit - 1,
    );

    const { data, count, error } = await query;
    if (error) {
      gridContainer.innerHTML = `<div class="col-span-full text-center text-danger py-10">Gagal memuat data.</div>`;
      return;
    }
    state.totalData = count || 0;
    renderGrid(data);
    renderPagination();
  };

  const renderGrid = (data) => {
    if (data.length === 0) {
      gridContainer.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center py-16 text-center"><div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><i data-feather="inbox" class="w-8 h-8 text-gray-400"></i></div><h3 class="text-lg font-bold text-text-primary mb-1">Belum ada laporan yang tersedia</h3><p class="text-sm text-text-secondary">Cobalah mengubah filter pencarian Anda.</p></div>`;
      UI.infoHasil.classList.add("hidden");
      if (typeof feather !== "undefined") feather.replace();
      return;
    }
    gridContainer.innerHTML = data
      .map((report) => {
        const isLost = report.type === "lost",
          formattedDate = new Date(report.event_at).toLocaleDateString(
            "id-ID",
            { day: "numeric", month: "short", year: "numeric" },
          ),
          fallbackImg =
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5YXUigGfVdNtNMxlAAs6CnJnRW3qUR0I86vaIWN9YuyqfTX3NCpCLhI_-&s=10";
        return `<div class="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-md shadow-sm"><div class="flex items-center gap-1.5 mb-3"><span class="w-2 h-2 rounded-full ${isLost ? "bg-danger" : "bg-success"}"></span><span class="text-xs font-bold ${isLost ? "text-danger" : "text-success"} uppercase tracking-wider">${isLost ? "Barang Hilang" : "Barang Ditemukan"}</span></div><img src="${report.photo_url || fallbackImg}" alt="${report.item_name}" class="w-full h-44 object-cover rounded-xl mb-5 bg-surface" /><h3 class="text-lg font-bold text-text-primary truncate mb-3">${report.item_name}</h3><div class="flex items-center gap-2 text-xs text-gray-500 mb-2"><i data-feather="tag" class="w-3.5 h-3.5"></i> ${report.categories?.name || "Lainnya"}</div><div class="flex items-center gap-2 text-xs text-gray-500 mb-2"><i data-feather="map-pin" class="w-3.5 h-3.5"></i> ${report.locations?.name || "Tidak diketahui"}</div><div class="flex items-center gap-2 text-xs text-gray-500 mb-4"><i data-feather="calendar" class="w-3.5 h-3.5"></i> ${formattedDate}</div><p class="text-xs text-gray-500 line-clamp-2 mb-6 leading-relaxed">${report.description_public || "-"}</p><a href="detail-laporan.html?id=${report.id}" class="mt-auto w-full border border-gray-200 text-text-primary font-semibold py-2.5 rounded-xl text-center hover:border-primary-dark hover:text-primary-dark transition text-sm block">Lihat Detail</a></div>`;
      })
      .join("");
    UI.infoHasil.classList.remove("hidden");
    UI.countCurrent.innerText = data.length;
    UI.countTotal.innerText = state.totalData;
    if (typeof feather !== "undefined") feather.replace();
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(state.totalData / state.limit);
    if (totalPages <= 1) {
      UI.pagContainer.classList.add("hidden");
      return;
    }
    UI.pagContainer.classList.remove("hidden");
    let html = `<button onclick="changePage(${state.page - 1})" class="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 ${state.page === 1 ? "text-gray-300 cursor-not-allowed" : "text-text-secondary hover:bg-surface"} transition" ${state.page === 1 ? "disabled" : ""}><i data-feather="chevron-left" class="w-4 h-4"></i></button>`;
    for (let i = 1; i <= totalPages; i++)
      html += `<button onclick="changePage(${i})" class="w-10 h-10 flex items-center justify-center rounded-xl font-semibold transition ${i === state.page ? "bg-primary-dark text-white shadow-sm" : "text-text-secondary hover:bg-surface"}">${i}</button>`;
    html += `<button onclick="changePage(${state.page + 1})" class="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 ${state.page === totalPages ? "text-gray-300 cursor-not-allowed" : "text-text-secondary hover:bg-surface"} transition" ${state.page === totalPages ? "disabled" : ""}><i data-feather="chevron-right" class="w-4 h-4"></i></button>`;
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

  let searchTimeout;
  UI.searchInp.addEventListener("input", (e) => {
    state.search = e.target.value;
    state.page = 1;
    UI.clearSearchBtn.classList.toggle("hidden", state.search.length === 0);
    updateResetButton();
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchData, 500);
  });
  UI.clearSearchBtn.addEventListener("click", () => {
    UI.searchInp.value = "";
    state.search = "";
    state.page = 1;
    UI.clearSearchBtn.classList.add("hidden");
    updateResetButton();
    fetchData();
  });

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
      fetchData();
    });
  });

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

  await loadKategori();
  fetchData();
}

/* PROFIL */
async function setupProfilPage() {
  const formProfil = document.getElementById("form-profil");
  if (!formProfil) return;

  const fileInput = document.getElementById("profil-foto"),
    avatarImg = document.getElementById("avatar-image"),
    avatarInit = document.getElementById("avatar-initial"),
    btnHapusAvatar = document.getElementById("btn-hapus-avatar"),
    waInput = document.getElementById("profil-wa"),
    btnSubmit = document.getElementById("btn-submit-profil"),
    notifBox = document.getElementById("profil-notif"),
    namaInput = document.getElementById("profil-nama"),
    emailInput = document.getElementById("profil-email");
  let isPhotoRemoved = false;

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
    if (namaInput)
      namaInput.value = profile.full_name || session.user.email.split("@")[0];
    if (emailInput) emailInput.value = session.user.email;
    if (profile.whatsapp) {
      let waStr = profile.whatsapp.toString();
      if (waStr.startsWith("0")) waStr = waStr.substring(1);
      if (waStr.startsWith("62")) waStr = waStr.substring(2);
      waInput.value = waStr;
    }
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

  let newPhotoFile = null;
  fileInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      newPhotoFile = file;
      isPhotoRemoved = false;
      avatarImg.src = URL.createObjectURL(file);
      avatarImg.classList.remove("hidden");
      avatarInit.classList.add("hidden");
      btnHapusAvatar.classList.remove("hidden");
    }
  });
  btnHapusAvatar.addEventListener("click", function () {
    if (
      confirm(
        "Hapus foto profil? Anda harus klik 'Simpan Perubahan' agar foto benar-benar terhapus.",
      )
    ) {
      fileInput.value = "";
      newPhotoFile = null;
      isPhotoRemoved = true;
      avatarImg.src = "";
      avatarImg.classList.add("hidden");
      btnHapusAvatar.classList.add("hidden");
      avatarInit.classList.remove("hidden");
    }
  });

  formProfil.addEventListener("submit", async (e) => {
    e.preventDefault();
    notifBox.classList.add("hidden");
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Menyimpan...";
    try {
      let finalPhotoUrl = profile.photo_url;
      if (isPhotoRemoved) finalPhotoUrl = null;
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
      let finalWa = waInput.value.trim();
      if (finalWa.startsWith("0")) finalWa = finalWa.substring(1);
      finalWa = "62" + finalWa;
      const { error: updateErr } = await supabaseClient
        .from("profiles")
        .update({ whatsapp: finalWa, photo_url: finalPhotoUrl })
        .eq("id", session.user.id);
      if (updateErr) throw updateErr;
      notifBox.innerText = "Profil berhasil diperbarui!";
      notifBox.className =
        "mb-6 p-4 rounded-xl text-sm font-semibold border bg-success-soft text-on-success-soft border-green-200 block";
      checkAuthState();
      scrollToElement("profil-notif");
    } catch (error) {
      notifBox.innerText = error.message || "Terjadi kesalahan saat menyimpan.";
      notifBox.className =
        "mb-6 p-4 rounded-xl text-sm font-semibold border bg-danger-soft text-on-danger-soft border-red-200 block";
      scrollToElement("profil-notif");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerText = "Simpan Perubahan";
      setTimeout(() => notifBox.classList.add("hidden"), 4000);
    }
  });
}

/* RIWAYAT */
async function setupRiwayatLaporan() {
  const panelHilang = document.getElementById("panel-hilang"),
    panelTemuan = document.getElementById("panel-temuan");
  if (!panelHilang || !panelTemuan) return;

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) return;

  const skeleton = `<div class="text-center py-10"><p class="text-text-secondary">Memuat data...</p></div>`;
  panelHilang.innerHTML = skeleton;
  panelTemuan.innerHTML = skeleton;

  try {
    const { data: myReports, error } = await supabaseClient
      .from("reports")
      .select(`*, locations(name)`)
      .eq("reporter_id", session.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const lostReports = myReports.filter((r) => r.type === "lost"),
      foundReports = myReports.filter((r) => r.type === "found"),
      fallbackImg =
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5YXUigGfVdNtNMxlAAs6CnJnRW3qUR0I86vaIWN9YuyqfTX3NCpCLhI_-&s=10";

    if (lostReports.length === 0)
      panelHilang.innerHTML = `<div class="text-center py-10 bg-surface rounded-xl border border-gray-200"><p class="text-text-secondary">Anda belum membuat laporan kehilangan.</p></div>`;
    else {
      let lostHtml = "";
      for (const report of lostReports) {
        const { data: claims } = await supabaseClient
          .from("claims")
          .select("status")
          .eq("lost_report_id", report.id)
          .limit(1);
        let badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="search" class="w-3.5 h-3.5"></i> Sedang Dicari</span>`;
        if (claims && claims.length > 0) {
          const status = claims[0].status;
          if (status === "pending")
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-warning-soft text-on-warning-soft text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="clock" class="w-3.5 h-3.5"></i> Menunggu Verifikasi</span>`;
          else if (status === "approved")
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-primary-soft text-on-primary-soft text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="package" class="w-3.5 h-3.5"></i> Pengembalian Diproses</span>`;
          else if (status === "completed")
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-success-soft text-success text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="check-circle" class="w-3.5 h-3.5"></i> Selesai Dikembalikan</span>`;
        } else {
          const { data: matches } = await supabaseClient
            .from("matches")
            .select("id")
            .eq("lost_report_id", report.id)
            .limit(1);
          if (matches && matches.length > 0)
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-info-soft text-on-info-soft text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="sparkles" class="w-3.5 h-3.5"></i> Potensi Kecocokan</span>`;
        }
        const dateStr = new Date(report.event_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        lostHtml += `<div class="bg-white border border-gray-200 rounded-[20px] p-4 flex flex-col sm:flex-row gap-5 hover:border-gray-300 transition-all hover:shadow-sm"><img src="${report.photo_url || fallbackImg}" alt="Foto" class="w-full sm:w-[160px] h-[120px] object-cover rounded-xl shrink-0 bg-surface" /><div class="flex-grow flex flex-col justify-center"><h3 class="text-lg font-bold text-text-primary truncate max-w-[250px] md:max-w-[400px] mb-1.5">${report.item_name}</h3><div class="flex items-center gap-3 text-sm text-text-secondary mb-3"><span class="flex items-center gap-1"><i data-feather="calendar" class="w-3.5 h-3.5"></i> ${dateStr}</span><span class="w-1 h-1 rounded-full bg-gray-300"></span><span class="flex items-center gap-1"><i data-feather="map-pin" class="w-3.5 h-3.5"></i> ${report.locations?.name || "Tidak diketahui"}</span></div><div>${badgeHtml}</div></div><div class="sm:border-l border-gray-100 sm:pl-5 flex flex-col justify-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0"><a href="detail-laporan.html?id=${report.id}" class="w-full sm:w-auto text-center border border-gray-200 hover:bg-surface text-text-primary font-semibold py-2.5 px-6 rounded-xl transition text-sm block">Lihat Laporan</a></div></div>`;
      }
      panelHilang.innerHTML = lostHtml;
    }

    if (foundReports.length === 0)
      panelTemuan.innerHTML = `<div class="text-center py-10 bg-surface rounded-xl border border-gray-200"><p class="text-text-secondary">Anda belum membuat laporan penemuan.</p></div>`;
    else {
      let foundHtml = "";
      for (const report of foundReports) {
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
          } else if (status === "approved")
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-primary-soft text-on-primary-soft text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="package" class="w-3.5 h-3.5"></i> Pengembalian Diproses</span>`;
          else if (status === "completed")
            badgeHtml = `<span class="inline-flex items-center gap-1.5 bg-success-soft text-success text-[13px] font-semibold px-3 py-1 rounded-full"><i data-feather="check-circle" class="w-3.5 h-3.5"></i> Selesai Dikembalikan</span>`;
        }
        const dateStr = new Date(report.event_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        foundHtml += `<div class="bg-white border border-gray-200 rounded-[20px] p-4 flex flex-col sm:flex-row gap-5 hover:border-gray-300 transition-all hover:shadow-sm"><img src="${report.photo_url || fallbackImg}" alt="Foto" class="w-full sm:w-[160px] h-[120px] object-cover rounded-xl shrink-0 bg-surface" /><div class="flex-grow flex flex-col justify-center"><h3 class="text-lg font-bold text-text-primary truncate max-w-[250px] md:max-w-[400px] mb-1.5">${report.item_name}</h3><div class="flex items-center gap-3 text-sm text-text-secondary mb-3"><span class="flex items-center gap-1"><i data-feather="calendar" class="w-3.5 h-3.5"></i> ${dateStr}</span><span class="w-1 h-1 rounded-full bg-gray-300"></span><span class="flex items-center gap-1"><i data-feather="map-pin" class="w-3.5 h-3.5"></i> ${report.locations?.name || "Tidak diketahui"}</span></div><div>${badgeHtml}</div></div><div class="sm:border-l border-gray-100 sm:pl-5 flex flex-col justify-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0">${actionBtn}</div></div>`;
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

/* BERANDA */
async function loadRecentReports() {
  const lostGrid = document.getElementById("recent-lost-grid"),
    foundGrid = document.getElementById("recent-found-grid");
  if (!lostGrid && !foundGrid) return;

  const renderCards = (data, container, isLost) => {
    if (!data || data.length === 0) {
      container.innerHTML = `<div class="col-span-full text-center py-8 text-gray-500">Belum ada laporan terbaru.</div>`;
      return;
    }
    const fallbackImg =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5YXUigGfVdNtNMxlAAs6CnJnRW3qUR0I86vaIWN9YuyqfTX3NCpCLhI_-&s=10";
    container.innerHTML = data
      .map((report) => {
        const formattedDate = new Date(report.event_at).toLocaleDateString(
          "id-ID",
          { day: "numeric", month: "short", year: "numeric" },
        );
        return `<div class="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-md shadow-sm"><div class="flex items-center gap-1.5 mb-3"><span class="w-2 h-2 rounded-full ${isLost ? "bg-danger" : "bg-success"}"></span><span class="text-xs font-bold ${isLost ? "text-danger" : "text-success"} uppercase tracking-wider">${isLost ? "Barang Hilang" : "Barang Ditemukan"}</span></div><img src="${report.photo_url || fallbackImg}" alt="${report.item_name}" class="w-full h-44 object-cover rounded-xl mb-5 bg-surface" /><h3 class="text-lg font-bold text-text-primary truncate mb-3">${report.item_name}</h3><div class="flex items-center gap-2 text-xs text-gray-500 mb-2"><i data-feather="tag" class="w-3.5 h-3.5"></i> ${report.categories?.name || "Lainnya"}</div><div class="flex items-center gap-2 text-xs text-gray-500 mb-2"><i data-feather="map-pin" class="w-3.5 h-3.5"></i> ${report.locations?.name || "Tidak diketahui"}</div><div class="flex items-center gap-2 text-xs text-gray-500 mb-4"><i data-feather="calendar" class="w-3.5 h-3.5"></i> ${formattedDate}</div><a href="detail-laporan.html?id=${report.id}" class="mt-auto w-full border border-gray-200 text-text-primary font-semibold py-2.5 rounded-xl text-center hover:border-primary-dark hover:text-primary-dark transition text-sm block">Lihat Detail</a></div>`;
      })
      .join("");
  };

  try {
    if (lostGrid) {
      const { data } = await supabaseClient
        .from("reports")
        .select("*, categories(name), locations(name)")
        .eq("type", "lost")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(4);
      renderCards(data, lostGrid, true);
    }
    if (foundGrid) {
      const { data } = await supabaseClient
        .from("reports")
        .select("*, categories(name), locations(name)")
        .eq("type", "found")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(4);
      renderCards(data, foundGrid, false);
    }
    if (typeof feather !== "undefined") feather.replace();
  } catch (err) {
    console.error("Gagal memuat laporan terbaru:", err);
  }
}

/* DETAIL LAPORAN */
async function setupDetailLaporan() {
  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get("id");
  const container = document.getElementById("detail-content");
  const loading = document.getElementById("detail-loading");
  const notifBox = document.getElementById("detail-notif");

  if (!container || !loading) return;
  if (!reportId) {
    loading.innerHTML = `<p class="text-danger font-semibold">Error: ID Laporan tidak ditemukan di URL.</p>`;
    return;
  }

  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    const currentUserId = session ? session.user.id : null;

    const { data: report, error } = await supabaseClient
      .from("reports")
      .select(
        `*, categories(name), locations(name), profiles:reporter_id(full_name, whatsapp)`,
      )
      .eq("id", reportId)
      .single();
    if (error || !report) throw new Error("Laporan tidak ditemukan.");

    const isMyReport = currentUserId === report.reporter_id,
      isLost = report.type === "lost";
    const { data: claimsData } = await supabaseClient
      .from("claims")
      .select(
        "*, claimant:claimant_id(full_name, whatsapp), found_report:found_report_id(reporter_id)",
      )
      .or(`found_report_id.eq.${reportId},lost_report_id.eq.${reportId}`)
      .in("status", ["approved", "completed"])
      .limit(1);
    const activeClaim =
      claimsData && claimsData.length > 0 ? claimsData[0] : null;

    const fallbackImg =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5YXUigGfVdNtNMxlAAs6CnJnRW3qUR0I86vaIWN9YuyqfTX3NCpCLhI_-&s=10";
    document.getElementById("detail-foto").src =
      report.photo_url || fallbackImg;
    document.getElementById("detail-nama").innerText = report.item_name;
    document.getElementById("detail-deskripsi").innerText =
      report.description_public || "-";
    document.getElementById("detail-kategori").innerText =
      report.categories?.name || "Lainnya";

    let pelaporName = report.profiles?.full_name || "Seseorang";
    if (!isMyReport && pelaporName !== "Seseorang") {
      const parts = pelaporName.split(" ");
      pelaporName =
        parts[0] + " " + (parts[1] ? parts[1].charAt(0) + "." : "***");
    }
    document.getElementById("detail-pelapor").innerText = isMyReport
      ? `${report.profiles?.full_name} (Anda)`
      : pelaporName;

    const dateObj = new Date(report.event_at);
    document.getElementById("detail-waktu").innerText =
      dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";
    document.getElementById("detail-lokasi").innerText =
      report.locations?.name || "Tidak diketahui";
    document.getElementById("detail-lokasi-detail").innerText =
      report.detail_location || "";

    let statusBadgeText =
        report.status === "active" ? "Laporan Aktif" : "Selesai",
      statusBadgeColor = "bg-gray-300 text-text-secondary";
    if (activeClaim && activeClaim.status === "completed") {
      statusBadgeText = "Telah Dikembalikan";
      statusBadgeColor = "bg-success text-white px-2 py-0.5 rounded";
    }

    document.getElementById("detail-badges").innerHTML =
      `<span class="w-2 h-2 rounded-full ${isLost ? "bg-danger" : "bg-success"}"></span><span class="text-xs font-bold ${isLost ? "text-danger" : "text-success"} uppercase tracking-wider">${isLost ? "Barang Hilang" : "Barang Ditemukan"}</span><span class="w-1 h-1 rounded-full bg-gray-300"></span><span class="text-xs font-semibold ${statusBadgeColor}">${statusBadgeText}</span>`;

    const actionPanel = document.getElementById("detail-action-panel");
    let actionHtml = "";

    const deleteBtnHtml =
      isMyReport && report.status === "active"
        ? `<button onclick="showModal('modal-hapus')" class="mt-4 w-full flex items-center justify-center gap-2 text-danger bg-danger-soft/50 hover:bg-danger-soft font-semibold py-2.5 px-4 rounded-xl transition text-[13px] border border-red-100"><i data-feather="trash-2" class="w-4 h-4"></i> Hapus Laporan Ini</button>`
        : "";

    const panelStyle =
      "sticky top-24 bg-white rounded-[24px] p-8 sm:p-10 text-left border border-gray-100 shadow-[0_16px_32px_0px_rgba(0,0,0,0.25)]";

    if (!currentUserId) {
      actionHtml = `<div class="${panelStyle}"><div class="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-4 text-primary-dark shadow-sm"><i data-feather="lock" class="w-6 h-6"></i></div><h2 class="text-lg font-bold text-text-primary mb-2">Masuk untuk Interaksi</h2><p class="text-sm text-text-secondary mb-6">Anda harus masuk ke sistem untuk berinteraksi dengan laporan ini.</p><a href="login.html" class="w-full block text-center bg-primary-dark hover:bg-primary-pressed text-white font-semibold py-3 px-6 rounded-xl transition text-[15px]">Masuk Sekarang</a></div>`;
    } else if (activeClaim && activeClaim.status === "completed") {
      actionHtml = `<div class="${panelStyle} text-center"><i data-feather="check-circle" class="w-10 h-10 text-success mx-auto mb-4"></i><h2 class="text-[20px] font-bold text-text-primary mb-2">Telah Dikembalikan</h2><p class="text-[14px] text-text-secondary">Barang ini telah berhasil diserahterimakan kepada pemilik yang sah. Laporan ditutup.</p></div>`;
    } else if (activeClaim && activeClaim.status === "approved") {
      let contactProfile = null,
        contactRole = "",
        modalDescText = "";
      if (currentUserId === activeClaim.found_report?.reporter_id) {
        contactProfile = activeClaim.claimant;
        contactRole = "Pemilik Barang";
        modalDescText =
          "Apakah Anda sudah menyerahkan barang ini secara langsung kepada pemilik yang sah? Laporan ini akan ditutup permanen.";
      } else if (currentUserId === activeClaim.claimant_id) {
        const { data: finderProf } = await supabaseClient
          .from("profiles")
          .select("full_name, whatsapp")
          .eq("id", activeClaim.found_report.reporter_id)
          .single();
        contactProfile = finderProf;
        contactRole = "Penemu Barang";
        modalDescText =
          "Apakah Anda sudah menerima barang Anda kembali dengan aman? Laporan ini akan ditutup permanen.";
      }

      if (contactProfile) {
        const waAction = contactProfile.whatsapp
          ? `href="https://wa.me/${contactProfile.whatsapp}" target="_blank"`
          : `href="#" onclick="document.getElementById('detail-notif').classList.remove('hidden'); document.getElementById('detail-notif').className='mb-6 p-4 rounded-xl text-sm font-semibold border block bg-warning-soft text-on-warning-soft border-yellow-200'; document.getElementById('detail-notif').innerText='Peringatan: Pengguna ini belum mencantumkan nomor WhatsApp.'; scrollToElement('detail-notif'); return false;"`;

        actionHtml = `<div class="${panelStyle}"><h2 class="text-[20px] font-bold text-primary-dark mb-2 flex items-center gap-2"><i data-feather="check-circle" class="w-5 h-5"></i> Klaim Disetujui!</h2><p class="text-[14px] text-text-secondary mb-6">Silakan hubungi pihak terkait untuk melakukan proses serah terima barang.</p><div class="bg-surface p-5 rounded-xl border border-gray-200 mb-6"><div class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">${contactRole}</div><div class="font-bold text-text-primary mb-4 text-lg">${contactProfile.full_name || "Tidak ada nama"}</div><a ${waAction} class="flex items-center justify-center gap-2 w-full bg-success hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition text-[14px] shadow-sm"><i data-feather="message-circle" class="w-4 h-4"></i> Hubungi via WhatsApp</a></div><p class="text-[13px] text-text-secondary mb-3 text-center">Apakah serah terima sudah selesai?</p><button onclick="openModalSelesai('${modalDescText}')" class="w-full bg-white border border-gray-200 hover:bg-surface text-text-primary font-semibold py-3 rounded-xl transition text-[14px]">Tandai Selesai</button></div>`;

        setTimeout(() => {
          const btnSelesai = document.getElementById("btn-confirm-selesai");
          if (btnSelesai) {
            btnSelesai.onclick = async () => {
              hideModal("modal-selesai");
              window.scrollTo({ top: 0, behavior: "smooth" });
              notifBox.classList.remove("hidden");
              notifBox.className =
                "mb-6 p-4 rounded-xl text-sm font-semibold border block bg-info-soft text-on-info-soft border-blue-200";
              notifBox.innerText = "Memproses penutupan laporan...";
              try {
                await supabaseClient
                  .from("claims")
                  .update({ status: "completed" })
                  .eq("id", activeClaim.id);
                if (activeClaim.found_report_id)
                  await supabaseClient
                    .from("reports")
                    .update({ status: "completed" })
                    .eq("id", activeClaim.found_report_id);
                if (activeClaim.lost_report_id)
                  await supabaseClient
                    .from("reports")
                    .update({ status: "completed" })
                    .eq("id", activeClaim.lost_report_id);
                notifBox.className =
                  "mb-6 p-4 rounded-xl text-sm font-semibold border block bg-success-soft text-on-success-soft border-green-200";
                notifBox.innerText =
                  "Serah terima berhasil. Seluruh laporan ditutup! Memuat ulang...";
                scrollToElement("detail-notif");
                setTimeout(() => window.location.reload(), 2500);
              } catch (err) {
                notifBox.className =
                  "mb-6 p-4 rounded-xl text-sm font-semibold border block bg-danger-soft text-on-danger-soft border-red-200";
                notifBox.innerText = "Gagal menutup laporan: " + err.message;
                scrollToElement("detail-notif");
              }
            };
          }
        }, 500);
      } else {
        actionHtml = `<div class="${panelStyle} text-center"><i data-feather="lock" class="w-8 h-8 text-gray-400 mx-auto mb-3"></i><h2 class="text-lg font-bold text-text-primary mb-2">Laporan Dikunci</h2><p class="text-sm text-text-secondary">Barang ini sedang dalam proses pengembalian kepada pemiliknya yang sah.</p></div>`;
      }
    } else if (isLost && isMyReport) {
      const { data: matches } = await supabaseClient
        .from("matches")
        .select(`*, found_report:found_report_id(item_name)`)
        .eq("lost_report_id", report.id)
        .order("total_score_internal", { ascending: false })
        .limit(3);
      if (matches && matches.length > 0) {
        let matchItemsHtml = matches
          .map(
            (m) =>
              `<div class="bg-surface border border-gray-200 p-4 rounded-xl mb-4 text-left"><div class="font-bold text-text-primary text-[15px] mb-1">${m.found_report?.item_name || "Barang Ditemukan"}</div><div class="text-xs text-text-secondary mb-3">Kecocokan: ${(m.total_score_internal * 100).toFixed(0)}%</div><a href="ajukan-claim.html?id=${m.found_report_id}" class="w-full block text-center border border-primary-dark text-primary-dark hover:bg-primary-soft font-semibold py-2 px-4 rounded-lg transition text-sm">Ajukan Klaim</a></div>`,
          )
          .join("");
        actionHtml = `<div class="${panelStyle}"><h2 class="text-[20px] font-bold text-text-primary mb-2 flex items-center gap-2"><i data-feather="sparkles" class="w-5 h-5 text-blue-600"></i> Potensi Kecocokan</h2><p class="text-[14px] text-text-secondary mb-6">Sistem menemukan ${matches.length} laporan penemuan yang mungkin milik Anda.</p>${matchItemsHtml}${deleteBtnHtml}</div>`;
      } else {
        actionHtml = `<div class="${panelStyle}"><i data-feather="search" class="w-8 h-8 text-gray-400 mb-3"></i><h2 class="text-lg font-bold text-text-primary mb-2">Belum Ada Kecocokan</h2><p class="text-sm text-text-secondary">Sistem terus memantau. Anda akan diberi tahu jika ada laporan barang temuan yang mirip.</p>${deleteBtnHtml}</div>`;
      }
    } else if (!isLost && !isMyReport) {
      actionHtml = `<div class="${panelStyle}"><h2 class="text-[20px] font-bold text-text-primary mb-2">Ini Barang Anda?</h2><p class="text-[14px] text-text-secondary mb-8">Ajukan klaim kepemilikan dengan memberikan ciri-ciri khusus atau bukti foto kepada penemu barang.</p><a href="ajukan-claim.html?id=${report.id}" class="w-full block text-center bg-primary-dark hover:bg-primary-pressed text-white font-semibold py-3.5 px-6 rounded-xl transition text-[15px] shadow-sm">Ajukan Klaim Sekarang</a></div>`;
    } else {
      actionHtml = `<div class="sticky top-24 bg-transparent p-0 text-center">${deleteBtnHtml}</div>`;
      document
        .querySelector(".lg\\:col-span-2")
        .classList.replace("lg:col-span-2", "lg:col-span-3");
    }

    actionPanel.innerHTML = actionHtml;
    loading.classList.add("hidden");
    container.classList.remove("hidden");
    if (typeof feather !== "undefined") feather.replace();

    /* Event Listener Hapus Laporan */
    setTimeout(() => {
      const btnHapus = document.getElementById("btn-confirm-hapus");
      if (btnHapus) {
        btnHapus.onclick = async () => {
          hideModal("modal-hapus");
          window.scrollTo({ top: 0, behavior: "smooth" });
          notifBox.classList.remove("hidden");
          notifBox.className =
            "mb-6 p-4 rounded-xl text-sm font-semibold border block bg-info-soft text-on-info-soft border-blue-200";
          notifBox.innerText = "Menghapus laporan...";
          try {
            const { error: delErr } = await supabaseClient
              .from("reports")
              .delete()
              .eq("id", reportId);
            if (delErr) throw delErr;
            notifBox.className =
              "mb-6 p-4 rounded-xl text-sm font-semibold border block bg-success-soft text-on-success-soft border-green-200";
            notifBox.innerText =
              "Laporan berhasil dihapus. Mengarahkan ke riwayat...";
            scrollToElement("detail-notif");
            setTimeout(() => (window.location.href = "riwayat.html"), 2000);
          } catch (err) {
            notifBox.className =
              "mb-6 p-4 rounded-xl text-sm font-semibold border block bg-danger-soft text-on-danger-soft border-red-200";
            notifBox.innerText = "Gagal menghapus: " + err.message;
            scrollToElement("detail-notif");
          }
        };
      }
    }, 500);
  } catch (error) {
    loading.innerHTML = `<p class="text-danger font-semibold border border-red-200 bg-danger-soft p-4 rounded-xl">${error.message}</p>`;
  }
}

/* AJUKAN KLAIM */
async function setupAjukanKlaim() {
  const urlParams = new URLSearchParams(window.location.search);
  const foundReportId = urlParams.get("id");
  const formKlaim = document.getElementById("form-klaim");
  const targetSummary = document.getElementById("klaim-target-summary");
  const notifBox = document.getElementById("klaim-notif");
  const fileInput = document.getElementById("klaim-foto");

  if (!formKlaim || !targetSummary) return;
  if (!foundReportId) {
    targetSummary.innerHTML = `<div class="text-danger font-semibold">Error: ID Barang Temuan tidak valid.</div>`;
    return;
  }

  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = "login.html";
      return;
    }

    const { data: foundReport, error: fetchErr } = await supabaseClient
      .from("reports")
      .select("*, locations(name)")
      .eq("id", foundReportId)
      .eq("type", "found")
      .single();
    if (fetchErr || !foundReport)
      throw new Error("Data laporan temuan tidak ditemukan.");
    if (foundReport.reporter_id === session.user.id) {
      targetSummary.innerHTML = `<div class="text-danger font-semibold">Anda tidak bisa mengklaim barang yang Anda temukan sendiri.</div>`;
      return;
    }

    const dateStr = new Date(foundReport.event_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const fallbackImg =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5YXUigGfVdNtNMxlAAs6CnJnRW3qUR0I86vaIWN9YuyqfTX3NCpCLhI_-&s=10";

    targetSummary.innerHTML = `<img src="${foundReport.photo_url || fallbackImg}" alt="Barang" class="w-20 h-20 object-cover rounded-xl shrink-0 bg-white border border-gray-100" /><div><div class="text-[11px] font-bold text-success uppercase tracking-wider mb-1">Barang Ditemukan</div><h3 class="text-[16px] font-bold text-text-primary">${foundReport.item_name}</h3><div class="text-[13px] text-text-secondary mt-1">${foundReport.locations?.name || "Lokasi tidak diketahui"} &bull; ${dateStr}</div></div>`;

    const { data: myLostReports } = await supabaseClient
      .from("reports")
      .select("id")
      .eq("reporter_id", session.user.id)
      .eq("type", "lost")
      .eq("category_id", foundReport.category_id)
      .limit(1);
    const lostReportIdToLink =
      myLostReports && myLostReports.length > 0 ? myLostReports[0].id : null;

    formKlaim.classList.remove("hidden");
    fileInput.addEventListener("change", function () {
      const fileNameDisplay = document.getElementById("klaim-file-name");
      if (this.files[0]) {
        fileNameDisplay.innerText = this.files[0].name;
        fileNameDisplay.classList.add("text-primary-dark");
      }
    });

    formKlaim.addEventListener("submit", async (e) => {
      e.preventDefault();
      notifBox.classList.add("hidden");
      const btnSubmit = document.getElementById("btn-submit-klaim");
      btnSubmit.disabled = true;
      btnSubmit.innerText = "Memeriksa Profil...";
      try {
        const { data: profileCheck, error: profileErr } = await supabaseClient
          .from("profiles")
          .select("whatsapp")
          .eq("id", session.user.id)
          .single();
        if (profileErr) throw new Error("Gagal memeriksa profil pengguna.");
        if (
          !profileCheck.whatsapp ||
          String(profileCheck.whatsapp).trim() === "" ||
          String(profileCheck.whatsapp).trim() === "62"
        )
          throw new Error(
            "PENTING: Harap lengkapi nomor WhatsApp Anda di halaman Profil terlebih dahulu sebelum mengajukan klaim.",
          );

        btnSubmit.innerText = "Mengirim...";
        let evidenceUrl = null;
        if (fileInput.files.length > 0) {
          const file = fileInput.files[0];
          const fileExt = file.name.split(".").pop();
          const fileName = `klaim_${session.user.id}_${Date.now()}.${fileExt}`;
          const { error: uploadErr } = await supabaseClient.storage
            .from("item_photos")
            .upload(fileName, file);
          if (uploadErr) throw new Error("Gagal mengunggah foto bukti.");
          const { data: publicUrlData } = supabaseClient.storage
            .from("item_photos")
            .getPublicUrl(fileName);
          evidenceUrl = publicUrlData.publicUrl;
        }

        const ciriText = document.getElementById("klaim-ciri").value.trim();
        const { error: insertErr } = await supabaseClient
          .from("claims")
          .insert([
            {
              found_report_id: foundReport.id,
              lost_report_id: lostReportIdToLink,
              claimant_id: session.user.id,
              special_detail_private: ciriText,
              evidence_url_private: evidenceUrl,
              status: "pending",
            },
          ]);
        if (insertErr) throw insertErr;

        notifBox.innerText =
          "Klaim berhasil diajukan! Mengarahkan ke Riwayat...";
        notifBox.className =
          "mb-6 p-4 rounded-xl text-sm font-semibold border bg-success-soft text-on-success-soft border-green-200 block";
        scrollToElement("klaim-notif");
        setTimeout(() => (window.location.href = "riwayat.html"), 2000);
      } catch (err) {
        notifBox.innerText = err.message;
        notifBox.className =
          "mb-6 p-4 rounded-xl text-sm font-semibold border bg-danger-soft text-on-danger-soft border-red-200 block";
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Kirim Pengajuan Klaim";
        scrollToElement("klaim-notif");
      }
    });
  } catch (err) {
    targetSummary.innerHTML = `<div class="text-danger font-semibold">${err.message}</div>`;
  }
}

/* TINJAU KLAIM */
async function setupTinjauKlaim() {
  const urlParams = new URLSearchParams(window.location.search);
  const foundReportId = urlParams.get("id");
  const container = document.getElementById("tinjau-content");
  const loading = document.getElementById("tinjau-loading");
  const notifBox = document.getElementById("tinjau-notif");

  if (!container || !loading) return;
  if (!foundReportId) {
    loading.innerHTML = `<p class="text-danger font-semibold">Error: ID Barang Temuan tidak valid.</p>`;
    return;
  }

  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = "login.html";
      return;
    }

    const { data: claims, error: claimsErr } = await supabaseClient
      .from("claims")
      .select("*")
      .eq("found_report_id", foundReportId)
      .eq("status", "pending")
      .limit(1);
    if (claimsErr || !claims || claims.length === 0) {
      loading.innerHTML = `<p class="text-text-secondary font-semibold">Tidak ada klaim yang menunggu verifikasi untuk laporan ini.</p>`;
      return;
    }

    const claim = claims[0];
    const { data: claimant } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", claim.claimant_id)
      .single();
    const { data: report } = await supabaseClient
      .from("reports")
      .select("*, locations(name)")
      .eq("id", claim.found_report_id)
      .single();

    const fallbackImg =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5YXUigGfVdNtNMxlAAs6CnJnRW3qUR0I86vaIWN9YuyqfTX3NCpCLhI_-&s=10";
    document.getElementById("tinjau-item-img").src =
      report.photo_url || fallbackImg;
    document.getElementById("tinjau-item-name").innerText = report.item_name;

    const dateStr = new Date(report.event_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    document.getElementById("tinjau-item-loc-date").innerText =
      `${report.locations?.name || "Lokasi tidak diketahui"} • ${dateStr}`;

    const claimantName = claimant?.full_name || "Seseorang";
    document.getElementById("tinjau-claimant-name").innerText = claimantName;
    document.getElementById("tinjau-claimant-initial").innerText = claimantName
      .charAt(0)
      .toUpperCase();

    const claimDate = new Date(claim.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    document.getElementById("tinjau-claimant-date").innerText =
      `Diajukan pada ${claimDate} WIB`;
    document.getElementById("tinjau-ciri-khusus").innerText =
      `"${claim.special_detail_private || "Tidak ada deskripsi khusus."}"`;

    const buktiContainer = document.getElementById("tinjau-bukti-container");
    if (claim.evidence_url_private)
      buktiContainer.innerHTML = `<a href="${claim.evidence_url_private}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-gray-200 rounded-lg text-primary-dark font-semibold hover:bg-gray-50 transition"><i data-feather="external-link" class="w-4 h-4"></i> Lihat Bukti Foto/Dokumen</a>`;
    else
      buktiContainer.innerHTML = `<span class="text-gray-400 italic">Pengklaim tidak melampirkan file bukti tambahan.</span>`;

    loading.classList.add("hidden");
    container.classList.remove("hidden");
    if (typeof feather !== "undefined") feather.replace();

    const updateClaimStatus = async (newStatus) => {
      if (typeof hideModal === "function")
        hideModal(newStatus === "approved" ? "modal-setuju" : "modal-tolak");
      window.scrollTo({ top: 0, behavior: "smooth" });
      notifBox.classList.remove("hidden");
      notifBox.className =
        "mb-6 p-4 rounded-xl text-sm font-semibold border block bg-info-soft text-on-info-soft border-blue-200";
      notifBox.innerText = "Memproses keputusan Anda...";

      try {
        const { error } = await supabaseClient
          .from("claims")
          .update({
            status: newStatus,
            decided_by: session.user.id,
            decided_at: new Date().toISOString(),
          })
          .eq("id", claim.id);
        if (error) throw error;
        notifBox.className =
          "mb-6 p-4 rounded-xl text-sm font-semibold border block bg-success-soft text-on-success-soft border-green-200";
        notifBox.innerText = `Klaim berhasil ${newStatus === "approved" ? "disetujui" : "ditolak"}. Mengarahkan ke Riwayat...`;
        scrollToElement("tinjau-notif");
        setTimeout(() => (window.location.href = "riwayat.html"), 2000);
      } catch (err) {
        notifBox.className =
          "mb-6 p-4 rounded-xl text-sm font-semibold border block bg-danger-soft text-on-danger-soft border-red-200";
        notifBox.innerText =
          "Gagal memproses klaim (Cek izin RLS Supabase!): " + err.message;
        scrollToElement("tinjau-notif");
      }
    };

    document
      .getElementById("btn-confirm-setuju")
      .addEventListener("click", () => updateClaimStatus("approved"));
    document
      .getElementById("btn-confirm-tolak")
      .addEventListener("click", () => updateClaimStatus("rejected"));
  } catch (err) {
    loading.innerHTML = `<p class="text-danger font-semibold">${err.message}</p>`;
  }
}

/* MOBILE SIDEBAR */
function setupMobileSidebar() {
  const mobileBtn = document.getElementById("mobile-menu-btn");
  const closeBtn = document.getElementById("mobile-close-btn");
  const sidebar = document.getElementById("mobile-sidebar");
  const overlay = document.getElementById("mobile-sidebar-overlay");

  if (!mobileBtn || !sidebar || !overlay) return;

  const toggleSidebar = () => {
    const isClosed = sidebar.classList.contains("translate-x-full");
    if (isClosed) {
      overlay.classList.remove("hidden");
      setTimeout(() => overlay.classList.remove("opacity-0"), 10);
      sidebar.classList.remove("translate-x-full");
      document.body.style.overflow = "hidden";
    } else {
      sidebar.classList.add("translate-x-full");
      overlay.classList.add("opacity-0");
      setTimeout(() => overlay.classList.add("hidden"), 300);
      document.body.style.overflow = "";
    }
  };

  mobileBtn.addEventListener("click", toggleSidebar);
  if (closeBtn) closeBtn.addEventListener("click", toggleSidebar);
  overlay.addEventListener("click", toggleSidebar);
}

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {
  const isAuthed = await checkAuthState();
  if (isAuthed === false) return; // Hentikan eksekusi script lain jika redirecting ke login.html

  setupMobileSidebar();
  setupPasswordToggle();
  setupAuthForms();
  loadMasterData();
  setupReportForms();
  setupDaftarLaporan();
  setupProfilPage();
  setupRiwayatLaporan();
  loadRecentReports();
  setupDetailLaporan();
  setupAjukanKlaim();
  setupTinjauKlaim();
});
