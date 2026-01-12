// const optionSets={
//      en: {
//         WELCOME_TITLE: "🎉 Welcome to *Quickets!*",
//         WELCOME_DESC: "Fast, friendly ticket assistance.\n\nChoose an option:",
//         LANG_PROMPT: "Select language:",
//         LANG_EN_LABEL: "English",
//         LANG_TA_LABEL: "தமிழ்",
//         MAIN: "Main",
//         MENU_BOOK: "Book Tickets",
//         MENU_TRACK: "Track Request",
//         MENU_MYBOOK: "My Bookings",
//         MENU_PASSENGERS: "Saved Passengers",         // <=24
//         MENU_HELP: "Help & Support",
//         MENU_ABOUT: "About Quickets",
//         SUPPORT_INFO: "*Support*\nChat: this WhatsApp\nEmail: quicketsofficial@gmail.com\nHours: 9am–9pm IST",
//         ABOUT: "*Quickets*\nFast, friendly ticket assistance. No hassle, no spam.",
//         NO_MSG: "No message in webhook (maybe status).",
//         DUP_MSG: "Duplicate message received, ignoring:",
//         ASK_FROM: "From city? (e.g., Hyderabad) — please *type in English*",
//         ASK_TO: "To city? (e.g., Visakhapatnam) — please *type in English*",
//         CITY_NOT_UNDERSTOOD: "I couldn’t understand that city.\nPlease type the *full city name* in English, e.g., Chennai",
//         CONFIRM_FROM_PROMPT: 'Did you mean *{{canonical}}* for "{{candidate}}"?',
//         CONFIRM_TO_PROMPT: 'Did you mean *{{canonical}}* for "{{candidate}}"?',
//         ASK_DATE: "Journey Date?\n(e.g., 24 Feb 2026 or 2026-02-24)\nOr use: tomorrow | day after tomorrow | next Monday | coming Friday night | this weekend",
//         INVALID_DATE:
//           "Invalid date ❌\n\nYou can type:\n• 24 Feb 2026\n• 2026-02-24\n• tomorrow\n• day after tomorrow\n• next Monday\n• coming Friday night\n• this weekend\n\nEnsure it’s not past and within 120 days.",
//         DATE_PAST: "That date is in the past. Please enter a future date (e.g., tomorrow, 24 Feb 2026).",
//         DATE_TOO_FAR: "Booking too far: please choose a date within the next {{maxAhead}} days.",
//         PICK_TIME_PREF: "Pick a time preference:",

//         // Short time labels (all <=24)
//         TIME_MORNING: "Morning",
//         TIME_AFTERNOON: "Afternoon",
//         TIME_EVENING: "Evening",
//         TIME_NIGHT: "Night",

//         HOW_MANY_PAX: "How many passengers?",
//         PAX_1: "1",
//         PAX_2: "2",
//         PAX_3: "3",
//         PAX_4: "4",
//         PAX_5: "5",
//         PAX_6: "6",

//         SEAT_TYPE_PROMPT: "Seat type preference?",

//         // Short seat labels (<=24)
//         SEAT_AC_SLEEPER: "AC Sleeper",
//         SEAT_AC_SEATER: "AC Seater",
//         SEAT_NONAC_SLEEPER: "Non-AC Sleeper",
//         SEAT_NONAC_SEATER: "Non-AC Seater",

//         PASSENGER_DETAILS_MODE: "Passenger details input:",
//         PAX_BULK: "Fill at once",                    // <=24
//         PAX_ONEBYONE: "Fill one-by-one",             // <=24

//         PASSENGER_BULK_EXAMPLE:
//           "Paste passengers (one per line) in the format:\n*name age gender* (type all in English)\n\nExample:\nAarav 28 M\nDiya 26 F\n(We will store anonymized entries only.)",
//         NEED_EXACT_PAX:
//           "I need exactly *{{want}}* passengers. You sent *{{have}}* I could read.\nFormat: *name age gender* (M/F/O)",
//         COULDNT_PARSE_PASS: "Couldn’t parse. Use: *name age gender*. Example:\nAarav 28 M",
//         ADDED_PASSENGERS: "Added {{count}} passengers.", // shortened
//         ENTER_AGE: "Enter *Age*",
//         INVALID_AGE: "Invalid age. Try again.",
//         PICK_GENDER: "Pick Gender:",
//         G_M: "Male",
//         G_F: "Female",
//         G_O: "Other",

