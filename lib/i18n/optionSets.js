const optionSets = {
  /* =====================================================
   * ENGLISH (SOURCE / MASTER)
   * ===================================================== */
  en: {
    /* =========================
     * GLOBAL / MENU
     * ========================= */
    WELCOME_TITLE: "👋 Welcome to *Quickets*",
    WELCOME_DESC:
      "Book Bus, Train & Flight tickets effortlessly.\n\n🚌 🚆 ✈️\nTrusted • Fast • Hassle-free\n\nLet’s get you moving.",

    LANG_PROMPT: "Please select your language:",
    LANG_EN_LABEL: "English",
    LANG_TA_LABEL: "தமிழ்",
    LANG_HI_LABEL: "हिन्दी",

    MENU: "Menu",
    MAIN: "Main Menu",

    CHOOSE_SERVICE: "🎟 Choose a service",
    SELECT: "Select",
    SERVICES: "Services",

    MENU_TRACK: "🔍 Track Booking",
    MENU_HELP: "Help & Support",

    SUPPORT_INFO:
      "*Quickets Support*\n\n" +
      "📩 Chat: This WhatsApp\n" +
      "📧 Email: quicketsofficial@gmail.com\n" +
      "📞 Phone: +91 9894381195\n" +
      "⏰ Hours: 6am – 11pm IST",

    HELP_TEXT:
      "🆘 *Quickets Help*\n\n" +
      "• Type *MENU* to start a new booking\n" +
      "• Type *RETRY* to repeat the last step\n" +
      "• Follow the on-screen instructions carefully\n\n" +
      "📞 Support: +91 9894381195",

    OOPS_TAP_OPTIONS: "Please tap one of the available options.",
    NOTHING_TO_RETRY: "Nothing to retry.\nType *MENU* to start.",

    /* =========================
     * BUS
     * ========================= */
    ASK_FROM:
      "🚌 *Boarding location*\n\nType the *city or town name*.\nExample: Chennai",
    ASK_TO:
      "🎯 *Destination*\n\nType the *destination city*.\nExample: Coimbatore",

    PICK_TIME_PREF: "⏰ *Preferred travel time*\n\nSelect a time slot below.",

    TIME_MORNING: "Morning (2AM – 10AM)",
    TIME_AFTERNOON: "Afternoon (10AM – 4PM)",
    TIME_EVENING: "Evening (4PM – 7PM)",
    TIME_NIGHT: "Night (7PM – 2AM)",

    HOW_MANY_PAX:
      "👥 *Number of passengers*\n\nSelect how many are travelling.",

    SEAT_TYPE_PROMPT:
      "💺 *Seat preference*\n\nChoose your preferred seat type.",

    SEAT_AC_SLEEPER: "AC Sleeper",
    SEAT_AC_SEATER: "AC Seater",
    SEAT_NONAC_SLEEPER: "Non-AC Sleeper",
    SEAT_NONAC_SEATER: "Non-AC Seater",

    BUDGET_PROMPT:
      "💰 *Budget per ticket*\n\nSelect a comfortable range.",

    BUDGET_300U: "Under ₹300",
    BUDGET_500: "Under ₹500",
    BUDGET_700: "Under ₹700",
    BUDGET_1000: "Under ₹1000",
    BUDGET_1500: "Under ₹1500",
    BUDGET_2000PLUS: "Above ₹2000",

    /* =========================
     * TRAIN
     * ========================= */
    TRAIN_ASK_FROM:
      "🚆 *From Station*\n\nType the *boarding station name*.\nExample: Chennai Central",
    TRAIN_ASK_TO:
      "🎯 *To Station*\n\nType the *destination station name*.\nExample: Bangalore",
    TRAIN_ASK_DATE:
      "📅 *Journey Date*\n\nType date in *DD-MM-YYYY*\nExample: 25-01-2026",

    TRAIN_PICK_CLASS: "🚆 *Select Travel Class*",
    TRAIN_CLASS_SL: "Sleeper (SL)",
    TRAIN_CLASS_3A: "AC 3 Tier (3A)",
    TRAIN_CLASS_2A: "AC 2 Tier (2A)",
    TRAIN_CLASS_1A: "First AC (1A)",
    TRAIN_CLASS_CC: "Chair Car (CC)",
    TRAIN_CLASS_2S: "Second Sitting (2S)",

    TRAIN_PICK_QUOTA: "🎟 *Select Booking Quota*",
    TRAIN_QUOTA_GN: "General",
    TRAIN_QUOTA_TATKAL: "Tatkal",
    TRAIN_QUOTA_LADIES: "Ladies",
    TRAIN_QUOTA_SENIOR: "Senior Citizen",

    TRAIN_REVIEW: "🧾 *Review your train booking details*",

    /* =========================
     * FLIGHT
     * ========================= */
    FLIGHT_COMING_SOON:
      "✈️ *Flight bookings are coming soon on Quickets!*",

    /* =========================
     * PASSENGER
     * ========================= */
    PASSENGER_DETAILS_MODE:
      "🧾 *Passenger details*\n\nHow would you like to enter details?",

    PAX_BULK: "Paste all at once",
    PAX_ONEBYONE: "Enter one by one",

    FILL_PAX_BULK:
      "📋 *Enter {{total}} passengers*\n\nFormat:\nName, Age, Gender\n\nExample:\nRavi, 28, M",

    NEED_EXACT_PAX:
      "⚠️ Passenger count mismatch.\nExpected: {{want}}\nReceived: {{have}}",

    ENTER_NAME_PROMPT:
      "👤 *Passenger {{i}} of {{total}}*\n\nEnter name.",

    ENTER_AGE: "🎂 Enter age.",
    INVALID_AGE: "⚠️ Please enter a valid age.",

    PICK_GENDER: "🚻 Select gender.",
    G_M: "Male",
    G_F: "Female",
    G_O: "Other",

    ASK_CONTACT_PHONE:
      "📞 *Contact number*\n\nEnter a valid mobile number.",
    INVALID_PHONE:
      "⚠️ Invalid phone number.\nPlease enter a valid mobile number.",

    CONFIRM_BOOKING_PROMPT:
      "✅ *Please confirm your booking*",
    CONFIRM_BOOKING: "Confirm Booking ✅",
    EDIT_BOOKING: "Edit ✏️",
    CANCEL_BOOKING: "Cancel ❌",

    /* =========================
     * TRACKING
     * ========================= */
    TRACK_PROMPT:
      "🔍 *Track your booking*\n\nEnter your *Booking ID*.",
    NO_BOOKING_FOUND: "❌ No booking found for this ID.",
    TRACK_STATUS_LINE:
      "📄 *Booking Status*\n\nID: {{id}}\nRoute: {{from}} → {{to}}\nDate: {{date}}\nStatus: *{{status}}*",

    CITY_NOT_UNDERSTOOD:
      "⚠️ I couldn’t recognise that place.\n\nPlease re-enter the *full city name* in English.",
    INVALID_DATE:
      "❌ Invalid date.\n\nPlease enter a valid *future* travel date.",
  },

  /* =====================================================
   * TAMIL
   * ===================================================== */
  ta: {
    WELCOME_TITLE: "👋 *Quickets* வரவேற்கிறது",
    WELCOME_DESC:
      "பேருந்து, ரயில் மற்றும் விமான டிக்கெட்டுகளை எளிதாக முன்பதிவு செய்யுங்கள்.\n\nநம்பகமான • விரைவு • சுலபம்",

    LANG_PROMPT: "மொழியைத் தேர்வு செய்யவும்:",
    LANG_EN_LABEL: "English",
    LANG_TA_LABEL: "தமிழ்",
    LANG_HI_LABEL: "हिन्दी",

    MENU: "மெனு",
    MAIN: "முகப்பு",

    CHOOSE_SERVICE: "🎟 சேவையைத் தேர்வு செய்யவும்",
    SELECT: "தேர்வு",
    SERVICES: "சேவைகள்",

    MENU_TRACK: "🔍 முன்பதிவு நிலை",
    MENU_HELP: "உதவி & ஆதரவு",

    SUPPORT_INFO:
      "*Quickets ஆதரவு*\n\n📧 quicketsofficial@gmail.com\n📞 +91 9894381195\n⏰ காலை 6 – இரவு 11",

    HELP_TEXT:
      "🆘 *Quickets உதவி*\n\n• *MENU* – புதிய முன்பதிவு\n• *RETRY* – முந்தைய படி",

    OOPS_TAP_OPTIONS:
      "கிடைக்கும் விருப்பங்களில் ஒன்றைத் தேர்வு செய்யவும்.",
    NOTHING_TO_RETRY:
      "மீண்டும் முயற்சிக்க ஒன்றுமில்லை.\n*MENU* அனுப்பவும்.",

    ASK_FROM: "🚌 *புறப்படும் இடம்*",
    ASK_TO: "🎯 *செல்லும் இடம்*",

    PICK_TIME_PREF: "⏰ *பயண நேரம்*",

    TIME_MORNING: "காலை (2AM – 10AM)",
    TIME_AFTERNOON: "மதியம் (10AM – 4PM)",
    TIME_EVENING: "மாலை (4PM – 7PM)",
    TIME_NIGHT: "இரவு (7PM – 2AM)",

    HOW_MANY_PAX: "👥 *பயணிகள் எண்ணிக்கை*",
    SEAT_TYPE_PROMPT: "💺 *இருக்கை வகை*",

    SEAT_AC_SLEEPER: "ஏசி ஸ்லீப்பர்",
    SEAT_AC_SEATER: "ஏசி சீட்டர்",
    SEAT_NONAC_SLEEPER: "நான்-ஏசி ஸ்லீப்பர்",
    SEAT_NONAC_SEATER: "நான்-ஏசி சீட்டர்",

    BUDGET_PROMPT: "💰 *பட்ஜெட்*",

    BUDGET_300U: "₹300க்கு கீழ்",
    BUDGET_500: "₹500க்கு கீழ்",
    BUDGET_700: "₹700க்கு கீழ்",
    BUDGET_1000: "₹1000க்கு கீழ்",
    BUDGET_1500: "₹1500க்கு கீழ்",
    BUDGET_2000PLUS: "₹2000க்கு மேல்",

    TRAIN_ASK_FROM: "🚆 *புறப்படும் நிலையம்*",
    TRAIN_ASK_TO: "🎯 *செல்லும் நிலையம்*",
    TRAIN_ASK_DATE: "📅 *பயண தேதி*",

    TRAIN_PICK_CLASS: "🚆 *வகை*",
    TRAIN_CLASS_SL: "ஸ்லீப்பர்",
    TRAIN_CLASS_3A: "ஏசி 3",
    TRAIN_CLASS_2A: "ஏசி 2",
    TRAIN_CLASS_1A: "முதல் ஏசி",
    TRAIN_CLASS_CC: "சேர் கார்",
    TRAIN_CLASS_2S: "இரண்டாம் இருக்கை",

    TRAIN_PICK_QUOTA: "🎟 *ஒதுக்கீடு*",
    TRAIN_QUOTA_GN: "பொது",
    TRAIN_QUOTA_TATKAL: "தட்கால்",
    TRAIN_QUOTA_LADIES: "பெண்கள்",
    TRAIN_QUOTA_SENIOR: "மூத்த குடிமக்கள்",

    TRAIN_REVIEW: "🧾 *ரயில் முன்பதிவு சரிபார்ப்பு*",

    FLIGHT_COMING_SOON:
      "✈️ விமான முன்பதிவு விரைவில்",

    PASSENGER_DETAILS_MODE:
      "🧾 *பயணி விவரங்கள்*",

    PAX_BULK: "ஒரே முறையில்",
    PAX_ONEBYONE: "ஒன்றாக ஒன்றாக",

    FILL_PAX_BULK:
      "📋 *{{total}} பயணிகள் விவரம்*\n\nபெயர், வயது, பாலினம்",

    NEED_EXACT_PAX:
      "⚠️ எண்ணிக்கை பொருந்தவில்லை",

    ENTER_NAME_PROMPT:
      "👤 பயணி {{i}} / {{total}} பெயர்",

    ENTER_AGE: "🎂 வயது",
    INVALID_AGE: "⚠️ சரியான வயதை உள்ளிடவும்",

    PICK_GENDER: "🚻 பாலினம்",
    G_M: "ஆண்",
    G_F: "பெண்",
    G_O: "மற்றது",

    ASK_CONTACT_PHONE: "📞 தொடர்பு எண்",
    INVALID_PHONE: "⚠️ தவறான எண்",

    CONFIRM_BOOKING_PROMPT:
      "✅ *உங்கள் முன்பதிவை உறுதி செய்யவும்*",
    CONFIRM_BOOKING: "உறுதி செய் ✅",
    EDIT_BOOKING: "திருத்து ✏️",
    CANCEL_BOOKING: "ரத்து ❌",

    TRACK_PROMPT: "🔍 புக் ஐடி",
    NO_BOOKING_FOUND: "❌ முன்பதிவு இல்லை",
    TRACK_STATUS_LINE:
      "📄 நிலை: {{status}}",

    CITY_NOT_UNDERSTOOD:
      "⚠️ இடம் புரியவில்லை",
    INVALID_DATE: "❌ தவறான தேதி",
  },

  /* =====================================================
   * HINDI
   * ===================================================== */
  hi: {
    WELCOME_TITLE:
      "👋 *Quickets में आपका स्वागत है*",
    WELCOME_DESC:
      "बस, ट्रेन और फ्लाइट टिकट आसानी से बुक करें.\n\nतेज़ • आसान • भरोसेमंद",

    LANG_PROMPT: "भाषा चुनें:",
    LANG_EN_LABEL: "English",
    LANG_TA_LABEL: "தமிழ்",
    LANG_HI_LABEL: "हिन्दी",

    MENU: "मेनू",
    MAIN: "मुख्य मेनू",

    CHOOSE_SERVICE: "🎟 सेवा चुनें",
    SELECT: "चुनें",
    SERVICES: "सेवाएं",

    MENU_TRACK: "🔍 बुकिंग ट्रैक करें",
    MENU_HELP: "मदद",

    SUPPORT_INFO:
      "*Quickets सहायता*\n\n📞 +91 9894381195",

    HELP_TEXT:
      "🆘 सहायता\n• *MENU* नई बुकिंग\n• *RETRY* दोहराएं",

    OOPS_TAP_OPTIONS:
      "कृपया कोई विकल्प चुनें",
    NOTHING_TO_RETRY:
      "दोहराने के लिए कुछ नहीं",

    ASK_FROM: "🚌 प्रस्थान स्थान",
    ASK_TO: "🎯 गंतव्य",

    PICK_TIME_PREF: "⏰ यात्रा समय",

    TIME_MORNING: "सुबह (2AM – 10AM)",
    TIME_AFTERNOON: "दोपहर (10AM – 4PM)",
    TIME_EVENING: "शाम (4PM – 7PM)",
    TIME_NIGHT: "रात (7PM – 2AM)",

    HOW_MANY_PAX:
      "👥 यात्रियों की संख्या",
    SEAT_TYPE_PROMPT: "💺 सीट प्रकार",

    SEAT_AC_SLEEPER: "एसी स्लीपर",
    SEAT_AC_SEATER: "एसी सीट",
    SEAT_NONAC_SLEEPER:
      "नॉन-एसी स्लीपर",
    SEAT_NONAC_SEATER:
      "नॉन-एसी सीट",

    BUDGET_PROMPT: "💰 बजट",

    BUDGET_300U: "₹300 से कम",
    BUDGET_500: "₹500 से कम",
    BUDGET_700: "₹700 से कम",
    BUDGET_1000: "₹1000 से कम",
    BUDGET_1500: "₹1500 से कम",
    BUDGET_2000PLUS:
      "₹2000 से अधिक",

    TRAIN_ASK_FROM:
      "🚆 प्रस्थान स्टेशन",
    TRAIN_ASK_TO:
      "🎯 गंतव्य स्टेशन",
    TRAIN_ASK_DATE:
      "📅 यात्रा तिथि",

    TRAIN_PICK_CLASS:
      "🚆 श्रेणी चुनें",
    TRAIN_CLASS_SL: "स्लीपर",
    TRAIN_CLASS_3A: "एसी 3",
    TRAIN_CLASS_2A: "एसी 2",
    TRAIN_CLASS_1A:
      "फर्स्ट एसी",
    TRAIN_CLASS_CC:
      "चेयर कार",
    TRAIN_CLASS_2S:
      "सेकंड सीट",

    TRAIN_PICK_QUOTA:
      "🎟 कोटा चुनें",
    TRAIN_QUOTA_GN: "सामान्य",
    TRAIN_QUOTA_TATKAL:
      "तत्काल",
    TRAIN_QUOTA_LADIES:
      "महिला",
    TRAIN_QUOTA_SENIOR:
      "वरिष्ठ नागरिक",

    TRAIN_REVIEW: "🧾 समीक्षा",

    FLIGHT_COMING_SOON:
      "✈️ फ्लाइट बुकिंग जल्द",

    PASSENGER_DETAILS_MODE:
      "🧾 यात्री विवरण",

    PAX_BULK: "एक साथ",
    PAX_ONEBYONE:
      "एक-एक करके",

    FILL_PAX_BULK:
      "📋 *{{total}} यात्रियों का विवरण*\n\nनाम, उम्र, लिंग",

    NEED_EXACT_PAX:
      "⚠️ संख्या मेल नहीं खाती",

    ENTER_NAME_PROMPT:
      "👤 यात्री {{i}} / {{total}}",

    ENTER_AGE: "🎂 उम्र",
    INVALID_AGE:
      "⚠️ गलत उम्र",

    PICK_GENDER: "🚻 लिंग",
    G_M: "पुरुष",
    G_F: "महिला",
    G_O: "अन्य",

    ASK_CONTACT_PHONE:
      "📞 मोबाइल नंबर",
    INVALID_PHONE:
      "⚠️ गलत नंबर",

    CONFIRM_BOOKING_PROMPT:
      "✅ *अपनी बुकिंग की पुष्टि करें*",
    CONFIRM_BOOKING:
      "पुष्टि करें ✅",
    EDIT_BOOKING:
      "संपादित करें ✏️",
    CANCEL_BOOKING:
      "रद्द ❌",

    TRACK_PROMPT:
      "🔍 बुकिंग आईडी",
    NO_BOOKING_FOUND:
      "❌ बुकिंग नहीं मिली",
    TRACK_STATUS_LINE:
      "📄 स्थिति: {{status}}",

    CITY_NOT_UNDERSTOOD:
      "⚠️ स्थान समझ नहीं आया",
    INVALID_DATE:
      "❌ गलत तारीख",
  },
};

module.exports = optionSets;
