// const optionSets = {
//   /* =====================================================
//    * ENGLISH (SOURCE / MASTER)
//    * ===================================================== */
//   en: {
//     /* =========================
//      * GLOBAL / MENU
//      * ========================= */
//     WELCOME_TITLE: "👋 Welcome to *Quickets*",
//     WELCOME_DESC:
//       "Book Bus, Train & Flight tickets effortlessly.\n\n🚌 🚆 ✈️\nTrusted • Fast • Hassle-free\n\nLet’s get you moving.",

//     LANG_PROMPT: "Please select your language:",
//     LANG_EN_LABEL: "English",
//     LANG_TA_LABEL: "தமிழ்",
//     LANG_HI_LABEL: "हिन्दी",

//     MENU: "Menu",
//     MAIN: "Main Menu",

//     CHOOSE_SERVICE: "🎟 Choose a service",
//     SELECT: "Select",
//     SERVICES: "Services",

//     MENU_TRACK: "🔍 Track Booking",
//     MENU_HELP: "Help & Support",

//     SUPPORT_INFO:
//       "*Quickets Support*\n\n" +
//       "📩 Chat with Admin: +91 9894381195\n" +
//       "📧 Email: quicketsofficial@gmail.com\n" +
//       "📞 Phone: +91 8300984737\n" +
//       "⏰ Hours: 7am – 11pm IST",

//     HELP_TEXT:
//       "🆘 *Quickets Help*\n\n" +
//       "• Type *MENU* to start a new booking\n" +
//       "• Type *RETRY* to repeat the last step\n" +
//       "• Follow the on-screen instructions carefully\n\n" +
//       "📞 Support: +91 9894381195",

//     OOPS_TAP_OPTIONS: "Please tap one of the available options.",
//     NOTHING_TO_RETRY: "Nothing to retry.\nType *MENU* to start.",

//     /* =========================
//      * BUS
//      * ========================= */
//     ASK_FROM:
//       "🚌 *Boarding location*\n\nType the *city or town name*.\nExample: Chennai",
//     ASK_TO:
//       "🎯 *Destination*\n\nType the *destination city*.\nExample: Coimbatore",

//     PICK_TIME_PREF: "⏰ *Preferred travel time*\n\nSelect a time slot below.",

//     TIME_MORNING: "Morning (2AM – 10AM)",
//     TIME_AFTERNOON: "Afternoon (10AM – 4PM)",
//     TIME_EVENING: "Evening (4PM – 7PM)",
//     TIME_NIGHT: "Night (7PM – 2AM)",

//     HOW_MANY_PAX:
//       "👥 *Number of passengers*\n\nSelect how many are travelling.",

//     SEAT_TYPE_PROMPT:
//       "💺 *Seat preference*\n\nChoose your preferred seat type.",

//     SEAT_AC_SLEEPER: "AC Sleeper",
//     SEAT_AC_SEATER: "AC Seater",
//     SEAT_NONAC_SLEEPER: "Non-AC Sleeper",
//     SEAT_NONAC_SEATER: "Non-AC Seater",

//     BUDGET_PROMPT:
//       "💰 *Budget per ticket*\n\nSelect a comfortable range.",

//     BUDGET_300U: "Under ₹300",
//     BUDGET_500: "Under ₹500",
//     BUDGET_700: "Under ₹700",
//     BUDGET_1000: "Under ₹1000",
//     BUDGET_1500: "Under ₹1500",
//     BUDGET_2000PLUS: "Above ₹2000",

//     /* =========================
//      * TRAIN
//      * ========================= */
//     TRAIN_ASK_FROM:
//       "🚆 *From Station*\n\nType the *boarding station name*.\nExample: Chennai Central",
//     TRAIN_ASK_TO:
//       "🎯 *To Station*\n\nType the *destination station name*.\nExample: Bangalore",
//     TRAIN_ASK_DATE:
//       "📅 *Journey Date*\n\nType date in *DD-MM-YYYY*\nExample: 25-01-2026",

//     TRAIN_PICK_CLASS: "🚆 *Select Travel Class*",
//     TRAIN_CLASS_SL: "Sleeper (SL)",
//     TRAIN_CLASS_3A: "AC 3 Tier (3A)",
//     TRAIN_CLASS_2A: "AC 2 Tier (2A)",
//     TRAIN_CLASS_1A: "First AC (1A)",
//     TRAIN_CLASS_CC: "Chair Car (CC)",
//     TRAIN_CLASS_2S: "Second Sitting (2S)",

//     TRAIN_PICK_QUOTA: "🎟 *Select Booking Quota*",
//     TRAIN_QUOTA_GN: "General",
//     TRAIN_QUOTA_TATKAL: "Tatkal",
//     TRAIN_QUOTA_LADIES: "Ladies",
//     TRAIN_QUOTA_SENIOR: "Senior Citizen",

//     TRAIN_REVIEW: "🧾 *Review your train booking details*",

//     /* =========================
//      * FLIGHT
//      * ========================= */
//     FLIGHT_COMING_SOON:
//       "✈️ *Flight bookings are coming soon on Quickets!*",

//     /* =========================
//      * PASSENGER
//      * ========================= */
//     PASSENGER_DETAILS_MODE:
//       "🧾 *Passenger details*\n\nHow would you like to enter details?",

//     PAX_BULK: "Paste all at once",
//     PAX_ONEBYONE: "Enter one by one",

//     FILL_PAX_BULK:
//       "📋 *Enter {{total}} passengers*\n\nFormat:\nName, Age, Gender\n\nExample:\nRavi, 28, M",

//     NEED_EXACT_PAX:
//       "⚠️ Passenger count mismatch.\nExpected: {{want}}\nReceived: {{have}}",

//     ENTER_NAME_PROMPT:
//       "👤 *Passenger {{i}} of {{total}}*\n\nEnter name.",

//     ENTER_AGE: "🎂 Enter age.",
//     INVALID_AGE: "⚠️ Please enter a valid age.",

//     PICK_GENDER: "🚻 Select gender.",
//     G_M: "Male",
//     G_F: "Female",
//     G_O: "Other",

//     ASK_CONTACT_PHONE:
//       "📞 *Contact number*\n\nEnter a valid mobile number.",
//     INVALID_PHONE:
//       "⚠️ Invalid phone number.\nPlease enter a valid mobile number.",

//     CONFIRM_BOOKING_PROMPT:
//       "✅ *Please confirm your booking*",
//     CONFIRM_BOOKING: "Confirm Booking ✅",
//     EDIT_BOOKING: "Edit ✏️",
//     CANCEL_BOOKING: "Cancel ❌",