//         REVIEW_REQUEST: "*Review your request*",
//         CONFIRM_BOOKING_PROMPT: "Confirm this booking?",
//         CONFIRM_BOOK: "Confirm",                      // <=24
//         EDIT_BOOK: "Edit",                            // <=24
//         CANCEL_BOOK: "Cancel",                        // <=24

//         CONFIRMED_BOOKING: "✅ *Confirmed*\nYour booking ID is *{{id}}*.\nWe’ll send details soon.",
//         CANCELLED: "Cancelled. No booking was created.",
//         TRACK_PROMPT:
//           "Enter your booking ID (e.g., QK-10023). If created today it may show *Pending* until confirmed.",
//         NO_BOOKING_FOUND: "No booking found for *{{id}}*.",
//         YOUR_BOOKINGS_NONE: "You have no confirmed bookings yet.",
//         YOUR_BOOKINGS_LIST: "*Your bookings:*\n{{lines}}",
//         SAVED_PASSENGERS_NONE: "No saved passengers yet.",

//         // shortened saved passengers list title for lists
//         SAVED_PASSENGERS_LIST: "*Saved Passengers:*\n{{lines}}", // <=24 inside single row title if used

//         CLEARED_PASSENGERS: "Cleared saved passengers.",
//         FILL_PAX_BULK:
//           "Please paste *{{total}}* passenger(s) like (type in English):\n\n• *Name<SPACE>Age<SPACE>Gender*\nExample:\nVikram 28 M\nSita 26 F\n",
//         OOPS_TAP_OPTIONS: "Please tap/select one of the options shown.",
//         MENU_PROMPT_SHORT: "Welcome to *Quickets!* \nFast, friendly ticket assistance.\n\nChoose an option:",
//         EDIT_BOOK_PROMPT: "Edit booking — pick time preference:",
//         ENTER_NAME_PROMPT: "Passenger {{i}}/{{total}} – enter Name (type in English)",
//         TRACK_STATUS_LINE: "*{{id}}* → {{from}} → {{to}}, {{date}}\nStatus: *{{status}}*",

//         // Budget labels & prompt (6 options) - all <=24
//         BUDGET_PROMPT: "Select your budget (INR):",
//         BUDGET_300U: "Under 300",
//         BUDGET_500: "500",
//         BUDGET_700: "700",
//         BUDGET_1000: "1000",
//         BUDGET_1500: "1500",
//         BUDGET_2000PLUS: "2000+",
//      },
//      ta: {
//         WELCOME_TITLE: "🎉 *Quickets* வரவேற்பு!",
//         WELCOME_DESC: "விரைவான, எளிய டிக்கெட் உதவி.\n\nதேர்வு செய்யவும்:",
//         LANG_PROMPT: "மொழியைத் தேர்வு செய்யவும்:",
//         LANG_EN_LABEL: "English",
//         LANG_TA_LABEL: "தமிழ்",

//         MAIN: "முகப்பு",

//         // Main menu (meaningful + short)
//         MENU_BOOK: "பேருந்து முன்பதிவு",
//         MENU_TRACK: "முன்பதிவு காண்க",
//         MENU_MYBOOK: "எனது முன்பதிவுகள்",
//         MENU_PASSENGERS: "பயணி பட்டியல்",
//         MENU_HELP: "உதவி மையம்",
//         MENU_ABOUT: "Quickets பற்றி",

//         SUPPORT_INFO: "*ஆதரவு*\nசாட்: இந்த WhatsApp\nமின்னஞ்சல்: quicketsofficial@gmail.com\nநேரம்: 9am–9pm IST",

//         ABOUT: "*Quickets*\nஉங்கள் பயணத்துக்கு விரைவான மற்றும் நம்பகமான டிக்கெட் உதவி.",

//         NO_MSG: "செய்தி இல்லை.",
//         DUP_MSG: "நகல் செய்தி, புறக்கணிக்கப்பட்டது.",

//         ASK_FROM: "புறப்படும் நகரம்?",
//         ASK_TO: "செல்லும் நகரம்?",

//         CITY_NOT_UNDERSTOOD:
//           "இந்த நகரம் புரியவில்லை.\nமுழு நகரப் பெயரை ஆங்கிலத்தில் எழுதவும்.",

