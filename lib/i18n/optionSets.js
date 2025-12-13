module.esports={
     en: {
        WELCOME_TITLE: "🎉 Welcome to *Quickets!*",
        WELCOME_DESC: "Fast, friendly ticket assistance.\n\nChoose an option:",
        LANG_PROMPT: "Select language:",
        LANG_EN_LABEL: "English",
        LANG_TA_LABEL: "தமிழ்",
        MAIN: "Main",
        MENU_BOOK: "Book Tickets",
        MENU_TRACK: "Track Request",
        MENU_MYBOOK: "My Bookings",
        MENU_PASSENGERS: "Saved Passengers",         // <=24
        MENU_HELP: "Help & Support",
        MENU_ABOUT: "About Quickets",
        SUPPORT_INFO: "*Support*\nChat: this WhatsApp\nEmail: quicketsofficial@gmail.com\nHours: 9am–9pm IST",
        ABOUT: "*Quickets*\nFast, friendly ticket assistance. No hassle, no spam.",
        NO_MSG: "No message in webhook (maybe status).",
        DUP_MSG: "Duplicate message received, ignoring:",
        ASK_FROM: "From city? (e.g., Hyderabad) — please *type in English*",
        ASK_TO: "To city? (e.g., Visakhapatnam) — please *type in English*",
        CITY_NOT_UNDERSTOOD: "I couldn’t understand that city.\nPlease type the *full city name* in English, e.g., Chennai",
        CONFIRM_FROM_PROMPT: 'Did you mean *{{canonical}}* for "{{candidate}}"?',
        CONFIRM_TO_PROMPT: 'Did you mean *{{canonical}}* for "{{candidate}}"?',
        ASK_DATE: "Journey Date?\n(e.g., 24 Feb 2026 or 2026-02-24)\nOr use: tomorrow | day after tomorrow | next Monday | coming Friday night | this weekend",
        INVALID_DATE:
          "Invalid date ❌\n\nYou can type:\n• 24 Feb 2026\n• 2026-02-24\n• tomorrow\n• day after tomorrow\n• next Monday\n• coming Friday night\n• this weekend\n\nEnsure it’s not past and within 120 days.",
        DATE_PAST: "That date is in the past. Please enter a future date (e.g., tomorrow, 24 Feb 2026).",
        DATE_TOO_FAR: "Booking too far: please choose a date within the next {{maxAhead}} days.",
        PICK_TIME_PREF: "Pick a time preference:",

        // Short time labels (all <=24)
        TIME_MORNING: "Morning",
        TIME_AFTERNOON: "Afternoon",
        TIME_EVENING: "Evening",
        TIME_NIGHT: "Night",

        HOW_MANY_PAX: "How many passengers?",
        PAX_1: "1",
        PAX_2: "2",
        PAX_3: "3",
        PAX_4: "4",
        PAX_5: "5",
        PAX_6: "6",

        SEAT_TYPE_PROMPT: "Seat type preference?",

        // Short seat labels (<=24)
        SEAT_AC_SLEEPER: "AC Sleeper",
        SEAT_AC_SEATER: "AC Seater",
        SEAT_NONAC_SLEEPER: "Non-AC Sleeper",
        SEAT_NONAC_SEATER: "Non-AC Seater",

        PASSENGER_DETAILS_MODE: "Passenger details input:",
        PAX_BULK: "Fill at once",                    // <=24
        PAX_ONEBYONE: "Fill one-by-one",             // <=24

        PASSENGER_BULK_EXAMPLE:
          "Paste passengers (one per line) in the format:\n*name age gender* (type all in English)\n\nExample:\nAarav 28 M\nDiya 26 F\n(We will store anonymized entries only.)",
        NEED_EXACT_PAX:
          "I need exactly *{{want}}* passengers. You sent *{{have}}* I could read.\nFormat: *name age gender* (M/F/O)",
        COULDNT_PARSE_PASS: "Couldn’t parse. Use: *name age gender*. Example:\nAarav 28 M",
        ADDED_PASSENGERS: "Added {{count}} passengers.", // shortened
        ENTER_AGE: "Enter *Age*",
        INVALID_AGE: "Invalid age. Try again.",
        PICK_GENDER: "Pick Gender:",
        G_M: "Male",
        G_F: "Female",
        G_O: "Other",

        REVIEW_REQUEST: "*Review your request*",
        CONFIRM_BOOKING_PROMPT: "Confirm this booking?",
        CONFIRM_BOOK: "Confirm",                      // <=24
        EDIT_BOOK: "Edit",                            // <=24
        CANCEL_BOOK: "Cancel",                        // <=24

        CONFIRMED_BOOKING: "✅ *Confirmed*\nYour booking ID is *{{id}}*.\nWe’ll send details soon.",
        CANCELLED: "Cancelled. No booking was created.",
        TRACK_PROMPT:
          "Enter your booking ID (e.g., QK-10023). If created today it may show *Pending* until confirmed.",
        NO_BOOKING_FOUND: "No booking found for *{{id}}*.",
        YOUR_BOOKINGS_NONE: "You have no confirmed bookings yet.",
        YOUR_BOOKINGS_LIST: "*Your bookings:*\n{{lines}}",
        SAVED_PASSENGERS_NONE: "No saved passengers yet.",

        // shortened saved passengers list title for lists
        SAVED_PASSENGERS_LIST: "*Saved Passengers:*\n{{lines}}", // <=24 inside single row title if used

        CLEARED_PASSENGERS: "Cleared saved passengers.",
        FILL_PAX_BULK:
          "Please paste *{{total}}* passenger(s) like (type in English):\n\n• *Name<SPACE>Age<SPACE>Gender*\nExample:\nVikram 28 M\nSita 26 F\n",
        OOPS_TAP_OPTIONS: "Please tap/select one of the options shown.",
        MENU_PROMPT_SHORT: "Welcome to *Quickets!* \nFast, friendly ticket assistance.\n\nChoose an option:",
        EDIT_BOOK_PROMPT: "Edit booking — pick time preference:",
        ENTER_NAME_PROMPT: "Passenger {{i}}/{{total}} – enter Name (type in English)",
        TRACK_STATUS_LINE: "*{{id}}* → {{from}} → {{to}}, {{date}}\nStatus: *{{status}}*",

        // Budget labels & prompt (6 options) - all <=24
        BUDGET_PROMPT: "Select your budget (INR):",
        BUDGET_300U: "Under 300",
        BUDGET_500: "500",
        BUDGET_700: "700",
        BUDGET_1000: "1000",
        BUDGET_1500: "1500",
        BUDGET_2000PLUS: "2000+",
      },
      ta: {
        WELCOME_TITLE: "🎉 *Quickets* வரவேற்பு!",
        WELCOME_DESC: "விரைவான, எளிய டிக்கெட் உதவி.\n\nதேர்வு செய்யவும்:",
        LANG_PROMPT: "மொழியைத் தேர்வு செய்யவும்:",
        LANG_EN_LABEL: "English",
        LANG_TA_LABEL: "தமிழ்",

        MAIN: "முகப்பு",

        // Main menu (meaningful + short)
        MENU_BOOK: "பேருந்து முன்பதிவு",
        MENU_TRACK: "முன்பதிவு காண்க",
        MENU_MYBOOK: "எனது முன்பதிவுகள்",
        MENU_PASSENGERS: "பயணி பட்டியல்",
        MENU_HELP: "உதவி மையம்",
        MENU_ABOUT: "Quickets பற்றி",

        SUPPORT_INFO: "*ஆதரவு*\nசாட்: இந்த WhatsApp\nமின்னஞ்சல்: quicketsofficial@gmail.com\nநேரம்: 9am–9pm IST",

        ABOUT: "*Quickets*\nஉங்கள் பயணத்துக்கு விரைவான மற்றும் நம்பகமான டிக்கெட் உதவி.",

        NO_MSG: "செய்தி இல்லை.",
        DUP_MSG: "நகல் செய்தி, புறக்கணிக்கப்பட்டது.",

        ASK_FROM: "புறப்படும் நகரம்?",
        ASK_TO: "செல்லும் நகரம்?",

        CITY_NOT_UNDERSTOOD:
          "இந்த நகரம் புரியவில்லை.\nமுழு நகரப் பெயரை ஆங்கிலத்தில் எழுதவும்.",

        CONFIRM_FROM_PROMPT: '“{{candidate}}” → *{{canonical}}* என உறுதிப்படுத்தவா?',
        CONFIRM_TO_PROMPT: '“{{candidate}}” → *{{canonical}}* என உறுதிப்படுத்தவா?',

        ASK_DATE:
          "பயண தேதி? (e.g., 24 Feb 2026)\nஅல்லது: tomorrow / next Monday / weekend",

        INVALID_DATE:
          "தவறான தேதி ❌\nஉதாரணங்கள்: 24 Feb 2026, tomorrow.\nகடந்த தேதிகளைத் தேர்வு செய்ய வேண்டாம்.",

        DATE_PAST: "இந்தத் தேதி கடந்துவிட்டது.",
        DATE_TOO_FAR: "{{maxAhead}} நாட்களுக்குள் உள்ள தேதியைத் தேர்வு செய்யவும்.",

        PICK_TIME_PREF: "நேரத்தை தேர்வு செய்யவும்:",

        // Time labels — meaningful & short
        TIME_MORNING: "காலை (2AM - 10AM)",
        TIME_AFTERNOON: "மதியம் (10AM - 4PM)",
        TIME_EVENING: "மாலை (4PM - 7PM)",
        TIME_NIGHT: "இரவு (7PM - 2AM)",

        HOW_MANY_PAX: "எத்தனை பயணிகள்?",

        PAX_1: "1", PAX_2: "2", PAX_3: "3",
        PAX_4: "4", PAX_5: "5", PAX_6: "6",

        SEAT_TYPE_PROMPT: "இருக்கை வகை தேர்வு:",

        // Seat types — natural Tamil
        SEAT_AC_SLEEPER: "AC ஸ்லீப்பர்",
        SEAT_AC_SEATER: "AC சீட்டர்",
        SEAT_NONAC_SLEEPER: "Non-AC ஸ்லீப்பர்",
        SEAT_NONAC_SEATER: "Non-AC சீட்டர்",

        PASSENGER_DETAILS_MODE: "பயணி விவரங்கள்:",

        // Passenger entry modes — meaningful
        PAX_BULK: "ஒரே முறையில் சேர்க்க",
        PAX_ONEBYONE: "ஒன்றாக ஒன்றாக சேர்க்க",

        PASSENGER_BULK_EXAMPLE:
          "ஒவ்வொரு வரியிலும்: பெயர் | வயது | பாலினம் — ஆங்கிலத்தில்.\nஎ.கா:\nVikram 28 M\nSita 26 F",

        NEED_EXACT_PAX: "*{{want}}* பேர் வேண்டும்.\nநீங்கள் *{{have}}* பேரை தேர்ந்தெடுத்துள்ளீர்கள்.",

        COULDNT_PARSE_PASS: "வடிவம் பிழை.\nஉதாரணம்: Aarav 28 M",

        ADDED_PASSENGERS: "{{count}} பயணிகளை தேர்ந்தெடுத்துள்ளீர்கள்.",
        ENTER_AGE: "வயதை எழுதவும்",
        INVALID_AGE: "செல்லுபடியாகாத வயது.",
        PICK_GENDER: "பாலினம் தேர்வு:",

        G_M: "ஆண்",
        G_F: "பெண்",
        G_O: "மற்றது",

        REVIEW_REQUEST: "*உங்கள் கோரிக்கை சுருக்கம்*",

        CONFIRM_BOOKING_PROMPT: "முன்பதிவுகளை உறுதிப்படுத்தலாமா?",
        CONFIRM_BOOK: "உறுதிப்படுத்து",
        EDIT_BOOK: "மாற்று",
        CANCEL_BOOK: "ரத்து செய்",

        CONFIRMED_BOOKING: "✅ *உறுதிப்படுத்தப்பட்டது*\nபுக் ஐடி: *{{id}}*.",
        CANCELLED: "முன்பதிவை ரத்து செய்யப்பட்டது.",

        TRACK_PROMPT: "முன்பதிவின் ஐடி எழுதவும்.",
        NO_BOOKING_FOUND: "*{{id}}* கிடைக்கவில்லை.",

        YOUR_BOOKINGS_NONE: "முன்பதிவுகள் எதுவும் இல்லை.",
        YOUR_BOOKINGS_LIST: "*உங்கள் முன்பதிவுகள்:*\n{{lines}}",

        SAVED_PASSENGERS_NONE: "சேமிக்கப்பட்ட பயணிகள் இல்லை.",
        SAVED_PASSENGERS_LIST: "*சேமிக்கப்பட்ட பயணிகள்:*\n{{lines}}",

        CLEARED_PASSENGERS: "பயணி பட்டியல் அழிக்கப்பட்டது.",

        FILL_PAX_BULK:
          "*{{total}}* பேரை வரிசையாக எழுதவும்:\nபெயர் | வயது | பாலினம்\nஎ.கா: Vikram 28 M",

        OOPS_TAP_OPTIONS: "கீழே உள்ள விருப்பங்களில் ஒன்றைத் தட்டவும்.",

        MENU_PROMPT_SHORT: "Quickets வரவேற்பு!\nவிரைவான டிக்கெட் உதவி.",

        EDIT_BOOK_PROMPT: "நேரம் தேர்வு செய்யவும்:",
        ENTER_NAME_PROMPT: "பயணி {{i}}/{{total}} — பெயர் (EN)",

        TRACK_STATUS_LINE: "*{{id}}* → {{from}} → {{to}}, {{date}}\nநிலை: *{{status}}*",

        // Budget prompt & labels (natural Tamil)
        BUDGET_PROMPT: "உங்கள் கட்டணத் தேர்வு:",
        BUDGET_300U: "₹300க்கு கீழ்",
        BUDGET_500: "₹500க்கு கீழ்",
        BUDGET_700: "₹700க்கு கீழ்",
        BUDGET_1000: "₹1000க்கு கீழ்",
        BUDGET_1500: "₹1500க்கு கீழ்",
        BUDGET_2000PLUS: "₹1500க்கு மேல்+",
      },
}