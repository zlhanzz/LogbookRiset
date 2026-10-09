/**
 * Logika Utama Aplikasi Web Logbook Riset
 * Pengelolaan entri logbook penelitian lapangan mahasiswa.
 * Mendukung Firebase Auth, Firestore, verifikasi QRIS Pakasir, dan ekspor Word (.docx).
 */

(function () {
  "use strict";

  // STATE APLIKASI
  const state = {
    entries: [],
    activeKabupaten: "all",
    activeKategori: "all",
    searchQuery: "",
    uploadedPhotoBase64: null,
    editingEntryId: null,
    isSyncing: false,
    currentPaymentOrder: null,
    lastCompletedOrder: null
  };

  // DOM ELEMENTS
  const DOM = {
    // Layar Rute & Navigasi
    viewLoginScreen: document.getElementById("viewLoginScreen"),
    viewVerifyEmail: document.getElementById("viewVerifyEmail"),
    viewMainApp: document.getElementById("viewMainApp"),
    viewPricing: document.getElementById("viewPricing"),
    viewCheckout: document.getElementById("viewCheckout"),
    viewPaymentSuccess: document.getElementById("viewPaymentSuccess"),
    btnPricingBackToDashboard: document.getElementById("btnPricingBackToDashboard"),
    btnGoToCheckout: document.getElementById("btnGoToCheckout"),
    btnCheckoutBackToPricing: document.getElementById("btnCheckoutBackToPricing"),
    guestHeaderActions: document.getElementById("guestHeaderActions"),
    userHeaderActions: document.getElementById("userHeaderActions"),
    btnHeaderLoginPrompt: document.getElementById("btnHeaderLoginPrompt"),
    btnSubscriptionBadge: document.getElementById("btnSubscriptionBadge"),
    planBadgeText: document.getElementById("planBadgeText"),
    btnOpenProfileModal: document.getElementById("btnOpenProfileModal"),
    headerUserAvatarImg: document.getElementById("headerUserAvatarImg"),
    headerUserAvatarInitials: document.getElementById("headerUserAvatarInitials"),
    headerUserNameText: document.getElementById("headerUserNameText"),
    btnSignOutTop: document.getElementById("btnSignOutTop"),

    // Elemen Halaman Sukses Pembayaran & Tanda Terima Digital
    receiptOrderIdText: document.getElementById("receiptOrderIdText"),
    receiptPaymentMethodText: document.getElementById("receiptPaymentMethodText"),
    receiptTimestampText: document.getElementById("receiptTimestampText"),
    receiptUserEmailText: document.getElementById("receiptUserEmailText"),
    receiptValidUntilText: document.getElementById("receiptValidUntilText"),
    receiptTotalAmountText: document.getElementById("receiptTotalAmountText"),
    btnSuccessGoDashboard: document.getElementById("btnSuccessGoDashboard"),
    btnSuccessGoProfile: document.getElementById("btnSuccessGoProfile"),
    btnSuccessPrintReceipt: document.getElementById("btnSuccessPrintReceipt"),

    // Gerbang Verifikasi Email Dedikasi
    verifyTargetEmailText: document.getElementById("verifyTargetEmailText"),
    btnConfirmEmailVerified: document.getElementById("btnConfirmEmailVerified"),
    spinnerCheckVerify: document.getElementById("spinnerCheckVerify"),
    btnResendEmailVerifyPage: document.getElementById("btnResendEmailVerifyPage"),
    btnResendVerifyText: document.getElementById("btnResendVerifyText"),
    btnSignOutFromVerifyPage: document.getElementById("btnSignOutFromVerifyPage"),

    // Auth Layar Login
    btnLoginGooglePage: document.getElementById("btnLoginGooglePage"),
    formEmailAuth: document.getElementById("formEmailAuth"),
    groupRegisterName: document.getElementById("groupRegisterName"),
    authNameInput: document.getElementById("authNameInput"),
    authEmailInput: document.getElementById("authEmailInput"),
    authPasswordInput: document.getElementById("authPasswordInput"),
    groupRegisterPasswordConfirm: document.getElementById("groupRegisterPasswordConfirm"),
    authPasswordConfirmInput: document.getElementById("authPasswordConfirmInput"),
    linkForgotPasswordArea: document.getElementById("linkForgotPasswordArea"),
    btnForgotPassword: document.getElementById("btnForgotPassword"),
    authNoticeBox: document.getElementById("authNoticeBox"),
    authNoticeText: document.getElementById("authNoticeText"),
    authNoticeActions: document.getElementById("authNoticeActions"),
    btnResendVerificationEmail: document.getElementById("btnResendVerificationEmail"),
    btnSubmitAuthForm: document.getElementById("btnSubmitAuthForm"),
    btnSubmitAuthText: document.getElementById("btnSubmitAuthText"),
    spinnerAuth: document.getElementById("spinnerAuth"),
    tabBtnLogin: document.getElementById("tabBtnLogin"),
    tabBtnRegister: document.getElementById("tabBtnRegister"),
    authBoxTitle: document.getElementById("authBoxTitle"),
    authBoxSubtitle: document.getElementById("authBoxSubtitle"),

    // Banner Verifikasi Email di Dashboard
    emailVerificationBanner: document.getElementById("emailVerificationBanner"),
    userVerificationEmailText: document.getElementById("userVerificationEmailText"),
    btnCheckVerificationStatus: document.getElementById("btnCheckVerificationStatus"),
    btnResendVerificationDashboard: document.getElementById("btnResendVerificationDashboard"),

    // Modal Reset Kata Sandi
    modalResetPassword: document.getElementById("modalResetPassword"),
    btnCloseResetPasswordModal: document.getElementById("btnCloseResetPasswordModal"),
    btnCancelResetPassword: document.getElementById("btnCancelResetPassword"),
    formResetPassword: document.getElementById("formResetPassword"),
    inputResetEmail: document.getElementById("inputResetEmail"),
    btnSubmitResetPassword: document.getElementById("btnSubmitResetPassword"),
    btnSubmitResetText: document.getElementById("btnSubmitResetText"),
    spinnerResetPassword: document.getElementById("spinnerResetPassword"),

    // Banner Data Sampel (Trial Hook)
    dummyDataNoticeBar: document.getElementById("dummyDataNoticeBar"),
    btnDeleteDummyData: document.getElementById("btnDeleteDummyData"),

    // Dashboard & Stats
    statTotal: document.getElementById("statTotal"),
    statWilayah: document.getElementById("statWilayah"),
    statWilayahLabel: document.getElementById("statWilayahLabel"),
    statCategoryCount: document.getElementById("statCategoryCount"),
    statDays: document.getElementById("statDays"),

    // Filter & Search
    searchInput: document.getElementById("searchInput"),
    btnClearSearch: document.getElementById("btnClearSearch"),
    kabupatenPills: document.getElementById("kabupatenPills"),
    filterKategoriSelect: document.getElementById("filterKategoriSelect"),

    // Feed & Tombol Aksi
    feedList: document.getElementById("logbookFeedList"),
    emptyState: document.getElementById("emptyState"),
    btnEmptyAdd: document.getElementById("btnEmptyAdd"),
    filteredCountBadge: document.getElementById("filteredCountBadge"),
    btnOpenAddModal: document.getElementById("btnOpenAddModal"),
    btnOpenExportModal: document.getElementById("btnOpenExportModal"),
    btnRefreshSync: document.getElementById("btnRefreshSync"),

    // Portal Checkout & Saluran Pembayaran (Route: /checkout)
    checkoutChannelSelection: document.getElementById("checkoutChannelSelection"),
    checkoutActivePaymentView: document.getElementById("checkoutActivePaymentView"),
    btnCheckoutChangeMethod: document.getElementById("btnCheckoutChangeMethod"),
    checkoutQrisArea: document.getElementById("checkoutQrisArea"),
    checkoutVaArea: document.getElementById("checkoutVaArea"),
    checkoutSubtotalText: document.getElementById("checkoutSubtotalText"),
    checkoutFeeLabel: document.getElementById("checkoutFeeLabel"),
    checkoutFeeText: document.getElementById("checkoutFeeText"),
    checkoutGrandTotalText: document.getElementById("checkoutGrandTotalText"),

    // Backward Compatibility Fallbacks
    modalPaywall: document.getElementById("modalPaywall"),
    btnClosePaywall: document.getElementById("btnClosePaywall"),
    paywallSelectionView: document.getElementById("checkoutChannelSelection"),
    paywallActivePaymentView: document.getElementById("checkoutActivePaymentView"),
    btnBackToChannels: document.getElementById("btnCheckoutChangeMethod"),
    paywallQrisArea: document.getElementById("checkoutQrisArea"),
    paywallVaArea: document.getElementById("checkoutVaArea"),
    qrisOrderIdText: document.getElementById("qrisOrderIdText"),
    qrisSandboxNotice: document.getElementById("qrisSandboxNotice"),
    qrisBaseAmount: document.getElementById("qrisBaseAmount"),
    qrisFeeRow: document.getElementById("qrisFeeRow"),
    qrisFeeAmount: document.getElementById("qrisFeeAmount"),
    qrisTotalAmount: document.getElementById("qrisTotalAmount"),
    qrisInstructionsText: document.getElementById("qrisInstructionsText"),
    qrisImageContainer: document.getElementById("qrisImageContainer"),
    qrisSpinner: document.getElementById("qrisSpinner"),
    qrisImageElement: document.getElementById("qrisImageElement"),
    vaBankNameTitle: document.getElementById("vaBankNameTitle"),
    vaOrderIdText: document.getElementById("vaOrderIdText"),
    vaSandboxNotice: document.getElementById("vaSandboxNotice"),
    vaNumberDisplay: document.getElementById("vaNumberDisplay"),
    btnCopyVaNumber: document.getElementById("btnCopyVaNumber"),
    vaExpiryHint: document.getElementById("vaExpiryHint"),
    vaBaseAmount: document.getElementById("vaBaseAmount"),
    vaFeeAmount: document.getElementById("vaFeeAmount"),
    vaTotalAmount: document.getElementById("vaTotalAmount"),
    btnCopyVaAmount: document.getElementById("btnCopyVaAmount"),
    vaInstructionsList: document.getElementById("vaInstructionsList"),
    btnCheckPaymentStatus: document.getElementById("btnCheckPaymentStatus"),
    btnOpenPakasirWebLink: document.getElementById("btnOpenPakasirWebLink"),
    btnSimulateSuccessPayment: document.getElementById("btnSimulateSuccessPayment"),
    qrisSimulateArea: document.getElementById("qrisSimulateArea"),

    // Modal Profil Riset & Tree Wilayah
    modalProfile: document.getElementById("modalProfile"),
    btnCloseProfileModal: document.getElementById("btnCloseProfileModal"),
    btnCancelProfile: document.getElementById("btnCancelProfile"),
    formResearcherProfile: document.getElementById("formResearcherProfile"),
    profName: document.getElementById("profName"),
    profNim: document.getElementById("profNim"),
    profUniversity: document.getElementById("profUniversity"),
    profMajor: document.getElementById("profMajor"),
    profTopic: document.getElementById("profTopic"),
    profSupervisor: document.getElementById("profSupervisor"),
    profSupervisorNip: document.getElementById("profSupervisorNip"),
    btnAddKabupatenBtn: document.getElementById("btnAddKabupatenBtn"),
    profileLocationsTree: document.getElementById("profileLocationsTree"),
    btnSaveProfile: document.getElementById("btnSaveProfile"),

    // Modal Form Logbook
    modalForm: document.getElementById("modalForm"),
    modalFormTitle: document.getElementById("modalFormTitle"),
    modalFormSubtitle: document.getElementById("modalFormSubtitle"),
    btnCloseAddModal: document.getElementById("btnCloseAddModal"),
    btnCancelAdd: document.getElementById("btnCancelAdd"),
    formAddLogbook: document.getElementById("formAddLogbook"),
    checkCustomLocation: document.getElementById("checkCustomLocation"),
    sectionRegisteredLocation: document.getElementById("sectionRegisteredLocation"),
    sectionCustomLocation: document.getElementById("sectionCustomLocation"),
    selectKabupaten: document.getElementById("selectKabupaten"),
    selectKecamatan: document.getElementById("selectKecamatan"),
    selectDesa: document.getElementById("selectDesa"),
    selectDusun: document.getElementById("selectDusun"),
    inputCustomKabupaten: document.getElementById("inputCustomKabupaten"),
    inputCustomKecamatan: document.getElementById("inputCustomKecamatan"),
    inputCustomDesa: document.getElementById("inputCustomDesa"),
    inputCustomDusun: document.getElementById("inputCustomDusun"),
    selectActivityCategory: document.getElementById("selectActivityCategory"),
    btnOpenManageCategories: document.getElementById("btnOpenManageCategories"),
    btnToggleNewCategoryForm: document.getElementById("btnToggleNewCategoryForm"),
    quickNewCategoryArea: document.getElementById("quickNewCategoryArea"),
    inputQuickNewCategoryName: document.getElementById("inputQuickNewCategoryName"),
    btnSaveQuickNewCategory: document.getElementById("btnSaveQuickNewCategory"),
    fieldResponden: document.getElementById("fieldResponden"),
    inputResponden: document.getElementById("inputResponden"),
    inputTanggal: document.getElementById("inputTanggal"),
    inputWaktuMulai: document.getElementById("inputWaktuMulai"),
    inputWaktuSelesai: document.getElementById("inputWaktuSelesai"),
    inputDeskripsi: document.getElementById("inputDeskripsi"),
    inputOutput: document.getElementById("inputOutput"),
    inputFoto: document.getElementById("inputFoto"),
    dropZone: document.getElementById("dropZone"),
    uploadPrompt: document.getElementById("uploadPrompt"),
    photoPreviewContainer: document.getElementById("photoPreviewContainer"),
    photoPreviewImg: document.getElementById("photoPreviewImg"),
    btnRemovePhoto: document.getElementById("btnRemovePhoto"),
    btnSubmitLogbook: document.getElementById("btnSubmitLogbook"),
    btnSubmitText: document.getElementById("btnSubmitText"),
    submitSpinner: document.getElementById("submitSpinner"),

    // Modal Kelola Kategori
    modalCategoryManager: document.getElementById("modalCategoryManager"),
    btnCloseCatModal: document.getElementById("btnCloseCatModal"),
    inputNewCategoryModal: document.getElementById("inputNewCategoryModal"),
    btnAddNewCategoryModal: document.getElementById("btnAddNewCategoryModal"),
    categoryListContainer: document.getElementById("categoryListContainer"),

    // Modal Ekspor Word
    modalExport: document.getElementById("modalExport"),
    btnCloseExportModal: document.getElementById("btnCloseExportModal"),
    btnCancelExport: document.getElementById("btnCancelExport"),
    exportOptionsContainer: document.getElementById("exportOptionsContainer"),
    exportCategoryFilter: document.getElementById("exportCategoryFilter"),
    exportDateStart: document.getElementById("exportDateStart"),
    exportDateEnd: document.getElementById("exportDateEnd"),
    exportSummaryCount: document.getElementById("exportSummaryCount"),
    btnDownloadWordAction: document.getElementById("btnDownloadWordAction"),
    exportSpinner: document.getElementById("exportSpinner"),

    // Modal Lightbox Foto & Toast
    modalLightbox: document.getElementById("modalLightbox"),
    btnCloseLightbox: document.getElementById("btnCloseLightbox"),
    lightboxImg: document.getElementById("lightboxImg"),
    lightboxCaption: document.getElementById("lightboxCaption"),

    // Modal Kelola Wilayah (5 Tingkat)
    modalAddLocation: document.getElementById("modalAddLocation"),
    modalAddLocationTitle: document.getElementById("modalAddLocationTitle"),
    modalAddLocationSubtitle: document.getElementById("modalAddLocationSubtitle"),
    btnCloseAddLocationModal: document.getElementById("btnCloseAddLocationModal"),
    btnCancelAddLocation: document.getElementById("btnCancelAddLocation"),
    formAddLocationEntry: document.getElementById("formAddLocationEntry"),
    btnSubmitAddLocation: document.getElementById("btnSubmitAddLocation"),
    btnSubmitAddLocationText: document.getElementById("btnSubmitAddLocationText"),
    locContextMode: document.getElementById("locContextMode"),
    locTargetKabIdx: document.getElementById("locTargetKabIdx"),
    locTargetKecIdx: document.getElementById("locTargetKecIdx"),
    locInputProvinsi: document.getElementById("locInputProvinsi"),
    locInputKabupaten: document.getElementById("locInputKabupaten"),
    locInputKecamatan: document.getElementById("locInputKecamatan"),
    locInputDesa: document.getElementById("locInputDesa"),
    locInputDusun: document.getElementById("locInputDusun"),
    groupLocProvinsi: document.getElementById("groupLocProvinsi"),
    groupLocKabupaten: document.getElementById("groupLocKabupaten"),
    groupLocKecamatan: document.getElementById("groupLocKecamatan"),
    groupLocDesa: document.getElementById("groupLocDesa"),
    groupLocDusun: document.getElementById("groupLocDusun"),

    // Modal Konfirmasi Hapus Wilayah (In-App)
    modalConfirmDeleteLocation: document.getElementById("modalConfirmDeleteLocation"),
    deleteLocationModalTitle: document.getElementById("deleteLocationModalTitle"),
    deleteLocationMessage: document.getElementById("deleteLocationMessage"),
    btnCloseConfirmDeleteModal: document.getElementById("btnCloseConfirmDeleteModal"),
    btnCancelDeleteLocation: document.getElementById("btnCancelDeleteLocation"),
    btnExecuteDeleteLocation: document.getElementById("btnExecuteDeleteLocation"),
    toastMessage: document.getElementById("toastMessage")
  };

  // ==========================================================================
  // 1. INISIALISASI APLIKASI
  // ==========================================================================
  async function initApp() {
    // 1. Catat rute awal dari URL browser sebelum dilakukan evaluasi atau navigasi
    const initialTargetRoute = normalizeRoute(window.location.pathname);

    try {
      // 2. Inisialisasi Firebase & Auth
      if (window.FirebaseService) {
        await FirebaseService.initialize();
      }
      if (window.AuthManager) {
        await AuthManager.init();
        // Menunggu sampai evaluasi sesi akun selesai (mencegah auth flicker / glitch)
        await AuthManager.waitForAuthReady();
        // Pasang listener untuk perubahan sesi berikutnya (login / logout manual)
        AuthManager.onUserChanged(handleUserOrProfileChanged);
      }

      // 3. Pasang Event Listeners
      setupEventListeners();

      // 4. Render awal berdasarkan status sesi yang sudah terverifikasi
      const user = window.AuthManager ? AuthManager.currentUser : null;
      await syncViewState(user, initialTargetRoute);
    } catch (err) {
      console.error("Gagal inisialisasi aplikasi:", err);
      const splash = document.getElementById("appInitialSplash");
      if (splash) splash.classList.add("hidden");
      const user = window.AuthManager ? AuthManager.currentUser : null;
      await syncViewState(user, initialTargetRoute);
    }
  }

  // ==========================================================================
  // ROUTER SISTEM PROFESIONAL (HTML5 HISTORY API - STANDAR INDUSTRI)
  // ==========================================================================
  const ROUTES = {
    LOGIN: "/login",
    VERIFY_EMAIL: "/verify-email",
    DASHBOARD: "/dashboard",
    PRICING: "/pricing",
    CHECKOUT: "/checkout",
    PAYMENT_SUCCESS: "/payment-success",
    PROFILE: "/profile"
  };

  function normalizeRoute(path) {
    if (!path || path === "/" || path === "") return ROUTES.DASHBOARD;
    const clean = path.split("?")[0].split("#")[0];
    return clean || ROUTES.DASHBOARD;
  }

  function navigateTo(targetPath, replace = false) {
    let cleanPath = normalizeRoute(targetPath);
    const user = window.AuthManager ? AuthManager.currentUser : null;

    // Proteksi Rute (Auth Gating Standar Industri)
    if (!user) {
      if (cleanPath !== ROUTES.LOGIN) {
        cleanPath = ROUTES.LOGIN;
      }
    } else if (!user.isDemo && !user.emailVerified) {
      if (cleanPath !== ROUTES.VERIFY_EMAIL) {
        cleanPath = ROUTES.VERIFY_EMAIL;
      }
    } else {
      // Pengguna aktif & terverifikasi
      if (cleanPath === ROUTES.LOGIN || cleanPath === ROUTES.VERIFY_EMAIL) {
        cleanPath = ROUTES.DASHBOARD;
      }
    }

    if (window.location.pathname !== cleanPath) {
      if (replace) {
        window.history.replaceState({ route: cleanPath }, "", cleanPath);
      } else {
        window.history.pushState({ route: cleanPath }, "", cleanPath);
      }
    }

    renderRoute(cleanPath);
  }

  function renderRoute(path) {
    const cleanPath = normalizeRoute(path);

    // Sembunyikan splash screen awal jika masih aktif
    const splash = document.getElementById("appInitialSplash");
    if (splash) splash.classList.add("hidden");

    // Sembunyikan semua tampilan utama
    if (DOM.viewLoginScreen) DOM.viewLoginScreen.classList.add("hidden");
    if (DOM.viewVerifyEmail) DOM.viewVerifyEmail.classList.add("hidden");
    if (DOM.viewMainApp) DOM.viewMainApp.classList.add("hidden");
    if (DOM.viewPricing) DOM.viewPricing.classList.add("hidden");
    if (DOM.viewCheckout) DOM.viewCheckout.classList.add("hidden");
    if (DOM.viewPaymentSuccess) DOM.viewPaymentSuccess.classList.add("hidden");

    const user = window.AuthManager ? AuthManager.currentUser : null;
    if (!user) {
      if (DOM.guestHeaderActions) DOM.guestHeaderActions.classList.remove("hidden");
      if (DOM.userHeaderActions) DOM.userHeaderActions.classList.add("hidden");
    } else {
      if (DOM.guestHeaderActions) DOM.guestHeaderActions.classList.add("hidden");
      if (DOM.userHeaderActions) DOM.userHeaderActions.classList.remove("hidden");
    }

    switch (cleanPath) {
      case ROUTES.LOGIN:
        if (DOM.viewLoginScreen) DOM.viewLoginScreen.classList.remove("hidden");
        break;

      case ROUTES.VERIFY_EMAIL:
        if (DOM.viewVerifyEmail) DOM.viewVerifyEmail.classList.remove("hidden");
        if (DOM.verifyTargetEmailText && user) {
          DOM.verifyTargetEmailText.textContent = user.email || "-";
        }
        break;

      case ROUTES.PRICING:
        if (DOM.viewPricing) DOM.viewPricing.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;

      case ROUTES.CHECKOUT:
        if (DOM.viewCheckout) DOM.viewCheckout.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
        updateCheckoutSummaryDisplay();
        break;

      case ROUTES.PAYMENT_SUCCESS:
        if (DOM.viewPaymentSuccess) DOM.viewPaymentSuccess.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
        renderPaymentSuccessReceipt();
        break;

      case ROUTES.PROFILE:
        if (DOM.viewMainApp) DOM.viewMainApp.classList.remove("hidden");
        openProfileModal();
        break;

      case ROUTES.DASHBOARD:
      default:
        if (DOM.viewMainApp) DOM.viewMainApp.classList.remove("hidden");
        break;
    }
  }

  function renderPaymentSuccessReceipt() {
    const user = window.AuthManager ? AuthManager.currentUser : null;
    let order = state.lastCompletedOrder || state.currentPaymentOrder;
    const isSubscribed = window.AuthManager && AuthManager.isSubscribed();

    // Pastikan pesanan terikat pada akun mahasiswa yang sedang aktif (Isolasi Multi-Tenant)
    if (order && order.userId && user && order.userId !== user.uid) {
      order = null;
    }

    // Jika pengguna belum berlangganan sama sekali dan tidak ada data pesanan baru untuk akun ini, redirect ke pricing
    if (!order && !isSubscribed) {
      navigateTo(ROUTES.PRICING, true);
      return;
    }

    const orderId = (order && order.orderId) || (user && user.subscriptionOrderId) || `LB-${Date.now().toString().slice(-8)}`;
    const methodKey = (order && order.method) || "qris";
    const methodName = VA_BANK_NAMES[methodKey] || (methodKey === "qris" ? "QRIS (Semua Bank & Dompet Digital)" : methodKey === "payment_link" ? "Portal Resmi Pakasir (pay-v2)" : methodKey);
    const completedDate = (order && order.completedAt) ? new Date(order.completedAt) : new Date();

    const validUntil = new Date(completedDate);
    validUntil.setDate(validUntil.getDate() + 90);

    const totalAmount = (order && (order.totalPayment || order.amount)) || 50660;

    const dateFormatter = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const expiryFormatter = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    if (DOM.receiptOrderIdText) DOM.receiptOrderIdText.textContent = `Order #${orderId}`;
    if (DOM.receiptPaymentMethodText) DOM.receiptPaymentMethodText.textContent = methodName;
    if (DOM.receiptTimestampText) DOM.receiptTimestampText.textContent = dateFormatter.format(completedDate);
    if (DOM.receiptUserEmailText) DOM.receiptUserEmailText.textContent = (user && user.email) || "-";
    if (DOM.receiptValidUntilText) DOM.receiptValidUntilText.textContent = `90 Hari Kalender (hingga ${expiryFormatter.format(validUntil)})`;
    if (DOM.receiptTotalAmountText) DOM.receiptTotalAmountText.textContent = formatRupiah(totalAmount);
  }

  function updateCheckoutSummaryDisplay() {
    const order = state.currentPaymentOrder;
    const baseAmount = order?.amount || 50000;
    let fee = 660;
    if (order?.fee !== undefined) {
      fee = order.fee;
    } else if (order?.method === "artha_graha_va" || order?.method === "sampoerna_va") {
      fee = 2000;
    } else if (order?.method && order.method.includes("_va")) {
      fee = 3500;
    } else if (order?.method === "qris") {
      fee = 660;
    }
    const total = order?.totalPayment || (baseAmount + fee);

    if (DOM.checkoutSubtotalText) DOM.checkoutSubtotalText.textContent = formatRupiah(baseAmount);
    if (DOM.checkoutFeeText) DOM.checkoutFeeText.textContent = formatRupiah(fee);
    if (DOM.checkoutFeeLabel) {
      if (order?.method === "qris") {
        DOM.checkoutFeeLabel.textContent = "Biaya Layanan (QRIS)";
      } else if (order?.method && (order.method === "artha_graha_va" || order.method === "sampoerna_va")) {
        DOM.checkoutFeeLabel.textContent = "Biaya Administrasi (Hemat Rp 2.000)";
      } else if (order?.method && order.method.includes("_va")) {
        DOM.checkoutFeeLabel.textContent = "Biaya Administrasi (VA)";
      } else {
        DOM.checkoutFeeLabel.textContent = "Biaya Transaksi";
      }
    }
    if (DOM.checkoutGrandTotalText) DOM.checkoutGrandTotalText.textContent = formatRupiah(total);
  }

  async function handleUserOrProfileChanged(user) {
    await syncViewState(user);
  }

  async function syncViewState(user, targetRoute = null) {
    const splash = document.getElementById("appInitialSplash");
    if (splash) splash.classList.add("hidden");

    if (!user) {
      state.entries = [];
      state.currentPaymentOrder = null;
      state.lastCompletedOrder = null;
      renderHeaderUserProfile(null);
      navigateTo(ROUTES.LOGIN, true);
      return;
    }

    // Bersihkan pesanan jika milik akun lain (Isolasi Multi-Tenant)
    if (state.lastCompletedOrder && state.lastCompletedOrder.userId && state.lastCompletedOrder.userId !== user.uid) {
      state.lastCompletedOrder = null;
    }
    if (state.currentPaymentOrder && state.currentPaymentOrder.userId && state.currentPaymentOrder.userId !== user.uid) {
      state.currentPaymentOrder = null;
    }

    // CEK GERBANG VERIFIKASI EMAIL (STANDAR INDUSTRI AUTH GATING)
    if (!user.isDemo && !user.emailVerified) {
      navigateTo(ROUTES.VERIFY_EMAIL, true);
      return;
    }

    // MODE TEROTENTIKASI & TERVERIFIKASI
    if (window.ProfileManager) {
      await ProfileManager.init(user);
    }
    if (window.CategoryManager) {
      await CategoryManager.init(user);
    }

    updateSubscriptionBadgeUI();
    renderHeaderUserProfile(user, window.ProfileManager ? ProfileManager.currentProfile : null);
    await loadEntries(user);
    refreshFormLocations();
    refreshCategoryDropdowns();

    // Fallback status banner verifikasi email jika di dashboard
    if (DOM.emailVerificationBanner) {
      if (user.email && !user.emailVerified) {
        if (DOM.userVerificationEmailText) DOM.userVerificationEmailText.textContent = user.email;
        DOM.emailVerificationBanner.classList.remove("hidden");
      } else {
        DOM.emailVerificationBanner.classList.add("hidden");
      }
    }

    // Rute tujuan saat ini (utamakan targetRoute jika diberikan saat startup/refresh)
    const currentPath = targetRoute ? normalizeRoute(targetRoute) : normalizeRoute(window.location.pathname);
    if (currentPath === ROUTES.LOGIN || currentPath === ROUTES.VERIFY_EMAIL) {
      navigateTo(ROUTES.DASHBOARD, true);
    } else {
      navigateTo(currentPath, true);
    }
  }

  function updateSubscriptionBadgeUI() {
    const isSub = window.AuthManager && AuthManager.isSubscribed();
    if (!DOM.btnSubscriptionBadge || !DOM.planBadgeText) return;

    if (isSub) {
      const remainingDays = AuthManager.getRemainingDays();
      DOM.btnSubscriptionBadge.className = "badge-plan pro";
      DOM.planBadgeText.textContent = `Aktif (${remainingDays} hari)`;
    } else {
      DOM.btnSubscriptionBadge.className = "badge-plan free";
      DOM.planBadgeText.textContent = "Mode Uji Coba";
    }
  }

  /**
   * Render Avatar Profil Pengguna di Header
   * Menampilkan foto profil Google (user.photoURL) atau graceful fallback inisial nama.
   * Standar Industri: refererless image loading + auto fallback onError
   */
  function renderHeaderUserProfile(user, profile = null) {
    if (!user) {
      if (DOM.headerUserAvatarImg) {
        DOM.headerUserAvatarImg.src = "";
        DOM.headerUserAvatarImg.classList.add("hidden");
      }
      if (DOM.headerUserAvatarInitials) {
        DOM.headerUserAvatarInitials.textContent = "U";
        DOM.headerUserAvatarInitials.classList.remove("hidden");
      }
      if (DOM.headerUserNameText) {
        DOM.headerUserNameText.textContent = "Profil Riset";
      }
      return;
    }

    // Dapatkan nama pengguna aktif dari profil riset atau akun login Google/Email
    const prof = profile || (window.ProfileManager ? ProfileManager.currentProfile : null) || {};
    const displayName = (prof.name && prof.name.trim()) ||
                        (user.displayName && user.displayName.trim()) ||
                        (user.email ? user.email.split("@")[0] : "") ||
                        "Peneliti";

    if (DOM.headerUserNameText) {
      DOM.headerUserNameText.textContent = displayName;
    }

    // Hitung inisial nama elegan (1 atau 2 huruf kapital)
    let initials = "U";
    if (displayName) {
      const parts = displayName.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else if (parts.length === 1 && parts[0].length > 0) {
        initials = parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
      }
    }

    if (DOM.headerUserAvatarInitials) {
      DOM.headerUserAvatarInitials.textContent = initials;
    }

    // Cek foto profil Google (user.photoURL)
    const photoUrl = user.photoURL;
    if (photoUrl && DOM.headerUserAvatarImg) {
      DOM.headerUserAvatarImg.src = photoUrl;
      DOM.headerUserAvatarImg.alt = displayName;
      DOM.headerUserAvatarImg.classList.remove("hidden");
      if (DOM.headerUserAvatarInitials) {
        DOM.headerUserAvatarInitials.classList.add("hidden");
      }

      // Fallback otomatis jika tautan gambar bermasalah atau offline
      DOM.headerUserAvatarImg.onerror = () => {
        DOM.headerUserAvatarImg.classList.add("hidden");
        if (DOM.headerUserAvatarInitials) {
          DOM.headerUserAvatarInitials.classList.remove("hidden");
        }
      };
    } else {
      // Tidak ada foto profil Google: Tampilkan inisial huruf
      if (DOM.headerUserAvatarImg) {
        DOM.headerUserAvatarImg.src = "";
        DOM.headerUserAvatarImg.classList.add("hidden");
      }
      if (DOM.headerUserAvatarInitials) {
        DOM.headerUserAvatarInitials.classList.remove("hidden");
      }
    }
  }

  // ==========================================================================
  // 2. MANAJEMEN DATA LOGBOOK & TRIAL HOOK
  // ==========================================================================
  function sanitizeEntries(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => {
      if (!item || !item.id) return false;
      const kab = String(item.kabupaten || "").trim();
      const tgl = String(item.tanggal || "").trim();
      if (!kab || !tgl || kab === "-" || tgl === "-" || tgl === "Invalid Date") return false;
      return true;
    });
  }

  async function loadEntries(user) {
    if (!user) {
      state.entries = [];
      updateDashboard();
      return;
    }

    state.isSyncing = true;
    updateSyncStatusUI();

    let fetched = [];

    // Baca dari Cloud Firestore jika tersedia
    if (window.FirebaseService && FirebaseService.isInitialized && FirebaseService.db) {
      try {
        const snap = await FirebaseService.db
          .collection("users")
          .doc(user.uid)
          .collection("logbooks")
          .get();

        snap.forEach(doc => {
          fetched.push({ id: doc.id, ...doc.data() });
        });
      } catch (err) {
        console.warn("Gagal membaca Firestore, fallback ke cache lokal:", err);
      }
    }

    // Jika Firestore kosong / akun baru, cek LocalStorage atau buat 3 data sampel bawaan
    const storageKey = `LOGBOOK_ENTRIES_${user.uid}`;
    if (fetched.length === 0) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          fetched = JSON.parse(saved);
        }
      } catch (e) {
        // ignore
      }
    }

    // Jika belum ada data riil dan pengguna belum pernah menghapus data contoh, berikan 3 data sampel bawaan untuk simulasi
    const isDismissed = (window.AuthManager && AuthManager.isDummyDismissed) ? AuthManager.isDummyDismissed(user.uid) : false;
    if (fetched.length === 0 && !isDismissed && Array.isArray(AuthManager.INITIAL_DUMMY_LOGBOOKS)) {
      fetched = [...AuthManager.INITIAL_DUMMY_LOGBOOKS];
    }

    // Jika data yang dimuat dari cache lokal masih merupakan data dummy lama (Luwu/Wajo tanpa foto), mutakhirkan ke data dummy baru
    if (fetched.length > 0 && fetched.every(e => e.isDummy === true)) {
      const hasOldDummy = fetched.some(e => e.kabupaten === "Luwu" || e.kabupaten === "Wajo" || !e.fotoUrl);
      if (hasOldDummy && Array.isArray(AuthManager.INITIAL_DUMMY_LOGBOOKS)) {
        fetched = [...AuthManager.INITIAL_DUMMY_LOGBOOKS];
      }
    }

    state.entries = sanitizeEntries(fetched);
    saveEntriesToLocalStorage(state.entries, user);
    state.isSyncing = false;
    updateSyncStatusUI();
    updateDashboard();
    preloadEntryPhotos(state.entries, user);
  }

  /**
   * Preload foto latar belakang agar tersimpan di fotoBase64 entri lokal
   * Menjamin ekspor Word instan bebas hambatan CORS
   */
  function preloadEntryPhotos(entries, user) {
    if (!Array.isArray(entries) || entries.length === 0) return;
    const needsPhoto = entries.filter(e => e && e.fotoUrl && !e.fotoBase64 && !e.fotoUrl.startsWith("data:image"));
    if (needsPhoto.length === 0) return;

    needsPhoto.forEach((item, idx) => {
      setTimeout(async () => {
        try {
          if (item.fotoBase64) return;
          const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(item.fotoUrl)}`;
          const resp = await fetch(proxyUrl);
          if (resp && resp.ok) {
            const blob = await resp.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              if (reader.result && typeof reader.result === "string" && reader.result.startsWith("data:image")) {
                item.fotoBase64 = reader.result;
                saveEntriesToLocalStorage(state.entries, user);
              }
            };
            reader.readAsDataURL(blob);
          }
        } catch (err) {
          // Background preload silent fallback
        }
      }, idx * 250);
    });
  }

  function saveEntriesToLocalStorage(arr, user) {
    if (!user) return;
    try {
      localStorage.setItem(`LOGBOOK_ENTRIES_${user.uid}`, JSON.stringify(arr));
    } catch (e) {
      console.warn("Gagal simpan localStorage:", e);
    }
  }

  function updateSyncStatusUI() {
    const icon = document.getElementById("refreshIcon");
    if (icon) {
      if (state.isSyncing) icon.classList.add("spinning");
      else icon.classList.remove("spinning");
    }
  }

  // ==========================================================================
  // 3. DASHBOARD, FEED & FILTER DATA
  // ==========================================================================
  function getFilteredEntries() {
    return state.entries.filter(item => {
      const kab = String(item.kabupaten || "").trim();
      const tgl = String(item.tanggal || "").trim();
      if (!kab || !tgl || kab === "-" || tgl === "-") return false;

      // Filter Wilayah
      if (state.activeKabupaten !== "all") {
        if (item.kabupaten.toLowerCase() !== state.activeKabupaten.toLowerCase()) {
          return false;
        }
      }

      // Filter Kategori
      if (state.activeKategori !== "all") {
        if (item.jenisKegiatan !== state.activeKategori) {
          return false;
        }
      }

      // Pencarian Kata Kunci
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const searchStr = `${item.kabupaten} ${item.kecamatan || ""} ${item.desa || ""} ${item.dusun || ""} ${item.jenisKegiatan || ""} ${item.sasaranResponden || ""} ${item.deskripsi || ""} ${item.output || ""}`.toLowerCase();
        if (!searchStr.includes(q)) return false;
      }

      return true;
    });
  }

  function updateDashboard() {
    const filtered = getFilteredEntries();

    // 1. Tampilkan / Sembunyikan Banner Dummy Data (Trial Notice)
    const hasDummy = state.entries.some(e => e.isDummy === true);
    if (DOM.dummyDataNoticeBar) {
      DOM.dummyDataNoticeBar.classList.toggle("hidden", !hasDummy);
    }
    if (DOM.btnDeleteDummyData) {
      // Tombol hapus data sampel hanya muncul bila pengguna sudah berlangganan
      const isSub = window.AuthManager && AuthManager.isSubscribed();
      DOM.btnDeleteDummyData.classList.toggle("hidden", !(hasDummy && isSub));
    }

    // 2. Statistik
    if (DOM.statTotal) DOM.statTotal.textContent = state.entries.length;
    if (DOM.statWilayah) {
      const uniqueWilayah = new Set(state.entries.map(e => e.kabupaten).filter(Boolean));
      DOM.statWilayah.textContent = uniqueWilayah.size;
    }
    if (DOM.statCategoryCount) {
      const uniqueCats = new Set(state.entries.map(e => e.jenisKegiatan).filter(Boolean));
      DOM.statCategoryCount.textContent = uniqueCats.size;
    }
    if (DOM.statDays) {
      const uniqueDays = new Set(state.entries.map(e => e.tanggal).filter(Boolean));
      DOM.statDays.textContent = uniqueDays.size;
    }

    // 3. Counter Badge
    if (DOM.filteredCountBadge) {
      DOM.filteredCountBadge.textContent = `Menampilkan ${filtered.length} dari ${state.entries.length} data`;
    }

    // 4. Update Pills Wilayah Dinamis
    renderKabupatenPills();

    // 5. Render Feed Cards
    renderFeedList(filtered);
  }

  function renderKabupatenPills() {
    if (!DOM.kabupatenPills) return;

    // Ambil kabupaten dari profil atau dari catatan logbook
    const profKab = window.ProfileManager ? ProfileManager.getRegisteredKabupatens() : [];
    const entriesKab = state.entries.map(e => e.kabupaten).filter(Boolean);
    const allKab = [...new Set([...profKab, ...entriesKab])];

    DOM.kabupatenPills.innerHTML = "";

    // Pill Semua Wilayah
    const allBtn = document.createElement("button");
    allBtn.className = `pill-btn ${state.activeKabupaten === "all" ? "active" : ""}`;
    allBtn.dataset.kabupaten = "all";
    allBtn.textContent = "Semua Wilayah";
    DOM.kabupatenPills.appendChild(allBtn);

    allKab.forEach(k => {
      const btn = document.createElement("button");
      btn.className = `pill-btn ${state.activeKabupaten.toLowerCase() === k.toLowerCase() ? "active" : ""}`;
      btn.dataset.kabupaten = k;
      btn.textContent = `Kab. ${k}`;
      DOM.kabupatenPills.appendChild(btn);
    });
  }

  function renderFeedList(items) {
    if (!DOM.feedList) return;
    DOM.feedList.innerHTML = "";

    if (items.length === 0) {
      if (DOM.emptyState) DOM.emptyState.classList.remove("hidden");
      return;
    }

    if (DOM.emptyState) DOM.emptyState.classList.add("hidden");

    const profileTz = (window.ProfileManager && ProfileManager.currentProfile && ProfileManager.currentProfile.timezone) || "WITA";

    // Urutkan terbaru di paling atas feed
    const sorted = [...items].sort((a, b) => {
      const dtA = (a.tanggal || "1970-01-01") + "T" + (a.waktuMulai || "00:00");
      const dtB = (b.tanggal || "1970-01-01") + "T" + (b.waktuMulai || "00:00");
      return dtB.localeCompare(dtA);
    });

    sorted.forEach(item => {
      const card = document.createElement("div");
      card.className = "logbook-card";

      // Badge Wilayah
      const kabBadgeClass = item.kabupaten.toLowerCase().includes("wajo") ? "wajo" : item.kabupaten.toLowerCase().includes("luwu") ? "luwu" : "";
      const displayKab = item.kabupaten.toLowerCase().startsWith("kab") ? item.kabupaten : `Kab. ${item.kabupaten}`;

      // Foto Bukti
      const hasPhoto = Boolean(item.fotoUrl || item.fotoBase64);
      const photoSrc = item.fotoUrl || item.fotoBase64 || "";

      // Detail Lokasi (Kecamatan, Desa, Dusun opsional)
      const locDetailParts = [
        item.kecamatan ? `Kec. ${escapeHtml(item.kecamatan)}` : "",
        item.desa ? `Desa ${escapeHtml(item.desa)}` : "",
        item.dusun ? `Dsn. ${escapeHtml(item.dusun)}` : ""
      ].filter(Boolean);
      const locDetailStr = locDetailParts.length > 0 ? locDetailParts.join(" &bull; ") : "-";

      card.innerHTML = `
        <div class="card-header">
          <div class="card-location">
            <span class="location-badge ${kabBadgeClass}">${escapeHtml(displayKab)}</span>
            <span class="location-detail">${locDetailStr}</span>
            ${item.isDummy ? `<span class="badge-dummy-data">Data Contoh</span>` : ""}
          </div>
          <div class="card-actions-menu">
            <button type="button" class="btn-card-action btn-edit-entry" data-id="${item.id}" title="Edit Catatan Ini">
              Edit
            </button>
            <button type="button" class="btn-card-action btn-delete-entry" data-id="${item.id}" title="Hapus Catatan Ini">
              Hapus
            </button>
          </div>
        </div>

        <div class="card-meta">
          <span class="meta-date">${formatDateIndo(item.tanggal)}</span>
          <span class="meta-time">${escapeHtml(item.waktuMulai || "-")} - ${escapeHtml(item.waktuSelesai || "-")} ${profileTz}</span>
        </div>

        <div class="card-main-layout ${hasPhoto ? "has-side-photo" : ""}">
          <div class="card-text-col">
            <div class="card-activity-type">
              <span class="activity-badge badge-interview">${escapeHtml(item.jenisKegiatan || "-")}</span>
              ${item.sasaranResponden ? `<span class="respondent-info">Responden: <strong>${escapeHtml(item.sasaranResponden)}</strong></span>` : ""}
            </div>

            <div class="card-body-content">
              <p class="card-desc">${escapeHtml(item.deskripsi || "-")}</p>
              
              <div class="card-output">
                <strong>Output Capaian:</strong>
                <span>${escapeHtml(item.output || "-")}</span>
              </div>
            </div>
          </div>

          ${hasPhoto ? `
            <div class="card-photo-col">
              <div class="card-thumb" data-photo-src="${encodeURIComponent(photoSrc)}" title="Klik untuk memperbesar foto GPS Cam">
                <img src="${photoSrc}" alt="Dokumentasi Lapangan GPS Cam" loading="lazy" />
                <span class="thumb-gps-badge">Foto GPS Cam</span>
              </div>
            </div>
          ` : ""}
        </div>
      `;

      DOM.feedList.appendChild(card);
    });
  }

  // ==========================================================================
  // ==========================================================================
  // 4. PORTAL PEMBAYARAN MULTI-CHANNEL PAKASIR API V2
  // ==========================================================================
  const VA_BANK_NAMES = {
    bri_va: "Bank BRI Virtual Account",
    bni_va: "Bank BNI Virtual Account",
    atm_bersama_va: "ATM Bersama Virtual Account",
    bnc_va: "Bank Neo Commerce (BNC) Virtual Account",
    cimb_niaga_va: "Bank CIMB Niaga Virtual Account",
    maybank_va: "Maybank Indonesia Virtual Account",
    permata_va: "Bank Permata Virtual Account",
    artha_graha_va: "Bank Artha Graha Virtual Account",
    sampoerna_va: "Bank Sahabat Sampoerna Virtual Account"
  };

  const VA_INSTRUCTIONS = {
    bri_va: [
      "Buka aplikasi <strong>BRImo</strong> atau kunjungi ATM BRI terdekat.",
      "Pilih menu <strong>Pembayaran / Transfer</strong> &rarr; <strong>Virtual Account (BRIVA)</strong>.",
      "Masukkan nomor Virtual Account BRI yang tertera di atas.",
      "Periksa nama penerima dan nominal transaksi (Rp 53.500).",
      "Konfirmasi dengan PIN BRImo/ATM dan simpan bukti transaksi."
    ],
    bni_va: [
      "Buka aplikasi <strong>BNI Mobile Banking</strong> atau kunjungi ATM BNI.",
      "Pilih menu <strong>Transfer</strong> &rarr; <strong>Virtual Account Billing</strong>.",
      "Masukkan nomor Virtual Account BNI yang tertera di atas.",
      "Pastikan tagihan dan detail pembayaran telah sesuai (Rp 53.500).",
      "Masukkan Password Transaksi dan selesaikan pembayaran."
    ],
    atm_bersama_va: [
      "Gunakan Mobile Banking atau ATM dari bank mana pun berlogo <strong>ATM Bersama / PRIMA / ALTO</strong>.",
      "Pilih menu <strong>Transfer Antar Bank</strong> lalu masukkan kode bank dan nomor VA di atas.",
      "Pastikan nominal transfer sesuai persis dengan total tagihan (Rp 53.500).",
      "Konfirmasi transaksi dan simpan tanda terima pembayaran."
    ],
    bnc_va: [
      "Buka aplikasi <strong>Neobank (Bank Neo Commerce)</strong> atau m-banking lain.",
      "Pilih menu <strong>Transfer / Pembayaran VA</strong>.",
      "Masukkan nomor Virtual Account BNC yang tertera di atas.",
      "Periksa nominal (Rp 53.500) dan konfirmasi pembayaran."
    ],
    cimb_niaga_va: [
      "Buka aplikasi <strong>OCTO Mobile</strong> atau ATM CIMB Niaga.",
      "Pilih menu <strong>Transfer</strong> &rarr; <strong>Rekening Ponsel / Virtual Account</strong>.",
      "Masukkan nomor Virtual Account CIMB Niaga di atas.",
      "Pastikan jumlah tagihan (Rp 53.500) sesuai dan masukkan PIN OCTO Mobile."
    ],
    maybank_va: [
      "Buka aplikasi <strong>M2U ID App</strong> atau kunjungi ATM Maybank.",
      "Pilih menu <strong>Transfer</strong> &rarr; <strong>Virtual Account</strong>.",
      "Masukkan nomor Virtual Account Maybank yang tertera di atas.",
      "Konfirmasi nominal tagihan (Rp 53.500) dan selesaikan transaksi."
    ],
    permata_va: [
      "Buka aplikasi <strong>PermataMobile X</strong> atau ATM Bank Permata.",
      "Pilih menu <strong>Pembayaran</strong> &rarr; <strong>Virtual Account</strong>.",
      "Masukkan nomor Virtual Account Permata yang tertera di atas.",
      "Periksa rincian tagihan (Rp 53.500) dan konfirmasi transfer."
    ],
    artha_graha_va: [
      "Buka aplikasi <strong>Agi Mobile</strong> atau ATM Bank Artha Graha.",
      "Pilih menu <strong>Pembayaran / Virtual Account</strong>.",
      "Masukkan nomor Virtual Account Artha Graha di atas.",
      "Pastikan nominal tagihan lebih hemat (Rp 52.000) telah sesuai dan selesaikan transaksi."
    ],
    sampoerna_va: [
      "Buka aplikasi <strong>Sampoerna Mobile Banking</strong> atau transfer antar bank.",
      "Pilih menu <strong>Virtual Account / Transfer</strong>.",
      "Masukkan nomor Virtual Account Bank Sahabat Sampoerna di atas.",
      "Pastikan nominal tagihan hemat (Rp 52.000) telah sesuai dan selesaikan transaksi."
    ]
  };

  function openPaywallModal() {
    navigateTo(ROUTES.PRICING);
  }

  function closePaywallModal() {
    navigateTo(ROUTES.DASHBOARD);
  }

  function handleBackToChannels() {
    if (DOM.checkoutChannelSelection) DOM.checkoutChannelSelection.classList.remove("hidden");
    if (DOM.checkoutActivePaymentView) DOM.checkoutActivePaymentView.classList.add("hidden");
  }

  function formatRupiah(num) {
    const val = Number(num) || 0;
    return "Rp " + val.toLocaleString("id-ID");
  }

  function copyToClipboard(text, label = "Teks") {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`${label} berhasil disalin ke clipboard`, "success");
      }).catch(() => {
        fallbackCopyText(text, label);
      });
    } else {
      fallbackCopyText(text, label);
    }
  }

  function fallbackCopyText(text, label) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast(`${label} berhasil disalin ke clipboard`, "success");
    } catch (e) {
      showToast(`Gagal menyalin ${label}`, "error");
    }
    document.body.removeChild(ta);
  }

  async function handleSelectPaymentChannel(method) {
    const user = window.AuthManager ? AuthManager.currentUser : null;
    if (!user) {
      showToast("Silakan masuk ke akun Anda terlebih dahulu.", "error");
      return;
    }

    if (method === "payment_link") {
      showToast("Menyiapkan laman pembayaran resmi Pakasir...", "info");
      try {
        const resp = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            email: user.email,
            name: user.displayName || user.email.split("@")[0],
            amount: 50000,
            method: "payment_link"
          })
        });
        const data = await resp.json();
        const paymentUrl = data.payment_url || (data.data && data.data.payment_link) || "https://app.pakasir.com/pay-v2";
        const orderId = data.order_id || (data.data && data.data.order_id) || `LB-${Date.now()}`;
        const txnId = data.txn_id || (data.data && data.data.txn_id) || "";

        state.currentPaymentOrder = {
          userId: user.uid,
          userEmail: user.email,
          orderId,
          txnId,
          amount: 50000,
          fee: data.fee || 0,
          totalPayment: data.total_payment || 50000,
          paymentUrl,
          method: "payment_link"
        };

        // Catat transaksi baru ke subkoleksi users/{uid}/transactions/{orderId}
        if (window.FirebaseService && FirebaseService.db && user && !user.isDemo) {
          try {
            await FirebaseService.db
              .collection("users")
              .doc(user.uid)
              .collection("transactions")
              .doc(orderId)
              .set({
                orderId,
                txnId,
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || user.email.split("@")[0],
                packageTitle: "Akses Sistem Logbook Riset (90 Hari)",
                durationDays: 90,
                amount: 50000,
                fee: data.fee || 0,
                totalPayment: data.total_payment || 50000,
                paymentMethod: "payment_link",
                paymentGateway: "pakasir",
                status: "pending",
                paymentUrl,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }, { merge: true });
          } catch (txErr) {
            console.warn("Gagal mencatat transaksi link ke Firestore:", txErr);
          }
        }

        window.open(paymentUrl, "_blank");
        showToast("Laman pembayaran resmi Pakasir telah dibuka di tab baru.", "info");

        // Tampilkan view aktif dengan tombol cek status
        if (DOM.checkoutChannelSelection) DOM.checkoutChannelSelection.classList.add("hidden");
        if (DOM.checkoutActivePaymentView) DOM.checkoutActivePaymentView.classList.remove("hidden");
        if (DOM.checkoutQrisArea) DOM.checkoutQrisArea.classList.add("hidden");
        if (DOM.checkoutVaArea) DOM.checkoutVaArea.classList.remove("hidden");

        if (DOM.vaBankNameTitle) DOM.vaBankNameTitle.textContent = "Portal Resmi Pakasir (pay-v2)";
        if (DOM.vaOrderIdText) DOM.vaOrderIdText.textContent = `Order #${orderId}`;
        if (DOM.vaNumberDisplay) DOM.vaNumberDisplay.textContent = "Buka di Browser";
        if (DOM.vaBaseAmount) DOM.vaBaseAmount.textContent = formatRupiah(50000);
        if (DOM.vaFeeAmount) DOM.vaFeeAmount.textContent = "Sesuai Channel";
        if (DOM.vaTotalAmount) DOM.vaTotalAmount.textContent = "Multi-Channel";

        updateCheckoutSummaryDisplay();
      } catch (e) {
        showToast("Gagal membuka portal: " + e.message, "error");
      }
      return;
    }

    // Beralih ke view detail pembayaran aktif
    if (DOM.checkoutChannelSelection) DOM.checkoutChannelSelection.classList.add("hidden");
    if (DOM.checkoutActivePaymentView) DOM.checkoutActivePaymentView.classList.remove("hidden");

    if (method === "qris") {
      if (DOM.checkoutQrisArea) DOM.checkoutQrisArea.classList.remove("hidden");
      if (DOM.checkoutVaArea) DOM.checkoutVaArea.classList.add("hidden");
    } else {
      if (DOM.checkoutQrisArea) DOM.checkoutQrisArea.classList.add("hidden");
      if (DOM.checkoutVaArea) DOM.checkoutVaArea.classList.remove("hidden");
    }

    await createPaymentTransaction(method);
    updateCheckoutSummaryDisplay();
  }

  async function createPaymentTransaction(method) {
    const user = window.AuthManager ? AuthManager.currentUser : null;
    if (!user) return;

    if (method === "qris") {
      if (DOM.qrisSpinner) DOM.qrisSpinner.classList.remove("hidden");
      if (DOM.qrisImageElement) DOM.qrisImageElement.classList.add("hidden");
    }

    showToast("Menghubungkan ke gateway Pakasir...", "info");

    try {
      const resp = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          name: user.displayName || user.email.split("@")[0],
          amount: 50000,
          method: method
        })
      });

      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.message || `Gagal membuat tagihan ${method} ke Pakasir.`);
      }

      const orderId = data.order_id || (data.data && data.data.order_id) || data.orderId || `LB-${Date.now()}`;
      const txnId = data.txn_id || (data.data && data.data.txn_id) || "";
      const amount = data.amount || (data.data && data.data.amount) || 50000;
      const fee = data.fee || (data.data && data.data.fee) || 0;
      const totalPayment = data.total_payment || (data.data && data.data.total_payment) || (amount + fee);
      const isSandbox = Boolean(data.is_sandbox !== undefined ? data.is_sandbox : (data.data && data.data.is_sandbox));
      const qrString = data.qr_string || (data.data && (data.data.qr_string || data.data.qris_string)) || "";
      const vaNumber = data.va_number || (data.data && data.data.va_number) || "";
      const paymentUrl = data.payment_url || (data.data && data.data.payment_url) || (txnId ? `https://app.pakasir.com/pay-v2/${txnId}` : "https://app.pakasir.com/pay-v2");

      state.currentPaymentOrder = {
        userId: user.uid,
        userEmail: user.email,
        orderId,
        txnId,
        method,
        amount,
        fee,
        totalPayment,
        isSandbox,
        qrString,
        vaNumber,
        paymentUrl
      };

      // Catat transaksi aktif ke ledger Firestore users/{uid}/transactions/{orderId}
      if (window.FirebaseService && FirebaseService.db && user) {
        try {
          await FirebaseService.db
            .collection("users")
            .doc(user.uid)
            .collection("transactions")
            .doc(orderId)
            .set({
              orderId,
              txnId,
              userId: user.uid,
              userEmail: user.email,
              userName: user.displayName || user.email.split("@")[0],
              packageTitle: "Akses Sistem Logbook Riset (90 Hari)",
              durationDays: 90,
              amount,
              fee,
              totalPayment,
              paymentMethod: method,
              paymentGateway: "pakasir",
              status: "pending",
              vaNumber: vaNumber || null,
              qrString: qrString || null,
              paymentUrl: paymentUrl || null,
              isSandbox,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (tErr) {
          console.warn("Gagal mencatat transaksi pending ke Firestore:", tErr);
        }
      }

      if (method === "qris") {
        if (DOM.qrisOrderIdText) DOM.qrisOrderIdText.textContent = `Order #${orderId}`;
        if (DOM.qrisBaseAmount) DOM.qrisBaseAmount.textContent = formatRupiah(amount);
        if (DOM.qrisFeeAmount) DOM.qrisFeeAmount.textContent = formatRupiah(fee);
        if (DOM.qrisFeeRow) {
          if (fee > 0) DOM.qrisFeeRow.classList.remove("hidden");
          else DOM.qrisFeeRow.classList.add("hidden");
        }
        if (DOM.qrisTotalAmount) DOM.qrisTotalAmount.textContent = formatRupiah(totalPayment);

        if (DOM.qrisSandboxNotice) {
          if (isSandbox) DOM.qrisSandboxNotice.classList.remove("hidden");
          else DOM.qrisSandboxNotice.classList.add("hidden");
        }

        const qrisImgUrl = qrString
          ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrString)}`
          : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent("000201010212")}`;

        if (DOM.qrisImageElement) {
          DOM.qrisImageElement.src = qrisImgUrl;
          DOM.qrisImageElement.onload = () => {
            if (DOM.qrisSpinner) DOM.qrisSpinner.classList.add("hidden");
            DOM.qrisImageElement.classList.remove("hidden");
          };
        }
      } else {
        // Virtual Account Rendering
        if (DOM.vaBankNameTitle) DOM.vaBankNameTitle.textContent = VA_BANK_NAMES[method] || "Bank Virtual Account";
        if (DOM.vaOrderIdText) DOM.vaOrderIdText.textContent = `Order #${orderId}`;
        if (DOM.vaNumberDisplay) DOM.vaNumberDisplay.textContent = vaNumber || "Menunggu Nomor...";
        if (DOM.vaBaseAmount) DOM.vaBaseAmount.textContent = formatRupiah(amount);
        if (DOM.vaFeeAmount) DOM.vaFeeAmount.textContent = formatRupiah(fee);
        if (DOM.vaTotalAmount) DOM.vaTotalAmount.textContent = formatRupiah(totalPayment);

        if (DOM.vaInstructionsList) {
          const list = VA_INSTRUCTIONS[method] || [
            "Buka aplikasi Mobile Banking atau ATM bank Anda.",
            "Pilih menu <strong>Transfer &rarr; Virtual Account</strong>.",
            "Masukkan nomor Virtual Account yang tertera di atas.",
            "Pastikan nominal transfer sesuai dan selesaikan transaksi."
          ];
          DOM.vaInstructionsList.innerHTML = list.map(item => `<li>${item}</li>`).join("");
        }

        if (DOM.vaSandboxNotice) {
          if (isSandbox) DOM.vaSandboxNotice.classList.remove("hidden");
          else DOM.vaSandboxNotice.classList.add("hidden");
        }
      }
    } catch (err) {
      console.error("Gagal membuat transaksi Pakasir:", err);
      const isUnavailable = err.message && (
        err.message.toLowerCase().includes("not available") ||
        err.message.toLowerCase().includes("tidak tersedia")
      );
      const errMsg = isUnavailable
        ? "Saluran pembayaran ini sedang dinonaktifkan di gateway Pakasir. Silakan pilih bank lain atau gunakan QRIS."
        : ("Gagal memuat transaksi: " + err.message);
      showToast(errMsg, "error");
      handleBackToChannels();
    }
  }

  async function handleCheckPaymentStatus() {
    if (!state.currentPaymentOrder) {
      showToast("Belum ada tagihan aktif. Silakan pilih saluran pembayaran.", "info");
      return;
    }

    showToast("Memeriksa status transaksi ke gateway Pakasir...", "info");

    try {
      const targetId = state.currentPaymentOrder.txnId || state.currentPaymentOrder.orderId;
      const q = new URLSearchParams({
        txn_id: targetId,
        order_id: state.currentPaymentOrder.orderId
      });

      const resp = await fetch(`/api/payment/status?${q.toString()}`);
      const data = await resp.json();

      if (data.rate_limited) {
        showToast("Gateway Pakasir membatasi cek status tiap 4 detik. Silakan coba kembali sesaat lagi.", "info");
        return;
      }

      if (data.status === "completed" || data.status === "paid" || data.status === "settlement") {
        const activeUser = window.AuthManager ? AuthManager.currentUser : null;
        state.lastCompletedOrder = {
          ...state.currentPaymentOrder,
          userId: (activeUser && activeUser.uid) || (state.currentPaymentOrder && state.currentPaymentOrder.userId),
          userEmail: (activeUser && activeUser.email) || (state.currentPaymentOrder && state.currentPaymentOrder.userEmail),
          completedAt: new Date()
        };
        await AuthManager.activateSubscription(state.currentPaymentOrder.orderId, state.currentPaymentOrder.amount || 50000, 90);

        // Update ledger transaksi pengguna di Cloud Firestore
        if (window.FirebaseService && FirebaseService.db && activeUser && state.currentPaymentOrder.orderId) {
          try {
            await FirebaseService.db
              .collection("users")
              .doc(activeUser.uid)
              .collection("transactions")
              .doc(state.currentPaymentOrder.orderId)
              .set({
                status: "completed",
                paidAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                gatewayStatus: data.status
              }, { merge: true });
          } catch (tUpdErr) {
            console.warn("Gagal update ledger transaksi di Firestore:", tUpdErr);
          }
        }

        showToast("Pembayaran berhasil diverifikasi oleh Pakasir. Akses aktif selama 90 hari.", "success");
        updateSubscriptionBadgeUI();
        updateDashboard();
        navigateTo(ROUTES.PAYMENT_SUCCESS);
      } else {
        showToast("Pembayaran belum terdeteksi (Status: " + (data.status || "pending") + "). Silakan selesaikan pembayaran di HP Anda.", "info");
      }
    } catch (e) {
      showToast("Gagal cek status: " + e.message, "error");
    }
  }

  async function handleSimulateSuccessPayment() {
    if (!state.currentPaymentOrder) {
      showToast("Belum ada transaksi aktif untuk disimulasikan.", "info");
      return;
    }

    showToast("Mengirim sinyal verifikasi simulasi ke server Pakasir...", "info");

    try {
      const resp = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: state.currentPaymentOrder.orderId,
          amount: state.currentPaymentOrder.amount || 50000
        })
      });

      const res = await resp.json();
      if (!res.success) {
        throw new Error(res.message || "Gagal memproses simulasi di server Pakasir.");
      }

      showToast("Server Pakasir menyetujui transaksi simulasi. Menunggu 4 detik untuk verifikasi status...", "info");

      // Tunggu jeda rate limit 4.2 detik agar API transaction-status Pakasir dapat diakses
      setTimeout(async () => {
        await handleCheckPaymentStatus();
      }, 4200);
    } catch (e) {
      console.warn("Simulasi API gagal, beralih ke simulasi lokal:", e.message);
      const activeUser = window.AuthManager ? AuthManager.currentUser : null;
      state.lastCompletedOrder = {
        ...state.currentPaymentOrder,
        userId: (activeUser && activeUser.uid) || (state.currentPaymentOrder && state.currentPaymentOrder.userId),
        userEmail: (activeUser && activeUser.email) || (state.currentPaymentOrder && state.currentPaymentOrder.userEmail),
        completedAt: new Date()
      };
      await AuthManager.activateSubscription(state.currentPaymentOrder.orderId, 50000, 90);

      // Update status transaksi simulasi di Cloud Firestore
      if (window.FirebaseService && FirebaseService.db && activeUser && state.currentPaymentOrder.orderId) {
        try {
          await FirebaseService.db
            .collection("users")
            .doc(activeUser.uid)
            .collection("transactions")
            .doc(state.currentPaymentOrder.orderId)
            .set({
              status: "completed",
              paidAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isSimulated: true
            }, { merge: true });
        } catch (tSimErr) {
          console.warn("Gagal update ledger simulasi di Firestore:", tSimErr);
        }
      }

      showToast("Pembayaran berhasil diverifikasi (mode simulasi). Akses aktif.", "success");
      updateSubscriptionBadgeUI();
      updateDashboard();
      navigateTo(ROUTES.PAYMENT_SUCCESS);
    }
  }

  async function handleDeleteDummyData() {
    const user = window.AuthManager ? AuthManager.currentUser : null;
    if (!user) return;

    if (!confirm("Hapus seluruh 3 data contoh bawaan? Anda akan memulai pencatatan riil riset Anda.")) return;

    const dummyIds = state.entries.filter(e => e.isDummy === true).map(e => e.id);

    // Hapus dari Firestore
    if (window.FirebaseService && FirebaseService.db) {
      for (const id of dummyIds) {
        try {
          await FirebaseService.db
            .collection("users")
            .doc(user.uid)
            .collection("logbooks")
            .doc(id)
            .delete();
        } catch (e) {
          // ignore
        }
      }
    }

    state.entries = state.entries.filter(e => e.isDummy !== true);
    if (window.AuthManager && AuthManager.setDummyDismissed) {
      AuthManager.setDummyDismissed(user.uid, true);
    }
    saveEntriesToLocalStorage(state.entries, user);
    updateDashboard();
    showToast("Data contoh berhasil dihapus. Selamat melakukan penelitian!", "success");
  }

  // ==========================================================================
  // 5. MODAL FORM LOGBOOK: SMART CASCADING & LOKASI
  // ==========================================================================
  function openAddModal() {
    // 1. Enforce Paywall: Harus Berlangganan
    if (!window.AuthManager || !AuthManager.isSubscribed()) {
      openPaywallModal();
      showToast("Aktivasi akses riset (Rp 50.000 / 3 Bulan) untuk mulai mencatat logbook.", "info");
      return;
    }

    // 2. Enforce Profil Lengkap
    if (window.ProfileManager && !ProfileManager.isComplete()) {
      openProfileModal();
      showToast("Lengkapi Profil & Wilayah Riset Anda terlebih dahulu sebelum mencatat logbook.", "info");
      return;
    }

    state.editingEntryId = null;
    state.uploadedPhotoBase64 = null;

    if (DOM.formAddLogbook) DOM.formAddLogbook.reset();
    if (DOM.modalFormTitle) DOM.modalFormTitle.textContent = "Catat Logbook Baru";
    if (DOM.modalFormSubtitle) DOM.modalFormSubtitle.textContent = "Aktivitas Penelitian Lapangan Skripsi";
    if (DOM.btnSubmitText) DOM.btnSubmitText.textContent = "Simpan Catatan Lapangan";

    // Nilai Default
    const today = new Date().toISOString().split("T")[0];
    if (DOM.inputTanggal) DOM.inputTanggal.value = today;

    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    if (DOM.inputWaktuMulai) DOM.inputWaktuMulai.value = `${h}:${m}`;

    // Update label zona waktu
    const tz = (window.ProfileManager && ProfileManager.currentProfile && ProfileManager.currentProfile.timezone) || "WITA";
    document.querySelectorAll(".badge-timezone-text").forEach(el => el.textContent = tz);

    // Reset pilihan lokasi & foto
    if (DOM.checkCustomLocation) DOM.checkCustomLocation.checked = false;
    toggleCustomLocationView(false);
    refreshFormLocations();

    if (DOM.photoPreviewContainer) DOM.photoPreviewContainer.classList.add("hidden");
    if (DOM.uploadPrompt) DOM.uploadPrompt.classList.remove("hidden");
    if (DOM.dropZone) DOM.dropZone.classList.remove("has-photo");

    if (DOM.modalForm) DOM.modalForm.classList.remove("hidden");
  }

  function openEditModal(entryId) {
    if (!window.AuthManager || !AuthManager.isSubscribed()) {
      openPaywallModal();
      return;
    }

    const item = state.entries.find(e => e.id === entryId);
    if (!item) return;

    state.editingEntryId = entryId;
    state.uploadedPhotoBase64 = item.fotoBase64 || null;

    if (DOM.modalFormTitle) DOM.modalFormTitle.textContent = "Edit Catatan Logbook";
    if (DOM.modalFormSubtitle) DOM.modalFormSubtitle.textContent = `Memperbarui Aktivitas: ${item.kabupaten} (${item.tanggal})`;
    if (DOM.btnSubmitText) DOM.btnSubmitText.textContent = "Perbarui Catatan";

    // Isi Nilai
    if (DOM.inputTanggal) DOM.inputTanggal.value = item.tanggal || "";
    if (DOM.inputWaktuMulai) DOM.inputWaktuMulai.value = item.waktuMulai || "";
    if (DOM.inputWaktuSelesai) DOM.inputWaktuSelesai.value = item.waktuSelesai || "";
    if (DOM.inputDeskripsi) DOM.inputDeskripsi.value = item.deskripsi || "";
    if (DOM.inputOutput) DOM.inputOutput.value = item.output || "";
    if (DOM.inputResponden) DOM.inputResponden.value = item.sasaranResponden || "";

    // Kategori
    if (DOM.selectActivityCategory) DOM.selectActivityCategory.value = item.jenisKegiatan || "";

    // Cek apakah lokasi terdaftar di profil atau custom
    const regKabs = window.ProfileManager ? ProfileManager.getRegisteredKabupatens() : [];
    const isRegKab = regKabs.some(k => k.toLowerCase() === (item.kabupaten || "").toLowerCase());

    if (isRegKab) {
      if (DOM.checkCustomLocation) DOM.checkCustomLocation.checked = false;
      toggleCustomLocationView(false);
      refreshFormLocations();
      if (DOM.selectKabupaten) {
        DOM.selectKabupaten.value = item.kabupaten;
        handleKabupatenChange();
      }
      if (DOM.selectKecamatan) {
        DOM.selectKecamatan.value = item.kecamatan || "";
        handleKecamatanChange();
      }
      if (DOM.selectDesa) {
        DOM.selectDesa.value = item.desa || "";
        handleDesaChange();
      }
      if (DOM.selectDusun && item.dusun) {
        DOM.selectDusun.value = item.dusun;
      }
    } else {
      if (DOM.checkCustomLocation) DOM.checkCustomLocation.checked = true;
      toggleCustomLocationView(true);
      if (DOM.inputCustomKabupaten) DOM.inputCustomKabupaten.value = item.kabupaten || "";
      if (DOM.inputCustomKecamatan) DOM.inputCustomKecamatan.value = item.kecamatan || "";
      if (DOM.inputCustomDesa) DOM.inputCustomDesa.value = item.desa || "";
      if (DOM.inputCustomDusun) DOM.inputCustomDusun.value = item.dusun || "";
    }

    // Foto
    const photoSrc = item.fotoUrl || item.fotoBase64 || "";
    if (photoSrc) {
      if (DOM.photoPreviewImg) DOM.photoPreviewImg.src = photoSrc;
      if (DOM.photoPreviewContainer) DOM.photoPreviewContainer.classList.remove("hidden");
      if (DOM.uploadPrompt) DOM.uploadPrompt.classList.add("hidden");
      if (DOM.dropZone) DOM.dropZone.classList.add("has-photo");
    } else {
      if (DOM.photoPreviewContainer) DOM.photoPreviewContainer.classList.add("hidden");
      if (DOM.uploadPrompt) DOM.uploadPrompt.classList.remove("hidden");
      if (DOM.dropZone) DOM.dropZone.classList.remove("has-photo");
    }

    if (DOM.modalForm) DOM.modalForm.classList.remove("hidden");
  }

  function closeFormModal() {
    if (DOM.modalForm) DOM.modalForm.classList.add("hidden");
    state.editingEntryId = null;
    state.uploadedPhotoBase64 = null;
  }

  function toggleCustomLocationView(isCustom) {
    if (DOM.sectionRegisteredLocation) DOM.sectionRegisteredLocation.classList.toggle("hidden", isCustom);
    if (DOM.sectionCustomLocation) DOM.sectionCustomLocation.classList.toggle("hidden", !isCustom);
  }

  function refreshFormLocations() {
    if (!DOM.selectKabupaten || !window.ProfileManager) return;
    const kabs = ProfileManager.getRegisteredKabupatens();

    DOM.selectKabupaten.innerHTML = '<option value="">Pilih Kabupaten...</option>';
    kabs.forEach(k => {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = k.toLowerCase().startsWith("kab") || k.toLowerCase().startsWith("kota") ? k : `Kab. ${k}`;
      DOM.selectKabupaten.appendChild(opt);
    });

    if (DOM.selectDusun) DOM.selectDusun.innerHTML = '<option value="">Tanpa Dusun...</option>';

    // Otomatis pilih jika hanya 1 kabupaten terdaftar
    if (kabs.length === 1) {
      DOM.selectKabupaten.value = kabs[0];
      handleKabupatenChange();
    } else {
      if (DOM.selectKecamatan) DOM.selectKecamatan.innerHTML = '<option value="">Pilih Kecamatan...</option>';
      if (DOM.selectDesa) DOM.selectDesa.innerHTML = '<option value="">Pilih Desa...</option>';
      if (DOM.selectDusun) DOM.selectDusun.innerHTML = '<option value="">Tanpa Dusun...</option>';
    }
  }

  function handleKabupatenChange() {
    const selectedKab = DOM.selectKabupaten ? DOM.selectKabupaten.value : "";
    if (!DOM.selectKecamatan) return;

    DOM.selectKecamatan.innerHTML = '<option value="">Pilih Kecamatan...</option>';
    if (DOM.selectDesa) DOM.selectDesa.innerHTML = '<option value="">Pilih Desa...</option>';
    if (DOM.selectDusun) DOM.selectDusun.innerHTML = '<option value="">Tanpa Dusun...</option>';

    if (!selectedKab || !window.ProfileManager) return;

    const kecs = ProfileManager.getRegisteredKecamatans(selectedKab);
    kecs.forEach(k => {
      const opt = document.createElement("option");
      opt.value = k.name || k;
      opt.textContent = `Kec. ${k.name || k}`;
      DOM.selectKecamatan.appendChild(opt);
    });

    // Otomatis pilih jika hanya 1 kecamatan
    if (kecs.length === 1) {
      DOM.selectKecamatan.value = kecs[0].name || kecs[0];
      handleKecamatanChange();
    }
  }

  function handleKecamatanChange() {
    const selectedKab = DOM.selectKabupaten ? DOM.selectKabupaten.value : "";
    const selectedKec = DOM.selectKecamatan ? DOM.selectKecamatan.value : "";
    if (!DOM.selectDesa) return;

    DOM.selectDesa.innerHTML = '<option value="">Pilih Desa...</option>';
    if (DOM.selectDusun) DOM.selectDusun.innerHTML = '<option value="">Tanpa Dusun...</option>';
    if (!selectedKab || !selectedKec || !window.ProfileManager) return;

    const desas = ProfileManager.getRegisteredDesas(selectedKab, selectedKec);
    desas.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = `Desa ${d}`;
      DOM.selectDesa.appendChild(opt);
    });

    // Otomatis pilih jika hanya 1 desa
    if (desas.length === 1) {
      DOM.selectDesa.value = desas[0];
      handleDesaChange();
    }
  }

  function handleDesaChange() {
    const selectedKab = DOM.selectKabupaten ? DOM.selectKabupaten.value : "";
    const selectedKec = DOM.selectKecamatan ? DOM.selectKecamatan.value : "";
    const selectedDesa = DOM.selectDesa ? DOM.selectDesa.value : "";
    if (!DOM.selectDusun) return;

    DOM.selectDusun.innerHTML = '<option value="">Tanpa Dusun</option>';
    if (!selectedKab || !selectedKec || !selectedDesa || !window.ProfileManager) return;

    const dusuns = ProfileManager.getRegisteredDusuns(selectedKab, selectedKec, selectedDesa);
    dusuns.forEach(dsn => {
      const opt = document.createElement("option");
      opt.value = dsn;
      opt.textContent = `Dusun ${dsn}`;
      DOM.selectDusun.appendChild(opt);
    });

    if (dusuns.length === 1) {
      DOM.selectDusun.value = dusuns[0];
    }
  }

  function refreshCategoryDropdowns() {
    const cats = window.CategoryManager ? CategoryManager.getCategories() : [];

    // Dropdown Form Tambah
    if (DOM.selectActivityCategory) {
      const currentVal = DOM.selectActivityCategory.value;
      DOM.selectActivityCategory.innerHTML = '<option value="">Pilih Kategori Kegiatan...</option>';
      cats.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        DOM.selectActivityCategory.appendChild(opt);
      });
      if (currentVal && cats.includes(currentVal)) {
        DOM.selectActivityCategory.value = currentVal;
      }
    }

    // Dropdown Filter Dashboard
    if (DOM.filterKategoriSelect) {
      DOM.filterKategoriSelect.innerHTML = '<option value="all">Semua Jenis Kegiatan</option>';
      cats.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        DOM.filterKategoriSelect.appendChild(opt);
      });
    }

    // Dropdown Filter Ekspor Word
    if (DOM.exportCategoryFilter) {
      DOM.exportCategoryFilter.innerHTML = '<option value="all">Semua Kategori Kegiatan</option>';
      cats.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        DOM.exportCategoryFilter.appendChild(opt);
      });
    }
  }

  async function handleSaveQuickNewCategory() {
    const name = DOM.inputQuickNewCategoryName ? DOM.inputQuickNewCategoryName.value.trim() : "";
    if (!name) {
      showToast("Tuliskan nama kategori baru!", "error");
      return;
    }

    const user = window.AuthManager ? AuthManager.currentUser : null;
    await CategoryManager.addCategory(name, user);
    refreshCategoryDropdowns();

    if (DOM.selectActivityCategory) DOM.selectActivityCategory.value = name;
    if (DOM.inputQuickNewCategoryName) DOM.inputQuickNewCategoryName.value = "";
    if (DOM.quickNewCategoryArea) DOM.quickNewCategoryArea.classList.add("hidden");

    showToast(`Kategori "${name}" berhasil ditambahkan & dipilih!`, "success");
  }

  function calculateDuration(mulaiStr, selesaiStr) {
    if (!mulaiStr || !selesaiStr) return "";
    try {
      const [h1, m1] = mulaiStr.split(":").map(Number);
      const [h2, m2] = selesaiStr.split(":").map(Number);
      let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff < 0) diff += 24 * 60;
      const jam = Math.floor(diff / 60);
      const mnt = diff % 60;
      if (jam > 0 && mnt > 0) return `${jam} jam ${mnt} menit`;
      if (jam > 0) return `${jam} jam`;
      return `${mnt} menit`;
    } catch (e) {
      return "";
    }
  }

  async function handleSubmitLogbook(e) {
    e.preventDefault();

    const isCustom = DOM.checkCustomLocation && DOM.checkCustomLocation.checked;
    let kabupaten = "", kecamatan = "", desa = "", dusun = "";

    if (isCustom) {
      kabupaten = (DOM.inputCustomKabupaten ? DOM.inputCustomKabupaten.value : "").trim();
      kecamatan = (DOM.inputCustomKecamatan ? DOM.inputCustomKecamatan.value : "").trim();
      desa = (DOM.inputCustomDesa ? DOM.inputCustomDesa.value : "").trim();
      dusun = (DOM.inputCustomDusun ? DOM.inputCustomDusun.value : "").trim();
    } else {
      kabupaten = (DOM.selectKabupaten ? DOM.selectKabupaten.value : "").trim();
      kecamatan = (DOM.selectKecamatan ? DOM.selectKecamatan.value : "").trim();
      desa = (DOM.selectDesa ? DOM.selectDesa.value : "").trim();
      dusun = (DOM.selectDusun ? DOM.selectDusun.value : "").trim();
    }

    const jenisKegiatan = DOM.selectActivityCategory ? DOM.selectActivityCategory.value : "";
    const sasaranResponden = DOM.inputResponden ? DOM.inputResponden.value.trim() : "";
    const tanggal = DOM.inputTanggal ? DOM.inputTanggal.value : "";
    const waktuMulai = DOM.inputWaktuMulai ? DOM.inputWaktuMulai.value : "";
    const waktuSelesai = DOM.inputWaktuSelesai ? DOM.inputWaktuSelesai.value : "";
    const deskripsi = DOM.inputDeskripsi ? DOM.inputDeskripsi.value.trim() : "";
    const output = DOM.inputOutput ? DOM.inputOutput.value.trim() : "";

    if (!kabupaten || !tanggal) {
      showToast("Kabupaten dan Tanggal wajib diisi!", "error");
      return;
    }
    if (!jenisKegiatan) {
      showToast("Pilih kategori kegiatan!", "error");
      return;
    }

    const durasi = calculateDuration(waktuMulai, waktuSelesai);
    const user = window.AuthManager ? AuthManager.currentUser : null;
    const isEditing = Boolean(state.editingEntryId);
    const docId = isEditing ? state.editingEntryId : `LOG-${Date.now()}`;

    setFormLoading(true);

    try {
      let finalFotoUrl = state.uploadedPhotoBase64 || "";

      // Upload CDN jika format data image
      if (
        window.FirebaseService &&
        FirebaseService.isInitialized &&
        user &&
        finalFotoUrl.startsWith("data:image")
      ) {
        try {
          finalFotoUrl = await FirebaseService.uploadPhoto(user.uid, finalFotoUrl, docId);
        } catch (uploadErr) {
          console.warn("Upload storage gagal, menyimpan base64:", uploadErr);
        }
      }

      const payload = {
        id: docId,
        userId: user ? user.uid : "",
        authorEmail: user ? user.email : "",
        authorName: (user && (user.displayName || user.name)) || (user ? user.email.split("@")[0] : ""),
        kabupaten,
        kecamatan,
        desa,
        dusun: dusun || "",
        jenisKegiatan,
        sasaranResponden,
        tanggal,
        waktuMulai,
        waktuSelesai,
        durasi,
        deskripsi,
        output,
        fotoUrl: finalFotoUrl,
        fotoBase64: state.uploadedPhotoBase64 || (finalFotoUrl.startsWith("data:image") ? finalFotoUrl : ""),
        isDummy: false,
        updatedAt: new Date().toISOString()
      };

      if (!isEditing) {
        payload.createdAt = new Date().toISOString();
      }

      // Simpan ke Firestore
      if (window.FirebaseService && FirebaseService.db && user) {
        await FirebaseService.db
          .collection("users")
          .doc(user.uid)
          .collection("logbooks")
          .doc(docId)
          .set(payload, { merge: true });
      }

      // Update State Lokal
      if (isEditing) {
        const idx = state.entries.findIndex(e => e.id === docId);
        if (idx !== -1) state.entries[idx] = { ...state.entries[idx], ...payload };
        showToast("Logbook berhasil diperbarui!", "success");
      } else {
        state.entries.unshift(payload);
        showToast("Logbook baru tersimpan ke Cloud!", "success");
      }

      saveEntriesToLocalStorage(state.entries, user);
      closeFormModal();
      updateDashboard();
    } catch (err) {
      console.error("Gagal simpan logbook:", err);
      showToast("Gagal menyimpan: " + err.message, "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteEntry(entryId) {
    const item = state.entries.find(e => e.id === entryId);
    if (!item) return;

    if (!confirm(`Hapus catatan lapangan di Kab. ${item.kabupaten} (${item.tanggal}) secara permanen?`)) return;

    const user = window.AuthManager ? AuthManager.currentUser : null;

    try {
      if (window.FirebaseService && FirebaseService.db && user) {
        await FirebaseService.db
          .collection("users")
          .doc(user.uid)
          .collection("logbooks")
          .doc(entryId)
          .delete();
      }

      state.entries = state.entries.filter(e => e.id !== entryId);
      saveEntriesToLocalStorage(state.entries, user);
      updateDashboard();
      showToast("Catatan logbook berhasil dihapus permanen.", "success");
    } catch (err) {
      showToast("Gagal menghapus: " + err.message, "error");
    }
  }

  function setFormLoading(isLoading) {
    if (DOM.btnSubmitLogbook) DOM.btnSubmitLogbook.disabled = isLoading;
    if (DOM.submitSpinner) DOM.submitSpinner.classList.toggle("hidden", !isLoading);
  }

  // Foto handler
  function handlePhotoSelected(file) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Pilih berkas gambar yang valid.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let w = img.width;
        let h = img.height;

        if (w > maxWidth || h > maxHeight) {
          if (w > h) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          } else {
            w = Math.round((w * maxHeight) / h);
            h = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        const compressed = canvas.toDataURL("image/jpeg", 0.82);
        state.uploadedPhotoBase64 = compressed;

        if (DOM.photoPreviewImg) DOM.photoPreviewImg.src = compressed;
        if (DOM.photoPreviewContainer) DOM.photoPreviewContainer.classList.remove("hidden");
        if (DOM.uploadPrompt) DOM.uploadPrompt.classList.add("hidden");
        if (DOM.dropZone) DOM.dropZone.classList.add("has-photo");
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function removeSelectedPhoto() {
    state.uploadedPhotoBase64 = null;
    if (DOM.inputFoto) DOM.inputFoto.value = "";
    if (DOM.photoPreviewContainer) DOM.photoPreviewContainer.classList.add("hidden");
    if (DOM.uploadPrompt) DOM.uploadPrompt.classList.remove("hidden");
    if (DOM.dropZone) DOM.dropZone.classList.remove("has-photo");
  }

  // ==========================================================================
  // 6. PROFIL RISET & HIRARKI WILAYAH WIZARD
  // ==========================================================================
  function openProfileModal() {
    const prof = (window.ProfileManager && ProfileManager.currentProfile) || {};
    if (DOM.profName) DOM.profName.value = prof.name || (AuthManager.currentUser ? AuthManager.currentUser.displayName : "");
    if (DOM.profNim) DOM.profNim.value = prof.nim || "";
    if (DOM.profUniversity) DOM.profUniversity.value = prof.university || "";
    if (DOM.profMajor) DOM.profMajor.value = prof.major || "";
    if (DOM.profTopic) DOM.profTopic.value = prof.topic || prof.researchTopic || "";
    if (DOM.profSupervisor) DOM.profSupervisor.value = prof.supervisor || "";
    if (DOM.profSupervisorNip) DOM.profSupervisorNip.value = prof.supervisorNip || "";

    // Set Timezone Radio
    const tz = prof.timezone || "WITA";
    const radio = document.querySelector(`input[name="profTimezone"][value="${tz}"]`);
    if (radio) radio.checked = true;

    // Render tree wilayah
    renderLocationTree();

    if (DOM.modalProfile) DOM.modalProfile.classList.remove("hidden");
  }

  function closeProfileModal() {
    if (DOM.modalProfile) DOM.modalProfile.classList.add("hidden");
    if (window.location.pathname === ROUTES.PROFILE) {
      window.history.pushState({ route: ROUTES.DASHBOARD }, "", ROUTES.DASHBOARD);
    }
  }

  function renderLocationTree() {
    if (DOM.profileLocationsTree && window.ProfileManager) {
      ProfileManager.renderLocationTreeBuilder(DOM.profileLocationsTree);
    }
  }

  // State Pending Konfirmasi Hapus Wilayah
  let pendingLocationDeleteAction = null;

  function openConfirmDeleteLocationModal(title, message, onConfirm) {
    if (DOM.deleteLocationModalTitle) DOM.deleteLocationModalTitle.textContent = title || "Hapus Wilayah Penelitian";
    if (DOM.deleteLocationMessage) DOM.deleteLocationMessage.textContent = message || "Apakah Anda yakin ingin menghapus data wilayah ini?";
    pendingLocationDeleteAction = onConfirm;
    if (DOM.modalConfirmDeleteLocation) DOM.modalConfirmDeleteLocation.classList.remove("hidden");
  }

  function closeConfirmDeleteLocationModal() {
    pendingLocationDeleteAction = null;
    if (DOM.modalConfirmDeleteLocation) DOM.modalConfirmDeleteLocation.classList.add("hidden");
  }

  function handleExecuteDeleteLocation() {
    if (typeof pendingLocationDeleteAction === "function") {
      pendingLocationDeleteAction();
    }
    closeConfirmDeleteLocationModal();
  }

  function populateProvinceDropdown(selectedVal = "Sulawesi Selatan") {
    if (!DOM.locInputProvinsi || !window.UNIVERSAL_LOCATIONS) return;
    const provs = UNIVERSAL_LOCATIONS.getProvincesList();
    DOM.locInputProvinsi.innerHTML = '<option value="">Pilih Provinsi...</option>';
    provs.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      if (p.toLowerCase() === selectedVal.toLowerCase()) {
        opt.selected = true;
      }
      DOM.locInputProvinsi.appendChild(opt);
    });
  }

  function openAddLocationModal(opts = {}) {
    if (!DOM.modalAddLocation) return;
    const mode = opts.mode || "full"; // 'full' | 'add-kec' | 'add-desa' | 'add-dusun'
    const kabIdx = opts.kabIdx !== undefined ? opts.kabIdx : "";
    const kecIdx = opts.kecIdx !== undefined ? opts.kecIdx : "";
    const desaIdx = opts.desaIdx !== undefined ? opts.desaIdx : "";

    if (DOM.locContextMode) DOM.locContextMode.value = mode;
    if (DOM.locTargetKabIdx) DOM.locTargetKabIdx.value = kabIdx;
    if (DOM.locTargetKecIdx) DOM.locTargetKecIdx.value = kecIdx;

    // Reset input fields
    if (DOM.locInputKabupaten) DOM.locInputKabupaten.value = "";
    if (DOM.locInputKecamatan) DOM.locInputKecamatan.value = "";
    if (DOM.locInputDesa) DOM.locInputDesa.value = "";
    if (DOM.locInputDusun) DOM.locInputDusun.value = "";

    // Data konteks jika mode turunan
    const treeLocs = (ProfileManager.getTreeLocations && ProfileManager.getTreeLocations()) || [];
    const kabData = (kabIdx !== "" && kabIdx !== null && kabIdx !== undefined) ? treeLocs[kabIdx] : null;
    const kecData = (kabData && kecIdx !== "" && kecIdx !== null && kecIdx !== undefined && kabData.kecamatans) ? kabData.kecamatans[kecIdx] : null;
    const desaData = (kecData && desaIdx !== "" && desaIdx !== null && desaIdx !== undefined && kecData.desas) ? ProfileManager.normalizeDesa(kecData.desas[desaIdx]) : null;

    const activeProv = (kabData && kabData.provinsi) || "Sulawesi Selatan";
    populateProvinceDropdown(activeProv);

    if (mode === "full") {
      if (DOM.modalAddLocationTitle) DOM.modalAddLocationTitle.textContent = "Tambah Wilayah Penelitian";
      if (DOM.modalAddLocationSubtitle) DOM.modalAddLocationSubtitle.textContent = "Daftarkan hirarki wilayah: Provinsi, Kabupaten, Kecamatan, Desa, dan Dusun (opsional)";
      if (DOM.groupLocProvinsi) DOM.groupLocProvinsi.style.display = "block";
      if (DOM.groupLocKabupaten) DOM.groupLocKabupaten.style.display = "block";
      if (DOM.groupLocKecamatan) DOM.groupLocKecamatan.style.display = "block";
      if (DOM.groupLocDesa) DOM.groupLocDesa.style.display = "block";
      if (DOM.groupLocDusun) DOM.groupLocDusun.style.display = "block";

      if (DOM.locInputProvinsi) DOM.locInputProvinsi.required = false;
      if (DOM.locInputKabupaten) {
        DOM.locInputKabupaten.required = false;
        DOM.locInputKabupaten.readOnly = false;
      }
      if (DOM.locInputKecamatan) {
        DOM.locInputKecamatan.required = false;
        DOM.locInputKecamatan.readOnly = false;
      }
      if (DOM.locInputDesa) {
        DOM.locInputDesa.required = false;
        DOM.locInputDesa.readOnly = false;
      }
      if (DOM.btnSubmitAddLocationText) DOM.btnSubmitAddLocationText.textContent = "Simpan Wilayah";
    } else if (mode === "add-kec") {
      const kabName = kabData ? kabData.kabupaten : "";
      if (DOM.modalAddLocationTitle) DOM.modalAddLocationTitle.textContent = `Tambah Kecamatan ke ${kabName}`;
      if (DOM.modalAddLocationSubtitle) DOM.modalAddLocationSubtitle.textContent = `Wilayah Provinsi: ${activeProv}`;
      if (DOM.groupLocProvinsi) DOM.groupLocProvinsi.style.display = "none";
      if (DOM.groupLocKabupaten) DOM.groupLocKabupaten.style.display = "none";
      if (DOM.groupLocKecamatan) DOM.groupLocKecamatan.style.display = "block";
      if (DOM.groupLocDesa) DOM.groupLocDesa.style.display = "block";
      if (DOM.groupLocDusun) DOM.groupLocDusun.style.display = "block";

      if (DOM.locInputProvinsi) DOM.locInputProvinsi.required = false;
      if (DOM.locInputKabupaten) {
        DOM.locInputKabupaten.value = kabName;
        DOM.locInputKabupaten.required = false;
      }
      if (DOM.locInputKecamatan) {
        DOM.locInputKecamatan.required = false;
        DOM.locInputKecamatan.readOnly = false;
      }
      if (DOM.locInputDesa) {
        DOM.locInputDesa.required = false;
        DOM.locInputDesa.readOnly = false;
      }
      if (DOM.btnSubmitAddLocationText) DOM.btnSubmitAddLocationText.textContent = "Tambah Kecamatan";
    } else if (mode === "add-desa") {
      const kabName = kabData ? kabData.kabupaten : "";
      const kecName = kecData ? (kecData.name || kecData) : "";
      if (DOM.modalAddLocationTitle) DOM.modalAddLocationTitle.textContent = `Tambah Desa ke Kec. ${kecName}`;
      if (DOM.modalAddLocationSubtitle) DOM.modalAddLocationSubtitle.textContent = `${kabName} • Provinsi ${activeProv}`;
      if (DOM.groupLocProvinsi) DOM.groupLocProvinsi.style.display = "none";
      if (DOM.groupLocKabupaten) DOM.groupLocKabupaten.style.display = "none";
      if (DOM.groupLocKecamatan) DOM.groupLocKecamatan.style.display = "none";
      if (DOM.groupLocDesa) DOM.groupLocDesa.style.display = "block";
      if (DOM.groupLocDusun) DOM.groupLocDusun.style.display = "block";

      if (DOM.locInputProvinsi) DOM.locInputProvinsi.required = false;
      if (DOM.locInputKabupaten) DOM.locInputKabupaten.required = false;
      if (DOM.locInputKecamatan) DOM.locInputKecamatan.required = false;
      if (DOM.locInputDesa) {
        DOM.locInputDesa.required = false;
        DOM.locInputDesa.readOnly = false;
      }
      if (DOM.btnSubmitAddLocationText) DOM.btnSubmitAddLocationText.textContent = "Tambah Desa";
    } else if (mode === "add-dusun") {
      const kabName = kabData ? kabData.kabupaten : "";
      const kecName = kecData ? (kecData.name || kecData) : "";
      const desaName = desaData ? desaData.name : "";
      if (DOM.modalAddLocationTitle) DOM.modalAddLocationTitle.textContent = `Tambah Dusun ke Desa ${desaName}`;
      if (DOM.modalAddLocationSubtitle) DOM.modalAddLocationSubtitle.textContent = `Kec. ${kecName} • ${kabName}`;
      if (DOM.groupLocProvinsi) DOM.groupLocProvinsi.style.display = "none";
      if (DOM.groupLocKabupaten) DOM.groupLocKabupaten.style.display = "none";
      if (DOM.groupLocKecamatan) DOM.groupLocKecamatan.style.display = "none";
      if (DOM.groupLocDesa) DOM.groupLocDesa.style.display = "none";
      if (DOM.groupLocDusun) DOM.groupLocDusun.style.display = "block";

      if (DOM.locInputProvinsi) DOM.locInputProvinsi.required = false;
      if (DOM.locInputKabupaten) DOM.locInputKabupaten.required = false;
      if (DOM.locInputKecamatan) DOM.locInputKecamatan.required = false;
      if (DOM.locInputDesa) DOM.locInputDesa.required = false;
      if (DOM.locInputDusun) {
        DOM.locInputDusun.required = false;
      }
      // Simpan desaIdx sementara
      DOM.modalAddLocation.dataset.targetDesaIdx = desaIdx;
      if (DOM.btnSubmitAddLocationText) DOM.btnSubmitAddLocationText.textContent = "Tambah Dusun";
    }

    DOM.modalAddLocation.classList.remove("hidden");
  }

  function closeAddLocationModal() {
    if (DOM.modalAddLocation) DOM.modalAddLocation.classList.add("hidden");
    if (DOM.formAddLocationEntry) DOM.formAddLocationEntry.reset();
  }

  async function handleSubmitAddLocation(e) {
    e.preventDefault();
    const user = window.AuthManager ? AuthManager.currentUser : null;
    const mode = (DOM.locContextMode ? DOM.locContextMode.value : "full") || "full";
    const kabIdx = DOM.locTargetKabIdx && DOM.locTargetKabIdx.value !== "" ? parseInt(DOM.locTargetKabIdx.value, 10) : null;
    const kecIdx = DOM.locTargetKecIdx && DOM.locTargetKecIdx.value !== "" ? parseInt(DOM.locTargetKecIdx.value, 10) : null;

    const treeLocs = (ProfileManager.getTreeLocations && ProfileManager.getTreeLocations()) || [];
    const kabData = kabIdx !== null ? treeLocs[kabIdx] : null;
    const kecData = (kabData && kecIdx !== null && kabData.kecamatans) ? kabData.kecamatans[kecIdx] : null;

    const prov = (mode === "full" ? (DOM.locInputProvinsi ? DOM.locInputProvinsi.value.trim() : "") : (kabData ? kabData.provinsi : "")) || "Sulawesi Selatan";
    const kab = (mode === "full" ? (DOM.locInputKabupaten ? DOM.locInputKabupaten.value.trim() : "") : (kabData ? kabData.kabupaten : "")).trim();
    const kec = ((mode === "full" || mode === "add-kec") ? (DOM.locInputKecamatan ? DOM.locInputKecamatan.value.trim() : "") : (kecData ? (kecData.name || kecData) : "")).trim();
    const desa = (DOM.locInputDesa ? DOM.locInputDesa.value.trim() : "").trim();
    const dusun = (DOM.locInputDusun ? DOM.locInputDusun.value.trim() : "").trim();

    if (mode === "full") {
      let effectiveKab = kab;
      if (!effectiveKab) {
        if (kec || desa || dusun) {
          effectiveKab = "Wilayah Riset";
        } else {
          showToast("Silakan masukkan nama wilayah penelitian Anda.", "info");
          return;
        }
      }
      await ProfileManager.addLocationEntry({ provinsi: prov, kabupaten: effectiveKab, kecamatan: kec, desa, dusun }, user);
      showToast(`Wilayah ${effectiveKab} berhasil disimpan.`, "success");
    } else if (mode === "add-kec") {
      if (!kec) {
        showToast("Nama Kecamatan belum diisi.", "info");
        return;
      }
      await ProfileManager.addLocationEntry({ provinsi: prov, kabupaten: kab, kecamatan: kec, desa, dusun }, user);
      showToast(`Kecamatan ${kec} ditambahkan ke ${kab}.`, "success");
    } else if (mode === "add-desa") {
      if (!desa) {
        showToast("Nama Desa/Kelurahan belum diisi.", "info");
        return;
      }
      await ProfileManager.addDesa(kabIdx, kecIdx, desa, dusun, user);
      showToast(`Desa ${desa} ditambahkan ke Kec. ${kec}.`, "success");
    } else if (mode === "add-dusun") {
      if (!dusun) {
        showToast("Nama Dusun/Lingkungan belum diisi.", "info");
        return;
      }
      const targetDesaIdx = DOM.modalAddLocation.dataset.targetDesaIdx !== undefined ? parseInt(DOM.modalAddLocation.dataset.targetDesaIdx, 10) : 0;
      await ProfileManager.addDusun(kabIdx, kecIdx, targetDesaIdx, dusun, user);
      showToast(`Dusun ${dusun} ditambahkan.`, "success");
    }


    renderLocationTree();
    refreshFormLocations();
    closeAddLocationModal();
  }


  async function handleSaveProfile(e) {
    e.preventDefault();
    const user = window.AuthManager ? AuthManager.currentUser : null;
    if (!user) return;

    const tzRadio = document.querySelector('input[name="profTimezone"]:checked');
    const selectedTz = tzRadio ? tzRadio.value : "WITA";

    const payload = {
      name: DOM.profName.value.trim(),
      nim: DOM.profNim.value.trim(),
      university: DOM.profUniversity.value.trim(),
      major: DOM.profMajor.value.trim(),
      topic: DOM.profTopic.value.trim(),
      researchTopic: DOM.profTopic.value.trim(),
      supervisor: DOM.profSupervisor.value.trim(),
      supervisorNip: DOM.profSupervisorNip ? DOM.profSupervisorNip.value.trim() : "",
      timezone: selectedTz
    };

    await ProfileManager.saveProfile(payload, user);
    renderHeaderUserProfile(user, ProfileManager.currentProfile);
    closeProfileModal();
    showToast("Profil Penelitian & Wilayah Riset berhasil disimpan!", "success");

    refreshFormLocations();
    updateDashboard();
  }

  // ==========================================================================
  // 7. KELOLA KATEGORI KEGIATAN TERDAFTAR
  // ==========================================================================
  function openCategoryManagerModal() {
    renderCategoryManagerList();
    if (DOM.modalCategoryManager) DOM.modalCategoryManager.classList.remove("hidden");
  }

  function closeCategoryManagerModal() {
    if (DOM.modalCategoryManager) DOM.modalCategoryManager.classList.add("hidden");
  }

  function renderCategoryManagerList() {
    if (!DOM.categoryListContainer || !window.CategoryManager) return;
    const user = window.AuthManager ? AuthManager.currentUser : null;

    CategoryManager.renderManager(
      DOM.categoryListContainer,
      // onEdit
      async (oldName, newName) => {
        if (!newName || !newName.trim() || newName.trim() === oldName) return;

        const res = await CategoryManager.updateCategory(oldName, newName.trim(), state.entries, user);
        saveEntriesToLocalStorage(state.entries, user);
        refreshCategoryDropdowns();
        renderCategoryManagerList();
        updateDashboard();
        showToast(`Kategori diperbarui! ${res.updatedEntriesCount} catatan logbook lama telah ditautkan.`, "success");
      },
      // onDelete
      async (delName) => {
        openConfirmDeleteLocationModal(
          "Hapus Kategori Kegiatan",
          `Hapus preset kategori "${delName}"?`,
          async () => {
            await CategoryManager.deleteCategory(delName, user);
            refreshCategoryDropdowns();
            renderCategoryManagerList();
            updateDashboard();
            showToast(`Kategori "${delName}" dihapus.`, "info");
          }
        );
      }
    );
  }

  async function handleAddCategoryFromModal() {
    const val = DOM.inputNewCategoryModal ? DOM.inputNewCategoryModal.value.trim() : "";
    if (!val) return;

    const user = window.AuthManager ? AuthManager.currentUser : null;
    await CategoryManager.addCategory(val, user);
    if (DOM.inputNewCategoryModal) DOM.inputNewCategoryModal.value = "";

    refreshCategoryDropdowns();
    renderCategoryManagerList();
    updateDashboard();
    showToast(`Kategori "${val}" berhasil ditambahkan.`, "success");
  }

  // ==========================================================================
  // 8. EKSPOR WORD (.DOCX) TRIAL HOOK
  // ==========================================================================
  function openExportModal() {
    renderExportOptions();
    updateExportSummary();
    if (DOM.modalExport) DOM.modalExport.classList.remove("hidden");
  }

  function closeExportModal() {
    if (DOM.modalExport) DOM.modalExport.classList.add("hidden");
  }

  function renderExportOptions() {
    if (!DOM.exportOptionsContainer) return;
    DOM.exportOptionsContainer.innerHTML = "";

    const profKab = window.ProfileManager ? ProfileManager.getRegisteredKabupatens() : [];
    const entriesKab = state.entries.map(e => e.kabupaten).filter(Boolean);
    const uniqueKab = [...new Set([...profKab, ...entriesKab])];

    // Opsi 1: Semua Wilayah
    const allOpt = document.createElement("label");
    allOpt.className = "export-opt-card active";
    allOpt.innerHTML = `
      <input type="radio" name="exportScope" value="all" checked>
      <span>Semua Wilayah (${state.entries.length} data)</span>
    `;
    DOM.exportOptionsContainer.appendChild(allOpt);

    // Opsi per-kabupaten
    uniqueKab.forEach(k => {
      const count = state.entries.filter(e => e.kabupaten.toLowerCase() === k.toLowerCase()).length;
      const opt = document.createElement("label");
      opt.className = "export-opt-card";
      opt.innerHTML = `
        <input type="radio" name="exportScope" value="kab_${k}">
        <span>Kab. ${k} (${count} data)</span>
      `;
      DOM.exportOptionsContainer.appendChild(opt);
    });
  }

  function getSelectedExportEntries() {
    const checked = document.querySelector('input[name="exportScope"]:checked');
    const scope = checked ? checked.value : "all";
    let filtered = [...state.entries];

    if (scope.startsWith("kab_")) {
      const target = scope.replace("kab_", "").toLowerCase();
      filtered = filtered.filter(e => e.kabupaten.toLowerCase() === target);
    }

    // Filter Kategori Opsional
    const selectedCat = DOM.exportCategoryFilter ? DOM.exportCategoryFilter.value : "all";
    if (selectedCat !== "all") {
      filtered = filtered.filter(e => e.jenisKegiatan === selectedCat);
    }

    // Filter Tanggal Opsional
    const start = DOM.exportDateStart ? DOM.exportDateStart.value : "";
    const end = DOM.exportDateEnd ? DOM.exportDateEnd.value : "";
    if (start) filtered = filtered.filter(e => (e.tanggal || "") >= start);
    if (end) filtered = filtered.filter(e => (e.tanggal || "") <= end);

    return filtered;
  }

  function updateExportSummary() {
    if (!DOM.exportSummaryCount) return;
    const selected = getSelectedExportEntries();
    DOM.exportSummaryCount.textContent = `Siap mengekspor ${selected.length} aktivitas ke dokumen Word`;
  }

  async function handleDownloadWord() {
    const selected = getSelectedExportEntries();
    if (selected.length === 0) {
      showToast("Tidak ada data logbook untuk diekspor pada filter ini.", "error");
      return;
    }

    const checked = document.querySelector('input[name="exportScope"]:checked');
    const scope = checked ? checked.value : "all";
    let kabTitle = "Semua Wilayah";
    if (scope.startsWith("kab_")) {
      kabTitle = `Kabupaten ${scope.replace("kab_", "")}`;
    }

    if (DOM.exportSpinner) DOM.exportSpinner.classList.remove("hidden");
    if (DOM.btnDownloadWordAction) DOM.btnDownloadWordAction.disabled = true;

    try {
      if (window.DocxExporter) {
        await window.DocxExporter.exportToDocx(selected, {
          title: "LOGBOOK AKTIVITAS PENELITIAN LAPANGAN",
          filterDescription: `Ekspor ${kabTitle}`,
          kabupaten: kabTitle
        });
        showToast("Dokumen Word (.docx) berhasil diunduh!", "success");
        closeExportModal();
      } else {
        throw new Error("Pustaka pembuat dokumen Word belum selesai dimuat. Silakan coba kembali sesaat lagi.");
      }
    } catch (e) {
      console.error("Gagal ekspor Word:", e);
      showToast("Gagal membuat dokumen Word: " + e.message, "error");
    } finally {
      if (DOM.exportSpinner) DOM.exportSpinner.classList.add("hidden");
      if (DOM.btnDownloadWordAction) DOM.btnDownloadWordAction.disabled = false;
    }
  }

  // ==========================================================================
  // 9. HELPER TOAST, FORMAT TANGGAL & STRING
  // ==========================================================================
  function showToast(msg, type = "info") {
    if (!DOM.toastMessage) return;
    DOM.toastMessage.textContent = msg;
    DOM.toastMessage.className = `toast ${type}`;
    DOM.toastMessage.classList.remove("hidden");

    setTimeout(() => {
      DOM.toastMessage.classList.add("hidden");
    }, 3500);
  }

  function formatDateIndo(dateStr) {
    if (!dateStr) return "-";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ==========================================================================
  // 10. SETUP EVENT LISTENERS
  // ==========================================================================
  function setupEventListeners() {
    // Layar Login: Google Sign In
    if (DOM.btnLoginGooglePage) {
      DOM.btnLoginGooglePage.addEventListener("click", async () => {
        try {
          showToast("Membuka otentikasi Google...", "info");
          await AuthManager.signInWithGoogle();
          showToast("Berhasil masuk dengan akun Google!", "success");
        } catch (err) {
          showToast("Login Google gagal: " + err.message, "error");
        }
      });
    }

    // Layar Login: Tab Switch Masuk vs Daftar
    let isRegisterMode = false;
    if (DOM.tabBtnLogin && DOM.tabBtnRegister) {
      DOM.tabBtnLogin.addEventListener("click", () => {
        isRegisterMode = false;
        DOM.tabBtnLogin.classList.add("active");
        DOM.tabBtnRegister.classList.remove("active");
        if (DOM.groupRegisterName) DOM.groupRegisterName.classList.add("hidden");
        if (DOM.groupRegisterPasswordConfirm) DOM.groupRegisterPasswordConfirm.classList.add("hidden");
        if (DOM.linkForgotPasswordArea) DOM.linkForgotPasswordArea.classList.remove("hidden");
        if (DOM.btnSubmitAuthText) DOM.btnSubmitAuthText.textContent = "Masuk Sekarang";
        if (DOM.authBoxTitle) DOM.authBoxTitle.textContent = "Masuk ke Akun Anda";
        if (DOM.authBoxSubtitle) DOM.authBoxSubtitle.textContent = "Kelola catatan aktivitas penelitian Anda";
        if (DOM.authNoticeBox) DOM.authNoticeBox.classList.add("hidden");
      });

      DOM.tabBtnRegister.addEventListener("click", () => {
        isRegisterMode = true;
        DOM.tabBtnRegister.classList.add("active");
        DOM.tabBtnLogin.classList.remove("active");
        if (DOM.groupRegisterName) DOM.groupRegisterName.classList.remove("hidden");
        if (DOM.groupRegisterPasswordConfirm) DOM.groupRegisterPasswordConfirm.classList.remove("hidden");
        if (DOM.linkForgotPasswordArea) DOM.linkForgotPasswordArea.classList.add("hidden");
        if (DOM.btnSubmitAuthText) DOM.btnSubmitAuthText.textContent = "Daftar Akun Baru";
        if (DOM.authBoxTitle) DOM.authBoxTitle.textContent = "Daftar Akun Baru";
        if (DOM.authBoxSubtitle) DOM.authBoxSubtitle.textContent = "Daftarkan identitas mahasiswa dan email Anda";
        if (DOM.authNoticeBox) DOM.authNoticeBox.classList.add("hidden");
      });
    }

    // Layar Login: Form Email & Sandi
    if (DOM.formEmailAuth) {
      DOM.formEmailAuth.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = DOM.authEmailInput ? DOM.authEmailInput.value.trim() : "";
        const pass = DOM.authPasswordInput ? DOM.authPasswordInput.value.trim() : "";
        const name = DOM.authNameInput ? DOM.authNameInput.value.trim() : "";
        const confirmPass = DOM.authPasswordConfirmInput ? DOM.authPasswordConfirmInput.value.trim() : "";

        if (!email || !pass) return;

        // Validasi khusus mode registrasi
        if (isRegisterMode) {
          if (!name) {
            showToast("Nama lengkap mahasiswa wajib diisi.", "error");
            if (DOM.authNameInput) DOM.authNameInput.focus();
            return;
          }
          if (pass.length < 6) {
            showToast("Kata sandi minimal 6 karakter.", "error");
            if (DOM.authPasswordInput) DOM.authPasswordInput.focus();
            return;
          }
          if (pass !== confirmPass) {
            showToast("Konfirmasi kata sandi tidak cocok. Pastikan kedua kata sandi sama.", "error");
            if (DOM.authPasswordConfirmInput) DOM.authPasswordConfirmInput.focus();
            return;
          }
        }

        if (DOM.spinnerAuth) DOM.spinnerAuth.classList.remove("hidden");
        if (DOM.btnSubmitAuthForm) DOM.btnSubmitAuthForm.disabled = true;

        try {
          if (isRegisterMode) {
            await AuthManager.registerWithEmail(email, pass, name || email.split("@")[0]);
            showToast("Pendaftaran berhasil. Tautan verifikasi telah dikirim ke email Anda.", "success");
            if (DOM.authNoticeBox && DOM.authNoticeText) {
              DOM.authNoticeText.textContent = `Akun terdaftar. Tautan verifikasi telah dikirim ke ${email}. Silakan periksa kotak masuk atau spam email Anda.`;
              DOM.authNoticeBox.className = "auth-notice-box success";
              DOM.authNoticeBox.classList.remove("hidden");
              if (DOM.authNoticeActions) DOM.authNoticeActions.classList.remove("hidden");
            }
          } else {
            await AuthManager.signInWithEmail(email, pass);
            showToast("Berhasil masuk ke akun!", "success");
            if (AuthManager.currentUser && !AuthManager.currentUser.emailVerified) {
              showToast("Catatan: Alamat email Anda belum diverifikasi.", "info");
            }
          }
        } catch (err) {
          const friendlyMsg = AuthManager.getFriendlyErrorMessage(err);
          showToast(friendlyMsg, "error");
          if (DOM.authNoticeBox && DOM.authNoticeText) {
            DOM.authNoticeText.textContent = friendlyMsg;
            DOM.authNoticeBox.className = "auth-notice-box";
            DOM.authNoticeBox.classList.remove("hidden");
          }
        } finally {
          if (DOM.spinnerAuth) DOM.spinnerAuth.classList.add("hidden");
          if (DOM.btnSubmitAuthForm) DOM.btnSubmitAuthForm.disabled = false;
        }
      });
    }

    // Tombol Kirim Ulang Verifikasi Email dari Layar Login
    if (DOM.btnResendVerificationEmail) {
      DOM.btnResendVerificationEmail.addEventListener("click", async () => {
        try {
          showToast("Mengirim ulang email verifikasi...", "info");
          await AuthManager.sendEmailVerification();
          showToast("Tautan verifikasi baru berhasil dikirim ke email Anda.", "success");
        } catch (e) {
          showToast(AuthManager.getFriendlyErrorMessage(e), "error");
        }
      });
    }

    // Modal Reset Kata Sandi (Lupa Sandi)
    if (DOM.btnForgotPassword) {
      DOM.btnForgotPassword.addEventListener("click", () => {
        if (DOM.modalResetPassword) {
          if (DOM.inputResetEmail && DOM.authEmailInput && DOM.authEmailInput.value) {
            DOM.inputResetEmail.value = DOM.authEmailInput.value.trim();
          }
          DOM.modalResetPassword.classList.remove("hidden");
        }
      });
    }

    if (DOM.btnCloseResetPasswordModal) {
      DOM.btnCloseResetPasswordModal.addEventListener("click", () => {
        if (DOM.modalResetPassword) DOM.modalResetPassword.classList.add("hidden");
      });
    }

    if (DOM.btnCancelResetPassword) {
      DOM.btnCancelResetPassword.addEventListener("click", () => {
        if (DOM.modalResetPassword) DOM.modalResetPassword.classList.add("hidden");
      });
    }

    if (DOM.formResetPassword) {
      DOM.formResetPassword.addEventListener("submit", async (e) => {
        e.preventDefault();
        const resetEmail = DOM.inputResetEmail ? DOM.inputResetEmail.value.trim() : "";
        if (!resetEmail) return;

        if (DOM.spinnerResetPassword) DOM.spinnerResetPassword.classList.remove("hidden");
        if (DOM.btnSubmitResetPassword) DOM.btnSubmitResetPassword.disabled = true;

        try {
          await AuthManager.sendPasswordResetEmail(resetEmail);
          showToast(`Tautan reset kata sandi telah dikirim ke ${resetEmail}. Silakan periksa email Anda.`, "success");
          if (DOM.modalResetPassword) DOM.modalResetPassword.classList.add("hidden");
        } catch (err) {
          showToast(AuthManager.getFriendlyErrorMessage(err), "error");
        } finally {
          if (DOM.spinnerResetPassword) DOM.spinnerResetPassword.classList.add("hidden");
          if (DOM.btnSubmitResetPassword) DOM.btnSubmitResetPassword.disabled = false;
        }
      });
    }

    // Gerbang Verifikasi Email Dedikasi
    let resendVerifyCooldownTimer = null;
    let resendVerifyCooldownSeconds = 0;

    function startResendVerifyCooldown(seconds = 60) {
      resendVerifyCooldownSeconds = seconds;
      if (DOM.btnResendEmailVerifyPage) {
        DOM.btnResendEmailVerifyPage.disabled = true;
      }
      if (DOM.btnResendVerifyText) {
        DOM.btnResendVerifyText.textContent = `Kirim Ulang (${resendVerifyCooldownSeconds}s)`;
      }

      if (resendVerifyCooldownTimer) {
        clearInterval(resendVerifyCooldownTimer);
      }

      resendVerifyCooldownTimer = setInterval(() => {
        resendVerifyCooldownSeconds -= 1;
        if (resendVerifyCooldownSeconds <= 0) {
          clearInterval(resendVerifyCooldownTimer);
          resendVerifyCooldownTimer = null;
          if (DOM.btnResendEmailVerifyPage) {
            DOM.btnResendEmailVerifyPage.disabled = false;
          }
          if (DOM.btnResendVerifyText) {
            DOM.btnResendVerifyText.textContent = "Kirim Ulang Email Verifikasi";
          }
        } else {
          if (DOM.btnResendVerifyText) {
            DOM.btnResendVerifyText.textContent = `Kirim Ulang (${resendVerifyCooldownSeconds}s)`;
          }
        }
      }, 1000);
    }

    let isCheckingVerifyPage = false;
    if (DOM.btnConfirmEmailVerified) {
      DOM.btnConfirmEmailVerified.addEventListener("click", async () => {
        if (isCheckingVerifyPage) return;
        isCheckingVerifyPage = true;
        if (DOM.spinnerCheckVerify) DOM.spinnerCheckVerify.classList.remove("hidden");
        if (DOM.btnConfirmEmailVerified) DOM.btnConfirmEmailVerified.disabled = true;

        try {
          const isVerified = await AuthManager.checkEmailVerification();
          if (isVerified) {
            showToast("Alamat email berhasil diverifikasi. Membuka dashboard...", "success");
            await syncViewState(AuthManager.currentUser);
          } else {
            showToast("Status email belum diverifikasi. Silakan periksa inbox/spam dan klik tautan konfirmasi terlebih dahulu.", "info");
          }
        } catch (err) {
          showToast(AuthManager.getFriendlyErrorMessage(err), "error");
        } finally {
          isCheckingVerifyPage = false;
          if (DOM.spinnerCheckVerify) DOM.spinnerCheckVerify.classList.add("hidden");
          if (DOM.btnConfirmEmailVerified) DOM.btnConfirmEmailVerified.disabled = false;
        }
      });
    }

    if (DOM.btnResendEmailVerifyPage) {
      DOM.btnResendEmailVerifyPage.addEventListener("click", async () => {
        if (resendVerifyCooldownSeconds > 0) return;
        try {
          showToast("Mengirim ulang tautan verifikasi...", "info");
          await AuthManager.sendEmailVerification();
          showToast("Tautan verifikasi baru berhasil dikirim ke alamat email Anda.", "success");
          startResendVerifyCooldown(60);
        } catch (err) {
          showToast(AuthManager.getFriendlyErrorMessage(err), "error");
        }
      });
    }

    if (DOM.btnSignOutFromVerifyPage) {
      DOM.btnSignOutFromVerifyPage.addEventListener("click", async () => {
        try {
          await AuthManager.signOut();
          showToast("Sesi akun telah diakhiri.", "info");
        } catch (err) {
          showToast("Gagal keluar akun: " + err.message, "error");
        }
      });
    }

    // Banner Verifikasi Email di Dashboard
    if (DOM.btnCheckVerificationStatus) {
      DOM.btnCheckVerificationStatus.addEventListener("click", async () => {
        try {
          showToast("Memeriksa status verifikasi email...", "info");
          const refreshed = await AuthManager.reloadUser();
          if (refreshed && refreshed.emailVerified) {
            showToast("Email Anda telah berhasil diverifikasi.", "success");
            if (DOM.emailVerificationBanner) DOM.emailVerificationBanner.classList.add("hidden");
          } else {
            showToast("Status email belum diverifikasi. Silakan klik tautan verifikasi yang ada pada email Anda terlebih dahulu.", "info");
          }
        } catch (e) {
          showToast(AuthManager.getFriendlyErrorMessage(e), "error");
        }
      });
    }

    if (DOM.btnResendVerificationDashboard) {
      DOM.btnResendVerificationDashboard.addEventListener("click", async () => {
        try {
          showToast("Mengirim ulang email verifikasi...", "info");
          await AuthManager.sendEmailVerification();
          showToast("Email verifikasi baru telah dikirimkan ke kotak masuk Anda.", "success");
        } catch (e) {
          showToast(AuthManager.getFriendlyErrorMessage(e), "error");
        }
      });
    }

    // ========================================================================
    // Navigasi Rute & Browser History (HTML5 History API)
    // ========================================================================
    window.addEventListener("popstate", () => {
      navigateTo(window.location.pathname, true);
    });

    document.addEventListener("click", (e) => {
      const routeEl = e.target.closest("[data-route]");
      if (routeEl) {
        e.preventDefault();
        const route = routeEl.getAttribute("data-route");
        if (route) navigateTo(route);
      }
    });

    const brandEl = document.querySelector(".brand");
    if (brandEl) {
      brandEl.style.cursor = "pointer";
      brandEl.addEventListener("click", () => {
        navigateTo(ROUTES.DASHBOARD);
      });
    }

    // Header Actions
    if (DOM.btnHeaderLoginPrompt) {
      DOM.btnHeaderLoginPrompt.addEventListener("click", () => {
        navigateTo(ROUTES.LOGIN);
      });
    }

    if (DOM.btnSubscriptionBadge) {
      DOM.btnSubscriptionBadge.addEventListener("click", () => {
        if (AuthManager.isSubscribed()) {
          const days = AuthManager.getRemainingDays();
          showToast(`Paket Anda aktif untuk ${days} hari ke depan.`, "info");
        } else {
          navigateTo(ROUTES.PRICING);
        }
      });
    }

    if (DOM.btnPricingBackToDashboard) {
      DOM.btnPricingBackToDashboard.addEventListener("click", () => {
        navigateTo(ROUTES.DASHBOARD);
      });
    }

    if (DOM.btnGoToCheckout) {
      DOM.btnGoToCheckout.addEventListener("click", () => {
        navigateTo(ROUTES.CHECKOUT);
      });
    }

    if (DOM.btnCheckoutBackToPricing) {
      DOM.btnCheckoutBackToPricing.addEventListener("click", () => {
        navigateTo(ROUTES.PRICING);
      });
    }

    if (DOM.btnCheckoutChangeMethod) {
      DOM.btnCheckoutChangeMethod.addEventListener("click", handleBackToChannels);
    }

    // Tombol Halaman Sukses Pembayaran & Bukti Transaksi
    if (DOM.btnSuccessGoDashboard) {
      DOM.btnSuccessGoDashboard.addEventListener("click", () => {
        navigateTo(ROUTES.DASHBOARD);
      });
    }

    if (DOM.btnSuccessGoProfile) {
      DOM.btnSuccessGoProfile.addEventListener("click", () => {
        navigateTo(ROUTES.PROFILE);
      });
    }

    if (DOM.btnSuccessPrintReceipt) {
      DOM.btnSuccessPrintReceipt.addEventListener("click", () => {
        window.print();
      });
    }

    if (DOM.btnOpenProfileModal) {
      DOM.btnOpenProfileModal.addEventListener("click", () => {
        navigateTo(ROUTES.PROFILE);
      });
    }

    if (DOM.btnSignOutTop) {
      DOM.btnSignOutTop.addEventListener("click", async () => {
        if (confirm("Keluar dari akun LogbookRiset.id?")) {
          await AuthManager.signOut();
          navigateTo(ROUTES.LOGIN);
          showToast("Anda telah keluar akun.", "info");
        }
      });
    }

    if (DOM.btnSignOutFromVerifyPage) {
      DOM.btnSignOutFromVerifyPage.addEventListener("click", async () => {
        await AuthManager.signOut();
        navigateTo(ROUTES.LOGIN);
      });
    }

    // Dummy Data Notice Bar
    if (DOM.btnDeleteDummyData) DOM.btnDeleteDummyData.addEventListener("click", handleDeleteDummyData);

    // Filter & Search Controls
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener("input", function () {
        state.searchQuery = this.value.trim();
        if (DOM.btnClearSearch) DOM.btnClearSearch.classList.toggle("hidden", !state.searchQuery);
        updateDashboard();
      });
    }

    if (DOM.btnClearSearch) {
      DOM.btnClearSearch.addEventListener("click", () => {
        if (DOM.searchInput) DOM.searchInput.value = "";
        state.searchQuery = "";
        DOM.btnClearSearch.classList.add("hidden");
        updateDashboard();
      });
    }

    if (DOM.kabupatenPills) {
      DOM.kabupatenPills.addEventListener("click", (e) => {
        const pill = e.target.closest(".pill-btn");
        if (!pill) return;
        state.activeKabupaten = pill.dataset.kabupaten;
        updateDashboard();
      });
    }

    if (DOM.filterKategoriSelect) {
      DOM.filterKategoriSelect.addEventListener("change", function () {
        state.activeKategori = this.value;
        updateDashboard();
      });
    }

    // Tombol Aksi Utama
    if (DOM.btnOpenAddModal) DOM.btnOpenAddModal.addEventListener("click", openAddModal);
    if (DOM.btnEmptyAdd) DOM.btnEmptyAdd.addEventListener("click", openAddModal);
    if (DOM.btnOpenExportModal) DOM.btnOpenExportModal.addEventListener("click", openExportModal);
    if (DOM.btnRefreshSync) {
      DOM.btnRefreshSync.addEventListener("click", () => {
        const user = AuthManager.currentUser;
        if (user) loadEntries(user);
      });
    }

    // Portal Checkout (Saluran Pembayaran Multi-Channel)
    if (DOM.btnClosePaywall) DOM.btnClosePaywall.addEventListener("click", closePaywallModal);
    if (DOM.checkoutChannelSelection) {
      DOM.checkoutChannelSelection.addEventListener("click", (e) => {
        const card = e.target.closest(".payment-channel-card");
        if (!card) return;
        const method = card.dataset.method;
        if (method) handleSelectPaymentChannel(method);
      });
    }
    if (DOM.btnBackToChannels) DOM.btnBackToChannels.addEventListener("click", handleBackToChannels);
    if (DOM.btnCopyVaNumber) {
      DOM.btnCopyVaNumber.addEventListener("click", () => {
        const num = state.currentPaymentOrder?.vaNumber;
        if (num) copyToClipboard(num, "Nomor Virtual Account");
      });
    }
    if (DOM.btnCopyVaAmount) {
      DOM.btnCopyVaAmount.addEventListener("click", () => {
        const total = state.currentPaymentOrder?.totalPayment;
        if (total) copyToClipboard(String(total), "Nominal Tagihan");
      });
    }
    if (DOM.btnCheckPaymentStatus) DOM.btnCheckPaymentStatus.addEventListener("click", handleCheckPaymentStatus);
    if (DOM.btnOpenPakasirWebLink) {
      DOM.btnOpenPakasirWebLink.addEventListener("click", () => {
        const url = (state.currentPaymentOrder && state.currentPaymentOrder.paymentUrl) || "https://app.pakasir.com/pay-v2";
        window.open(url, "_blank");
      });
    }
    if (DOM.btnSimulateSuccessPayment) DOM.btnSimulateSuccessPayment.addEventListener("click", handleSimulateSuccessPayment);

    // Profile Modal
    if (DOM.btnCloseProfileModal) DOM.btnCloseProfileModal.addEventListener("click", closeProfileModal);
    if (DOM.btnCancelProfile) DOM.btnCancelProfile.addEventListener("click", closeProfileModal);
    if (DOM.formResearcherProfile) DOM.formResearcherProfile.addEventListener("submit", handleSaveProfile);
    if (DOM.btnAddKabupatenBtn) {
      DOM.btnAddKabupatenBtn.addEventListener("click", () => openAddLocationModal({ mode: "full" }));
    }

    // Modal Kelola Wilayah (5 Tingkat)
    if (DOM.btnCloseAddLocationModal) DOM.btnCloseAddLocationModal.addEventListener("click", closeAddLocationModal);
    if (DOM.btnCancelAddLocation) DOM.btnCancelAddLocation.addEventListener("click", closeAddLocationModal);
    if (DOM.formAddLocationEntry) DOM.formAddLocationEntry.addEventListener("submit", handleSubmitAddLocation);

    // Modal Konfirmasi Hapus Wilayah (In-App)
    if (DOM.btnCloseConfirmDeleteModal) DOM.btnCloseConfirmDeleteModal.addEventListener("click", closeConfirmDeleteLocationModal);
    if (DOM.btnCancelDeleteLocation) DOM.btnCancelDeleteLocation.addEventListener("click", closeConfirmDeleteLocationModal);
    if (DOM.btnExecuteDeleteLocation) DOM.btnExecuteDeleteLocation.addEventListener("click", handleExecuteDeleteLocation);

    // Delegasi Tree Wilayah di Modal Profil (100% In-App Dialog Tanpa Prompt/Confirm)
    if (DOM.profileLocationsTree) {
      DOM.profileLocationsTree.addEventListener("click", async (e) => {
        const btnAddKec = e.target.closest(".btn-add-kec-action");
        if (btnAddKec) {
          const kabIdx = parseInt(btnAddKec.dataset.kabIdx, 10);
          openAddLocationModal({ mode: "add-kec", kabIdx });
          return;
        }

        const user = window.AuthManager ? AuthManager.currentUser : null;

        const btnRemoveKab = e.target.closest(".btn-remove-kab-action");
        if (btnRemoveKab) {
          const kabIdx = parseInt(btnRemoveKab.dataset.kabIdx, 10);
          const kabName = btnRemoveKab.dataset.kabName || "ini";
          openConfirmDeleteLocationModal(
            "Hapus Kabupaten",
            `Hapus ${kabName} beserta seluruh kecamatan, desa, dan dusun di dalamnya?`,
            async () => {
              await ProfileManager.removeKabupaten(kabIdx, user);
              renderLocationTree();
              refreshFormLocations();
              showToast(`Kabupaten ${kabName} berhasil dihapus.`, "info");
            }
          );
          return;
        }

        const btnAddDesa = e.target.closest(".btn-add-desa-action");
        if (btnAddDesa) {
          const kabIdx = parseInt(btnAddDesa.dataset.kabIdx, 10);
          const kecIdx = parseInt(btnAddDesa.dataset.kecIdx, 10);
          openAddLocationModal({ mode: "add-desa", kabIdx, kecIdx });
          return;
        }

        const btnRemoveKec = e.target.closest(".btn-remove-kec-action");
        if (btnRemoveKec) {
          const kabIdx = parseInt(btnRemoveKec.dataset.kabIdx, 10);
          const kecIdx = parseInt(btnRemoveKec.dataset.kecIdx, 10);
          const kecName = btnRemoveKec.dataset.kecName || "ini";
          openConfirmDeleteLocationModal(
            "Hapus Kecamatan",
            `Hapus Kec. ${kecName} beserta seluruh desa dan dusun di dalamnya?`,
            async () => {
              await ProfileManager.removeKecamatan(kabIdx, kecIdx, user);
              renderLocationTree();
              refreshFormLocations();
              showToast(`Kecamatan ${kecName} berhasil dihapus.`, "info");
            }
          );
          return;
        }

        const btnAddDusun = e.target.closest(".btn-add-dusun-action");
        if (btnAddDusun) {
          const kabIdx = parseInt(btnAddDusun.dataset.kabIdx, 10);
          const kecIdx = parseInt(btnAddDusun.dataset.kecIdx, 10);
          const desaIdx = parseInt(btnAddDusun.dataset.desaIdx, 10);
          openAddLocationModal({ mode: "add-dusun", kabIdx, kecIdx, desaIdx });
          return;
        }

        const btnRemoveDesa = e.target.closest(".btn-remove-desa-action");
        if (btnRemoveDesa) {
          const kabIdx = parseInt(btnRemoveDesa.dataset.kabIdx, 10);
          const kecIdx = parseInt(btnRemoveDesa.dataset.kecIdx, 10);
          const desaIdx = parseInt(btnRemoveDesa.dataset.desaIdx, 10);
          const desaName = btnRemoveDesa.dataset.desaName || "ini";
          openConfirmDeleteLocationModal(
            "Hapus Desa/Kelurahan",
            `Hapus Desa/Kelurahan ${desaName} beserta dusun di dalamnya?`,
            async () => {
              await ProfileManager.removeDesa(kabIdx, kecIdx, desaIdx, user);
              renderLocationTree();
              refreshFormLocations();
              showToast(`Desa ${desaName} berhasil dihapus.`, "info");
            }
          );
          return;
        }

        const btnRemoveDusun = e.target.closest(".btn-remove-dusun-action");
        if (btnRemoveDusun) {
          const kabIdx = parseInt(btnRemoveDusun.dataset.kabIdx, 10);
          const kecIdx = parseInt(btnRemoveDusun.dataset.kecIdx, 10);
          const desaIdx = parseInt(btnRemoveDusun.dataset.desaIdx, 10);
          const dusunIdx = parseInt(btnRemoveDusun.dataset.dusunIdx, 10);
          await ProfileManager.removeDusun(kabIdx, kecIdx, desaIdx, dusunIdx, user);
          renderLocationTree();
          refreshFormLocations();
          showToast("Dusun berhasil dihapus.", "info");
          return;
        }

      });
    }

    // Modal Form Logbook
    if (DOM.btnCloseAddModal) DOM.btnCloseAddModal.addEventListener("click", closeFormModal);
    if (DOM.btnCancelAdd) DOM.btnCancelAdd.addEventListener("click", closeFormModal);
    if (DOM.formAddLogbook) DOM.formAddLogbook.addEventListener("submit", handleSubmitLogbook);

    if (DOM.checkCustomLocation) {
      DOM.checkCustomLocation.addEventListener("change", function () {
        toggleCustomLocationView(this.checked);
      });
    }

    if (DOM.selectKabupaten) DOM.selectKabupaten.addEventListener("change", handleKabupatenChange);
    if (DOM.selectKecamatan) DOM.selectKecamatan.addEventListener("change", handleKecamatanChange);
    if (DOM.selectDesa) DOM.selectDesa.addEventListener("change", handleDesaChange);

    if (DOM.btnToggleNewCategoryForm) {
      DOM.btnToggleNewCategoryForm.addEventListener("click", () => {
        if (DOM.quickNewCategoryArea) {
          DOM.quickNewCategoryArea.classList.toggle("hidden");
          if (!DOM.quickNewCategoryArea.classList.contains("hidden") && DOM.inputQuickNewCategoryName) {
            DOM.inputQuickNewCategoryName.focus();
          }
        }
      });
    }

    if (DOM.btnSaveQuickNewCategory) DOM.btnSaveQuickNewCategory.addEventListener("click", handleSaveQuickNewCategory);
    if (DOM.btnOpenManageCategories) DOM.btnOpenManageCategories.addEventListener("click", openCategoryManagerModal);

    // Modal Kelola Kategori
    if (DOM.btnCloseCatModal) DOM.btnCloseCatModal.addEventListener("click", closeCategoryManagerModal);
    if (DOM.btnAddNewCategoryModal) DOM.btnAddNewCategoryModal.addEventListener("click", handleAddCategoryFromModal);

    // Foto Dropzone
    if (DOM.dropZone && DOM.inputFoto) {
      DOM.dropZone.addEventListener("click", (e) => {
        if (e.target.closest("#btnRemovePhoto")) return;
        if (state.uploadedPhotoBase64) return;
        DOM.inputFoto.click();
      });
      DOM.inputFoto.addEventListener("change", function () {
        if (this.files && this.files[0]) handlePhotoSelected(this.files[0]);
      });
    }
    if (DOM.btnRemovePhoto) {
      DOM.btnRemovePhoto.addEventListener("click", (e) => {
        e.stopPropagation();
        removeSelectedPhoto();
      });
    }

    // Modal Ekspor Word
    if (DOM.btnCloseExportModal) DOM.btnCloseExportModal.addEventListener("click", closeExportModal);
    if (DOM.btnCancelExport) DOM.btnCancelExport.addEventListener("click", closeExportModal);
    if (DOM.btnDownloadWordAction) DOM.btnDownloadWordAction.addEventListener("click", handleDownloadWord);
    if (DOM.exportOptionsContainer) DOM.exportOptionsContainer.addEventListener("change", updateExportSummary);
    if (DOM.exportCategoryFilter) DOM.exportCategoryFilter.addEventListener("change", updateExportSummary);
    if (DOM.exportDateStart) DOM.exportDateStart.addEventListener("change", updateExportSummary);
    if (DOM.exportDateEnd) DOM.exportDateEnd.addEventListener("change", updateExportSummary);

    // Delegasi Feed Card Actions (Edit, Delete, Lightbox)
    if (DOM.feedList) {
      DOM.feedList.addEventListener("click", (e) => {
        const btnEdit = e.target.closest(".btn-edit-entry");
        if (btnEdit) {
          openEditModal(btnEdit.dataset.id);
          return;
        }

        const btnDelete = e.target.closest(".btn-delete-entry");
        if (btnDelete) {
          handleDeleteEntry(btnDelete.dataset.id);
          return;
        }

        const thumb = e.target.closest(".card-thumb");
        if (thumb) {
          const src = decodeURIComponent(thumb.dataset.photoSrc);
          if (DOM.lightboxImg) DOM.lightboxImg.src = src;
          if (DOM.modalLightbox) DOM.modalLightbox.classList.remove("hidden");
        }
      });
    }

    // Lightbox Close
    if (DOM.btnCloseLightbox) {
      DOM.btnCloseLightbox.addEventListener("click", () => {
        if (DOM.modalLightbox) DOM.modalLightbox.classList.add("hidden");
      });
    }
  }

  // JALANKAN SAAT DOM SIAP
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