//         CONFIRM_FROM_PROMPT: '“{{candidate}}” → *{{canonical}}* என உறுதிப்படுத்தவா?',
//         CONFIRM_TO_PROMPT: '“{{candidate}}” → *{{canonical}}* என உறுதிப்படுத்தவா?',

//         ASK_DATE:
//           "பயண தேதி? (e.g., 24 Feb 2026)\nஅல்லது: tomorrow / next Monday / weekend",

//         INVALID_DATE:
//           "தவறான தேதி ❌\nஉதாரணங்கள்: 24 Feb 2026, tomorrow.\nகடந்த தேதிகளைத் தேர்வு செய்ய வேண்டாம்.",

//         DATE_PAST: "இந்தத் தேதி கடந்துவிட்டது.",
//         DATE_TOO_FAR: "{{maxAhead}} நாட்களுக்குள் உள்ள தேதியைத் தேர்வு செய்யவும்.",

//         PICK_TIME_PREF: "நேரத்தை தேர்வு செய்யவும்:",

//         // Time labels — meaningful & short
//         TIME_MORNING: "காலை (2AM - 10AM)",
//         TIME_AFTERNOON: "மதியம் (10AM - 4PM)",
//         TIME_EVENING: "மாலை (4PM - 7PM)",
//         TIME_NIGHT: "இரவு (7PM - 2AM)",

//         HOW_MANY_PAX: "எத்தனை பயணிகள்?",

//         PAX_1: "1", PAX_2: "2", PAX_3: "3",
//         PAX_4: "4", PAX_5: "5", PAX_6: "6",

//         SEAT_TYPE_PROMPT: "இருக்கை வகை தேர்வு:",

//         // Seat types — natural Tamil
//         SEAT_AC_SLEEPER: "AC ஸ்லீப்பர்",
//         SEAT_AC_SEATER: "AC சீட்டர்",
//         SEAT_NONAC_SLEEPER: "Non-AC ஸ்லீப்பர்",
//         SEAT_NONAC_SEATER: "Non-AC சீட்டர்",

//         PASSENGER_DETAILS_MODE: "பயணி விவரங்கள்:",

//         // Passenger entry modes — meaningful
//         PAX_BULK: "ஒரே முறையில் சேர்க்க",
//         PAX_ONEBYONE: "ஒன்றாக ஒன்றாக சேர்க்க",

//         PASSENGER_BULK_EXAMPLE:
//           "ஒவ்வொரு வரியிலும்: பெயர் | வயது | பாலினம் — ஆங்கிலத்தில்.\nஎ.கா:\nVikram 28 M\nSita 26 F",

//         NEED_EXACT_PAX: "*{{want}}* பேர் வேண்டும்.\nநீங்கள் *{{have}}* பேரை தேர்ந்தெடுத்துள்ளீர்கள்.",

//         COULDNT_PARSE_PASS: "வடிவம் பிழை.\nஉதாரணம்: Aarav 28 M",

//         ADDED_PASSENGERS: "{{count}} பயணிகளை தேர்ந்தெடுத்துள்ளீர்கள்.",
//         ENTER_AGE: "வயதை எழுதவும்",
//         INVALID_AGE: "செல்லுபடியாகாத வயது.",
//         PICK_GENDER: "பாலினம் தேர்வு:",

//         G_M: "ஆண்",
//         G_F: "பெண்",
//         G_O: "மற்றது",

//         REVIEW_REQUEST: "*உங்கள் கோரிக்கை சுருக்கம்*",

//         CONFIRM_BOOKING_PROMPT: "முன்பதிவுகளை உறுதிப்படுத்தலாமா?",
//         CONFIRM_BOOK: "உறுதிப்படுத்து",
//         EDIT_BOOK: "மாற்று",
//         CANCEL_BOOK: "ரத்து செய்",

//         CONFIRMED_BOOKING: "✅ *உறுதிப்படுத்தப்பட்டது*\nபுக் ஐடி: *{{id}}*.",
//         CANCELLED: "முன்பதிவை ரத்து செய்யப்பட்டது.",

//         TRACK_PROMPT: "முன்பதிவின் ஐடி எழுதவும்.",
//         NO_BOOKING_FOUND: "*{{id}}* கிடைக்கவில்லை.",

//         YOUR_BOOKINGS_NONE: "முன்பதிவுகள் எதுவும் இல்லை.",
//         YOUR_BOOKINGS_LIST: "*உங்கள் முன்பதிவுகள்:*\n{{lines}}",

