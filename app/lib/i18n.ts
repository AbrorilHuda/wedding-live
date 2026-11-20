import type { Locale, PhotoIdeaKey } from "./types";

export interface Dictionary {
  coupleNames: string;
  monogram: string;
  eventDate: string;
  eventLocation: string;
  heroBadge: string;
  heroGreeting: string;
  heroCtaText: string;
  photosShared: (count: number) => string;
  addPhoto: string;
  stepsTitle: string;
  steps: { label: string; desc: string }[];
  ideasTitle: string;
  ideasSubtitle: string;
  ideas: Record<
    PhotoIdeaKey,
    { label: string; prompt: string }
  >;
  captureThisIdea: string;
  tipsTitle: string;
  tips: string[];
  galleryTitle: string;
  gallerySubtitle: string;
  newPhotosPill: (count: number) => string;
  emptyStateTitle: string;
  emptyStateDesc: string;
  loadMore: string;
  loadingMore: string;
  allLoaded: string;
  footerThanks: string;
  footerSignature: string;
  footerPrivacy: string;
  // Upload Sheet
  sheetTitleName: string;
  sheetSubtitleName: string;
  nameLabel: string;
  namePlaceholder: string;
  nameRequired: string;
  tableLabel: string;
  tableOptional: string;
  tableOptionalHint: string;
  tablePlaceholder: string;
  continueBtn: string;
  greetingBack: (name: string) => string;
  changeName: string;
  quotaLabel: (used: number, max: number) => string;
  quotaReachedTitle: string;
  quotaReachedDesc: (max: number) => string;
  openCamera: string;
  openCameraDesc: string;
  pickGallery: string;
  pickGalleryDesc: string;
  cameraFallbackNotice: string;
  cameraTipStrip: string;
  takePhoto: string;
  retakePhoto: string;
  usePhoto: string;
  switchCamera: string;
  uploadingTitle: string;
  statusQueued: string;
  statusCompressing: string;
  statusUploading: string;
  statusDone: string;
  statusOffline: string;
  statusError: string;
  offlineBanner: string;
  retryBtn: string;
  invalidFileError: string;
  fileTooLargeError: string;
  thankYouTitle: (name: string) => string;
  thankYouDesc: (count: number) => string;
  viewGalleryBtn: string;
  uploadMoreBtn: string;
  // Lightbox
  uploadedBy: string;
  tablePrefix: string;
  closeLightbox: string;
  prevPhoto: string;
  nextPhoto: string;
}