//     /* =========================
//      * TRACKING
//      * ========================= */
//     TRACK_PROMPT:
//       "🔍 *Track your booking*\n\nEnter your *Booking ID*.",
//     NO_BOOKING_FOUND: "❌ No booking found for this ID.",
//     TRACK_STATUS_LINE:
//       "📄 *Booking Status*\n\nID: {{id}}\nRoute: {{from}} → {{to}}\nDate: {{date}}\nStatus: *{{status}}*",

//     CITY_NOT_UNDERSTOOD:
//       "⚠️ I couldn’t recognise that place.\n\nPlease re-enter the *full city name* in English.",
//     INVALID_DATE:
//       "❌ Invalid date.\n\nPlease enter a valid *future* travel date.",
//   },

//   /* =====================================================
//    * TAMIL
//    * ===================================================== */
//   ta: {
//     WELCOME_TITLE: "👋 *Quickets* வரவேற்கிறது",
//     WELCOME_DESC:
//       "பேருந்து, ரயில் மற்றும் விமான டிக்கெட்டுகளை எளிதாக முன்பதிவு செய்யுங்கள்.\n\nநம்பகமான • விரைவு • சுலபம்",

//     LANG_PROMPT: "மொழியைத் தேர்வு செய்யவும்:",
//     LANG_EN_LABEL: "English",
//     LANG_TA_LABEL: "தமிழ்",
//     LANG_HI_LABEL: "हिन्दी",

//     MENU: "மெனு",
//     MAIN: "முகப்பு",

//     CHOOSE_SERVICE: "🎟 சேவையைத் தேர்வு செய்யவும்",
//     SELECT: "தேர்வு",
//     SERVICES: "சேவைகள்",

//     MENU_TRACK: "🔍 முன்பதிவு நிலை",
//     MENU_HELP: "உதவி & ஆதரவு",

//     SUPPORT_INFO:
//       "*Quickets ஆதரவு*\n\n📧 quicketsofficial@gmail.com\n📞 +91 9894381195\n⏰ காலை 6 – இரவு 11",

//     HELP_TEXT:
//       "🆘 *Quickets உதவி*\n\n• *MENU* – புதிய முன்பதிவு\n• *RETRY* – முந்தைய படி",

//     OOPS_TAP_OPTIONS:
//       "கிடைக்கும் விருப்பங்களில் ஒன்றைத் தேர்வு செய்யவும்.",
//     NOTHING_TO_RETRY:
//       "மீண்டும் முயற்சிக்க ஒன்றுமில்லை.\n*MENU* அனுப்பவும்.",

//     ASK_FROM: "🚌 *புறப்படும் இடம்*",
//     ASK_TO: "🎯 *செல்லும் இடம்*",

//     PICK_TIME_PREF: "⏰ *பயண நேரம்*",

//     TIME_MORNING: "காலை (2AM – 10AM)",
//     TIME_AFTERNOON: "மதியம் (10AM – 4PM)",
//     TIME_EVENING: "மாலை (4PM – 7PM)",
//     TIME_NIGHT: "இரவு (7PM – 2AM)",

//     HOW_MANY_PAX: "👥 *பயணிகள் எண்ணிக்கை*",
//     SEAT_TYPE_PROMPT: "💺 *இருக்கை வகை*",

//     SEAT_AC_SLEEPER: "ஏசி ஸ்லீப்பர்",
//     SEAT_AC_SEATER: "ஏசி சீட்டர்",
//     SEAT_NONAC_SLEEPER: "நான்-ஏசி ஸ்லீப்பர்",
//     SEAT_NONAC_SEATER: "நான்-ஏசி சீட்டர்",

//     BUDGET_PROMPT: "💰 *பட்ஜெட்*",

//     BUDGET_300U: "₹300க்கு கீழ்",
//     BUDGET_500: "₹500க்கு கீழ்",
//     BUDGET_700: "₹700க்கு கீழ்",
//     BUDGET_1000: "₹1000க்கு கீழ்",
//     BUDGET_1500: "₹1500க்கு கீழ்",
//     BUDGET_2000PLUS: "₹2000க்கு மேல்",

//     TRAIN_ASK_FROM: "🚆 *புறப்படும் நிலையம்*",
//     TRAIN_ASK_TO: "🎯 *செல்லும் நிலையம்*",
//     TRAIN_ASK_DATE: "📅 *பயண தேதி*",

//     TRAIN_PICK_CLASS: "🚆 *வகை*",
//     TRAIN_CLASS_SL: "ஸ்லீப்பர்",
//     TRAIN_CLASS_3A: "ஏசி 3",
//     TRAIN_CLASS_2A: "ஏசி 2",
//     TRAIN_CLASS_1A: "முதல் ஏசி",
//     TRAIN_CLASS_CC: "சேர் கார்",
//     TRAIN_CLASS_2S: "இரண்டாம் இருக்கை",

//     TRAIN_PICK_QUOTA: "🎟 *ஒதுக்கீடு*",
//     TRAIN_QUOTA_GN: "பொது",
//     TRAIN_QUOTA_TATKAL: "தட்கால்",
//     TRAIN_QUOTA_LADIES: "பெண்கள்",
//     TRAIN_QUOTA_SENIOR: "மூத்த குடிமக்கள்",

//     TRAIN_REVIEW: "🧾 *ரயில் முன்பதிவு சரிபார்ப்பு*",

//     FLIGHT_COMING_SOON:
//       "✈️ விமான முன்பதிவு விரைவில்",

//     PASSENGER_DETAILS_MODE:
//       "🧾 *பயணி விவரங்கள்*",

//     PAX_BULK: "ஒரே முறையில்",
//     PAX_ONEBYONE: "ஒன்றாக ஒன்றாக",

//     FILL_PAX_BULK:
//       "📋 *{{total}} பயணிகள் விவரம்*\n\nபெயர், வயது, பாலினம்",

//     NEED_EXACT_PAX:
//       "⚠️ எண்ணிக்கை பொருந்தவில்லை",

//     ENTER_NAME_PROMPT:
//       "👤 பயணி {{i}} / {{total}} பெயர்",

//     ENTER_AGE: "🎂 வயது",
//     INVALID_AGE: "⚠️ சரியான வயதை உள்ளிடவும்",

//     PICK_GENDER: "🚻 பாலினம்",
//     G_M: "ஆண்",
//     G_F: "பெண்",
//     G_O: "மற்றது",

//     ASK_CONTACT_PHONE: "📞 தொடர்பு எண்",
//     INVALID_PHONE: "⚠️ தவறான எண்",

//     CONFIRM_BOOKING_PROMPT:
//       "✅ *உங்கள் முன்பதிவை உறுதி செய்யவும்*",
//     CONFIRM_BOOKING: "உறுதி செய் ✅",
//     EDIT_BOOKING: "திருத்து ✏️",
//     CANCEL_BOOKING: "ரத்து ❌",