//         SAVED_PASSENGERS_NONE: "சேமிக்கப்பட்ட பயணிகள் இல்லை.",
//         SAVED_PASSENGERS_LIST: "*சேமிக்கப்பட்ட பயணிகள்:*\n{{lines}}",

//         CLEARED_PASSENGERS: "பயணி பட்டியல் அழிக்கப்பட்டது.",

//         FILL_PAX_BULK:
//           "*{{total}}* பேரை வரிசையாக எழுதவும்:\nபெயர் | வயது | பாலினம்\nஎ.கா: Vikram 28 M",

//         OOPS_TAP_OPTIONS: "கீழே உள்ள விருப்பங்களில் ஒன்றைத் தட்டவும்.",

//         MENU_PROMPT_SHORT: "Quickets வரவேற்பு!\nவிரைவான டிக்கெட் உதவி.",

//         EDIT_BOOK_PROMPT: "நேரம் தேர்வு செய்யவும்:",
//         ENTER_NAME_PROMPT: "பயணி {{i}}/{{total}} — பெயர் (EN)",

//         TRACK_STATUS_LINE: "*{{id}}* → {{from}} → {{to}}, {{date}}\nநிலை: *{{status}}*",

//         // Budget prompt & labels (natural Tamil)
//         BUDGET_PROMPT: "உங்கள் கட்டணத் தேர்வு:",
//         BUDGET_300U: "₹300க்கு கீழ்",
//         BUDGET_500: "₹500க்கு கீழ்",
//         BUDGET_700: "₹700க்கு கீழ்",
//         BUDGET_1000: "₹1000க்கு கீழ்",
//         BUDGET_1500: "₹1500க்கு கீழ்",
//         BUDGET_2000PLUS: "₹1500க்கு மேல்+",
//      },
// }
// module.exports = optionSets;