export const DICTIONARY: Record<Locale, Dictionary> = {
  id: {
    coupleNames: "Eeng & Intan",
    monogram: "E & I",
    eventDate: "Sabtu, 21 November 2026",
    eventLocation: "Glasshouse Garden, Jakarta",
    heroBadge: "Galeri Tamu Pernikahan",
    heroGreeting: "Terima kasih telah hadir merayakan hari bahagia kami.",
    heroCtaText: "Abadikan momen kami. Bagikan foto terbaikmu di sini.",
    photosShared: (count) => `${count} foto terkumpul`,
    addPhoto: "Tambah Foto",
    stepsTitle: "Cukup 3 langkah singkat",
    steps: [
      { label: "Scan", desc: "Tanpa aplikasi & login" },
      { label: "Foto", desc: "Kamera atau galeri HP" },
      { label: "Tampil", desc: "Langsung di galeri" },
    ],
    ideasTitle: "Ide Momen Foto",
    ideasSubtitle: "Bingung mau foto apa? Pilih salah satu inspirasi di bawah.",
    ideas: {
      candid: {
        label: "Candid",
        prompt: "Tangkap tawa lepas, pelukan hangat, atau obrolan santai tamu.",
      },
      decor: {
        label: "Detail dekorasi",
        prompt: "Bunga meja, cahaya lilin, cincin, atau sudut venue favoritmu.",
      },
      group: {
        label: "Foto bareng",
        prompt: "Selfie atau foto bersama teman satu meja dan keluarga.",
      },
      highlight: {
        label: "Momen utama",
        prompt: "Kirab pengantin, lempar buket, toast, hingga dansa pertama.",
      },
    },
    captureThisIdea: "Unggah momen ini",
    tipsTitle: "Tips singkat agar foto makin jernih",
    tips: [
      "Cari cahaya terang",
      "Bersihkan lensa",
      "Tahan sebentar sebelum jepret",
    ],
    galleryTitle: "Galeri Momen Tamu",
    gallerySubtitle: "Foto terbaru tampil paling atas",
    newPhotosPill: (count) => `${count} foto baru`,
    emptyStateTitle: "Jadilah yang pertama mengunggah foto 💛",
    emptyStateDesc:
      "Foto yang kamu bagikan akan langsung muncul di sini untuk dikenang bersama.",
    loadMore: "Muat foto lainnya",
    loadingMore: "Memuat foto...",
    allLoaded: "Semua momen telah ditampilkan",
    footerThanks:
      "Kehadiran dan setiap momen yang kamu abadikan sangat berarti bagi kami.",
    footerSignature: "Dengan hangat, Eeng & Intan",
    footerPrivacy:
      "Foto yang diunggah hanya tampil di galeri pribadi acara pernikahan ini.",
    sheetTitleName: "Siapa namamu?",
    sheetSubtitleName:
      "Tanpa login atau daftar akun. Namamu akan tampil manis di bawah foto.",
    nameLabel: "Nama kamu",
    namePlaceholder: "Contoh: Nadia Putri",
    nameRequired: "Mohon isi namamu terlebih dahulu ya.",
    tableLabel: "Nomor meja",
    tableOptional: "Opsional",
    tableOptionalHint: "Boleh dikosongkan jika tidak tahu atau bebas duduk",
    tablePlaceholder: "Kosongkan jika tidak perlu (mis. Meja 8)",
    continueBtn: "Lanjut Pilih Foto",
    greetingBack: (name) => `Hai, ${name}`,
    changeName: "Ubah nama",
    quotaLabel: (used, max) => `${used} dari ${max} foto terpakai`,
    quotaReachedTitle: "Terima kasih banyak! 💛",
    quotaReachedDesc: (max) =>
      `Kamu sudah membagikan ${max} foto terbaikmu untuk galeri hari ini.`,
    openCamera: "Buka Kamera",
    openCameraDesc: "Langsung buka kamera HP untuk jepret",
    pickGallery: "Pilih dari Galeri",
    pickGalleryDesc: "Bisa pilih beberapa foto sekaligus",
    cameraFallbackNotice:
      "Izin kamera ditolak atau tidak tersedia di browser ini. Kamu bisa langsung pilih foto dari galeri HP.",
    cameraTipStrip: "Cahaya terang · Lensa bersih · Tahan sebentar",
    takePhoto: "Ambil foto",
    retakePhoto: "Ulangi",
    usePhoto: "Gunakan Foto",
    switchCamera: "Ganti kamera",
    uploadingTitle: "Menyiapkan & mengunggah foto",
    statusQueued: "Dalam antrean...",
    statusCompressing: "Mengompres otomatis...",
    statusUploading: "Mengunggah...",
    statusDone: "Terkirim",
    statusOffline: "Menunggu sinyal...",
    statusError: "Gagal mengunggah",
    offlineBanner:
      "Sinyal sedang lemah atau terputus. Foto aman di antrean dan akan dicoba ulang otomatis.",
    retryBtn: "Coba Lagi",
    invalidFileError: "Hanya file gambar (JPG, PNG, HEIC, WebP) yang didukung.",
    fileTooLargeError: "Ukuran file terlalu besar (maksimal 25 MB per foto).",
    thankYouTitle: (name) => `Terima kasih, ${name}!`,
    thankYouDesc: (count) =>
      count > 1
        ? `${count} fotomu sudah tampil di galeri bersama.`
        : "Fotomu sudah tampil di galeri bersama.",
    viewGalleryBtn: "Lihat di Galeri",
    uploadMoreBtn: "Tambah Foto Lagi",
    uploadedBy: "Diunggah oleh",
    tablePrefix: "Meja",
    closeLightbox: "Tutup pratinjau",
    prevPhoto: "Foto sebelumnya",
    nextPhoto: "Foto berikutnya",
  },
  en: {
    coupleNames: "Eeng & Intan",
    monogram: "E & I",
    eventDate: "Saturday, November 21, 2026",
    eventLocation: "Glasshouse Garden, Jakarta",
    heroBadge: "Wedding Guest Gallery",
    heroGreeting: "Thank you for celebrating our special day with us.",
    heroCtaText: "Capture our moments. Share your favorite photos here.",
    photosShared: (count) => `${count} photos shared`,
    addPhoto: "Add Photo",
    stepsTitle: "3 effortless steps",
    steps: [
      { label: "Scan", desc: "No app or login" },
      { label: "Snap", desc: "Camera or gallery" },
      { label: "Share", desc: "Live in the gallery" },
    ],
    ideasTitle: "Photo Ideas",
    ideasSubtitle: "Need inspiration? Pick a moment to capture.",
    ideas: {
      candid: {
        label: "Candid",
        prompt: "Genuine laughter, warm hugs, or relaxed table conversations.",
      },
      decor: {
        label: "Decor details",
        prompt: "Table florals, candlelight, rings, or your favorite venue corner.",
      },
      group: {
        label: "Group shots",
        prompt: "Selfies or group photos with your tablemates and family.",
      },
      highlight: {
        label: "Key moments",
        prompt: "The entrance, bouquet toss, toasts, and first dance.",
      },
    },
    captureThisIdea: "Upload this moment",
    tipsTitle: "Quick tips for crisp photos",
    tips: [
      "Find bright light",
      "Wipe your lens",
      "Hold steady for a second",
    ],
    galleryTitle: "Guest Moments Gallery",
    gallerySubtitle: "Newest photos appear first",
    newPhotosPill: (count) => `${count} new photos`,
    emptyStateTitle: "Be the first to share a photo 💛",
    emptyStateDesc:
      "Your photo will appear right here for everyone to cherish.",
    loadMore: "Load more photos",
    loadingMore: "Loading photos...",
    allLoaded: "You've seen every moment so far",
    footerThanks:
      "Your presence and every memory you capture mean the world to us.",
    footerSignature: "With love, Eeng & Intan",
    footerPrivacy:
      "Uploaded photos are only displayed in this private wedding gallery.",
    sheetTitleName: "What's your name?",
    sheetSubtitleName:
      "No account needed. Your name will appear gently under your photos.",
    nameLabel: "Your name",
    namePlaceholder: "e.g. Nadia Putri",
    nameRequired: "Please enter your name first.",
    tableLabel: "Table number",
    tableOptional: "Optional",
    tableOptionalHint: "Feel free to leave blank if unsure or open seating",
    tablePlaceholder: "Leave blank if unsure (e.g. Table 8)",
    continueBtn: "Continue to Photos",
    greetingBack: (name) => `Hi, ${name}`,
    changeName: "Change name",
    quotaLabel: (used, max) => `${used} of ${max} photos used`,
    quotaReachedTitle: "Thank you so much! 💛",
    quotaReachedDesc: (max) =>
      `You've shared all ${max} of your favorite moments for today's gallery.`,
    openCamera: "Open Camera",
    openCameraDesc: "Opens your phone camera directly",
    pickGallery: "Choose from Gallery",
    pickGalleryDesc: "Select one or multiple photos",
    cameraFallbackNotice:
      "Camera permission denied or unavailable. No worries—choose photos directly from your gallery.",
    cameraTipStrip: "Bright light · Clean lens · Hold steady",
    takePhoto: "Take photo",
    retakePhoto: "Retake",
    usePhoto: "Use Photo",
    switchCamera: "Switch camera",
    uploadingTitle: "Optimizing & uploading",
    statusQueued: "Queued...",
    statusCompressing: "Optimizing...",
    statusUploading: "Uploading...",
    statusDone: "Shared",
    statusOffline: "Waiting for signal...",
    statusError: "Upload failed",
    offlineBanner:
      "Weak or lost connection. Your photos are safely queued and will retry automatically.",
    retryBtn: "Retry",
    invalidFileError: "Only image files (JPG, PNG, HEIC, WebP) are supported.",
    fileTooLargeError: "File is too large (max 25 MB per photo).",
    thankYouTitle: (name) => `Thank you, ${name}!`,
    thankYouDesc: (count) =>
      count > 1
        ? `${count} photos are now live in the shared gallery.`
        : "Your photo is now live in the shared gallery.",
    viewGalleryBtn: "View in Gallery",
    uploadMoreBtn: "Add More Photos",
    uploadedBy: "Shared by",
    tablePrefix: "Table",
    closeLightbox: "Close preview",
    prevPhoto: "Previous photo",
    nextPhoto: "Next photo",
  },
};