//     TRACK_PROMPT: "🔍 புக் ஐடி",
//     NO_BOOKING_FOUND: "❌ முன்பதிவு இல்லை",
//     TRACK_STATUS_LINE:
//       "📄 நிலை: {{status}}",

//     CITY_NOT_UNDERSTOOD:
//       "⚠️ இடம் புரியவில்லை",
//     INVALID_DATE: "❌ தவறான தேதி",
//   },

//   /* =====================================================
//    * HINDI
//    * ===================================================== */
//   hi: {
//     WELCOME_TITLE:
//       "👋 *Quickets में आपका स्वागत है*",
//     WELCOME_DESC:
//       "बस, ट्रेन और फ्लाइट टिकट आसानी से बुक करें.\n\nतेज़ • आसान • भरोसेमंद",

//     LANG_PROMPT: "भाषा चुनें:",
//     LANG_EN_LABEL: "English",
//     LANG_TA_LABEL: "தமிழ்",
//     LANG_HI_LABEL: "हिन्दी",

//     MENU: "मेनू",
//     MAIN: "मुख्य मेनू",

//     CHOOSE_SERVICE: "🎟 सेवा चुनें",
//     SELECT: "चुनें",
//     SERVICES: "सेवाएं",

//     MENU_TRACK: "🔍 बुकिंग ट्रैक करें",
//     MENU_HELP: "मदद",

//     SUPPORT_INFO:
//       "*Quickets सहायता*\n\n📞 +91 9894381195",

//     HELP_TEXT:
//       "🆘 सहायता\n• *MENU* नई बुकिंग\n• *RETRY* दोहराएं",

//     OOPS_TAP_OPTIONS:
//       "कृपया कोई विकल्प चुनें",
//     NOTHING_TO_RETRY:
//       "दोहराने के लिए कुछ नहीं",

//     ASK_FROM: "🚌 प्रस्थान स्थान",
//     ASK_TO: "🎯 गंतव्य",

//     PICK_TIME_PREF: "⏰ यात्रा समय",

//     TIME_MORNING: "सुबह (2AM – 10AM)",
//     TIME_AFTERNOON: "दोपहर (10AM – 4PM)",
//     TIME_EVENING: "शाम (4PM – 7PM)",
//     TIME_NIGHT: "रात (7PM – 2AM)",

//     HOW_MANY_PAX:
//       "👥 यात्रियों की संख्या",
//     SEAT_TYPE_PROMPT: "💺 सीट प्रकार",

//     SEAT_AC_SLEEPER: "एसी स्लीपर",
//     SEAT_AC_SEATER: "एसी सीट",
//     SEAT_NONAC_SLEEPER:
//       "नॉन-एसी स्लीपर",
//     SEAT_NONAC_SEATER:
//       "नॉन-एसी सीट",

//     BUDGET_PROMPT: "💰 बजट",

//     BUDGET_300U: "₹300 से कम",
//     BUDGET_500: "₹500 से कम",
//     BUDGET_700: "₹700 से कम",
//     BUDGET_1000: "₹1000 से कम",
//     BUDGET_1500: "₹1500 से कम",
//     BUDGET_2000PLUS:
//       "₹2000 से अधिक",

//     TRAIN_ASK_FROM:
//       "🚆 प्रस्थान स्टेशन",
//     TRAIN_ASK_TO:
//       "🎯 गंतव्य स्टेशन",
//     TRAIN_ASK_DATE:
//       "📅 यात्रा तिथि",

//     TRAIN_PICK_CLASS:
//       "🚆 श्रेणी चुनें",
//     TRAIN_CLASS_SL: "स्लीपर",
//     TRAIN_CLASS_3A: "एसी 3",
//     TRAIN_CLASS_2A: "एसी 2",
//     TRAIN_CLASS_1A:
//       "फर्स्ट एसी",
//     TRAIN_CLASS_CC:
//       "चेयर कार",
//     TRAIN_CLASS_2S:
//       "सेकंड सीट",

//     TRAIN_PICK_QUOTA:
//       "🎟 कोटा चुनें",
//     TRAIN_QUOTA_GN: "सामान्य",
//     TRAIN_QUOTA_TATKAL:
//       "तत्काल",
//     TRAIN_QUOTA_LADIES:
//       "महिला",
//     TRAIN_QUOTA_SENIOR:
//       "वरिष्ठ नागरिक",

//     TRAIN_REVIEW: "🧾 समीक्षा",

//     FLIGHT_COMING_SOON:
//       "✈️ फ्लाइट बुकिंग जल्द",

//     PASSENGER_DETAILS_MODE:
//       "🧾 यात्री विवरण",

//     PAX_BULK: "एक साथ",
//     PAX_ONEBYONE:
//       "एक-एक करके",

//     FILL_PAX_BULK:
//       "📋 *{{total}} यात्रियों का विवरण*\n\nनाम, उम्र, लिंग",

//     NEED_EXACT_PAX:
//       "⚠️ संख्या मेल नहीं खाती",

//     ENTER_NAME_PROMPT:
//       "👤 यात्री {{i}} / {{total}}",

//     ENTER_AGE: "🎂 उम्र",
//     INVALID_AGE:
//       "⚠️ गलत उम्र",

//     PICK_GENDER: "🚻 लिंग",
//     G_M: "पुरुष",
//     G_F: "महिला",
//     G_O: "अन्य",

//     ASK_CONTACT_PHONE:
//       "📞 मोबाइल नंबर",
//     INVALID_PHONE:
//       "⚠️ गलत नंबर",

//     CONFIRM_BOOKING_PROMPT:
//       "✅ *अपनी बुकिंग की पुष्टि करें*",
//     CONFIRM_BOOKING:
//       "पुष्टि करें ✅",
//     EDIT_BOOKING:
//       "संपादित करें ✏️",
//     CANCEL_BOOKING:
//       "रद्द ❌",

//     TRACK_PROMPT:
//       "🔍 बुकिंग आईडी",
//     NO_BOOKING_FOUND:
//       "❌ बुकिंग नहीं मिली",
//     TRACK_STATUS_LINE:
//       "📄 स्थिति: {{status}}",

//     CITY_NOT_UNDERSTOOD:
//       "⚠️ स्थान समझ नहीं आया",
//     INVALID_DATE:
//       "❌ गलत तारीख",
//   },
// };