const optionSets = {
  en: {
    /* =========================
     * GLOBAL / MENU
     * ========================= */
    WELCOME_TITLE: "👋 Welcome to *Quickets*",
    WELCOME_DESC:
      "Book bus tickets in minutes.\nFast • Simple • Reliable",

    LANG_PROMPT: "Please select your language:",
    LANG_EN_LABEL: "English",
    LANG_TA_LABEL: "தமிழ்",

    MAIN: "Main Menu",

    MENU_BOOK_BUS: "🚌 Bus Ticket",
    MENU_BOOK_TRAIN: "🚆 Train Ticket",

    MENU_MYBOOK: "My Bookings",
    MENU_PASSENGERS: "Saved Passengers",
    MENU_HELP: "Help & Support",
    MENU_ABOUT: "About Quickets",

    SUPPORT_INFO:
      "*Quickets Support*\n\n📩 Chat: This WhatsApp\n📧 Email: quicketsofficial@gmail.com\n⏰ Hours: 6am – 11pm IST",

    ABOUT:
      "*Quickets*\nA simple, fast way to book travel tickets.\nNo spam. No hassle.",

    /* =========================
     * BOOKING – LOCATIONS
     * ========================= */
    ASK_FROM:
      "🚌 *Boarding location*\n\nType the *city or town name*.\nExample: Chennai",

    ASK_TO:
      "🎯 *Destination*\n\nType the *destination city*.\nExample: Coimbatore",

    CITY_NOT_UNDERSTOOD:
      "⚠️ I couldn’t recognise that place.\n\nPlease re-enter the *full city name* in English.",

    CONFIRM_FROM_PROMPT:
      "📍 Please confirm: From *{{canonical}}*?",

    CONFIRM_TO_PROMPT:
      "📍 Please confirm:\nTo *{{canonical}}*?",

    
    TRAIN_ASK_FROM:
      "🚆 *From Station*\n\nType the *boarding station name*.\nExample: Chennai Central",

    TRAIN_ASK_TO:
      "🎯 *To Station*\n\nType the *destination station*.\nExample: Bangalore",

    TRAIN_ASK_DATE:
      "📅 *Journey Date*\n\nType date in *DD-MM-YYYY*\nExample: 25-01-2026",


    /* =========================
     * DATE & TIME
     * ========================= */
    ASK_DATE:
      "📅 *Travel date*\n\nYou can type:\n• Today / Tomorrow\n• 25 Dec\n• 25/12/2025",

    INVALID_DATE:
      "❌ Invalid date.\n\nPlease enter a valid *future* travel date.",

    DATE_PAST:
      "⚠️ That date is in the past.\nPlease choose a future date.",

    DATE_TOO_FAR:
      "⚠️ You can book only within the next *{{maxAhead}} days*.",

    PICK_TIME_PREF:
      "⏰ *Preferred travel time*\n\nSelect a time slot below.",

    TIME_MORNING: "Morning (2AM - 10AM)",
    TIME_AFTERNOON: "Afternoon (10AM - 4PM)",
    TIME_EVENING: "Evening (4PM - 7PM)",
    TIME_NIGHT: "Night (7PM - 2AM)",


    /* =========================
 * TRAIN – CLASS & QUOTA
 * ========================= */

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


    /* =========================
     * PASSENGERS & SEAT
     * ========================= */
    HOW_MANY_PAX:
      "👥 *Number of passengers*\n\nSelect how many are travelling.",

    SEAT_TYPE_PROMPT:
      "💺 *Seat preference*\n\nChoose your preferred seat type.",

    SEAT_AC_SLEEPER: "AC Sleeper",
    SEAT_AC_SEATER: "AC Seater",
    SEAT_NONAC_SLEEPER: "Non-AC Sleeper",
    SEAT_NONAC_SEATER: "Non-AC Seater",

    /* =========================
     * BUDGET
     * ========================= */
    BUDGET_PROMPT:
      "💰 *Budget per ticket*\n\nSelect a comfortable range.",

    BUDGET_300U: "Under ₹300",
    BUDGET_500: "Under ₹500",
    BUDGET_700: "Under ₹700",
    BUDGET_1000: "Under ₹1000",
    BUDGET_1500: "Under ₹1500",
    BUDGET_2000PLUS: "Above ₹2000",

    /* =========================
     * PASSENGER DETAILS
     * ========================= */
    PASSENGER_DETAILS_MODE:
      "🧾 *Passenger details*\n\nHow would you like to enter details?",

    PAX_BULK: "Paste all at once",
    PAX_ONEBYONE: "Enter one by one",

    FILL_PAX_BULK:
      "📋 *Enter {{total}} passengers*\n\nFormat:\nName Age Gender\n\nExample:\nRavi 28 M\nAnu 24 F",

    NEED_EXACT_PAX:
      "⚠️ Passenger count mismatch.\n\nExpected: *{{want}}*\nReceived: *{{have}}*",

    ENTER_NAME_PROMPT:
      "👤 *Passenger {{i}} of {{total}}*\n\nEnter the *name*.",

    ENTER_AGE:
      "🎂 Enter the *age*.",

    INVALID_AGE:
      "⚠️ Please enter a valid age (numbers only).",

    PICK_GENDER:
      "🚻 Select *gender*.",

    G_M: "Male",
    G_F: "Female",
    G_O: "Other",

    /* =========================
     * SUMMARY & CONFIRMATION
     * ========================= */
    REVIEW_REQUEST:
      "🧾 *Review your booking details*",


    CONFIRM_BOOKING_PROMPT:
      "✅ *Ready to proceed?*\n\nConfirm or make changes.",

    CONFIRM_BOOK: "Confirm",
    EDIT_BOOK: "Edit",
    CANCEL_BOOK: "Cancel",

    CONFIRMED_BOOKING:
      "🎉 *Booking Confirmed!*\n\nBooking ID: *{{id}}*\n\nThank you for choosing *Quickets*.",

    CANCELLED:
      "❌ Booking cancelled.\nNo ticket was created.",


    TRAIN_REVIEW:
      "🧾 *Review your train booking details*",

    TRAIN_CONFIRMED:
      "🎟 *Train Booking Received!*\n\n" +
      "🆔 Booking ID: *{{id}}*\n\n" +
      "⏳ Our IRCTC agent will check availability and update you shortly.",


    /* =========================
     * TRACKING
     * ========================= */
    TRACK_PROMPT:
      "🔍 *Track your booking*\n\nEnter your *Booking ID*.\nExample: QK-10025",

    NO_BOOKING_FOUND:
      "❌ No booking found for *{{id}}*.",

    TRACK_STATUS_LINE:
      "📄 *Booking Status*\n\nID: {{id}}\nRoute: {{from}} → {{to}}\nDate: {{date}}\nStatus: *{{status}}*",

    /* =========================
     * MISC
     * ========================= */
    OOPS_TAP_OPTIONS:
      "Please tap one of the available options.",

    TICKET_CONFIRMED_TITLE: "🎟️ *QUIKETS — BOOKING CONFIRMED*",
    TICKET_REVIEW_TITLE: "🧾 *BOOKING REVIEW*",
    TICKET_JOURNEY: "🚍 *Journey*",
    TICKET_PASSENGERS: "👥 *Passengers ({{count}})*",
    TICKET_NEXT_STEPS: "ℹ️ *Next Steps*",
    TICKET_THANKS: "🙏 Thank you for choosing *Quickets*",

    /* =========================
     * HELP / RECOVERY
     * ========================= */
    HELP_TEXT:
      "🆘 *Quickets Help*\n\n" +
      "• To start a new booking, type *MENU*\n" +
      "• To retry the previous failed step, type *RETRY*\n" +
      "• Follow the step-by-step instructions shown\n" +
      "• Make sure to enter correct travel and passenger details\n" +
      "• Payment is mandatory to confirm your booking\n\n" +
      "💬 For any queries or support,\n" +
      "Chat with our Quickets Admin on WhatsApp:\n" +
      "👉 +91 9894381195\n\n" +
      "We’re here to help 🚍✨",

  },

  /* ====================================================================== */

  ta: {
    /* =========================
     * GLOBAL / MENU
     * ========================= */
    WELCOME_TITLE: "👋 *Quickets* வரவேற்கிறது",
    WELCOME_DESC:
      "நிமிடங்களில் டிக்கெட் முன்பதிவு.\nஎளிது • விரைவு • நம்பகமானது",

    LANG_PROMPT: "மொழியைத் தேர்வு செய்யவும்:",
    LANG_EN_LABEL: "English",
    LANG_TA_LABEL: "தமிழ்",

    MAIN: "முகப்பு",

    MENU_BOOK_BUS: "🚌 பேருந்து டிக்கெட்",
    MENU_BOOK_TRAIN: "🚆 ரயில் டிக்கெட்",

    MENU_TRACK: "முன்பதிவு நிலை",
    MENU_MYBOOK: "என் முன்பதிவுகள்",
    MENU_PASSENGERS: "பயணி விவரங்கள்",
    MENU_HELP: "உதவி",
    MENU_ABOUT: "Quickets பற்றி",

    SUPPORT_INFO:
      "*Quickets ஆதரவு*\n\n📩 சாட்: இந்த WhatsApp\n📧 மின்னஞ்சல்: quicketsofficial@gmail.com\n⏰ நேரம்: காலை 9 – இரவு 9",

    ABOUT:
      "*Quickets*\nஉங்கள் பயணத்திற்கு எளிய மற்றும் நம்பகமான டிக்கெட் சேவை.",

    /* =========================
     * BOOKING – LOCATIONS
     * ========================= */
    ASK_FROM:
      "🚌 *புறப்படும் இடம்*\n\nநகரம் அல்லது ஊரின் பெயரை எழுதவும்.\nஎ.கா: சென்னை",

    ASK_TO:
      "🎯 *செல்லும் இடம்*\n\nசெல்லும் நகரத்தை எழுதவும்.\nஎ.கா: கோயம்புத்தூர்",

    CITY_NOT_UNDERSTOOD:
      "⚠️ அந்த இடத்தை அறிய முடியவில்லை.\n\nநகரத்தின் முழுப் பெயரை ஆங்கிலத்தில் எழுதவும்.",

    CONFIRM_FROM_PROMPT:
      "📍 உறுதிப்படுத்தவும்:\n*{{canonical}}* தானா?",

    CONFIRM_TO_PROMPT:
      "📍 உறுதிப்படுத்தவும்:\nசெல்லும் இடம் *{{canonical}}* தானா?",


    TRAIN_ASK_FROM:
  "🚆 *புறப்படும் நிலையம்*\n\nரயில் நிலையத்தின் பெயரை எழுதவும்.\nஎ.கா: சென்னை சென்ட்ரல்",

TRAIN_ASK_TO:
  "🎯 *செல்லும் நிலையம்*\n\nரயில் நிலையத்தின் பெயரை எழுதவும்.\nஎ.கா: பெங்களூர்",

TRAIN_ASK_DATE:
  "📅 *பயண தேதி*\n\nDD-MM-YYYY வடிவில் எழுதவும்",

TRAIN_PICK_CLASS: "🚆 *பயண வகை*",
TRAIN_CLASS_SL: "ஸ்லீப்பர் (SL)",
TRAIN_CLASS_3A: "AC 3 டியர் (3A)",
TRAIN_CLASS_2A: "AC 2 டியர் (2A)",
TRAIN_CLASS_1A: "முதல் AC (1A)",
TRAIN_CLASS_CC: "சேர் கார் (CC)",
TRAIN_CLASS_2S: "இரண்டாம் வகுப்பு (2S)",

TRAIN_PICK_QUOTA: "🎟 *ஒதுக்கீடு வகை*",
TRAIN_QUOTA_GN: "பொது",
TRAIN_QUOTA_TATKAL: "தட்கால்",
TRAIN_QUOTA_LADIES: "பெண்கள்",
TRAIN_QUOTA_SENIOR: "மூத்த குடிமக்கள்",

TRAIN_CONFIRMED:
  "🎟 *ரயில் முன்பதிவு பெறப்பட்டது!*\n\n" +
  "🆔 புக் ஐடி: *{{id}}*\n\n" +
  "⏳ IRCTC முகவர் சரிபார்த்து விரைவில் தகவல் தருவார்.",


      

    /* =========================
     * DATE & TIME
     * ========================= */
    ASK_DATE:
      "📅 *பயண தேதி*\n\nஉதாரணம்:\n• இன்று / நாளை\n• 25 Dec\n• 25/12/2025",

    INVALID_DATE:
      "❌ தவறான தேதி.\n\nசரியான எதிர்கால தேதியை உள்ளிடவும்.",

    DATE_PAST:
      "⚠️ கடந்த தேதியை தேர்வு செய்ய முடியாது.",

    DATE_TOO_FAR:
      "⚠️ {{maxAhead}} நாட்களுக்குள் உள்ள தேதியை தேர்வு செய்யவும்.",

    PICK_TIME_PREF:
      "⏰ *பயண நேர விருப்பம்*\n\nஒரு நேரத்தைத் தேர்வு செய்யவும்.",

    TIME_MORNING: "காலை (2AM - 10AM)",
    TIME_AFTERNOON: "மதியம் (10AM - 4PM)",
    TIME_EVENING: "மாலை (4PM - 7PM)",
    TIME_NIGHT: "இரவு (7PM - 2AM)",

    /* =========================
     * PASSENGERS & SEAT
     * ========================= */
    HOW_MANY_PAX:
      "👥 *எத்தனை பயணிகள்?*\n\nஎண்ணிக்கையைத் தேர்வு செய்யவும்.",

    SEAT_TYPE_PROMPT:
      "💺 *இருக்கை வகை*\n\nஉங்கள் விருப்பத்தைத் தேர்வு செய்யவும்.",

    SEAT_AC_SLEEPER: "AC ஸ்லீப்பர்",
    SEAT_AC_SEATER: "AC சீட்டர்",
    SEAT_NONAC_SLEEPER: "Non-AC ஸ்லீப்பர்",
    SEAT_NONAC_SEATER: "Non-AC சீட்டர்",

    /* =========================
     * BUDGET
     * ========================= */
    BUDGET_PROMPT:
      "💰 *ஒரு டிக்கெட்டின் கட்டணம்*\n\nஉங்கள் வரம்பைத் தேர்வு செய்யவும்.",

    BUDGET_300U: "₹300க்கு கீழ்",
    BUDGET_500: "₹500",
    BUDGET_700: "₹700",
    BUDGET_1000: "₹1000",
    BUDGET_1500: "₹1500",
    BUDGET_2000PLUS: "₹2000+",

    /* =========================
     * PASSENGER DETAILS
     * ========================= */
    PASSENGER_DETAILS_MODE:
      "🧾 *பயணி விவரங்கள்*\n\nஎப்படி சேர்க்க விரும்புகிறீர்கள்?",

    PAX_BULK: "ஒரே முறையில்",
    PAX_ONEBYONE: "ஒன்றாக ஒன்றாக",

    FILL_PAX_BULK:
      "📋 *{{total}} பயணிகள் விவரம்*\n\nவடிவம்:\nபெயர் வயது பாலினம்\n\nஎ.கா:\nRavi 28 M\nAnu 24 F",

    NEED_EXACT_PAX:
      "⚠️ பயணிகள் எண்ணிக்கை பொருந்தவில்லை.\n\nதேவை: *{{want}}*\nகிடைத்தது: *{{have}}*",

    ENTER_NAME_PROMPT:
      "👤 *பயணி {{i}} / {{total}}*\n\nபெயரை எழுதவும்.",

    ENTER_AGE:
      "🎂 வயதை எழுதவும்.",

    INVALID_AGE:
      "⚠️ சரியான வயதை உள்ளிடவும்.",

    PICK_GENDER:
      "🚻 பாலினத்தைத் தேர்வு செய்யவும்.",

    G_M: "ஆண்",
    G_F: "பெண்",
    G_O: "மற்றது",

    /* =========================
     * SUMMARY & CONFIRMATION
     * ========================= */
    REVIEW_REQUEST:
      "🧾 *முன்பதிவு விவரங்கள் சரிபார்ப்பு*",


    CONFIRM_BOOKING_PROMPT:
      "✅ *தொடர வேண்டுமா?*\n\nஉறுதிப்படுத்தவும் அல்லது மாற்றவும்.",

    CONFIRM_BOOK: "உறுதி",
    EDIT_BOOK: "மாற்று",
    CANCEL_BOOK: "ரத்து",

    CONFIRMED_BOOKING:
      "🎉 *முன்பதிவு உறுதி செய்யப்பட்டது!*\n\nபுக் ஐடி: *{{id}}*\n\n*Quickets* தேர்வு செய்ததற்கு நன்றி.",

    CANCELLED:
      "❌ முன்பதிவு ரத்து செய்யப்பட்டது.",

    /* =========================
     * TRACKING
     * ========================= */
    TRACK_PROMPT:
      "🔍 *முன்பதிவு நிலை*\n\nபுக் ஐடியை உள்ளிடவும்.\nஎ.கா: QK-10025",

    NO_BOOKING_FOUND:
      "❌ *{{id}}* என்ற முன்பதிவு கிடைக்கவில்லை.",

    TRACK_STATUS_LINE:
      "📄 *முன்பதிவு நிலை*\n\nID: {{id}}\nபாதை: {{from}} → {{to}}\nதேதி: {{date}}\nநிலை: *{{status}}*",

    /* =========================
     * MISC
     * ========================= */
    OOPS_TAP_OPTIONS:
      "கீழே உள்ள விருப்பங்களில் ஒன்றைத் தேர்வு செய்யவும்.",
    TICKET_CONFIRMED_TITLE: "🎟️ *QUICKETS — முன்பதிவு உறுதிப்படுத்தப்பட்டது*",
    TICKET_REVIEW_TITLE: "🧾 *முன்பதிவு சுருக்கம்*",
    TICKET_JOURNEY: "🚍 *பயண விவரங்கள்*",
    TICKET_PASSENGERS: "👥 *பயணிகள் ({{count}})*",
    TICKET_NEXT_STEPS: "ℹ️ *அடுத்த படிகள்*",
    TICKET_THANKS: "🙏 *Quickets* தேர்ந்தெடுத்ததற்கு நன்றி",

        /* =========================
     * HELP / RECOVERY
     * ========================= */
    HELP_TEXT:
      "🆘 *Quickets உதவி*\n\n" +
      "• புதிய முன்பதிவை தொடங்க *MENU* என்று அனுப்பவும்\n" +
      "• முந்தைய தவறான படியை மீண்டும் முயற்சிக்க *RETRY* என்று அனுப்பவும்\n" +
      "• காட்டப்படும் படிகளை முறையாக பின்பற்றவும்\n" +
      "• பயண மற்றும் பயணி விவரங்களை சரியாக உள்ளிடவும்\n" +
      "• முன்பதிவை உறுதிப்படுத்த கட்டணம் கட்டாயம்\n\n" +
      "💬 ஏதேனும் கேள்விகள் அல்லது உதவிக்கு,\n" +
      "Quickets நிர்வாகியை WhatsApp-ல் தொடர்பு கொள்ளவும்:\n" +
      "👉 +91 9894381195\n\n" +
      "நாங்கள் உதவ தயாராக இருக்கிறோம் 🚍✨",


  },
};

module.exports = optionSets;
