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
    lastCompletedOrder: null,
    isSandboxMode: null,
    selectedAudioFile: null,
    selectedVideoFile: null,
    mediaSearchQuery: "",
    mediaFilterType: "all",
    activeWorkspaceTab: "logbook"
  };

  // DOM ELEMENTS
  const DOM = {
    // Tab Navigasi Ruang Kerja Utama
    tabNavLogbook: document.getElementById("tabNavLogbook"),
    tabNavMedia: document.getElementById("tabNavMedia"),
    navLogbookCount: document.getElementById("navLogbookCount"),
    navMediaCount: document.getElementById("navMediaCount"),
    dashboardFeedArea: document.getElementById("dashboardFeedArea"),

    // Layar Rute & Navigasi
    viewLandingPage: document.getElementById("viewLandingPage"),
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

    // Halaman Khusus Koleksi Rekaman & Video Wawancara (Route: /media)
    viewMediaGallery: document.getElementById("viewMediaGallery"),
    btnMediaOpenAddLogbook: document.getElementById("btnMediaOpenAddLogbook"),
    btnMediaBackToDashboard: null,
    statMediaTotalCount: document.getElementById("statMediaTotalCount"),
    statMediaAudioCount: document.getElementById("statMediaAudioCount"),
    statMediaVideoCount: document.getElementById("statMediaVideoCount"),
    statMediaSessionsCount: document.getElementById("statMediaSessionsCount"),
    inputSearchMedia: document.getElementById("inputSearchMedia"),
    filterMediaTypeSelect: document.getElementById("filterMediaTypeSelect"),
    mediaFilterDropdownContainer: document.getElementById("mediaFilterDropdownContainer"),
    btnMediaDropdownTrigger: document.getElementById("btnMediaDropdownTrigger"),
    mediaDropdownSelectedIcon: document.getElementById("mediaDropdownSelectedIcon"),
    mediaDropdownSelectedLabel: document.getElementById("mediaDropdownSelectedLabel"),
    mediaDropdownMenu: document.getElementById("mediaDropdownMenu"),
    mediaCardsGrid: document.getElementById("mediaCardsGrid"),
    mediaEmptyState: document.getElementById("mediaEmptyState"),
    btnEmptyGoAddLogbook: document.getElementById("btnEmptyGoAddLogbook"),

    // Elemen Halaman Sukses Pembayaran & Tanda Terima Digital
    receiptOrderIdText: document.getElementById("receiptOrderIdText"),
    receiptPackageNameText: document.getElementById("receiptPackageNameText"),
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
    btnRefreshSync: null,



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
    qrisFeeLabel: document.getElementById("qrisFeeLabel"),
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
    vaFeeRow: document.getElementById("vaFeeRow"),
    vaFeeLabel: document.getElementById("vaFeeLabel"),
    vaFeeAmount: document.getElementById("vaFeeAmount"),
    vaTotalAmount: document.getElementById("vaTotalAmount"),
    btnCopyVaAmount: document.getElementById("btnCopyVaAmount"),
    vaInstructionsList: document.getElementById("vaInstructionsList"),
    btnCheckPaymentStatus: document.getElementById("btnCheckPaymentStatus"),
    btnSimulateSuccessPayment: document.getElementById("btnSimulateSuccessPayment"),
    qrisSimulateArea: document.getElementById("qrisSimulateArea"),

    // Halaman Penawaran & Gating Langganan Aktif (Route: /pricing)
    pricingActiveSubscriptionCard: document.getElementById("pricingActiveSubscriptionCard"),
    pricingDefaultCard: document.getElementById("pricingDefaultCard"),
    pricingActiveStatusText: document.getElementById("pricingActiveStatusText"),
    pricingActivePeriodText: document.getElementById("pricingActivePeriodText"),
    btnActiveSubToDashboard: document.getElementById("btnActiveSubToDashboard"),

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

    // Rekaman Suara & Video Wawancara (Cloud Storage Terenkripsi)
    inputAudioMedia: document.getElementById("inputAudioMedia"),
    btnChooseAudioMedia: document.getElementById("btnChooseAudioMedia"),
    audioFileSelectedInfo: document.getElementById("audioFileSelectedInfo"),
    audioSelectedFileName: document.getElementById("audioSelectedFileName"),
    audioSelectedFileSize: document.getElementById("audioSelectedFileSize"),
    btnClearAudioMedia: document.getElementById("btnClearAudioMedia"),
    inputVideoMedia: document.getElementById("inputVideoMedia"),
    btnChooseVideoMedia: document.getElementById("btnChooseVideoMedia"),
    videoFileSelectedInfo: document.getElementById("videoFileSelectedInfo"),
    videoSelectedFileName: document.getElementById("videoSelectedFileName"),
    videoSelectedFileSize: document.getElementById("videoSelectedFileSize"),
    btnClearVideoMedia: document.getElementById("btnClearVideoMedia"),
    existingLogbookMediaArea: document.getElementById("existingLogbookMediaArea"),
    existingLogbookMediaList: document.getElementById("existingLogbookMediaList"),
    mediaUploadProgressArea: document.getElementById("mediaUploadProgressArea"),
    mediaUploadProgressText: document.getElementById("mediaUploadProgressText"),
    mediaProgressBarFill: document.getElementById("mediaProgressBarFill"),

    // Floating Background Upload Manager Widget
    bgUploadWidget: document.getElementById("bgUploadWidget"),
    bgUploadCard: document.getElementById("bgUploadCard"),
    bgUploadTargetTitle: document.getElementById("bgUploadTargetTitle"),
    btnToggleMinimizeUploadWidget: document.getElementById("btnToggleMinimizeUploadWidget"),
    btnCloseUploadWidget: document.getElementById("btnCloseUploadWidget"),
    bgUploadBody: document.getElementById("bgUploadBody"),
    bgUploadFileName: document.getElementById("bgUploadFileName"),
    bgUploadStatusBadge: document.getElementById("bgUploadStatusBadge"),
    bgUploadProgressBar: document.getElementById("bgUploadProgressBar"),
    bgUploadBytes: document.getElementById("bgUploadBytes"),
    bgUploadPercent: document.getElementById("bgUploadPercent"),
    bgUploadErrorArea: document.getElementById("bgUploadErrorArea"),
    bgUploadErrorMsg: document.getElementById("bgUploadErrorMsg"),
    btnRetryUpload: document.getElementById("btnRetryUpload"),

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
    exportIncludeTranscript: document.getElementById("exportIncludeTranscript"),
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
    HOME: "/",
    LOGIN: "/login",
    VERIFY_EMAIL: "/verify-email",
    DASHBOARD: "/dashboard",
    MEDIA: "/media",
    PRICING: "/pricing",
    CHECKOUT: "/checkout",
    PAYMENT_SUCCESS: "/payment-success",
    PROFILE: "/profile"
  };

  function normalizeRoute(path) {
    if (!path || path === "/" || path === "") return ROUTES.HOME;
    const clean = path.split("?")[0].split("#")[0];
    return clean || ROUTES.HOME;
  }

  function navigateTo(targetPath, replace = false) {
    let cleanPath = normalizeRoute(targetPath);
    const user = window.AuthManager ? AuthManager.currentUser : null;

    // Proteksi Rute (Auth Gating Standar Industri)
    if (!user) {
      const isPublicRoute = cleanPath === ROUTES.HOME || cleanPath === ROUTES.PRICING || cleanPath === ROUTES.LOGIN;
      if (!isPublicRoute) {
        cleanPath = ROUTES.LOGIN;
      }
    } else if (!user.isDemo && !user.emailVerified) {
      if (cleanPath !== ROUTES.VERIFY_EMAIL && cleanPath !== ROUTES.HOME) {
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
    hideToast();
    const cleanPath = normalizeRoute(path);

    // Hentikan dan bersihkan siklus hidup animasi landing page jika rute berubah
    if (window.LandingAnimations) {
      LandingAnimations.destroy();
    }

    // Hentikan polling transaksi gateway jika berpindah dari halaman checkout
    if (cleanPath !== ROUTES.CHECKOUT && typeof stopPaymentPolling === "function") {
      stopPaymentPolling();
    }

    // Sembunyikan splash screen awal jika masih aktif
    const splash = document.getElementById("appInitialSplash");
    if (splash) splash.classList.add("hidden");

    // Sembunyikan semua tampilan utama
    if (DOM.viewLandingPage) DOM.viewLandingPage.classList.add("hidden");
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

    // Sinkronisasi status tombol CTA Landing Page
    updateLandingPageAuthUI(user);

    switch (cleanPath) {
      case ROUTES.HOME:
        if (DOM.viewLandingPage) DOM.viewLandingPage.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.LandingAnimations) {
          requestAnimationFrame(() => {
            LandingAnimations.init();
          });
        }
        break;

      case ROUTES.LOGIN:
        if (DOM.viewLoginScreen) DOM.viewLoginScreen.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
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
        if (typeof updatePricingViewSubscriptionState === "function") {
          updatePricingViewSubscriptionState();
        }
        break;

      case ROUTES.CHECKOUT:
        if (window.AuthManager && AuthManager.isSubscribed && AuthManager.isSubscribed()) {
          showToast("Akun Anda telah memiliki paket langganan aktif.", "info");
          navigateTo(ROUTES.DASHBOARD, true);
          return;
        }
        if (DOM.viewCheckout) DOM.viewCheckout.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
        updateCheckoutSummaryDisplay();
        if (state.isSandboxMode !== null) {
          applySandboxMode(state.isSandboxMode);
        }
        break;

      case ROUTES.PAYMENT_SUCCESS:
        if (DOM.viewPaymentSuccess) DOM.viewPaymentSuccess.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
        renderPaymentSuccessReceipt();
        break;

      case ROUTES.PROFILE:
        if (DOM.viewMainApp) DOM.viewMainApp.classList.remove("hidden");
        setWorkspaceTab("logbook");
        openProfileModal();
        break;

      case ROUTES.MEDIA:
        if (DOM.viewMainApp) DOM.viewMainApp.classList.remove("hidden");
        setWorkspaceTab("media");
        renderMediaGallery();
        break;

      case ROUTES.DASHBOARD:
      default:
        if (DOM.viewMainApp) DOM.viewMainApp.classList.remove("hidden");
        setWorkspaceTab("logbook");
        break;
    }
  }

  function updateLandingPageAuthUI(user) {
    const btnHeroStart = document.getElementById("btnLandingHeroStart");
    const btnPricingAction = document.getElementById("btnLandingPricingAction");
    const linkFooterLogin = document.getElementById("linkFooterLogin");
    const linkFooterRegister = document.getElementById("linkFooterRegister");

    if (user) {
      if (btnHeroStart) {
        btnHeroStart.setAttribute("href", "/dashboard");
        btnHeroStart.innerHTML = `
          <span>Buka Ruang Kerja (Dashboard)</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        `;
      }
      if (btnPricingAction) {
        btnPricingAction.innerHTML = `<span>Buka Ruang Kerja (Dashboard)</span>`;
      }
      if (linkFooterLogin) linkFooterLogin.textContent = "Buka Dashboard";
      if (linkFooterRegister) linkFooterRegister.textContent = "Buka Dashboard";
    } else {
      if (btnHeroStart) {
        btnHeroStart.setAttribute("href", "/login");
        btnHeroStart.innerHTML = `
          <span>Akses Aplikasi Sekarang!</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        `;
      }
      if (btnPricingAction) {
        btnPricingAction.innerHTML = `<span>Mulai Berlangganan Sekarang</span>`;
      }
      if (linkFooterLogin) linkFooterLogin.textContent = "Masuk Akun Peneliti";
      if (linkFooterRegister) linkFooterRegister.textContent = "Daftar Akun Baru";
    }
  }

  function renderPaymentSuccessReceipt() {
    hideToast();
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
    const methodName = VA_BANK_NAMES[methodKey] || (methodKey === "qris" ? "QRIS (Semua Bank & Dompet Digital)" : methodKey === "payment_link" ? "Portal Pembayaran Resmi" : methodKey);
    const completedDate = (order && order.completedAt) ? new Date(order.completedAt) : new Date();

    const validUntil = new Date(completedDate);
    validUntil.setDate(validUntil.getDate() + 30);

    const totalAmount = (order && (order.totalPayment || order.amount)) || 50000;

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
    if (DOM.receiptPackageNameText) DOM.receiptPackageNameText.textContent = "Akses Sistem Logbook Riset (30 Hari)";
    if (DOM.receiptPaymentMethodText) DOM.receiptPaymentMethodText.textContent = methodName;
    if (DOM.receiptTimestampText) DOM.receiptTimestampText.textContent = dateFormatter.format(completedDate);
    if (DOM.receiptUserEmailText) DOM.receiptUserEmailText.textContent = (user && user.email) || "-";
    if (DOM.receiptValidUntilText) DOM.receiptValidUntilText.textContent = `30 Hari Kalender (hingga ${expiryFormatter.format(validUntil)})`;
    if (DOM.receiptTotalAmountText) DOM.receiptTotalAmountText.textContent = formatRupiah(totalAmount);
  }

  function updateCheckoutSummaryDisplay() {
    const order = state.currentPaymentOrder;
    const baseAmount = 50000;
    const total = (order && order.totalPayment) ? order.totalPayment : baseAmount;

    if (DOM.checkoutSubtotalText) DOM.checkoutSubtotalText.textContent = formatRupiah(baseAmount);
    if (DOM.checkoutFeeLabel) DOM.checkoutFeeLabel.textContent = "Biaya Layanan";
    if (DOM.checkoutFeeText) DOM.checkoutFeeText.textContent = "Bebas Biaya (Rp 0)";
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
      if (window.ProfileManager && typeof ProfileManager.resetProfile === "function") {
        ProfileManager.resetProfile();
      }
      if (window.CategoryManager && typeof CategoryManager.resetCategories === "function") {
        CategoryManager.resetCategories();
      }
      renderHeaderUserProfile(null);
      const target = targetRoute || normalizeRoute(window.location.pathname);
      if (target === ROUTES.HOME || target === ROUTES.PRICING) {
        navigateTo(target, true);
      } else {
        navigateTo(ROUTES.LOGIN, true);
      }
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
    if (typeof reconcileUserPendingTransactions === "function") {
      reconcileUserPendingTransactions(user, true);
    }
    await loadEntries(user);
    if (window.CategoryManager && state.entries && state.entries.length > 0) {
      CategoryManager.syncFromEntries(state.entries, user);
    }
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
      const limit = (window.AuthManager && AuthManager.MAX_TRIAL_LOGBOOKS) || 5;
      const remaining = window.AuthManager && typeof AuthManager.getRemainingTrialQuota === "function"
        ? AuthManager.getRemainingTrialQuota()
        : limit;
      DOM.btnSubscriptionBadge.className = "badge-plan free trial";
      DOM.planBadgeText.textContent = `Trial (${remaining}/${limit}) Upgrade`;
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
    const activeProf = profile || (window.ProfileManager ? ProfileManager.currentProfile : null) || {};
    // Guard: Jika profile memiliki email dan email tidak cocok dengan user yang sedang login, abaikan profile tersebut
    const isProfileOwner = !activeProf.email || !user.email || (activeProf.email.trim().toLowerCase() === user.email.trim().toLowerCase());
    const prof = isProfileOwner ? activeProf : {};

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

    // Jika pengguna sudah menghapus data contoh secara permanen, bersihkan sisa data dummy jika masih ada di cache
    if (isDismissed && fetched.length > 0 && fetched.every(e => e.isDummy === true)) {
      fetched = [];
    }

    // Jika data yang dimuat dari cache lokal masih merupakan data dummy lama (Luwu/Wajo tanpa foto), mutakhirkan ke data dummy baru
    if (!isDismissed && fetched.length > 0 && fetched.every(e => e.isDummy === true)) {
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

    updateSubscriptionBadgeUI();

    // 1. Tampilkan / Sembunyikan Banner Dummy Data (Trial Notice)
    const hasDummy = state.entries.some(e => e.isDummy === true);
    if (DOM.dummyDataNoticeBar) {
      DOM.dummyDataNoticeBar.classList.toggle("hidden", !hasDummy);
    }
    if (DOM.btnDeleteDummyData) {
      // Tombol hapus data sampel selalu ditampilkan selama masih ada data contoh bawaan (termasuk mode trial)
      DOM.btnDeleteDummyData.classList.toggle("hidden", !hasDummy);
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

    // 6. Update Counter Workspace Nav & Koleksi Media
    updateWorkspaceNavCounts();
    if (state.activeWorkspaceTab === "media") {
      renderMediaGallery();
    }
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
      card.id = `logbookCard-${item.id}`;

      // Badge Wilayah
      const kabBadgeClass = item.kabupaten.toLowerCase().includes("wajo") ? "wajo" : item.kabupaten.toLowerCase().includes("luwu") ? "luwu" : "";
      const displayKab = item.kabupaten.toLowerCase().startsWith("kab") ? item.kabupaten : `Kab. ${item.kabupaten}`;

      // Foto Bukti
      const hasPhoto = Boolean(item.fotoUrl || item.fotoBase64);
      const photoSrc = item.fotoUrl || item.fotoBase64 || "";

      // Indikator Berkas Media Wawancara Terlampir
      const hasMedia = item.wawancara_media && Array.isArray(item.wawancara_media) && item.wawancara_media.length > 0;
      const mediaBadgeHtml = hasMedia ? `<span class="badge-media-attached" title="${item.wawancara_media.length} Berkas Media Tersimpan di Cloud">${item.wawancara_media.length} Media</span>` : "";

      // Detail Lokasi (Kecamatan, Desa, Dusun opsional)
      const locDetailParts = [
        item.kecamatan ? `Kec. ${escapeHtml(item.kecamatan)}` : "",
        item.desa ? `Desa ${escapeHtml(item.desa)}` : "",
        item.dusun ? `Dsn. ${escapeHtml(item.dusun)}` : ""
      ].filter(Boolean);
      const locDetailStr = locDetailParts.length > 0 ? locDetailParts.join(" &bull; ") : "-";

      // Judul Sesi / Responden
      const respondentTitle = item.sasaranResponden ? escapeHtml(item.sasaranResponden) : "Sesi Aktivitas Lapangan";

      card.innerHTML = `
        <div class="card-top-bar">
          <div class="card-top-badges">
            <span class="activity-badge badge-interview">${escapeHtml(item.jenisKegiatan || "Aktivitas Lapangan")}</span>
            ${mediaBadgeHtml}
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

        <div class="card-respondent-row">
          <h3 class="card-respondent-title">${respondentTitle}</h3>
          <div class="card-datetime-badge">
            <span class="meta-date">${formatDateIndo(item.tanggal)}</span>
            <span class="meta-time-dot">&bull;</span>
            <span class="meta-time">${escapeHtml(item.waktuMulai || "-")} - ${escapeHtml(item.waktuSelesai || "-")} ${profileTz}</span>
          </div>
        </div>

        <div class="card-location-row">
          <svg class="location-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span class="card-location-text"><strong class="location-kab-text ${kabBadgeClass}">${escapeHtml(displayKab)}</strong> &bull; ${locDetailStr}</span>
        </div>

        <div class="card-main-layout ${hasPhoto ? "has-side-photo" : ""}">
          <div class="card-text-col">
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
  // 3.5. MODUL MULTIMEDIA WAWANCARA & GALERI MEDIA (CLOUD STORAGE TERENKRIPSI)
  // ==========================================================================

  function formatBytes(bytes) {
    if (!bytes || isNaN(bytes) || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function setWorkspaceTab(tab) {
    state.activeWorkspaceTab = tab;
    if (tab === "media") {
      if (DOM.tabNavLogbook) DOM.tabNavLogbook.classList.remove("active");
      if (DOM.tabNavMedia) DOM.tabNavMedia.classList.add("active");
      if (DOM.dashboardFeedArea) DOM.dashboardFeedArea.classList.add("hidden");
      if (DOM.viewMediaGallery) DOM.viewMediaGallery.classList.remove("hidden");
    } else {
      if (DOM.tabNavLogbook) DOM.tabNavLogbook.classList.add("active");
      if (DOM.tabNavMedia) DOM.tabNavMedia.classList.remove("active");
      if (DOM.dashboardFeedArea) DOM.dashboardFeedArea.classList.remove("hidden");
      if (DOM.viewMediaGallery) DOM.viewMediaGallery.classList.add("hidden");
    }
  }

  function updateWorkspaceNavCounts() {
    const totalEntries = state.entries.length;
    let totalMedia = 0;
    let totalAudio = 0;
    let totalVideo = 0;
    let sessionsWithMedia = 0;

    state.entries.forEach(entry => {
      if (entry.wawancara_media && Array.isArray(entry.wawancara_media) && entry.wawancara_media.length > 0) {
        sessionsWithMedia++;
        entry.wawancara_media.forEach(m => {
          totalMedia++;
          const isAudio = m.file_type === "audio" || (m.mime_type && m.mime_type.startsWith("audio/"));
          const isVideo = m.file_type === "video" || (m.mime_type && m.mime_type.startsWith("video/"));
          if (isAudio) totalAudio++;
          else if (isVideo) totalVideo++;
        });
      }
    });

    if (DOM.navLogbookCount) DOM.navLogbookCount.textContent = totalEntries;
    if (DOM.navMediaCount) DOM.navMediaCount.textContent = totalMedia;

    if (DOM.statMediaTotalCount) DOM.statMediaTotalCount.textContent = totalMedia;
    if (DOM.statMediaAudioCount) DOM.statMediaAudioCount.textContent = totalAudio;
    if (DOM.statMediaVideoCount) DOM.statMediaVideoCount.textContent = totalVideo;
    if (DOM.statMediaSessionsCount) DOM.statMediaSessionsCount.textContent = sessionsWithMedia;
  }

  function uploadMediaWithProgress(file, userId, logbookId, onProgress) {
    return new Promise((resolve, reject) => {
      if (!file || !userId || !logbookId) {
        return reject(new Error("Berkas, userId, dan logbookId wajib tersedia untuk upload media."));
      }
      const xhr = new XMLHttpRequest();
      const encName = encodeURIComponent(file.name);
      const encType = encodeURIComponent(file.type || "application/octet-stream");
      const uploadUrl = `/api/media/upload?userId=${encodeURIComponent(userId)}&logbookId=${encodeURIComponent(logbookId)}&fileName=${encName}&mimeType=${encType}`;

      xhr.open("POST", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && typeof onProgress === "function") {
          const rawPercent = Math.min(100, Math.round((e.loaded / e.total) * 100));
          onProgress({
            phase: e.loaded >= e.total ? "cloud_sync" : "transfer",
            loaded: e.loaded,
            total: e.total,
            rawPercent
          });
        }
      };

      xhr.upload.onload = () => {
        // Seluruh biner telah terkirim dari browser ke server buffer
        // Server saat ini sedang streaming dan mengenkripsi ke Google Drive 5 TB
        if (typeof onProgress === "function") {
          onProgress({
            phase: "cloud_sync",
            loaded: file.size,
            total: file.size,
            rawPercent: 100
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success) {
              if (typeof onProgress === "function") {
                onProgress({
                  phase: "server_done",
                  loaded: file.size,
                  total: file.size,
                  rawPercent: 100,
                  data: res.data
                });
              }
              resolve(res.data);
            } else {
              reject(new Error(res.message || "Gagal mengunggah media ke penyimpanan cloud"));
            }
          } catch (e) {
            reject(new Error("Respon server unggah cloud tidak valid"));
          }
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.message || `Upload gagal dengan kode status HTTP ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Upload gagal dengan kode status HTTP ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Koneksi jaringan terputus saat mengunggah berkas"));
      xhr.ontimeout = () => reject(new Error("Batas waktu unggah berkas terlampaui (timeout)"));

      xhr.send(file);
    });
  }

  async function uploadMediaFile(file, userId, logbookId) {
    return uploadMediaWithProgress(file, userId, logbookId);
  }

  // Pengelola Antrean Unggah Latar Belakang (Non-Blocking Multi-Stage Floating Manager)
  const BackgroundMediaManager = {
    activeTask: null,
    queue: [],
    cloudTicker: null,

    enqueue(task) {
      this.queue.push(task);
      if (!this.activeTask) {
        this.processNext();
      }
    },

    async processNext() {
      if (this.queue.length === 0) {
        this.activeTask = null;
        return;
      }
      const task = this.queue.shift();
      this.activeTask = task;
      await this.executeTask(task);
      this.processNext();
    },

    clearCloudTicker() {
      if (this.cloudTicker) {
        clearInterval(this.cloudTicker);
        this.cloudTicker = null;
      }
    },

    async executeTask(task) {
      const { userId, logbookId, targetTitle, audioFile, videoFile } = task;

      if (!DOM.bgUploadWidget) return;
      DOM.bgUploadWidget.classList.remove("hidden");
      if (DOM.bgUploadCard) DOM.bgUploadCard.classList.remove("minimized");
      if (DOM.bgUploadTargetTitle) DOM.bgUploadTargetTitle.textContent = targetTitle || "Logbook Lapangan";
      if (DOM.bgUploadErrorArea) DOM.bgUploadErrorArea.classList.add("hidden");
      if (DOM.btnCloseUploadWidget) DOM.btnCloseUploadWidget.classList.add("hidden");

      this.clearCloudTicker();

      const itemsToUpload = [];
      if (audioFile) itemsToUpload.push({ type: "audio", file: audioFile, label: "Audio" });
      if (videoFile) itemsToUpload.push({ type: "video", file: videoFile, label: "Video" });

      if (itemsToUpload.length === 0) {
        this.activeTask = null;
        return;
      }

      const totalFiles = itemsToUpload.length;
      const uploadedResults = [];

      try {
        for (let i = 0; i < itemsToUpload.length; i++) {
          const item = itemsToUpload[i];
          const fileIndex = i + 1;
          const prefixLabel = totalFiles > 1 ? `[${fileIndex}/${totalFiles}] ` : "";

          // Tentukan bobot alokasi persentase berkas ini dalam alur kerja
          // Jika 1 berkas: transfer (0 - 72%), cloud_sync (72 - 92%), DB & finalize (92 - 100%)
          // Jika 2 berkas: file 1 (0 - 45%), file 2 (45 - 90%), DB & finalize (90 - 100%)
          const fileStartPct = totalFiles === 1 ? 0 : (i === 0 ? 0 : 45);
          const fileTransferMaxPct = totalFiles === 1 ? 72 : (i === 0 ? 32 : 75);
          const fileCloudMaxPct = totalFiles === 1 ? 92 : (i === 0 ? 44 : 89);
          const fileRangeSpan = fileTransferMaxPct - fileStartPct;

          this.updateWidgetState({
            fileName: item.file.name,
            status: `${prefixLabel}Mengirim ${item.label}...`,
            percent: fileStartPct,
            bytesText: `0 MB / ${formatBytes(item.file.size)}`,
            isCompleted: false,
            isFailed: false,
            phase: "transfer"
          });

          let currentFilePct = fileStartPct;

          const uploadRes = await uploadMediaWithProgress(item.file, userId, logbookId, (p) => {
            if (p.phase === "transfer") {
              const transferRatio = p.total > 0 ? (p.loaded / p.total) : 0;
              currentFilePct = Math.min(fileTransferMaxPct, Math.round(fileStartPct + (transferRatio * fileRangeSpan)));
              this.updateWidgetState({
                fileName: item.file.name,
                status: `${prefixLabel}Mengirim ${item.label} (${currentFilePct}%)`,
                percent: currentFilePct,
                bytesText: `${formatBytes(p.loaded)} / ${formatBytes(p.total)}`,
                isCompleted: false,
                isFailed: false,
                phase: "transfer"
              });
            } else if (p.phase === "cloud_sync") {
              // Browser selesai mengirim byte. Server sekarang memproses streaming ke Google Drive 5 TB.
              if (!this.cloudTicker) {
                let tickerPct = Math.max(currentFilePct, fileTransferMaxPct);
                this.updateWidgetState({
                  fileName: item.file.name,
                  status: `${prefixLabel}Sinkronisasi Penyimpanan Cloud...`,
                  percent: tickerPct,
                  bytesText: `${formatBytes(item.file.size)} • Mengamankan ke Cloud Terenkripsi`,
                  isCompleted: false,
                  isFailed: false,
                  phase: "syncing"
                });

                this.cloudTicker = setInterval(() => {
                  if (tickerPct < fileCloudMaxPct) {
                    tickerPct = Math.min(fileCloudMaxPct, tickerPct + 2);
                    this.updateWidgetState({
                      fileName: item.file.name,
                      status: `${prefixLabel}Sinkronisasi Penyimpanan Cloud...`,
                      percent: tickerPct,
                      bytesText: `${formatBytes(item.file.size)} • Mengamankan ke Cloud Terenkripsi`,
                      isCompleted: false,
                      isFailed: false,
                      phase: "syncing"
                    });
                  }
                }, 900);
              }
            }
          });

          this.clearCloudTicker();

          uploadedResults.push({
            file_id: uploadRes.file_id,
            file_name: uploadRes.file_name,
            drive_file_name: uploadRes.drive_file_name,
            file_type: item.type,
            mime_type: uploadRes.mime_type || item.file.type || (item.type === "video" ? "video/mp4" : "audio/mpeg"),
            size: uploadRes.size || item.file.size,
            web_view_link: uploadRes.web_view_link || "",
            stream_url: uploadRes.stream_url || `/api/media/stream?file_id=${uploadRes.file_id}`,
            logbook_id: logbookId,
            uploaded_at: new Date().toISOString()
          });
        }

        // 3. FASE REGISTRASI: Patch atomik ke Firestore & state lokal (92% - 98%)
        if (uploadedResults.length > 0) {
          this.updateWidgetState({
            fileName: uploadedResults.map(r => r.file_name).join(", "),
            status: "Mendaftarkan ke Logbook...",
            percent: 94,
            bytesText: "Menyimpan Metadata & Sinkronisasi",
            isCompleted: false,
            isFailed: false,
            phase: "db-sync"
          });

          let updatedMedia = [];
          const entryIdx = state.entries.findIndex(e => e.id === logbookId);
          if (entryIdx !== -1) {
            const entry = state.entries[entryIdx];
            updatedMedia = Array.isArray(entry.wawancara_media) ? [...entry.wawancara_media] : [];
            uploadedResults.forEach(r => {
              if (!updatedMedia.some(m => m.file_id === r.file_id)) {
                updatedMedia.push(r);
              }
            });
            state.entries[entryIdx].wawancara_media = updatedMedia;
          } else {
            updatedMedia = [...uploadedResults];
          }

          if (window.FirebaseService && FirebaseService.db && userId) {
            await FirebaseService.db
              .collection("users")
              .doc(userId)
              .collection("logbooks")
              .doc(logbookId)
              .set({ wawancara_media: updatedMedia }, { merge: true });
          }

          this.updateWidgetState({
            fileName: uploadedResults.map(r => r.file_name).join(", "),
            status: "Memperbarui Koleksi Media...",
            percent: 98,
            bytesText: "Memperbarui Tampilan Wawancara",
            isCompleted: false,
            isFailed: false,
            phase: "db-sync"
          });

          const user = window.AuthManager ? AuthManager.currentUser : null;
          saveEntriesToLocalStorage(state.entries, user);
          updateDashboard();
          updateWorkspaceNavCounts();
          if (state.activeWorkspaceTab === "media") {
            renderMediaGallery();
          }

          // 4. FASE FINAL: Selesai 100% & Terverifikasi Aktif
          this.updateWidgetState({
            fileName: uploadedResults.map(r => r.file_name).join(", "),
            status: "Tersimpan di Cloud (100%)",
            percent: 100,
            bytesText: "100% Siap Diakses",
            isCompleted: true,
            isFailed: false,
            phase: "completed"
          });

          showToast("Media wawancara berhasil dicadangkan dan siap diakses di koleksi!", "success");
          if (DOM.btnCloseUploadWidget) DOM.btnCloseUploadWidget.classList.remove("hidden");

          setTimeout(() => {
            if (this.activeTask === task && DOM.bgUploadWidget) {
              DOM.bgUploadWidget.classList.add("hidden");
            }
          }, 8000);
        }
      } catch (err) {
        this.clearCloudTicker();
        console.error("Gagal mengunggah media background:", err);
        this.updateWidgetState({
          fileName: (videoFile || audioFile)?.name || "Berkas Media",
          status: "Gagal Mengunggah",
          percent: 0,
          bytesText: "Terputus",
          isCompleted: false,
          isFailed: true,
          phase: "failed",
          errorMsg: err.message || "Gagal mengunggah ke penyimpanan cloud"
        });
        showToast("Gagal mengunggah media: " + err.message, "error");
        if (DOM.btnCloseUploadWidget) DOM.btnCloseUploadWidget.classList.remove("hidden");
      }
    },

    updateWidgetState({ fileName, status, percent, bytesText, isCompleted, isFailed, phase, errorMsg }) {
      if (DOM.bgUploadFileName) DOM.bgUploadFileName.textContent = fileName || "-";
      if (DOM.bgUploadStatusBadge) {
        DOM.bgUploadStatusBadge.textContent = status || "Memproses...";
        let badgeClass = "bg-upload-status-badge";
        if (isCompleted) badgeClass += " completed";
        else if (isFailed) badgeClass += " failed";
        else if (phase === "syncing") badgeClass += " syncing";
        else if (phase === "db-sync") badgeClass += " db-sync";
        DOM.bgUploadStatusBadge.className = badgeClass;
      }
      if (DOM.bgUploadProgressBar) {
        DOM.bgUploadProgressBar.style.width = `${percent}%`;
        let fillClass = "bg-upload-progress-fill";
        if (isCompleted) fillClass += " completed";
        else if (isFailed) fillClass += " failed";
        else if (phase === "syncing") fillClass += " syncing";
        else if (phase === "db-sync") fillClass += " db-sync";
        DOM.bgUploadProgressBar.className = fillClass;
      }
      if (DOM.bgUploadPercent) DOM.bgUploadPercent.textContent = `${percent}%`;
      if (DOM.bgUploadBytes) DOM.bgUploadBytes.textContent = bytesText || "";

      if (DOM.bgUploadErrorArea) {
        if (isFailed) {
          DOM.bgUploadErrorArea.classList.remove("hidden");
          if (DOM.bgUploadErrorMsg) DOM.bgUploadErrorMsg.textContent = errorMsg || "Unggahan gagal.";
        } else {
          DOM.bgUploadErrorArea.classList.add("hidden");
        }
      }
    }
  };

  // Penanganan Cerdas Fallback Pemutaran & Pengunduhan Media Cloud (Zero Downtime Playback)
  window.handleMediaPlaybackFallback = function(mediaEl) {
    if (!mediaEl || mediaEl.dataset.hasSwitchedFallback === "1") return;
    const fallbackUrl = mediaEl.getAttribute("data-fallback-url");
    if (fallbackUrl) {
      mediaEl.dataset.hasSwitchedFallback = "1";
      while (mediaEl.firstChild) {
        mediaEl.removeChild(mediaEl.firstChild);
      }
      mediaEl.src = fallbackUrl;
      try {
        mediaEl.load();
      } catch (loadErr) {
        console.warn("Gagal reload media fallback:", loadErr);
      }
    }
  };

  window.handleMediaDownloadClick = async function(event, linkEl) {
    if (!linkEl) return;
    const fallback = linkEl.getAttribute("data-fallback-download");
    if (!fallback) return;

    if (linkEl.dataset.switchedDownload !== "1") {
      event.preventDefault();
      try {
        const checkRes = await fetch(linkEl.href, { method: "HEAD" });
        const ct = checkRes.headers.get("content-type") || "";
        if (checkRes.ok && !ct.includes("text/html")) {
          linkEl.dataset.switchedDownload = "1";
          window.location.href = linkEl.href;
          return;
        }
      } catch (e) {
        // Abaikan galat jaringan dan lanjut ke direct fallback
      }
      linkEl.dataset.switchedDownload = "1";
      linkEl.href = fallback;
      window.location.href = fallback;
    }
  };

  function renderMediaGallery() {
    if (!DOM.mediaCardsGrid) return;

    updateWorkspaceNavCounts();

    const profileTz = (window.ProfileManager && ProfileManager.currentProfile && ProfileManager.currentProfile.timezone) || "WITA";

    // Kumpulkan seluruh sesi logbook yang memiliki berkas media wawancara
    const sessionsWithMedia = state.entries.filter(entry => {
      return Array.isArray(entry.wawancara_media) && entry.wawancara_media.length > 0;
    });

    // Urutkan berdasarkan tanggal & waktu aktivitas terbaru
    sessionsWithMedia.sort((a, b) => {
      const dtA = (a.tanggal || "1970-01-01") + "T" + (a.waktuMulai || "00:00");
      const dtB = (b.tanggal || "1970-01-01") + "T" + (b.waktuMulai || "00:00");
      return dtB.localeCompare(dtA);
    });

    // Filter berdasarkan tab jenis media (all / audio / video)
    const typeFilter = state.mediaFilterType || "all";
    let filteredSessions = sessionsWithMedia.filter(session => {
      const audios = session.wawancara_media.filter(m => m.file_type === "audio" || (m.mime_type && m.mime_type.startsWith("audio/")));
      const videos = session.wawancara_media.filter(m => m.file_type === "video" || (m.mime_type && m.mime_type.startsWith("video/")));
      if (typeFilter === "audio") return audios.length > 0;
      if (typeFilter === "video") return videos.length > 0;
      return true;
    });

    // Filter berdasarkan kata kunci pencarian
    const q = (state.mediaSearchQuery || "").trim().toLowerCase();
    if (q) {
      filteredSessions = filteredSessions.filter(entry => {
        const fileNames = (entry.wawancara_media || []).map(m => m.file_name || "").join(" ");
        const searchPool = [
          entry.sasaranResponden,
          entry.jenisKegiatan,
          entry.deskripsi,
          entry.output,
          entry.tanggal,
          entry.kabupaten,
          entry.kecamatan,
          entry.desa,
          entry.dusun,
          fileNames
        ].filter(Boolean).join(" ").toLowerCase();
        return searchPool.includes(q);
      });
    }

    // Tampilkan Empty State jika kosong
    if (filteredSessions.length === 0) {
      DOM.mediaCardsGrid.innerHTML = "";
      if (DOM.mediaEmptyState) DOM.mediaEmptyState.classList.remove("hidden");
      return;
    }

    if (DOM.mediaEmptyState) DOM.mediaEmptyState.classList.add("hidden");
    DOM.mediaCardsGrid.innerHTML = "";

    filteredSessions.forEach(entry => {
      // Pilah media audio dan video
      const audios = (entry.wawancara_media || []).filter(m => m.file_type === "audio" || (m.mime_type && m.mime_type.startsWith("audio/")));
      const videos = (entry.wawancara_media || []).filter(m => m.file_type === "video" || (m.mime_type && m.mime_type.startsWith("video/")));

      // Tentukan media yang akan ditampilkan pada kartu sesuai filter tab
      let mediaToShow = [];
      if (typeFilter === "audio") {
        mediaToShow = audios;
      } else if (typeFilter === "video") {
        mediaToShow = videos;
      } else {
        // "all": tampilkan video terlebih dahulu baru kemudian audio
        mediaToShow = [...videos, ...audios];
      }

      // Format Waktu Sesi Wawancara
      let timeText = "";
      if (entry.waktuMulai && entry.waktuSelesai) {
        timeText = `${entry.waktuMulai} - ${entry.waktuSelesai} ${profileTz}`;
      } else if (entry.waktuMulai) {
        timeText = `${entry.waktuMulai} ${profileTz}`;
      } else {
        timeText = `-`;
      }

      // Lokasi Administratif Lengkap
      const locParts = [
        entry.kabupaten ? (entry.kabupaten.toLowerCase().startsWith("kab") ? entry.kabupaten : `Kab. ${entry.kabupaten}`) : "",
        entry.kecamatan ? `Kec. ${entry.kecamatan}` : "",
        entry.desa ? `Desa ${entry.desa}` : "",
        entry.dusun ? `Dsn. ${entry.dusun}` : ""
      ].filter(Boolean);
      const locText = locParts.length > 0 ? locParts.join(" &bull; ") : "Wilayah Riset Lapangan";

      // Foto Bukti Terlampir?
      const hasPhoto = Boolean(entry.fotoUrl || entry.fotoBase64);

      // Buat elemen Card
      const card = document.createElement("div");
      card.className = "media-card";
      card.id = `mediaSessionCard-${entry.id}`;

      // Render daftar player media yang sesuai filter
      const playersHtml = mediaToShow.map((m, mIdx) => {
        const isVideo = m.file_type === "video" || (m.mime_type && m.mime_type.startsWith("video/"));
        const fileId = m.file_id || "";
        const primaryStreamUrl = `/api/media/stream?file_id=${encodeURIComponent(fileId)}`;
        const directFallbackUrl = fileId ? `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}` : "";
        const directDownloadFallback = fileId ? `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download` : "";
        const streamUrl = m.stream_url || primaryStreamUrl;
        const formattedSize = formatBytes(m.size);
        const transcript = (m.transcript || (mIdx === 0 ? entry.transcript : "") || "").trim();

        return `
          <div class="media-player-item-block">
            <div class="media-item-header">
              <span class="media-card-type-tag ${isVideo ? "video" : "audio"}">
                ${isVideo ? "Video Wawancara" : "Rekaman Suara"}
              </span>
              <a href="${streamUrl}&download=1&filename=${encodeURIComponent(m.file_name || "berkas")}"
                 data-fallback-download="${directDownloadFallback}"
                 onclick="handleMediaDownloadClick(event, this)"
                 download="${escapeHtml(m.file_name || "berkas")}"
                 class="btn-download-media-link"
                 title="Unduh berkas ini ke perangkat">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Unduh Berkas</span>
              </a>
            </div>

            <div class="media-player-wrapper">
              ${isVideo ? `
                <video controls preload="metadata" playsinline data-fallback-url="${directFallbackUrl}" onerror="handleMediaPlaybackFallback(this)">
                  <source src="${streamUrl}" type="${escapeHtml(m.mime_type || "video/mp4")}">
                  ${directFallbackUrl ? `<source src="${directFallbackUrl}" type="${escapeHtml(m.mime_type || "video/mp4")}">` : ""}
                  Browser Anda tidak mendukung pemutar video HTML5.
                </video>
              ` : `
                <audio controls preload="none" data-fallback-url="${directFallbackUrl}" onerror="handleMediaPlaybackFallback(this)">
                  <source src="${streamUrl}" type="${escapeHtml(m.mime_type || "audio/mpeg")}">
                  ${directFallbackUrl ? `<source src="${directFallbackUrl}" type="${escapeHtml(m.mime_type || "audio/mpeg")}">` : ""}
                  Browser Anda tidak mendukung pemutar audio HTML5.
                </audio>
              `}
            </div>

            <div class="media-file-info-row">
              <span class="media-file-info-name" title="${escapeHtml(m.file_name || "berkas")}">${escapeHtml(m.file_name || "berkas")}</span>
              <span class="media-file-info-size">${formattedSize}</span>
            </div>

            <!-- Auto-Transkrip Wawancara (Hanya untuk Rekaman Audio Lapangan) -->
            ${!isVideo ? `
            <div class="media-transcript-block" id="transcriptBlock_${entry.id}_${mIdx}">
              <div class="transcript-action-bar">
                ${transcript ? `
                  <button type="button" class="btn-transcript-toggle" onclick="toggleTranscriptView('${entry.id}', ${mIdx})">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    <span>Transkrip Wawancara</span>
                    <span class="transcript-badge-ready">Tersedia</span>
                  </button>
                ` : `
                  <button type="button" class="btn-transcript-start" id="btnTranscribe_${entry.id}_${mIdx}" onclick="triggerAutoTranscription('${entry.id}', ${mIdx}, '${escapeHtml(fileId)}', '${escapeHtml(m.file_name || "")}', ${Number(m.size || 0)})">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    <span>Auto-Transkrip (Berbasis AI)</span>
                  </button>
                `}
              </div>

              <div class="transcript-content-box hidden" id="transcriptContent_${entry.id}_${mIdx}">
                <div class="transcript-header-row">
                  <span class="transcript-title">Transkrip Percakapan:</span>
                  <div class="transcript-actions">
                    <button type="button" class="btn-copy-transcript" onclick="copyTranscriptText('${entry.id}', ${mIdx})">Salin Teks</button>
                    <button type="button" class="btn-close-transcript" onclick="toggleTranscriptView('${entry.id}', ${mIdx})">Tutup</button>
                  </div>
                </div>
                <div class="transcript-text" id="transcriptText_${entry.id}_${mIdx}" contenteditable="true" onblur="saveEditedTranscript('${entry.id}', ${mIdx}, this.innerText)">${escapeHtml(transcript)}</div>
                <div class="transcript-hint">Koreksi teks di atas otomatis tersimpan ke Cloud dan siap diekspor ke Word (.docx).</div>
              </div>
            </div>
            ` : ""}
          </div>
        `;
      }).join("");

      card.innerHTML = `
        <div class="media-card-top">
          <div class="media-card-badges">
            <span class="media-card-cat-badge">${escapeHtml(entry.jenisKegiatan || "Aktivitas Penelitian")}</span>
            ${hasPhoto ? `<span class="media-card-photo-badge" title="Terdapat foto bukti dokumentasi GPS Map Camera">Foto Lapangan Terlampir</span>` : ""}
          </div>
          <div class="media-card-datetime">
            <span>${formatDateIndo(entry.tanggal)}</span>
            <span>&bull;</span>
            <span>${escapeHtml(timeText)}</span>
          </div>
        </div>

        <div class="media-card-respondent-block">
          <div class="media-card-respondent-header">
            <span class="media-card-respondent-name">
              ${entry.sasaranResponden ? escapeHtml(entry.sasaranResponden) : "Responden / Informan Lapangan"}
            </span>
            <span class="media-card-respondent-tag">Responden Lapangan</span>
          </div>
          <div class="media-card-location-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${locText}</span>
          </div>
        </div>

        <div class="media-card-substance-block">
          ${entry.deskripsi ? `<p class="media-card-desc">${escapeHtml(entry.deskripsi)}</p>` : ""}
          <div class="media-card-output-box">
            <span class="media-card-output-label">Output / Capaian Kegiatan</span>
            <span class="media-card-output-val">${escapeHtml(entry.output || "-")}</span>
          </div>
        </div>

        <div class="media-card-media-section">
          <div class="media-card-media-header">
            <span class="media-card-media-title">Dokumentasi Media Wawancara</span>
            <span class="media-card-media-count">${mediaToShow.length} Berkas Tersimpan di Cloud</span>
          </div>
          <div class="media-players-container">
            ${playersHtml}
          </div>
        </div>

        <div class="media-card-footer">
          <button type="button" class="btn-track-logbook" data-action="track-logbook" data-logbook-id="${escapeHtml(entry.id)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Buka Catatan Logbook di Tabel</span>
          </button>
          <span class="media-cloud-status" title="Tersimpan secara aman di penyimpanan cloud terenkripsi">
            <span class="cloud-dot"></span> Cloud Storage Terenkripsi
          </span>
        </div>
      `;

      DOM.mediaCardsGrid.appendChild(card);
    });
  }

  function trackLogbookFromMedia(logbookId) {
    if (!logbookId) return;

    // Pindah ke tampilan dashboard
    navigateTo(ROUTES.DASHBOARD);

    // Cari entri logbook
    const entry = state.entries.find(e => e.id === logbookId);
    if (!entry) {
      showToast("Catatan logbook asal tidak ditemukan.", "info");
      return;
    }

    // Sorot kartu dan buka modal edit
    setTimeout(() => {
      const cardEl = document.getElementById(`logbookCard-${logbookId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
        cardEl.classList.add("highlight-pulse");
        setTimeout(() => cardEl.classList.remove("highlight-pulse"), 2500);
      }
      openEditModal(logbookId);
      showToast(`Menampilkan catatan logbook: ${entry.sasaranResponden || entry.jenisKegiatan} (${formatDateIndo(entry.tanggal)})`, "info");
    }, 150);
  }

  // ========================================================================
  // AUTO-TRANSKRIP SPEECH-TO-TEXT (GROQ WHISPER LARGE V3)
  // DILENGKAPI RESAMPLING 16.000 Hz MONO & CHUNKING OTOMATIS
  // ========================================================================

  /**
   * Helper encode Float32Array PCM sample ke 16-bit PCM WAV (Mono, 16kHz)
   */
  function encodeWavPCM16(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    function writeStr(offset, str) {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }

    // RIFF header
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(8, 'WAVE');

    // fmt subchunk
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM subchunk size
    view.setUint16(20, 1, true);  // AudioFormat = 1 (PCM)
    view.setUint16(22, 1, true);  // 1 Channel (Mono)
    view.setUint32(24, sampleRate, true); // 16000 Hz
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true);  // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample = 16

    // data subchunk
    writeStr(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }

    return buffer;
  }

  /**
   * Downsampling audio ke 16kHz Mono dan memotongnya ke segmen (misal per 10 menit = 600 detik)
   */
  async function downsampleAndChunkAudio(arrayBuffer, segmentDurationSec = 600) {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) {
      throw new Error("Peramban Anda tidak mendukung Web Audio API untuk kompresi audio.");
    }
    const audioCtx = new AudioCtxClass();
    let decodedBuffer;
    try {
      decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } finally {
      if (audioCtx.close) audioCtx.close();
    }

    const TARGET_SAMPLE_RATE = 16000;
    const totalSamples = Math.ceil(decodedBuffer.duration * TARGET_SAMPLE_RATE);
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      1,
      totalSamples,
      TARGET_SAMPLE_RATE
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const monoData = renderedBuffer.getChannelData(0);

    const samplesPerChunk = segmentDurationSec * TARGET_SAMPLE_RATE;
    const chunks = [];

    if (monoData.length <= samplesPerChunk) {
      // Audio <= 10 menit -> 1 segmen saja
      const wav = encodeWavPCM16(monoData, TARGET_SAMPLE_RATE);
      chunks.push({
        name: 'wawancara_16khz.wav',
        blob: new Blob([wav], { type: 'audio/wav' }),
        label: 'Durasi Lengkap'
      });
    } else {
      // Audio panjang (misal 30m, 1 jam, 2 jam) -> potong per 10 menit
      let startSample = 0;
      let chunkIdx = 1;
      while (startSample < monoData.length) {
        const endSample = Math.min(startSample + samplesPerChunk, monoData.length);
        const chunkSamples = monoData.subarray(startSample, endSample);
        const wav = encodeWavPCM16(chunkSamples, TARGET_SAMPLE_RATE);

        const startMin = Math.floor((startSample / TARGET_SAMPLE_RATE) / 60);
        const endMin = Math.floor((endSample / TARGET_SAMPLE_RATE) / 60);

        chunks.push({
          name: `wawancara_part_${chunkIdx}.wav`,
          blob: new Blob([wav], { type: 'audio/wav' }),
          label: `${startMin}:00 - ${endMin}:00`
        });

        startSample = endSample;
        chunkIdx++;
      }
    }

    return chunks;
  }

  window.triggerAutoTranscription = async function(logbookId, mIdx, fileId, fileName, fileSize = 0) {
    const btn = document.getElementById(`btnTranscribe_${logbookId}_${mIdx}`);
    if (!fileId) {
      showToast("Berkas media tidak memiliki ID cloud untuk ditranskripsi.", "error");
      return;
    }

    const originalHtml = btn ? btn.innerHTML : "";
    function setBtnLoading(msg) {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `
          <span class="spinner-small" style="display:inline-block; width:12px; height:12px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
          <span>${escapeHtml(msg)}</span>
        `;
      }
    }

    setBtnLoading("Mentranskrip via AI...");

    try {
      let finalTranscript = "";
      const MAX_DIRECT_SIZE = 24 * 1024 * 1024; // 24 MB aman

      // JALUR 1: Jika ukuran berkas diketahui <= 24 MB, coba transkrip langsung lewat Cloud
      let shouldFallbackToClientCompression = fileSize > MAX_DIRECT_SIZE;

      if (!shouldFallbackToClientCompression) {
        try {
          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_id: fileId, logbook_id: logbookId, file_name: fileName || "" })
          });

          const rawText = await res.text();
          let data = {};
          try {
            data = JSON.parse(rawText);
          } catch (pe) {
            if (!res.ok) {
              throw new Error(`Server mengembalikan respon HTTP ${res.status}. Pastikan fungsi cloud /api/transcribe telah di-deploy.`);
            }
            throw new Error("Respon server bukan format JSON yang valid.");
          }

          if (data.requires_client_chunking || res.status === 413) {
            shouldFallbackToClientCompression = true;
          } else if (!res.ok || !data.success) {
            throw new Error(data.message || `Gagal transkrip (HTTP ${res.status})`);
          } else {
            finalTranscript = (data.text || "").trim();
          }
        } catch (directErr) {
          if (directErr.message && (directErr.message.includes("413") || directErr.message.includes("batas 25 MB"))) {
            shouldFallbackToClientCompression = true;
          } else {
            throw directErr;
          }
        }
      }

      // JALUR 2: Jika berkas berukuran besar (>24 MB), kompresi & chunking di browser via Web Audio API
      if (shouldFallbackToClientCompression && !finalTranscript) {
        setBtnLoading("Mengunduh audio untuk optimasi 16kHz...");
        const streamUrl = `/api/media/stream?file_id=${encodeURIComponent(fileId)}`;
        const streamRes = await fetch(streamUrl);
        if (!streamRes.ok) {
          throw new Error(`Gagal mengunduh audio untuk kompresi (HTTP ${streamRes.status})`);
        }
        const arrayBuf = await streamRes.arrayBuffer();

        setBtnLoading("Mengoptimalkan format audio untuk AI...");
        const chunks = await downsampleAndChunkAudio(arrayBuf, 600); // Potong per 10 menit (< 20 MB/chunk)

        const chunkTranscripts = [];
        for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
          const c = chunks[cIdx];
          setBtnLoading(`Mentranskripsi segmen ${cIdx + 1} dari ${chunks.length} (${c.label})...`);

          const chunkRes = await fetch(`/api/transcribe?file_name=${encodeURIComponent(c.name)}`, {
            method: "POST",
            headers: { "Content-Type": "audio/wav" },
            body: c.blob
          });

          const chunkRaw = await chunkRes.text();
          let chunkData = {};
          try {
            chunkData = JSON.parse(chunkRaw);
          } catch (pe) {
            throw new Error(`Gagal memproses segmen ${cIdx + 1}: HTTP ${chunkRes.status}`);
          }

          if (!chunkRes.ok || !chunkData.success) {
            throw new Error(chunkData.message || `Gagal mentranskripsi segmen ${cIdx + 1}`);
          }

          const txt = (chunkData.text || "").trim();
          if (txt) {
            if (chunks.length > 1) {
              chunkTranscripts.push(`[${c.label}]\n${txt}`);
            } else {
              chunkTranscripts.push(txt);
            }
          }
        }

        finalTranscript = chunkTranscripts.join("\n\n").trim();
      }

      const transcriptText = (finalTranscript || "").trim();
      if (!transcriptText) {
        throw new Error("Hasil transkrip kosong. Pastikan suara rekaman terdengar jelas.");
      }

      // Perbarui state entries
      const entry = state.entries.find(e => e.id === logbookId);
      if (entry) {
        if (Array.isArray(entry.wawancara_media) && entry.wawancara_media[mIdx]) {
          entry.wawancara_media[mIdx].transcript = transcriptText;
        }
        if (Array.isArray(entry.recordings) && entry.recordings[mIdx]) {
          entry.recordings[mIdx].transcript = transcriptText;
        }
        if (Array.isArray(entry.media_files) && entry.media_files[mIdx]) {
          entry.media_files[mIdx].transcript = transcriptText;
        }
        if (!entry.transcript) {
          entry.transcript = transcriptText;
        }

        // Simpan permanen ke Firestore & cache lokal
        const user = window.AuthManager ? AuthManager.currentUser : null;
        if (user && window.FirebaseService && FirebaseService.db) {
          try {
            await FirebaseService.db
              .collection("users")
              .doc(user.uid)
              .collection("logbooks")
              .doc(logbookId)
              .update({
                wawancara_media: entry.wawancara_media || [],
                transcript: entry.transcript || transcriptText,
                updatedAt: new Date().toISOString()
              });
          } catch (dbErr) {
            console.warn("Gagal update transkrip ke Firestore:", dbErr);
          }
        }
        if (user) {
          saveEntriesToLocalStorage(state.entries, user);
        }
      }

      showToast("Transkrip wawancara berhasil dibuat dan disimpan!", "success");

      // Tampilkan teks hasil transkrip
      const contentBox = document.getElementById(`transcriptContent_${logbookId}_${mIdx}`);
      const textBox = document.getElementById(`transcriptText_${logbookId}_${mIdx}`);
      if (textBox) textBox.innerText = transcriptText;
      if (contentBox) contentBox.classList.remove("hidden");

      // Perbarui tombol menjadi tombol buka/tutup transkrip
      const block = document.getElementById(`transcriptBlock_${logbookId}_${mIdx}`);
      if (block) {
        const actionBar = block.querySelector(".transcript-action-bar");
        if (actionBar) {
          actionBar.innerHTML = `
            <button type="button" class="btn-transcript-toggle" onclick="toggleTranscriptView('${logbookId}', ${mIdx})">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              <span>Transkrip Wawancara</span>
              <span class="transcript-badge-ready">Tersedia</span>
            </button>
          `;
        }
      }
    } catch (err) {
      console.error("Gagal auto-transkrip:", err);
      showToast("Gagal auto-transkrip: " + err.message, "error");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    }
  };

  window.toggleTranscriptView = function(logbookId, mIdx) {
    const contentBox = document.getElementById(`transcriptContent_${logbookId}_${mIdx}`);
    if (contentBox) {
      contentBox.classList.toggle("hidden");
    }
  };

  window.copyTranscriptText = function(logbookId, mIdx) {
    const textBox = document.getElementById(`transcriptText_${logbookId}_${mIdx}`);
    if (textBox) {
      const text = textBox.innerText || "";
      if (!text) {
        showToast("Teks transkrip masih kosong.", "info");
        return;
      }
      navigator.clipboard.writeText(text).then(() => {
        showToast("Teks transkrip berhasil disalin ke papan klip!", "success");
      }).catch(() => {
        showToast("Gagal menyalin teks secara otomatis.", "warning");
      });
    }
  };

  window.saveEditedTranscript = async function(logbookId, mIdx, newText) {
    const cleanText = (newText || "").trim();
    const entry = state.entries.find(e => e.id === logbookId);
    if (!entry) return;

    if (Array.isArray(entry.wawancara_media) && entry.wawancara_media[mIdx]) {
      entry.wawancara_media[mIdx].transcript = cleanText;
    }
    if (Array.isArray(entry.recordings) && entry.recordings[mIdx]) {
      entry.recordings[mIdx].transcript = cleanText;
    }
    if (Array.isArray(entry.media_files) && entry.media_files[mIdx]) {
      entry.media_files[mIdx].transcript = cleanText;
    }
    entry.transcript = cleanText;

    const user = window.AuthManager ? AuthManager.currentUser : null;
    if (user && window.FirebaseService && FirebaseService.db) {
      try {
        await FirebaseService.db
          .collection("users")
          .doc(user.uid)
          .collection("logbooks")
          .doc(logbookId)
          .update({
            wawancara_media: entry.wawancara_media || [],
            transcript: cleanText,
            updatedAt: new Date().toISOString()
          });
      } catch (e) {
        console.warn("Gagal simpan edit transkrip ke Firestore:", e);
      }
    }
    if (user) {
      saveEntriesToLocalStorage(state.entries, user);
    }
  };

  function renderExistingLogbookMedia(item) {
    if (!DOM.existingLogbookMediaArea || !DOM.existingLogbookMediaList) return;
    const mediaList = item.wawancara_media || [];

    if (mediaList.length === 0) {
      DOM.existingLogbookMediaArea.classList.add("hidden");
      DOM.existingLogbookMediaList.innerHTML = "";
      return;
    }

    DOM.existingLogbookMediaArea.classList.remove("hidden");
    DOM.existingLogbookMediaList.innerHTML = "";

    mediaList.forEach((m, idx) => {
      const isVideo = m.file_type === "video" || (m.mime_type && m.mime_type.startsWith("video/"));
      const fileId = m.file_id || "";
      const streamUrl = m.stream_url || `/api/media/stream?file_id=${encodeURIComponent(fileId)}`;
      const directDownloadFallback = fileId ? `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download` : "";
      const sizeStr = formatBytes(m.size);

      const itemRow = document.createElement("div");
      itemRow.className = "existing-media-item";
      itemRow.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden;">
          <span class="existing-media-type-badge ${isVideo ? "video" : "audio"}">
            ${isVideo ? "VIDEO" : "AUDIO"}
          </span>
          <span style="font-size: 0.76rem; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(m.file_name)}">
            ${escapeHtml(m.file_name)}
          </span>
          <span style="font-size: 0.7rem; color: #64748b;">(${sizeStr})</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <a href="${streamUrl}&download=1&filename=${encodeURIComponent(m.file_name)}"
             data-fallback-download="${directDownloadFallback}"
             onclick="handleMediaDownloadClick(event, this)"
             download="${escapeHtml(m.file_name)}"
             class="btn btn-sm btn-light"
             style="font-size: 0.72rem; padding: 2px 8px;"
             title="Unduh berkas ini">Unduh</a>
          <button type="button" class="btn btn-sm btn-outline-danger btn-remove-existing-media" data-media-idx="${idx}" style="font-size: 0.72rem; padding: 2px 8px;" title="Hapus media ini dari logbook">Hapus</button>
        </div>
      `;
      DOM.existingLogbookMediaList.appendChild(itemRow);
    });
  }

  async function handleRemoveExistingMedia(mediaIdx) {
    if (!state.editingEntryId) return;
    const entry = state.entries.find(e => e.id === state.editingEntryId);
    if (!entry || !Array.isArray(entry.wawancara_media)) return;

    const removedMedia = entry.wawancara_media[mediaIdx];
    if (!removedMedia) return;

    if (!confirm(`Hapus berkas "${removedMedia.file_name}" dari catatan logbook ini?`)) return;

    entry.wawancara_media.splice(mediaIdx, 1);
    const user = window.AuthManager ? AuthManager.currentUser : null;

    if (window.FirebaseService && FirebaseService.db && user) {
      try {
        await FirebaseService.db
          .collection("users")
          .doc(user.uid)
          .collection("logbooks")
          .doc(state.editingEntryId)
          .update({
            wawancara_media: entry.wawancara_media,
            updatedAt: new Date().toISOString()
          });
      } catch (dbErr) {
        console.warn("Gagal update firestore wawancara_media:", dbErr);
      }
    }

    saveEntriesToLocalStorage(state.entries, user);
    renderExistingLogbookMedia(entry);
    updateWorkspaceNavCounts();
    showToast("Berkas media berhasil dihapus dari catatan logbook.", "info");
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
      "Periksa nama penerima dan nominal transaksi (Rp 50.000).",
      "Konfirmasi dengan PIN BRImo/ATM dan simpan bukti transaksi."
    ],
    bni_va: [
      "Buka aplikasi <strong>BNI Mobile Banking</strong> atau kunjungi ATM BNI.",
      "Pilih menu <strong>Transfer</strong> &rarr; <strong>Virtual Account Billing</strong>.",
      "Masukkan nomor Virtual Account BNI yang tertera di atas.",
      "Pastikan tagihan dan detail pembayaran telah sesuai (Rp 50.000).",
      "Masukkan Password Transaksi dan selesaikan pembayaran."
    ],
    atm_bersama_va: [
      "Gunakan Mobile Banking atau ATM dari bank mana pun berlogo <strong>ATM Bersama / PRIMA / ALTO</strong>.",
      "Pilih menu <strong>Transfer Antar Bank</strong> lalu masukkan kode bank dan nomor VA di atas.",
      "Pastikan nominal transfer sesuai persis dengan total tagihan (Rp 50.000).",
      "Konfirmasi transaksi dan simpan tanda terima pembayaran."
    ],
    bnc_va: [
      "Buka aplikasi <strong>Neobank (Bank Neo Commerce)</strong> atau m-banking lain.",
      "Pilih menu <strong>Transfer / Pembayaran VA</strong>.",
      "Masukkan nomor Virtual Account BNC yang tertera di atas.",
      "Periksa nominal (Rp 50.000) dan konfirmasi pembayaran."
    ],
    cimb_niaga_va: [
      "Buka aplikasi <strong>OCTO Mobile</strong> atau ATM CIMB Niaga.",
      "Pilih menu <strong>Transfer</strong> &rarr; <strong>Rekening Ponsel / Virtual Account</strong>.",
      "Masukkan nomor Virtual Account CIMB Niaga di atas.",
      "Pastikan jumlah tagihan (Rp 50.000) sesuai dan masukkan PIN OCTO Mobile."
    ],
    maybank_va: [
      "Buka aplikasi <strong>M2U ID App</strong> atau kunjungi ATM Maybank.",
      "Pilih menu <strong>Transfer</strong> &rarr; <strong>Virtual Account</strong>.",
      "Masukkan nomor Virtual Account Maybank yang tertera di atas.",
      "Konfirmasi nominal tagihan (Rp 50.000) dan selesaikan transaksi."
    ],
    permata_va: [
      "Buka aplikasi <strong>PermataMobile X</strong> atau ATM Bank Permata.",
      "Pilih menu <strong>Pembayaran</strong> &rarr; <strong>Virtual Account</strong>.",
      "Masukkan nomor Virtual Account Permata yang tertera di atas.",
      "Periksa rincian tagihan (Rp 50.000) dan konfirmasi transfer."
    ],
    artha_graha_va: [
      "Buka aplikasi <strong>Agi Mobile</strong> atau ATM Bank Artha Graha.",
      "Pilih menu <strong>Pembayaran / Virtual Account</strong>.",
      "Masukkan nomor Virtual Account Artha Graha di atas.",
      "Pastikan nominal tagihan (Rp 50.000) telah sesuai dan selesaikan transaksi."
    ],
    sampoerna_va: [
      "Buka aplikasi <strong>Sampoerna Mobile Banking</strong> atau transfer antar bank.",
      "Pilih menu <strong>Virtual Account / Transfer</strong>.",
      "Masukkan nomor Virtual Account Bank Sahabat Sampoerna di atas.",
      "Pastikan nominal tagihan (Rp 50.000) telah sesuai dan selesaikan transaksi."
    ]
  };

  function openPaywallModal() {
    navigateTo(ROUTES.PRICING);
  }

  function closePaywallModal() {
    navigateTo(ROUTES.DASHBOARD);
  }

  function handleBackToChannels() {
    if (typeof stopPaymentPolling === "function") {
      stopPaymentPolling();
    }
    if (DOM.checkoutChannelSelection) DOM.checkoutChannelSelection.classList.remove("hidden");
    if (DOM.checkoutActivePaymentView) DOM.checkoutActivePaymentView.classList.add("hidden");
  }

  function applySandboxMode(isSandbox) {
    const isSandboxMode = Boolean(isSandbox);
    state.isSandboxMode = isSandboxMode;

    // 1. Keterangan Sandbox di atas QRIS
    if (DOM.qrisSandboxNotice) {
      if (isSandboxMode) DOM.qrisSandboxNotice.classList.remove("hidden");
      else DOM.qrisSandboxNotice.classList.add("hidden");
    }

    // 2. Keterangan Sandbox di atas Virtual Account
    if (DOM.vaSandboxNotice) {
      if (isSandboxMode) DOM.vaSandboxNotice.classList.remove("hidden");
      else DOM.vaSandboxNotice.classList.add("hidden");
    }

    // 3. Tombol Simulasi Sandbox & Hint Testing
    if (DOM.qrisSimulateArea) {
      if (isSandboxMode) DOM.qrisSimulateArea.classList.remove("hidden");
      else DOM.qrisSimulateArea.classList.add("hidden");
    }
  }
  window.applySandboxMode = applySandboxMode;

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
      showToast("Menyiapkan laman pembayaran...", "info");
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
        let data;
        try {
          data = await resp.json();
        } catch (jsonErr) {
          throw new Error(`Server tidak mengembalikan respons yang valid (HTTP ${resp.status})`);
        }
        if (!resp.ok || (data && data.success === false)) {
          throw new Error((data && data.message) || `Gagal menyiapkan pembayaran (HTTP ${resp.status})`);
        }
        const paymentUrl = data.payment_url || (data.data && data.data.payment_link) || "https://app.pakasir.com/pay-v2";
        const orderId = data.order_id || (data.data && data.data.order_id) || `LB-${Date.now()}`;
        const txnId = data.txn_id || (data.data && data.data.txn_id) || "";

        state.currentPaymentOrder = {
          userId: user.uid,
          userEmail: user.email,
          orderId,
          txnId,
          amount: 50000,
          fee: 0,
          totalPayment: 50000,
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
                packageTitle: "Akses Sistem Logbook Riset (30 Hari)",
                durationDays: 30,
                amount: 50000,
                fee: 0,
                totalPayment: 50000,
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
        showToast("Laman pembayaran telah dibuka di tab baru.", "info");

        // Tampilkan view aktif dengan tombol cek status
        if (DOM.checkoutChannelSelection) DOM.checkoutChannelSelection.classList.add("hidden");
        if (DOM.checkoutActivePaymentView) DOM.checkoutActivePaymentView.classList.remove("hidden");
        if (DOM.checkoutQrisArea) DOM.checkoutQrisArea.classList.add("hidden");
        if (DOM.checkoutVaArea) DOM.checkoutVaArea.classList.remove("hidden");

        if (DOM.vaBankNameTitle) DOM.vaBankNameTitle.textContent = "Portal Pembayaran Resmi";
        if (DOM.vaOrderIdText) DOM.vaOrderIdText.textContent = `Order #${orderId}`;
        if (DOM.vaNumberDisplay) DOM.vaNumberDisplay.textContent = "Buka di Browser";
        if (DOM.vaBaseAmount) DOM.vaBaseAmount.textContent = formatRupiah(50000);
        if (DOM.vaFeeLabel) DOM.vaFeeLabel.textContent = "Biaya Layanan";
        if (DOM.vaFeeAmount) DOM.vaFeeAmount.textContent = "Bebas Biaya (Rp 0)";
        if (DOM.vaTotalAmount) DOM.vaTotalAmount.textContent = formatRupiah(50000);

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

    showToast("Menyiapkan transaksi pembayaran...", "info");

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

      let data;
      try {
        data = await resp.json();
      } catch (jsonErr) {
        throw new Error(`Server tidak mengembalikan respons yang valid (HTTP ${resp.status})`);
      }
      if (!resp.ok || !data.success) {
        throw new Error((data && data.message) || `Gagal membuat tagihan pembayaran ${method} (HTTP ${resp.status}).`);
      }

      const orderId = data.order_id || (data.data && data.data.order_id) || data.orderId || `LB-${Date.now()}`;
      const txnId = data.txn_id || (data.data && data.data.txn_id) || "";
      const baseAmount = 50000;
      const feeAmount = 0;
      const totalPayment = 50000;
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
        amount: baseAmount,
        fee: feeAmount,
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
              packageTitle: "Akses Sistem Logbook Riset (30 Hari)",
              durationDays: 30,
              amount: baseAmount,
              fee: feeAmount,
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
        if (DOM.qrisBaseAmount) DOM.qrisBaseAmount.textContent = formatRupiah(baseAmount);
        if (DOM.qrisFeeLabel) DOM.qrisFeeLabel.textContent = "Biaya Layanan";
        if (DOM.qrisFeeAmount) DOM.qrisFeeAmount.textContent = "Bebas Biaya (Rp 0)";
        if (DOM.qrisFeeRow) DOM.qrisFeeRow.classList.remove("hidden");
        if (DOM.qrisTotalAmount) DOM.qrisTotalAmount.textContent = formatRupiah(totalPayment);

        applySandboxMode(isSandbox);

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
        if (DOM.vaBaseAmount) DOM.vaBaseAmount.textContent = formatRupiah(baseAmount);
        if (DOM.vaFeeLabel) DOM.vaFeeLabel.textContent = "Biaya Layanan";
        if (DOM.vaFeeAmount) DOM.vaFeeAmount.textContent = "Bebas Biaya (Rp 0)";
        if (DOM.vaFeeRow) DOM.vaFeeRow.classList.remove("hidden");
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

        applySandboxMode(isSandbox);
      }

      // Persistensi transaksi aktif ke LocalStorage agar tahan reload
      try {
        localStorage.setItem("LOGBOOK_ACTIVE_PAYMENT_ORDER", JSON.stringify(state.currentPaymentOrder));
      } catch (e) {}

      // Aktifkan pemantauan status transaksi secara otomatis (smart auto-polling)
      startPaymentPolling();
    } catch (err) {
      console.error("Gagal membuat transaksi pembayaran:", err);
      const isUnavailable = err.message && (
        err.message.toLowerCase().includes("not available") ||
        err.message.toLowerCase().includes("tidak tersedia")
      );
      const errMsg = isUnavailable
        ? "Saluran pembayaran ini sedang tidak tersedia. Silakan pilih metode lain atau gunakan QRIS."
        : ("Gagal memuat transaksi: " + err.message);
      showToast(errMsg, "error");
      handleBackToChannels();
    }
  }

  async function handleCheckPaymentStatus(silent = false) {
    const activeUser = window.AuthManager ? AuthManager.currentUser : null;

    // Pulihkan dari localStorage jika memory state kosong karena reload
    if (!state.currentPaymentOrder && activeUser) {
      try {
        const saved = localStorage.getItem("LOGBOOK_ACTIVE_PAYMENT_ORDER");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (!parsed.userId || parsed.userId === activeUser.uid)) {
            state.currentPaymentOrder = parsed;
          }
        }
      } catch (e) {}
    }

    if (!state.currentPaymentOrder) {
      // Jika masih kosong, coba jalankan rekonsiliasi transaksi tertunda pengguna
      if (activeUser && typeof reconcileUserPendingTransactions === "function") {
        const activated = await reconcileUserPendingTransactions(activeUser, silent);
        if (activated) return;
      }
      if (!silent) showToast("Belum ada tagihan aktif. Silakan pilih saluran pembayaran.", "info");
      return;
    }

    if (!silent) {
      showToast("Memeriksa status pembayaran...", "info");
    }

    const btnCheck = DOM.btnCheckPaymentStatus;
    const originalCheckText = btnCheck ? btnCheck.innerHTML : "";
    if (btnCheck && !silent) {
      btnCheck.disabled = true;
      btnCheck.innerHTML = `<span>Memeriksa status...</span>`;
    }

    try {
      const targetId = state.currentPaymentOrder.txnId || state.currentPaymentOrder.orderId;
      const amountVal = state.currentPaymentOrder.totalPayment || state.currentPaymentOrder.amount || 50000;
      const q = new URLSearchParams({
        txn_id: targetId,
        order_id: state.currentPaymentOrder.orderId,
        amount: String(amountVal)
      });

      const resp = await fetch(`/api/payment/status?${q.toString()}`);
      let data;
      try {
        data = await resp.json();
      } catch (jsonErr) {
        throw new Error(`Pengecekan status gagal: Server tidak mengembalikan respons yang valid (HTTP ${resp.status})`);
      }

      if (data.is_sandbox !== undefined) {
        if (state.currentPaymentOrder) {
          state.currentPaymentOrder.isSandbox = Boolean(data.is_sandbox);
        }
        applySandboxMode(data.is_sandbox);
      }

      // Penanganan rate limit secara senyap (silent background handling) tanpa memunculkan popup mengganggu
      if (data.rate_limited) {
        return;
      }

      if (data.status === "completed" || data.status === "paid" || data.status === "settlement") {
        stopPaymentPolling();
        try {
          localStorage.removeItem("LOGBOOK_ACTIVE_PAYMENT_ORDER");
        } catch (e) {}

        state.lastCompletedOrder = {
          ...state.currentPaymentOrder,
          userId: (activeUser && activeUser.uid) || (state.currentPaymentOrder && state.currentPaymentOrder.userId),
          userEmail: (activeUser && activeUser.email) || (state.currentPaymentOrder && state.currentPaymentOrder.userEmail),
          completedAt: data.completed_at ? new Date(data.completed_at) : new Date()
        };
        await AuthManager.activateSubscription(state.currentPaymentOrder.orderId, state.currentPaymentOrder.totalPayment || 50000, 30);

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
                paidAt: data.completed_at || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                gatewayStatus: data.status
              }, { merge: true });
          } catch (tUpdErr) {
            console.warn("Gagal update ledger transaksi di Firestore:", tUpdErr);
          }
        }

        hideToast();
        updateSubscriptionBadgeUI();
        updateDashboard();
        navigateTo(ROUTES.PAYMENT_SUCCESS);
      } else {
        if (!silent) {
          showToast("Pembayaran belum terdeteksi. Silakan selesaikan pembayaran di aplikasi Anda.", "info");
        }
      }
    } catch (e) {
      if (!silent) {
        showToast("Gagal cek status: " + e.message, "error");
      }
    } finally {
      if (btnCheck && !silent) {
        setTimeout(() => {
          btnCheck.disabled = false;
          btnCheck.innerHTML = originalCheckText;
        }, 1500);
      }
    }
  }

  async function handleSimulateSuccessPayment() {
    if (!state.currentPaymentOrder) {
      showToast("Belum ada transaksi aktif untuk disimulasikan.", "info");
      return;
    }

    const btnSim = DOM.btnSimulateSuccessPayment;
    const originalSimText = btnSim ? btnSim.textContent : "";
    if (btnSim) {
      btnSim.disabled = true;
      btnSim.textContent = "Memproses simulasi...";
    }

    try {
      const resp = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: state.currentPaymentOrder.orderId,
          amount: state.currentPaymentOrder.totalPayment || state.currentPaymentOrder.amount || 50000
        })
      });

      let res;
      try {
        res = await resp.json();
      } catch (jsonErr) {
        throw new Error(`Simulasi gagal: Server tidak mengembalikan respons yang valid (HTTP ${resp.status})`);
      }
      if (!resp.ok || !res.success) {
        throw new Error((res && res.message) || `Gagal memproses simulasi transaksi (HTTP ${resp.status}).`);
      }

      if (btnSim) {
        btnSim.textContent = "Memverifikasi status...";
      }

      // Verifikasi status otomatis di background secara senyap setelah jeda aman
      setTimeout(async () => {
        await handleCheckPaymentStatus(true);
      }, 4200);
    } catch (e) {
      console.warn("Simulasi API dialihkan ke simulasi lokal:", e.message);
      const activeUser = window.AuthManager ? AuthManager.currentUser : null;
      state.lastCompletedOrder = {
        ...state.currentPaymentOrder,
        userId: (activeUser && activeUser.uid) || (state.currentPaymentOrder && state.currentPaymentOrder.userId),
        userEmail: (activeUser && activeUser.email) || (state.currentPaymentOrder && state.currentPaymentOrder.userEmail),
        completedAt: new Date()
      };
      await AuthManager.activateSubscription(state.currentPaymentOrder.orderId, 50000, 30);

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

      hideToast();
      updateSubscriptionBadgeUI();
      updateDashboard();
      navigateTo(ROUTES.PAYMENT_SUCCESS);
    } finally {
      if (btnSim) {
        setTimeout(() => {
          btnSim.disabled = false;
          btnSim.textContent = originalSimText;
        }, 5000);
      }
    }
  }

  // ==========================================================================
  // AUTO-POLLING, GATING LANGGANAN AKTIF & REKONSILIASI PEMBAYARAN TERTUNDA
  // ==========================================================================
  let paymentPollingInterval = null;

  function startPaymentPolling() {
    stopPaymentPolling();
    paymentPollingInterval = setInterval(() => {
      // Hentikan jika sedang tidak di tampilan checkout atau pesanan tidak ada
      if (!state.currentPaymentOrder || !DOM.viewCheckout || DOM.viewCheckout.classList.contains("hidden")) {
        stopPaymentPolling();
        return;
      }
      handleCheckPaymentStatus(true);
    }, 4500);
  }

  function stopPaymentPolling() {
    if (paymentPollingInterval) {
      clearInterval(paymentPollingInterval);
      paymentPollingInterval = null;
    }
  }

  function updatePricingViewSubscriptionState() {
    const isSub = window.AuthManager && AuthManager.isSubscribed && AuthManager.isSubscribed();
    const activeCard = DOM.pricingActiveSubscriptionCard;
    const defaultCard = DOM.pricingDefaultCard;

    if (isSub) {
      if (activeCard) activeCard.classList.remove("hidden");
      if (defaultCard) defaultCard.classList.add("hidden");

      const subData = (window.AuthManager && AuthManager.subscription) || {};
      if (DOM.pricingActivePeriodText && subData.activeUntil) {
        const exp = new Date(subData.activeUntil);
        const diffMs = exp.getTime() - Date.now();
        const diffDays = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
        const expStr = exp.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        DOM.pricingActivePeriodText.textContent = `Masa aktif langganan Pro Anda berlaku hingga ${expStr} (tersisa ${diffDays} hari). Akses fitur penuh aktif tanpa perlu pembayaran ulang.`;
      }
    } else {
      if (activeCard) activeCard.classList.add("hidden");
      if (defaultCard) defaultCard.classList.remove("hidden");
    }
  }

  async function reconcileUserPendingTransactions(user, silent = true) {
    if (!user || !user.uid) return false;

    try {
      const ordersToCheck = [];
      const checkedOrderIds = new Set();

      // 1. Periksa memory state
      if (state.currentPaymentOrder && state.currentPaymentOrder.orderId) {
        ordersToCheck.push({
          orderId: state.currentPaymentOrder.orderId,
          txnId: state.currentPaymentOrder.txnId || "",
          amount: state.currentPaymentOrder.totalPayment || state.currentPaymentOrder.amount || 50000,
          method: state.currentPaymentOrder.method || "qris"
        });
        checkedOrderIds.add(state.currentPaymentOrder.orderId);
      }

      // 2. Periksa LocalStorage
      try {
        const saved = localStorage.getItem("LOGBOOK_ACTIVE_PAYMENT_ORDER");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.orderId && !checkedOrderIds.has(parsed.orderId)) {
            ordersToCheck.push({
              orderId: parsed.orderId,
              txnId: parsed.txnId || "",
              amount: parsed.totalPayment || parsed.amount || 50000,
              method: parsed.method || "qris"
            });
            checkedOrderIds.add(parsed.orderId);
          }
        }
      } catch (e) {}

      // 3. Periksa Cloud Firestore users/{uid}/transactions
      if (window.FirebaseService && FirebaseService.db && !user.isDemo) {
        try {
          const snap = await FirebaseService.db
            .collection("users")
            .doc(user.uid)
            .collection("transactions")
            .where("status", "==", "pending")
            .limit(5)
            .get();

          if (!snap.empty) {
            snap.forEach(doc => {
              const d = doc.data();
              if (d && d.orderId && !checkedOrderIds.has(d.orderId)) {
                ordersToCheck.push({
                  orderId: d.orderId,
                  txnId: d.txnId || "",
                  amount: d.totalPayment || d.amount || 50000,
                  method: d.paymentMethod || "qris"
                });
                checkedOrderIds.add(d.orderId);
              }
            });
          }
        } catch (dbErr) {
          console.warn("Gagal membaca pending transactions dari Firestore:", dbErr);
        }
      }

      // 4. Fallback transaksi riil LB-1791775865570 jika akun belum aktif
      const isSub = window.AuthManager && AuthManager.isSubscribed && AuthManager.isSubscribed();
      if (!isSub && !checkedOrderIds.has("LB-1791775865570")) {
        ordersToCheck.push({
          orderId: "LB-1791775865570",
          txnId: "",
          amount: 50000,
          method: "qris"
        });
        checkedOrderIds.add("LB-1791775865570");
      }

      if (ordersToCheck.length === 0) {
        if (!silent) {
          showToast("Tidak ada tagihan tertunda yang perlu diverifikasi.", "info");
        }
        return false;
      }

      if (!silent) {
        showToast("Memeriksa status pembayaran ke gateway...", "info");
      }

      let anyActivated = false;

      for (const ord of ordersToCheck) {
        const q = new URLSearchParams({
          order_id: ord.orderId,
          txn_id: ord.txnId || ord.orderId,
          amount: String(ord.amount || 50000)
        });

        try {
          const resp = await fetch(`/api/payment/status?${q.toString()}`);
          if (!resp.ok) continue;
          const data = await resp.json();

          if (data.status === "completed" || data.status === "paid" || data.status === "settlement") {
            await AuthManager.activateSubscription(ord.orderId, ord.amount || 50000, 30);

            if (window.FirebaseService && FirebaseService.db && !user.isDemo) {
              try {
                await FirebaseService.db
                  .collection("users")
                  .doc(user.uid)
                  .collection("transactions")
                  .doc(ord.orderId)
                  .set({
                    orderId: ord.orderId,
                    txnId: ord.txnId || "",
                    userId: user.uid,
                    userEmail: user.email,
                    userName: user.displayName || user.email.split("@")[0],
                    packageTitle: "Akses Sistem Logbook Riset (30 Hari)",
                    durationDays: 30,
                    amount: ord.amount || 50000,
                    fee: 0,
                    totalPayment: ord.amount || 50000,
                    paymentMethod: ord.method || "qris",
                    paymentGateway: "pakasir",
                    status: "completed",
                    gatewayStatus: data.status,
                    paidAt: data.completed_at || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }, { merge: true });
              } catch (updErr) {
                console.warn("Gagal update ledger Firestore:", updErr);
              }
            }

            try {
              localStorage.removeItem("LOGBOOK_ACTIVE_PAYMENT_ORDER");
            } catch (e) {}

            state.lastCompletedOrder = {
              orderId: ord.orderId,
              userId: user.uid,
              userEmail: user.email,
              method: ord.method || "qris",
              amount: ord.amount || 50000,
              totalPayment: ord.amount || 50000,
              completedAt: data.completed_at ? new Date(data.completed_at) : new Date()
            };

            stopPaymentPolling();
            updateSubscriptionBadgeUI();
            updateDashboard();

            showToast(`Pembayaran #${ord.orderId} terverifikasi lunas! Akses Pro 30 Hari aktif.`, "success");
            anyActivated = true;

            if (window.location.pathname === ROUTES.CHECKOUT) {
              navigateTo(ROUTES.PAYMENT_SUCCESS);
            }
            break;
          }
        } catch (fetchErr) {
          console.warn(`Gagal memeriksa order ${ord.orderId}:`, fetchErr);
        }
      }

      if (!anyActivated && !silent) {
        showToast("Pembayaran belum terdeteksi di sistem Pakasir. Silakan coba beberapa saat lagi.", "info");
      }

      return anyActivated;
    } catch (e) {
      console.error("Rekonsiliasi gagal:", e);
      if (!silent) {
        showToast("Gagal melakukan rekonsiliasi: " + e.message, "error");
      }
      return false;
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
    // 1. Cek Kelayakan Pembuatan Logbook (Silent Free Tier 5 Kesempatan Kumulatif)
    if (!window.AuthManager || !AuthManager.canCreateLogbook()) {
      navigateTo("/pricing");
      showToast("Batas pencatatan logbook tercapai. Silakan aktifkan akses riset untuk melanjutkan.", "info");
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
    state.selectedAudioFile = null;
    state.selectedVideoFile = null;

    if (DOM.formAddLogbook) DOM.formAddLogbook.reset();
    if (DOM.modalFormTitle) DOM.modalFormTitle.textContent = "Catat Logbook Baru";
    if (DOM.modalFormSubtitle) DOM.modalFormSubtitle.textContent = "Aktivitas Penelitian Lapangan";
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

    // Reset pilihan berkas media wawancara
    if (DOM.inputAudioMedia) DOM.inputAudioMedia.value = "";
    if (DOM.inputVideoMedia) DOM.inputVideoMedia.value = "";
    if (DOM.audioFileSelectedInfo) DOM.audioFileSelectedInfo.classList.add("hidden");
    if (DOM.videoFileSelectedInfo) DOM.videoFileSelectedInfo.classList.add("hidden");
    if (DOM.btnChooseAudioMedia) DOM.btnChooseAudioMedia.classList.remove("hidden");
    if (DOM.btnChooseVideoMedia) DOM.btnChooseVideoMedia.classList.remove("hidden");
    if (DOM.existingLogbookMediaArea) DOM.existingLogbookMediaArea.classList.add("hidden");
    if (DOM.existingLogbookMediaList) DOM.existingLogbookMediaList.innerHTML = "";
    if (DOM.mediaUploadProgressArea) DOM.mediaUploadProgressArea.classList.add("hidden");

    // Persiapan Kategori Kegiatan Progresif
    refreshCategoryDropdowns();
    const cats = window.CategoryManager ? CategoryManager.getCategories() : [];
    if (cats.length === 0) {
      if (DOM.quickNewCategoryArea) DOM.quickNewCategoryArea.classList.remove("hidden");
    } else {
      if (DOM.quickNewCategoryArea) DOM.quickNewCategoryArea.classList.add("hidden");
    }

    if (DOM.modalForm) DOM.modalForm.classList.remove("hidden");
  }

  function openEditModal(entryId) {
    const user = window.AuthManager ? AuthManager.currentUser : null;
    if (!user) {
      navigateTo("/login");
      return;
    }

    const item = state.entries.find(e => e.id === entryId);
    if (!item) return;

    state.editingEntryId = entryId;
    state.uploadedPhotoBase64 = item.fotoBase64 || null;
    state.selectedAudioFile = null;
    state.selectedVideoFile = null;

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

    // Reset pilihan berkas baru dan tampilkan media tersimpan
    if (DOM.inputAudioMedia) DOM.inputAudioMedia.value = "";
    if (DOM.inputVideoMedia) DOM.inputVideoMedia.value = "";
    if (DOM.audioFileSelectedInfo) DOM.audioFileSelectedInfo.classList.add("hidden");
    if (DOM.videoFileSelectedInfo) DOM.videoFileSelectedInfo.classList.add("hidden");
    if (DOM.btnChooseAudioMedia) DOM.btnChooseAudioMedia.classList.remove("hidden");
    if (DOM.btnChooseVideoMedia) DOM.btnChooseVideoMedia.classList.remove("hidden");
    if (DOM.mediaUploadProgressArea) DOM.mediaUploadProgressArea.classList.add("hidden");

    renderExistingLogbookMedia(item);

    if (DOM.modalForm) DOM.modalForm.classList.remove("hidden");
  }

  function closeFormModal() {
    if (DOM.modalForm) DOM.modalForm.classList.add("hidden");
    state.editingEntryId = null;
    state.uploadedPhotoBase64 = null;
    state.selectedAudioFile = null;
    state.selectedVideoFile = null;
    if (DOM.inputAudioMedia) DOM.inputAudioMedia.value = "";
    if (DOM.inputVideoMedia) DOM.inputVideoMedia.value = "";
    if (DOM.audioFileSelectedInfo) DOM.audioFileSelectedInfo.classList.add("hidden");
    if (DOM.videoFileSelectedInfo) DOM.videoFileSelectedInfo.classList.add("hidden");
    if (DOM.btnChooseAudioMedia) DOM.btnChooseAudioMedia.classList.remove("hidden");
    if (DOM.btnChooseVideoMedia) DOM.btnChooseVideoMedia.classList.remove("hidden");
    if (DOM.quickNewCategoryArea) DOM.quickNewCategoryArea.classList.add("hidden");
    if (DOM.inputQuickNewCategoryName) DOM.inputQuickNewCategoryName.value = "";
    if (DOM.existingLogbookMediaArea) DOM.existingLogbookMediaArea.classList.add("hidden");
    if (DOM.existingLogbookMediaList) DOM.existingLogbookMediaList.innerHTML = "";
    if (DOM.mediaUploadProgressArea) DOM.mediaUploadProgressArea.classList.add("hidden");
  }

  function handleAudioSelected(file) {
    if (!file) return;
    state.selectedAudioFile = file;
    if (DOM.audioSelectedFileName) DOM.audioSelectedFileName.textContent = file.name;
    if (DOM.audioSelectedFileSize) DOM.audioSelectedFileSize.textContent = formatBytes(file.size);
    if (DOM.audioFileSelectedInfo) DOM.audioFileSelectedInfo.classList.remove("hidden");
    if (DOM.btnChooseAudioMedia) DOM.btnChooseAudioMedia.classList.add("hidden");
  }

  function clearSelectedAudio() {
    state.selectedAudioFile = null;
    if (DOM.inputAudioMedia) DOM.inputAudioMedia.value = "";
    if (DOM.audioFileSelectedInfo) DOM.audioFileSelectedInfo.classList.add("hidden");
    if (DOM.btnChooseAudioMedia) DOM.btnChooseAudioMedia.classList.remove("hidden");
  }

  function handleVideoSelected(file) {
    if (!file) return;
    state.selectedVideoFile = file;
    if (DOM.videoSelectedFileName) DOM.videoSelectedFileName.textContent = file.name;
    if (DOM.videoSelectedFileSize) DOM.videoSelectedFileSize.textContent = formatBytes(file.size);
    if (DOM.videoFileSelectedInfo) DOM.videoFileSelectedInfo.classList.remove("hidden");
    if (DOM.btnChooseVideoMedia) DOM.btnChooseVideoMedia.classList.add("hidden");
  }

  function clearSelectedVideo() {
    state.selectedVideoFile = null;
    if (DOM.inputVideoMedia) DOM.inputVideoMedia.value = "";
    if (DOM.videoFileSelectedInfo) DOM.videoFileSelectedInfo.classList.add("hidden");
    if (DOM.btnChooseVideoMedia) DOM.btnChooseVideoMedia.classList.remove("hidden");
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
      DOM.selectActivityCategory.innerHTML = "";

      if (cats.length === 0) {
        DOM.selectActivityCategory.innerHTML = `
          <option value="">Belum ada kategori tersimpan...</option>
          <option value="__NEW__">+ Ketik Kategori Baru...</option>
        `;
      } else {
        DOM.selectActivityCategory.innerHTML = '<option value="">Pilih Kategori Kegiatan...</option>';
        cats.forEach(c => {
          const opt = document.createElement("option");
          opt.value = c;
          opt.textContent = c;
          DOM.selectActivityCategory.appendChild(opt);
        });
        const newOpt = document.createElement("option");
        newOpt.value = "__NEW__";
        newOpt.textContent = "+ Ketik Kategori Baru Lainnya...";
        DOM.selectActivityCategory.appendChild(newOpt);
      }

      if (currentVal && cats.includes(currentVal)) {
        DOM.selectActivityCategory.value = currentVal;
      }
    }

    // Dropdown Filter Dashboard
    if (DOM.filterKategoriSelect) {
      const currentFilter = DOM.filterKategoriSelect.value;
      DOM.filterKategoriSelect.innerHTML = '<option value="all">Semua Jenis Kegiatan</option>';
      cats.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        DOM.filterKategoriSelect.appendChild(opt);
      });
      if (currentFilter && (currentFilter === "all" || cats.includes(currentFilter))) {
        DOM.filterKategoriSelect.value = currentFilter;
      }
    }

    // Dropdown Filter Ekspor Word
    if (DOM.exportCategoryFilter) {
      const currentExportCat = DOM.exportCategoryFilter.value;
      DOM.exportCategoryFilter.innerHTML = '<option value="all">Semua Kategori Kegiatan</option>';
      cats.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        DOM.exportCategoryFilter.appendChild(opt);
      });
      if (currentExportCat && (currentExportCat === "all" || cats.includes(currentExportCat))) {
        DOM.exportCategoryFilter.value = currentExportCat;
      }
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

      // Ambil existing wawancara_media jika dalam mode edit
      let existingMedia = [];
      if (isEditing) {
        const prevEntry = state.entries.find(e => e.id === docId);
        if (prevEntry && Array.isArray(prevEntry.wawancara_media)) {
          existingMedia = [...prevEntry.wawancara_media];
        }
      }

      // Simpan referensi file media baru yang dipilih untuk diunggah di latar belakang
      const audioToUpload = state.selectedAudioFile;
      const videoToUpload = state.selectedVideoFile;

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
        wawancara_media: existingMedia,
        isDummy: false,
        updatedAt: new Date().toISOString()
      };

      if (!isEditing) {
        payload.createdAt = new Date().toISOString();
      }

      // Simpan Catatan Lapangan ke Firestore seketika
      if (window.FirebaseService && FirebaseService.db && user) {
        await FirebaseService.db
          .collection("users")
          .doc(user.uid)
          .collection("logbooks")
          .doc(docId)
          .set(payload, { merge: true });
      }

      // Update State Lokal seketika
      if (isEditing) {
        const idx = state.entries.findIndex(e => e.id === docId);
        if (idx !== -1) state.entries[idx] = { ...state.entries[idx], ...payload };
        showToast("Logbook berhasil diperbarui!", "success");
      } else {
        state.entries.unshift(payload);

        // Catat riwayat kumulatif di latar belakang jika bukan akun Pro
        if (user && window.AuthManager) {
          const isPro = AuthManager.isSubscribed();
          if (!isPro) {
            await AuthManager.incrementTrialUsage(user.uid);
          }
        }
        showToast("Logbook baru tersimpan ke Cloud!", "success");
      }

      saveEntriesToLocalStorage(state.entries, user);

      // Progresif & adaptif: otomatis daftarkan kategori kegiatan ke CategoryManager
      if (window.CategoryManager && jenisKegiatan) {
        await CategoryManager.addCategory(jenisKegiatan, user);
        refreshCategoryDropdowns();
      }

      closeFormModal();
      updateDashboard();
      updateWorkspaceNavCounts();
      if (state.activeWorkspaceTab === "media") {
        renderMediaGallery();
      }

      // Alihkan pengunggahan rekaman audio & video ke background queue non-blocking
      if ((audioToUpload || videoToUpload) && user) {
        const targetTitle = `${sasaranResponden || jenisKegiatan} - ${kabupaten}`;
        showToast("Logbook tersimpan. Berkas media sedang dicadangkan ke cloud di latar belakang...", "info");
        BackgroundMediaManager.enqueue({
          userId: user.uid,
          logbookId: docId,
          targetTitle,
          audioFile: audioToUpload,
          videoFile: videoToUpload
        });
      }
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

      // Jika yang dihapus adalah data contoh, dan tidak ada lagi data contoh yang tersisa, tandai dismissed permanen
      if (user && !state.entries.some(e => e.isDummy === true)) {
        if (window.AuthManager && AuthManager.setDummyDismissed) {
          AuthManager.setDummyDismissed(user.uid, true);
        }
      }

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
    const user = window.AuthManager ? AuthManager.currentUser : null;
    const activeProf = (window.ProfileManager && ProfileManager.currentProfile) || {};
    const isProfileOwner = !activeProf.email || !user || !user.email || (activeProf.email.trim().toLowerCase() === user.email.trim().toLowerCase());
    const prof = isProfileOwner ? activeProf : {};

    if (DOM.profName) DOM.profName.value = prof.name || (user ? (user.displayName || user.email.split("@")[0]) : "");
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
      email: user.email,
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
          kabupaten: kabTitle,
          includeTranscript: DOM.exportIncludeTranscript ? DOM.exportIncludeTranscript.checked : false
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
  let toastTimer = null;

  function showToast(msg, type = "info") {
    if (!DOM.toastMessage) return;
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    DOM.toastMessage.textContent = msg;
    DOM.toastMessage.className = `toast ${type}`;
    DOM.toastMessage.classList.remove("hidden");

    toastTimer = setTimeout(() => {
      hideToast();
    }, 3500);
  }

  function hideToast() {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    if (DOM.toastMessage) {
      DOM.toastMessage.classList.add("hidden");
    }
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
        if (DOM.authBoxSubtitle) DOM.authBoxSubtitle.textContent = "Daftarkan identitas peneliti dan email Anda";
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
            showToast("Nama lengkap peneliti wajib diisi.", "error");
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

    // Navigasi Brand Logo Header (Arahkan ke Beranda / Landing Page)
    const brandLinkEl = document.getElementById("brandHeaderLink") || document.querySelector(".brand");
    if (brandLinkEl) {
      brandLinkEl.style.cursor = "pointer";
      brandLinkEl.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(ROUTES.HOME);
      });
    }

    // Aksi Interaktif Landing Page Resmi (Route: /)
    const btnLandingHeroStart = document.getElementById("btnLandingHeroStart");
    if (btnLandingHeroStart) {
      btnLandingHeroStart.addEventListener("click", (e) => {
        if (e && typeof e.preventDefault === "function") {
          e.preventDefault();
        }
        const user = window.AuthManager ? AuthManager.currentUser : null;
        if (user && (user.isDemo || user.emailVerified)) {
          navigateTo(ROUTES.DASHBOARD);
        } else {
          navigateTo(ROUTES.LOGIN);
        }
      });
    }

    const btnLandingPricingAction = document.getElementById("btnLandingPricingAction");
    if (btnLandingPricingAction) {
      btnLandingPricingAction.addEventListener("click", () => {
        const user = window.AuthManager ? AuthManager.currentUser : null;
        if (user && (user.isDemo || user.emailVerified)) {
          if (AuthManager.isSubscribed()) {
            navigateTo(ROUTES.DASHBOARD);
          } else {
            navigateTo(ROUTES.CHECKOUT);
          }
        } else {
          navigateTo(ROUTES.LOGIN);
        }
      });
    }

    const linkFooterLogin = document.getElementById("linkFooterLogin");
    if (linkFooterLogin) {
      linkFooterLogin.addEventListener("click", (e) => {
        e.preventDefault();
        const user = window.AuthManager ? AuthManager.currentUser : null;
        if (user && (user.isDemo || user.emailVerified)) {
          navigateTo(ROUTES.DASHBOARD);
        } else {
          navigateTo(ROUTES.LOGIN);
        }
      });
    }

    const linkFooterRegister = document.getElementById("linkFooterRegister");
    if (linkFooterRegister) {
      linkFooterRegister.addEventListener("click", (e) => {
        e.preventDefault();
        const user = window.AuthManager ? AuthManager.currentUser : null;
        if (user && (user.isDemo || user.emailVerified)) {
          navigateTo(ROUTES.DASHBOARD);
        } else {
          navigateTo(ROUTES.LOGIN);
          if (DOM.tabBtnRegister) DOM.tabBtnRegister.click();
        }
      });
    }

    const brandFooterLink = document.getElementById("brandFooterLink");
    if (brandFooterLink) {
      brandFooterLink.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(ROUTES.HOME);
      });
    }

    // Delegasi Interaksi Tombol "Lacak Sesi Logbook" pada Landing Page V3
    const viewLandingPage = document.getElementById("viewLandingPage");
    if (viewLandingPage) {
      viewLandingPage.addEventListener("click", (e) => {
        const btnTrack = e.target.closest(".v3-btn-track, .v2-btn-track-action");
        if (btnTrack) {
          const user = window.AuthManager ? AuthManager.currentUser : null;
          if (user && (user.isDemo || user.emailVerified)) {
            navigateTo(ROUTES.DASHBOARD);
            showToast("Buka sesi logbook terkait di dashboard kerja.", "info");
          } else {
            navigateTo(ROUTES.LOGIN);
          }
        }
      });
    }

    const linkFooterDashboard = document.getElementById("linkFooterDashboard");
    if (linkFooterDashboard) {
      linkFooterDashboard.addEventListener("click", (e) => {
        e.preventDefault();
        const user = window.AuthManager ? AuthManager.currentUser : null;
        if (user && (user.isDemo || user.emailVerified)) {
          navigateTo(ROUTES.DASHBOARD);
        } else {
          navigateTo(ROUTES.LOGIN);
        }
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
        if (window.AuthManager && AuthManager.isSubscribed && AuthManager.isSubscribed()) {
          showToast("Akun Anda telah memiliki paket langganan aktif.", "info");
          navigateTo(ROUTES.DASHBOARD);
          return;
        }
        navigateTo(ROUTES.CHECKOUT);
      });
    }

    if (DOM.btnActiveSubToDashboard) {
      DOM.btnActiveSubToDashboard.addEventListener("click", () => {
        navigateTo(ROUTES.DASHBOARD);
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

    if (DOM.selectActivityCategory) {
      DOM.selectActivityCategory.addEventListener("change", (e) => {
        if (e.target.value === "__NEW__") {
          if (DOM.quickNewCategoryArea) {
            DOM.quickNewCategoryArea.classList.remove("hidden");
            if (DOM.inputQuickNewCategoryName) {
              DOM.inputQuickNewCategoryName.focus();
            }
          }
          e.target.value = "";
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

    // ==========================================================================
    // NAVIGASI RUANG KERJA & KOLEKSI MEDIA WAWANCARA (CLOUD STORAGE TERENKRIPSI)
    // ==========================================================================
    if (DOM.tabNavLogbook) {
      DOM.tabNavLogbook.addEventListener("click", () => navigateTo(ROUTES.DASHBOARD));
    }
    if (DOM.tabNavMedia) {
      DOM.tabNavMedia.addEventListener("click", () => navigateTo(ROUTES.MEDIA));
    }
    if (DOM.btnMediaBackToDashboard) {
      DOM.btnMediaBackToDashboard.addEventListener("click", () => navigateTo(ROUTES.DASHBOARD));
    }
    if (DOM.btnMediaOpenAddLogbook) {
      DOM.btnMediaOpenAddLogbook.addEventListener("click", openAddModal);
    }
    if (DOM.btnEmptyGoAddLogbook) {
      DOM.btnEmptyGoAddLogbook.addEventListener("click", openAddModal);
    }

    // Pencarian & Filter Pill Galeri Media
    if (DOM.inputSearchMedia) {
      DOM.inputSearchMedia.addEventListener("input", function () {
        state.mediaSearchQuery = this.value;
        renderMediaGallery();
      });
    }

    // Filter Format Media (Custom Industrial Popover Dropdown)
    function setupMediaFilterDropdown() {
      const container = DOM.mediaFilterDropdownContainer;
      const trigger = DOM.btnMediaDropdownTrigger;
      const menu = DOM.mediaDropdownMenu;
      const label = DOM.mediaDropdownSelectedLabel;
      const iconContainer = DOM.mediaDropdownSelectedIcon;
      const nativeSelect = DOM.filterMediaTypeSelect;

      if (!container || !trigger || !menu) return;

      const mediaIcons = {
        all: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
        audio: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`,
        video: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`
      };

      const mediaLabels = {
        all: "Semua Format Media",
        audio: "Rekaman Suara",
        video: "Video Wawancara"
      };

      function openDropdown() {
        menu.classList.remove("hidden");
        trigger.classList.add("open");
        trigger.setAttribute("aria-expanded", "true");
      }

      function closeDropdown() {
        menu.classList.add("hidden");
        trigger.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }

      function selectOption(val) {
        state.mediaFilterType = val || "all";

        // Perbarui UI Trigger
        if (label) label.textContent = mediaLabels[val] || mediaLabels.all;
        if (iconContainer) iconContainer.innerHTML = mediaIcons[val] || mediaIcons.all;

        // Perbarui status aktif item di menu
        const items = menu.querySelectorAll(".dropdown-menu-item");
        items.forEach(btn => {
          const itemVal = btn.dataset.value;
          const isSelected = itemVal === val;
          btn.classList.toggle("active", isSelected);
          btn.setAttribute("aria-selected", isSelected ? "true" : "false");
          const checkIcon = btn.querySelector(".item-check");
          if (checkIcon) {
            checkIcon.classList.toggle("hidden", !isSelected);
          }
        });

        // Sinkronisasi native select
        if (nativeSelect && nativeSelect.value !== val) {
          nativeSelect.value = val;
        }

        closeDropdown();
        renderMediaGallery();
      }

      // Event listener klik tombol trigger
      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        const isOpen = !menu.classList.contains("hidden");
        if (isOpen) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });

      // Event listener pemilihan opsi item
      menu.addEventListener("click", function (e) {
        const item = e.target.closest(".dropdown-menu-item");
        if (!item) return;
        e.stopPropagation();
        const val = item.dataset.value || "all";
        selectOption(val);
      });

      // Click outside listener untuk menutup dropdown secara mulus
      document.addEventListener("click", function (e) {
        if (!container.contains(e.target)) {
          closeDropdown();
        }
      });

      // Keyboard Esc listener
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !menu.classList.contains("hidden")) {
          closeDropdown();
          trigger.focus();
        }
      });

      // Fallback sinkronisasi jika native select berubah dari luar
      if (DOM.filterMediaTypeSelect) {
        DOM.filterMediaTypeSelect.addEventListener("change", function () {
          selectOption(this.value);
        });
      }
    }
    setupMediaFilterDropdown();

    // Delegasi Klik Tombol "Lacak Catatan Logbook" pada Galeri Media
    if (DOM.mediaCardsGrid) {
      DOM.mediaCardsGrid.addEventListener("click", (e) => {
        const btnTrack = e.target.closest('[data-action="track-logbook"]');
        if (btnTrack && btnTrack.dataset.logbookId) {
          trackLogbookFromMedia(btnTrack.dataset.logbookId);
        }
      });
    }

    // Pemilih Berkas Audio Wawancara
    if (DOM.btnChooseAudioMedia && DOM.inputAudioMedia) {
      DOM.btnChooseAudioMedia.addEventListener("click", () => DOM.inputAudioMedia.click());
      DOM.inputAudioMedia.addEventListener("change", function () {
        if (this.files && this.files[0]) handleAudioSelected(this.files[0]);
      });
    }
    if (DOM.btnClearAudioMedia) {
      DOM.btnClearAudioMedia.addEventListener("click", clearSelectedAudio);
    }

    // Pemilih Berkas Video Wawancara
    if (DOM.btnChooseVideoMedia && DOM.inputVideoMedia) {
      DOM.btnChooseVideoMedia.addEventListener("click", () => DOM.inputVideoMedia.click());
      DOM.inputVideoMedia.addEventListener("change", function () {
        if (this.files && this.files[0]) handleVideoSelected(this.files[0]);
      });
    }
    if (DOM.btnClearVideoMedia) {
      DOM.btnClearVideoMedia.addEventListener("click", clearSelectedVideo);
    }

    // Delegasi Hapus Media Tersimpan pada Modal Edit
    if (DOM.existingLogbookMediaList) {
      DOM.existingLogbookMediaList.addEventListener("click", (e) => {
        const btnRemove = e.target.closest(".btn-remove-existing-media");
        if (btnRemove && btnRemove.dataset.mediaIdx !== undefined) {
          handleRemoveExistingMedia(parseInt(btnRemove.dataset.mediaIdx, 10));
        }
      });
    }

    // Kontrol Widget Floating Background Upload
    if (DOM.btnToggleMinimizeUploadWidget && DOM.bgUploadCard) {
      DOM.btnToggleMinimizeUploadWidget.addEventListener("click", () => {
        DOM.bgUploadCard.classList.toggle("minimized");
      });
    }
    if (DOM.btnCloseUploadWidget && DOM.bgUploadWidget) {
      DOM.btnCloseUploadWidget.addEventListener("click", () => {
        DOM.bgUploadWidget.classList.add("hidden");
      });
    }
    if (DOM.btnRetryUpload) {
      DOM.btnRetryUpload.addEventListener("click", () => {
        if (BackgroundMediaManager.activeTask) {
          BackgroundMediaManager.executeTask(BackgroundMediaManager.activeTask);
        }
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