// module.exports = optionSets;

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
      "📩 Chat with Admin: +91 9894381195\n" +
      "📧 Email: quicketsofficial@gmail.com\n" +
      "📞 Phone: +91 8300984737\n" +
      "⏰ Hours: 7am – 11pm IST",

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

    BUDGET_PROMPT: "💰 *Budget per ticket*\n\nSelect a comfortable range.",

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
    FLIGHT_COMING_SOON: "✈️ *Flight bookings are coming soon on Quickets!*",

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

    ENTER_NAME_PROMPT: "👤 *Passenger {{i}} of {{total}}*\n\nEnter name.",

    ENTER_AGE: "🎂 Enter age.",
    INVALID_AGE: "⚠️ Please enter a valid age.",

    PICK_GENDER: "🚻 Select gender.",
    G_M: "Male",
    G_F: "Female",
    G_O: "Other",

    ASK_CONTACT_PHONE: "📞 *Contact number*\n\nEnter a valid mobile number.",
    INVALID_PHONE:
      "⚠️ Invalid phone number.\nPlease enter a valid mobile number.",

    CONFIRM_BOOKING_PROMPT: "✅ *Please confirm your booking*",
    CONFIRM_BOOKING: "Confirm Booking ✅",
    EDIT_BOOKING: "Edit ✏️",
    CANCEL_BOOKING: "Cancel ❌",

    /* =========================
     * TRACKING
     * ========================= */
    TRACK_PROMPT: "🔍 *Track your booking*\n\nEnter your *Booking ID*.",
    NO_BOOKING_FOUND: "❌ No booking found for this ID.",
    TRACK_STATUS_LINE:
      "📄 *Booking Status*\n\nID: {{id}}\nRoute: {{from}} → {{to}}\nDate: {{date}}\nStatus: *{{status}}*",

    CITY_NOT_UNDERSTOOD:
      "⚠️ I couldn’t recognise that place.\n\nPlease re-enter the *full city name* in English.",
    INVALID_DATE:
      "❌ Invalid date.\n\nPlease enter a valid *future* travel date.",

    /* ===== TRAIN FLOW (COMMON) ===== */

    NUMBER_SELECT_HINT: "Reply with the *number* from the list below.",

    SELECT_FROM_STATION: "Select FROM station",
    SELECT_TO_STATION: "Select TO station",

    TRAIN_FROM_PROMPT:
      "📍 *FROM Station*\n\nEnter the starting railway station.\n\n✍️ *Example:*\nChennai\nBangalore\nMAS",

    TRAIN_TO_PROMPT:
      "🎯 *TO Station*\n\nEnter the destination railway station.\n\n✍️ *Example:*\nMumbai\nDelhi\nMAS",

    TRAIN_DATE_PROMPT:
      "📅 *Journey Date*\n\nEnter travel date in *DD-MM-YYYY* format.\n\n✍️ *Example:*\n25-01-2026",

    INVALID_NUMBER: "❌ Invalid number. Please choose from the list.",

    NO_STATIONS_FOUND: "❌ No stations found.\n\n✍️ Example:\nChennai\nMAS",

    FROM_TO_SAME_ERROR: "❌ Destination cannot be same as FROM station.",

    INVALID_DATE_MSG:
      "❌ Invalid date.\n\n✍️ Use future date in DD-MM-YYYY format.\nExample: 25-01-2026",

    /* ===== LIST HELP TEXT ===== */

    TRAIN_CLASS_HELP:
      "🚆 *Select Travel Class*\n\nThis decides the coach type you’ll travel in.\n\n✍️ *Example:*\nSleeper is economical, AC classes are more comfortable.",

    CHOOSE_CLASS: "Choose Class",
    AVAILABLE_CLASSES: "Available Classes",

    TRAIN_QUOTA_HELP:
      "🎟 *Select Booking Quota*\n\nQuota affects seat availability and booking rules.\n\n✍️ *Example:*\nGeneral = normal booking\nTatkal = last-minute booking",

    CHOOSE_QUOTA: "Choose Quota",
    QUOTA_TYPE: "Quota Type",

    TRAIN_BERTH_HELP:
      "🛏 *Berth Preference (Optional)*\n\nThis is only a preference.\nActual allotment depends on availability.\n\n✍️ *Example:*\nChoose *Lower Berth* if you prefer easy access.",

    CHOOSE_BERTH: "Choose Berth",
    BERTH_PREFERENCE: "Berth Preference",

    PASSENGER_COUNT_HELP:
      "👥 *Number of Passengers*\n\nSelect how many people will travel.\n\n✍️ *Example:*\nIf 2 people are travelling, choose *2*.",

    PASSENGERS: "Passengers",
    PASSENGER_COUNT: "Passengers Count",

    INVALID_PAX_COUNT: "❌ Please choose passenger count between 1 and 6.",

    PASSENGER_ENTRY_MODE:
      "👥 *Passenger Details Entry*\n\nChoose how you want to enter passenger details.\n\n✍️ *Example:*\nOne by One = enter each passenger separately\nAll at once = paste all details together",

    /* ===== GENERIC ===== */

    BOOK_AGAIN_MSG: "🔄 Starting a new train booking…",

    GENERIC_ERROR: "⚠️ Something went wrong.\nType *BOOK AGAIN*",

    HELP_FALLBACK: "⚠️ Please type:\n• RETRY\n• BOOK AGAIN\n• HELP",

    TRAIN_CLASS_SL: "Sleeper (SL)",
    TRAIN_CLASS_3A: "AC 3 Tier (3A)",
    TRAIN_CLASS_2A: "AC 2 Tier (2A)",
    TRAIN_CLASS_CC: "Chair Car (CC)",
    TRAIN_CLASS_2S: "Second Sitting (2S)",

    BERTH_L: "Lower Berth",
    BERTH_M: "Middle Berth",
    BERTH_U: "Upper Berth",
    BERTH_SL: "Side Lower",
    BERTH_SU: "Side Upper",
    BERTH_NONE: "No Preference",
  },

  /* =====================================================
   * TAMIL (UX PARITY)
   * ===================================================== */
  ta: {
    WELCOME_TITLE: "👋 *Quickets* வரவேற்கிறது",
    WELCOME_DESC:
      "பேருந்து, ரயில் மற்றும் விமான டிக்கெட்டுகளை எளிதாக முன்பதிவு செய்யுங்கள்.\n\n🚌 🚆 ✈️\nநம்பகமான • விரைவு • சுலபம்\n\nபயணத்தை தொடங்கலாம்.",

    LANG_PROMPT: "மொழியைத் தேர்வு செய்யவும்:",
    LANG_EN_LABEL: "English",
    LANG_TA_LABEL: "தமிழ்",
    LANG_HI_LABEL: "हिन्दी",

    MENU: "மெனு",
    MAIN: "முகப்பு மெனு",

    CHOOSE_SERVICE: "🎟 சேவையைத் தேர்வு செய்யவும்",
    SELECT: "தேர்வு",
    SERVICES: "சேவைகள்",

    MENU_TRACK: "🔍 முன்பதிவை கண்காணிக்க",
    MENU_HELP: "உதவி & ஆதரவு",

    SUPPORT_INFO:
      "*Quickets ஆதரவு*\n\n📩 நிர்வாகியுடன் அரட்டை: +91 9894381195\n📧 Email: quicketsofficial@gmail.com\n📞 Phone: +91 8300984737\n⏰ நேரம்: காலை 7 – இரவு 11",

    HELP_TEXT:
      "🆘 *Quickets உதவி*\n\n• *MENU* – புதிய முன்பதிவை தொடங்க\n• *RETRY* – முந்தைய படியை மீண்டும் செய்ய\n• திரையில் வரும் வழிமுறைகளை பின்பற்றவும்\n\n📞 ஆதரவு: +91 9894381195",

    OOPS_TAP_OPTIONS: "கிடைக்கும் விருப்பங்களில் ஒன்றைத் தேர்வு செய்யவும்.",
    NOTHING_TO_RETRY: "மீண்டும் முயற்சிக்க ஒன்றுமில்லை.\n*MENU* அனுப்பவும்.",

    ASK_FROM:
      "🚌 *புறப்படும் இடம்*\n\n*நகரம் அல்லது ஊர் பெயரை* உள்ளிடவும்.\nஉதாரணம்: சென்னை",
    ASK_TO:
      "🎯 *செல்லும் இடம்*\n\n*செல்ல வேண்டிய நகரத்தை* உள்ளிடவும்.\nஉதாரணம்: கோயம்புத்தூர்",

    PICK_TIME_PREF:
      "⏰ *விரும்பும் பயண நேரம்*\n\nகீழே உள்ள நேர இடைவெளியைத் தேர்வு செய்யவும்.",

    TIME_MORNING: "காலை (2AM – 10AM)",
    TIME_AFTERNOON: "மதியம் (10AM – 4PM)",
    TIME_EVENING: "மாலை (4PM – 7PM)",
    TIME_NIGHT: "இரவு (7PM – 2AM)",

    HOW_MANY_PAX:
      "👥 *பயணிகள் எண்ணிக்கை*\n\nஎத்தனை பேர் பயணம் செய்கிறார்கள் என்பதைத் தேர்வு செய்யவும்.",

    SEAT_TYPE_PROMPT:
      "💺 *இருக்கை விருப்பம்*\n\nஉங்களுக்கு விருப்பமான இருக்கை வகையைத் தேர்வு செய்யவும்.",

    SEAT_AC_SLEEPER: "ஏசி ஸ்லீப்பர்",
    SEAT_AC_SEATER: "ஏசி சீட்டர்",
    SEAT_NONAC_SLEEPER: "நான்-ஏசி ஸ்லீப்பர்",
    SEAT_NONAC_SEATER: "நான்-ஏசி சீட்டர்",

    BUDGET_PROMPT:
      "💰 *ஒரு டிக்கெட்டுக்கான பட்ஜெட்*\n\nஉங்களுக்கு ஏற்ற வரம்பைத் தேர்வு செய்யவும்.",

    BUDGET_300U: "₹300க்கு கீழ்",
    BUDGET_500: "₹500க்கு கீழ்",
    BUDGET_700: "₹700க்கு கீழ்",
    BUDGET_1000: "₹1000க்கு கீழ்",
    BUDGET_1500: "₹1500க்கு கீழ்",
    BUDGET_2000PLUS: "₹2000க்கு மேல்",

    TRAIN_ASK_FROM:
      "🚆 *புறப்படும் நிலையம்*\n\n*ரயில் நிலையத்தின் பெயரை* உள்ளிடவும்.\nஉதாரணம்: சென்னை சென்ட்ரல்",
    TRAIN_ASK_TO:
      "🎯 *செல்லும் நிலையம்*\n\n*இறங்கும் நிலையத்தின் பெயரை* உள்ளிடவும்.\nஉதாரணம்: பெங்களூர்",
    TRAIN_ASK_DATE:
      "📅 *பயண தேதி*\n\n*DD-MM-YYYY* வடிவில் உள்ளிடவும்.\nஉதாரணம்: 25-01-2026",

    TRAIN_PICK_CLASS: "🚆 *பயண வகையைத் தேர்வு செய்யவும்*",
    TRAIN_CLASS_SL: "ஸ்லீப்பர்",
    TRAIN_CLASS_3A: "ஏசி 3 அடுக்கு",
    TRAIN_CLASS_2A: "ஏசி 2 அடுக்கு",
    TRAIN_CLASS_1A: "முதல் ஏசி",
    TRAIN_CLASS_CC: "சேர் கார்",
    TRAIN_CLASS_2S: "இரண்டாம் இருக்கை",

    TRAIN_PICK_QUOTA: "🎟 *ஒதுக்கீட்டைத் தேர்வு செய்யவும்*",
    TRAIN_QUOTA_GN: "பொது",
    TRAIN_QUOTA_TATKAL: "தட்கால்",
    TRAIN_QUOTA_LADIES: "பெண்கள்",
    TRAIN_QUOTA_SENIOR: "மூத்த குடிமக்கள்",

    TRAIN_REVIEW: "🧾 *உங்கள் ரயில் முன்பதிவு விவரங்களை சரிபார்க்கவும்*",

    TRAIN_CLASS_SL: "ஸ்லீப்பர்",
    TRAIN_CLASS_3A: "ஏசி 3 அடுக்கு",
    TRAIN_CLASS_2A: "ஏசி 2 அடுக்கு",
    TRAIN_CLASS_CC: "சேர் கார்",
    TRAIN_CLASS_2S: "இரண்டாம் இருக்கை",

    BERTH_L: "கீழ் படுக்கை",
    BERTH_M: "நடு படுக்கை",
    BERTH_U: "மேல் படுக்கை",
    BERTH_SL: "பக்க கீழ் படுக்கை",
    BERTH_SU: "பக்க மேல் படுக்கை",
    BERTH_NONE: "விருப்பமில்லை",

    FLIGHT_COMING_SOON: "✈️ *Quickets-ல் விமான முன்பதிவு விரைவில் வருகிறது!*",

    PASSENGER_DETAILS_MODE:
      "🧾 *பயணி விவரங்கள்*\n\nவிவரங்களை எவ்வாறு உள்ளிட விரும்புகிறீர்கள்?",

    PAX_BULK: "ஒரே முறையில்",
    PAX_ONEBYONE: "ஒன்றாக ஒன்றாக",

    FILL_PAX_BULK:
      "📋 *{{total}} பயணிகள் விவரம்*\n\nவடிவம்:\nபெயர், வயது, பாலினம்\n\nஉதாரணம்:\nரவி, 28, ஆண்",

    NEED_EXACT_PAX:
      "⚠️ பயணிகள் எண்ணிக்கை பொருந்தவில்லை.\nஎதிர்பார்ப்பு: {{want}}\nபெறப்பட்டது: {{have}}",

    ENTER_NAME_PROMPT: "👤 *பயணி {{i}} / {{total}}*\n\nபெயரை உள்ளிடவும்.",

    ENTER_AGE: "🎂 வயதை உள்ளிடவும்.",
    INVALID_AGE: "⚠️ சரியான வயதை உள்ளிடவும்.",

    PICK_GENDER: "🚻 பாலினத்தைத் தேர்வு செய்யவும்.",
    G_M: "ஆண்",
    G_F: "பெண்",
    G_O: "மற்றது",

    ASK_CONTACT_PHONE: "📞 *தொடர்பு எண்*\n\nசரியான மொபைல் எண்ணை உள்ளிடவும்.",
    INVALID_PHONE: "⚠️ தவறான மொபைல் எண்.\n\nசரியான எண்ணை உள்ளிடவும்.",

    CONFIRM_BOOKING_PROMPT: "✅ *உங்கள் முன்பதிவை உறுதி செய்யவும்*",
    CONFIRM_BOOKING: "உறுதி செய் ✅",
    EDIT_BOOKING: "திருத்து ✏️",
    CANCEL_BOOKING: "ரத்து ❌",

    TRACK_PROMPT:
      "🔍 *முன்பதிவை கண்காணிக்க*\n\nஉங்கள் *Booking ID* ஐ உள்ளிடவும்.",
    NO_BOOKING_FOUND: "❌ இந்த ID-க்கு முன்பதிவு இல்லை.",
    TRACK_STATUS_LINE:
      "📄 *முன்பதிவு நிலை*\n\nID: {{id}}\nபாதை: {{from}} → {{to}}\nதேதி: {{date}}\nநிலை: *{{status}}*",

    CITY_NOT_UNDERSTOOD:
      "⚠️ அந்த இடத்தை அடையாளம் காண முடியவில்லை.\n\n*ஆங்கிலத்தில் முழு நகர பெயரை* மீண்டும் உள்ளிடவும்.",
    INVALID_DATE: "❌ தவறான தேதி.\n\nசரியான *எதிர்கால பயண தேதியை* உள்ளிடவும்.",

    NUMBER_SELECT_HINT: "கீழே உள்ள பட்டியலில் இருந்து *எண்ணை* பதிலளிக்கவும்.",

    SELECT_FROM_STATION: "புறப்படும் நிலையத்தைத் தேர்வு செய்யவும்",
    SELECT_TO_STATION: "செல்லும் நிலையத்தைத் தேர்வு செய்யவும்",

    TRAIN_FROM_PROMPT:
      "📍 *புறப்படும் நிலையம்*\n\nபுறப்படும் ரயில் நிலையத்தின் பெயரை உள்ளிடவும்.\n\n✍️ *உதாரணம்:*\nசென்னை\nபெங்களூர்\nMAS",

    TRAIN_TO_PROMPT:
      "🎯 *செல்லும் நிலையம்*\n\nசெல்லும் ரயில் நிலையத்தின் பெயரை உள்ளிடவும்.\n\n✍️ *உதாரணம்:*\nமும்பை\nடெல்லி\nMAS",

    TRAIN_DATE_PROMPT:
      "📅 *பயண தேதி*\n\n*DD-MM-YYYY* வடிவில் தேதியை உள்ளிடவும்.\n\n✍️ *உதாரணம்:*\n25-01-2026",

    INVALID_NUMBER:
      "❌ தவறான எண். பட்டியலில் உள்ள சரியான எண்ணைத் தேர்வு செய்யவும்.",

    NO_STATIONS_FOUND:
      "❌ எந்த நிலையமும் கிடைக்கவில்லை.\n\n✍️ உதாரணம்:\nசென்னை\nMAS",

    FROM_TO_SAME_ERROR:
      "❌ செல்லும் நிலையம், புறப்படும் நிலையமாக இருக்கக்கூடாது.",

    INVALID_DATE_MSG:
      "❌ தவறான தேதி.\n\n✍️ எதிர்கால தேதியை DD-MM-YYYY வடிவில் உள்ளிடவும்.\nஉதாரணம்: 25-01-2026",

    TRAIN_CLASS_HELP:
      "🚆 *பயண வகையைத் தேர்வு செய்யவும்*\n\nநீங்கள் பயணிக்கும் பெட்டி வகையை இது தீர்மானிக்கும்.\n\n✍️ *உதாரணம்:*\nஸ்லீப்பர் குறைந்த செலவு, ஏசி வகைகள் அதிக வசதி.",

    CHOOSE_CLASS: "வகையைத் தேர்வு செய்",
    AVAILABLE_CLASSES: "கிடைக்கும் வகைகள்",

    TRAIN_QUOTA_HELP:
      "🎟 *ஒதுக்கீட்டைத் தேர்வு செய்யவும்*\n\nஒதுக்கீடு இருக்கை கிடைப்பை பாதிக்கும்.\n\n✍️ *உதாரணம்:*\nபொது = சாதாரண முன்பதிவு\nதட்கால் = அவசர முன்பதிவு",

    CHOOSE_QUOTA: "ஒதுக்கீடு",
    QUOTA_TYPE: "ஒதுக்கீடு வகை",

    TRAIN_BERTH_HELP:
      "🛏 *படுக்கை விருப்பம் (விருப்பம்)*\n\nஇது ஒரு விருப்பம் மட்டுமே.\nஉண்மையான ஒதுக்கீடு கிடைப்பை சார்ந்தது.\n\n✍️ *உதாரணம்:*\nகீழ் படுக்கையை தேர்வு செய்யலாம்.",

    CHOOSE_BERTH: "படுக்கை",
    BERTH_PREFERENCE: "படுக்கை விருப்பம்",

    PASSENGER_COUNT_HELP:
      "👥 *பயணிகள் எண்ணிக்கை*\n\nஎத்தனை பேர் பயணம் செய்கிறார்கள் என்பதைத் தேர்வு செய்யவும்.\n\n✍️ *உதாரணம்:*\n2 பேர் என்றால் *2* தேர்வு செய்யவும்.",

    PASSENGERS: "பயணிகள்",
    PASSENGER_COUNT: "பயணிகள் எண்ணிக்கை",

    INVALID_PAX_COUNT:
      "❌ 1 முதல் 6 வரை பயணிகள் எண்ணிக்கையைத் தேர்வு செய்யவும்.",

    PASSENGER_ENTRY_MODE:
      "👥 *பயணி விவரங்கள்*\n\nவிவரங்களை எவ்வாறு உள்ளிட விரும்புகிறீர்கள்?\n\n✍️ *உதாரணம்:*\nஒன்றாக ஒன்றாக = ஒவ்வொருவராக\nஒரே முறையில் = அனைத்தையும் சேர்த்து",

    BOOK_AGAIN_MSG: "🔄 புதிய ரயில் முன்பதிவு தொடங்கப்படுகிறது…",

    GENERIC_ERROR: "⚠️ ஏதோ தவறு ஏற்பட்டது.\n*BOOK AGAIN* என தட்டச்சு செய்யவும்",

    HELP_FALLBACK:
      "⚠️ தயவுசெய்து இதைப் பயன்படுத்தவும்:\n• RETRY\n• BOOK AGAIN\n• HELP",
  },

  /* =====================================================
   * HINDI (UX PARITY)
   * ===================================================== */
  hi: {
    WELCOME_TITLE: "👋 *Quickets में आपका स्वागत है*",
    WELCOME_DESC:
      "बस, ट्रेन और फ्लाइट टिकट आसानी से बुक करें।\n\n🚌 🚆 ✈️\nतेज़ • आसान • भरोसेमंद\n\nआइए यात्रा शुरू करें।",

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
    MENU_HELP: "मदद और सहायता",

    SUPPORT_INFO:
      "*Quickets सहायता*\n\n📩 एडमिन से चैट: +91 9894381195\n📧 Email: quicketsofficial@gmail.com\n📞 Phone: +91 8300984737\n⏰ समय: सुबह 7 – रात 11",

    HELP_TEXT:
      "🆘 *Quickets सहायता*\n\n• *MENU* – नई बुकिंग शुरू करें\n• *RETRY* – पिछला चरण दोहराएं\n• स्क्रीन पर दिए निर्देशों का पालन करें\n\n📞 सहायता: +91 9894381195",

    OOPS_TAP_OPTIONS: "कृपया उपलब्ध विकल्पों में से एक चुनें।",
    NOTHING_TO_RETRY: "दोहराने के लिए कुछ नहीं है।\n*MENU* लिखकर शुरू करें।",

    ASK_FROM:
      "🚌 *प्रस्थान स्थान*\n\n*शहर या कस्बे का नाम* लिखें।\nउदाहरण: चेन्नई",
    ASK_TO: "🎯 *गंतव्य*\n\n*गंतव्य शहर का नाम* लिखें।\nउदाहरण: कोयंबटूर",

    PICK_TIME_PREF: "⏰ *यात्रा का समय*\n\nनीचे दिए गए समय विकल्प चुनें।",

    TIME_MORNING: "सुबह (2AM – 10AM)",
    TIME_AFTERNOON: "दोपहर (10AM – 4PM)",
    TIME_EVENING: "शाम (4PM – 7PM)",
    TIME_NIGHT: "रात (7PM – 2AM)",

    HOW_MANY_PAX:
      "👥 *यात्रियों की संख्या*\n\nकितने लोग यात्रा कर रहे हैं, चुनें।",

    SEAT_TYPE_PROMPT: "💺 *सीट पसंद*\n\nअपनी पसंद की सीट चुनें।",

    SEAT_AC_SLEEPER: "एसी स्लीपर",
    SEAT_AC_SEATER: "एसी सीट",
    SEAT_NONAC_SLEEPER: "नॉन-एसी स्लीपर",
    SEAT_NONAC_SEATER: "नॉन-एसी सीट",

    BUDGET_PROMPT: "💰 *प्रति टिकट बजट*\n\nउपयुक्त बजट सीमा चुनें।",

    BUDGET_300U: "₹300 से कम",
    BUDGET_500: "₹500 से कम",
    BUDGET_700: "₹700 से कम",
    BUDGET_1000: "₹1000 से कम",
    BUDGET_1500: "₹1500 से कम",
    BUDGET_2000PLUS: "₹2000 से अधिक",

    TRAIN_ASK_FROM:
      "🚆 *प्रस्थान स्टेशन*\n\n*स्टेशन का नाम* लिखें।\nउदाहरण: चेन्नई सेंट्रल",
    TRAIN_ASK_TO:
      "🎯 *गंतव्य स्टेशन*\n\n*स्टेशन का नाम* लिखें।\nउदाहरण: बेंगलुरु",
    TRAIN_ASK_DATE:
      "📅 *यात्रा तिथि*\n\n*DD-MM-YYYY* प्रारूप में लिखें।\nउदाहरण: 25-01-2026",

    TRAIN_PICK_CLASS: "🚆 *यात्रा श्रेणी चुनें*",
    TRAIN_CLASS_SL: "स्लीपर",
    TRAIN_CLASS_3A: "एसी 3 टियर",
    TRAIN_CLASS_2A: "एसी 2 टियर",
    TRAIN_CLASS_1A: "फर्स्ट एसी",
    TRAIN_CLASS_CC: "चेयर कार",
    TRAIN_CLASS_2S: "सेकंड सीट",

    TRAIN_PICK_QUOTA: "🎟 *कोटा चुनें*",
    TRAIN_QUOTA_GN: "सामान्य",
    TRAIN_QUOTA_TATKAL: "तत्काल",
    TRAIN_QUOTA_LADIES: "महिला",
    TRAIN_QUOTA_SENIOR: "वरिष्ठ नागरिक",

    TRAIN_REVIEW: "🧾 *अपनी ट्रेन बुकिंग विवरण की समीक्षा करें*",

    TRAIN_CLASS_SL: "स्लीपर",
    TRAIN_CLASS_3A: "एसी 3 टियर",
    TRAIN_CLASS_2A: "एसी 2 टियर",
    TRAIN_CLASS_CC: "चेयर कार",
    TRAIN_CLASS_2S: "सेकंड सीट",

    BERTH_L: "निचली बर्थ",
    BERTH_M: "मध्य बर्थ",
    BERTH_U: "ऊपरी बर्थ",
    BERTH_SL: "साइड निचली",
    BERTH_SU: "साइड ऊपरी",
    BERTH_NONE: "कोई पसंद नहीं",

    FLIGHT_COMING_SOON: "✈️ *Quickets पर फ्लाइट बुकिंग जल्द शुरू होगी!*",

    PASSENGER_DETAILS_MODE:
      "🧾 *यात्री विवरण*\n\nआप विवरण कैसे दर्ज करना चाहते हैं?",

    PAX_BULK: "एक साथ",
    PAX_ONEBYONE: "एक-एक करके",

    FILL_PAX_BULK:
      "📋 *{{total}} यात्रियों का विवरण*\n\nप्रारूप:\nनाम, उम्र, लिंग\n\nउदाहरण:\nरवि, 28, पुरुष",

    NEED_EXACT_PAX:
      "⚠️ यात्रियों की संख्या मेल नहीं खाती।\nअपेक्षित: {{want}}\nप्राप्त: {{have}}",

    ENTER_NAME_PROMPT: "👤 *यात्री {{i}} / {{total}}*\n\nनाम दर्ज करें।",

    ENTER_AGE: "🎂 उम्र दर्ज करें।",
    INVALID_AGE: "⚠️ कृपया सही उम्र दर्ज करें।",

    PICK_GENDER: "🚻 लिंग चुनें।",
    G_M: "पुरुष",
    G_F: "महिला",
    G_O: "अन्य",

    ASK_CONTACT_PHONE: "📞 *संपर्क नंबर*\n\nमान्य मोबाइल नंबर दर्ज करें।",
    INVALID_PHONE: "⚠️ अमान्य मोबाइल नंबर।\n\nकृपया सही नंबर दर्ज करें।",

    CONFIRM_BOOKING_PROMPT: "✅ *अपनी बुकिंग की पुष्टि करें*",
    CONFIRM_BOOKING: "पुष्टि करें ✅",
    EDIT_BOOKING: "संपादित करें ✏️",
    CANCEL_BOOKING: "रद्द ❌",

    TRACK_PROMPT: "🔍 *अपनी बुकिंग ट्रैक करें*\n\nअपना *Booking ID* दर्ज करें।",
    NO_BOOKING_FOUND: "❌ इस ID के लिए कोई बुकिंग नहीं मिली।",
    TRACK_STATUS_LINE:
      "📄 *बुकिंग स्थिति*\n\nID: {{id}}\nमार्ग: {{from}} → {{to}}\nतिथि: {{date}}\nस्थिति: *{{status}}*",

    CITY_NOT_UNDERSTOOD:
      "⚠️ स्थान समझ में नहीं आया।\n\nकृपया *अंग्रेज़ी में पूरा शहर नाम* लिखें।",
    INVALID_DATE: "❌ गलत तारीख।\n\nकृपया *भविष्य की मान्य तारीख* दर्ज करें।",

    NUMBER_SELECT_HINT: "नीचे दी गई सूची से *संख्या* के साथ उत्तर दें।",

    SELECT_FROM_STATION: "प्रस्थान स्टेशन चुनें",
    SELECT_TO_STATION: "गंतव्य स्टेशन चुनें",

    TRAIN_FROM_PROMPT:
      "📍 *प्रस्थान स्टेशन*\n\nप्रस्थान रेलवे स्टेशन का नाम दर्ज करें।\n\n✍️ *उदाहरण:*\nचेन्नई\nबेंगलुरु\nMAS",

    TRAIN_TO_PROMPT:
      "🎯 *गंतव्य स्टेशन*\n\nगंतव्य रेलवे स्टेशन का नाम दर्ज करें।\n\n✍️ *उदाहरण:*\nमुंबई\nदिल्ली\nMAS",

    TRAIN_DATE_PROMPT:
      "📅 *यात्रा तिथि*\n\n*DD-MM-YYYY* प्रारूप में तारीख दर्ज करें।\n\n✍️ *उदाहरण:*\n25-01-2026",

    INVALID_NUMBER: "❌ गलत संख्या। कृपया सूची से सही संख्या चुनें।",

    NO_STATIONS_FOUND: "❌ कोई स्टेशन नहीं मिला।\n\n✍️ उदाहरण:\nचेन्नई\nMAS",

    FROM_TO_SAME_ERROR:
      "❌ गंतव्य स्टेशन, प्रस्थान स्टेशन के समान नहीं हो सकता।",

    INVALID_DATE_MSG:
      "❌ गलत तारीख।\n\n✍️ कृपया भविष्य की तारीख DD-MM-YYYY प्रारूप में दर्ज करें।\nउदाहरण: 25-01-2026",

    TRAIN_CLASS_HELP:
      "🚆 *यात्रा श्रेणी चुनें*\n\nयह तय करता है कि आप किस कोच में यात्रा करेंगे।\n\n✍️ *उदाहरण:*\nस्लीपर सस्ता होता है, एसी श्रेणियाँ अधिक आरामदायक होती हैं।",

    CHOOSE_CLASS: "श्रेणी चुनें",
    AVAILABLE_CLASSES: "उपलब्ध श्रेणियाँ",

    TRAIN_QUOTA_HELP:
      "🎟 *कोटा चुनें*\n\nकोटा सीट उपलब्धता को प्रभावित करता है।\n\n✍️ *उदाहरण:*\nसामान्य = सामान्य बुकिंग\nतत्काल = आखिरी समय की बुकिंग",

    CHOOSE_QUOTA: "कोटा",
    QUOTA_TYPE: "कोटा प्रकार",

    TRAIN_BERTH_HELP:
      "🛏 *बर्थ पसंद (वैकल्पिक)*\n\nयह केवल एक पसंद है।\nवास्तविक आवंटन उपलब्धता पर निर्भर करता है।\n\n✍️ *उदाहरण:*\nआसान चढ़ने के लिए *लोअर बर्थ* चुनें।",

    CHOOSE_BERTH: "बर्थ",
    BERTH_PREFERENCE: "बर्थ पसंद",

    PASSENGER_COUNT_HELP:
      "👥 *यात्रियों की संख्या*\n\nकितने लोग यात्रा करेंगे, चुनें।\n\n✍️ *उदाहरण:*\nयदि 2 लोग हैं तो *2* चुनें।",

    PASSENGERS: "यात्री",
    PASSENGER_COUNT: "यात्रियों की संख्या",

    INVALID_PAX_COUNT: "❌ कृपया 1 से 6 के बीच यात्री संख्या चुनें।",

    PASSENGER_ENTRY_MODE:
      "👥 *यात्री विवरण*\n\nआप विवरण कैसे दर्ज करना चाहते हैं?\n\n✍️ *उदाहरण:*\nएक-एक करके = प्रत्येक यात्री अलग\nएक साथ = सभी विवरण एक साथ",

    BOOK_AGAIN_MSG: "🔄 नई ट्रेन बुकिंग शुरू हो रही है…",

    GENERIC_ERROR: "⚠️ कुछ गलत हो गया।\n*BOOK AGAIN* लिखें",

    HELP_FALLBACK: "⚠️ कृपया टाइप करें:\n• RETRY\n• BOOK AGAIN\n• HELP",
  },
};

module.exports = optionSets;
