#!/usr/bin/env python3
"""Apply the requested localized metadata and synchronize React/API sources."""

import copy
import json
import os


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGUAGES = ["en", "ta", "ml", "ar", "ur", "fr", "tr", "id", "bn", "ms"]

MOJIBAKE_REPLACEMENTS = {
    "Ä±": "ı", "ÄŸ": "ğ", "Äž": "Ğ", "Ä°": "İ",
    "ÅŸ": "ş", "Åž": "Ş", "Å’": "Œ", "Å“": "œ",
    "Ã§": "ç", "Ã‡": "Ç", "Ã¶": "ö", "Ã–": "Ö",
    "Ã¼": "ü", "Ãœ": "Ü", "Ã©": "é", "Ã¨": "è",
    "Ãª": "ê", "Ã¢": "â", "Ã´": "ô", "Ã®": "î",
    "Ã¯": "ï",
}

SICKNESS_NAME = {
    "en": "Dua for Recovery from Illness",
    "ta": "நோயிலிருந்து குணமடைவதற்கான துஆ",
    "ml": "രോഗശാന്തിക്കുള്ള ദുആ",
    "ar": "دعاء للتعافي من المرض",
    "ur": "بیماری سے شفا یابی کی دعا",
    "fr": "Invocation pour la guérison de la maladie",
    "tr": "Hastalıktan şifa bulma duası",
    "id": "Doa untuk kesembuhan dari penyakit",
    "bn": "অসুস্থতা থেকে সুস্থতার দোয়া",
    "ms": "Doa untuk sembuh daripada penyakit",
}

SICKNESS_DESCRIPTION = {
    "en": "Duas for illness and healing.",
    "ta": "நோய் மற்றும் குணமடைவதற்கான துஆக்கள்.",
    "ml": "രോഗത്തിനും രോഗശാന്തിക്കുമുള്ള ദുആകൾ.",
    "ar": "أدعية للمرض والشفاء.",
    "ur": "بیماری اور شفا کے لیے دعائیں۔",
    "fr": "Invocations pour la maladie et la guérison.",
    "tr": "Hastalık ve şifa için dualar.",
    "id": "Doa untuk penyakit dan kesembuhan.",
    "bn": "অসুস্থতা ও আরোগ্যের দোয়া।",
    "ms": "Doa untuk penyakit dan penyembuhan.",
}

PROPHET_NAMES = {
    "en": "Names of the Prophets (Asma ul Anbiya)",
    "ta": "நபிமார்களின் பெயர்கள் (Asma ul Anbiya)",
    "ml": "പ്രവാചകന്മാരുടെ പേരുകൾ (Asma ul Anbiya)",
    "ar": "أسماء الأنبياء (Asma ul Anbiya)",
    "ur": "انبیاء کے نام (Asma ul Anbiya)",
    "fr": "Noms des prophètes (Asma ul Anbiya)",
    "tr": "Peygamberlerin İsimleri (Asma ul Anbiya)",
    "id": "Nama para Nabi (Asma ul Anbiya)",
    "bn": "নবীদের নাম (Asma ul Anbiya)",
    "ms": "Nama-nama Nabi (Asma ul Anbiya)",
}

RABBANA_NAME = {
    "en": "40 Rabbana Duas",
    "ta": "40 ரப்பனா துஆக்கள்",
    "ml": "40 റബ്ബനാ ദുആകൾ",
    "ar": "أربعون دعاءً من أدعية ربنا",
    "ur": "40 ربنا کی دعائیں",
    "fr": "40 invocations Rabbana",
    "tr": "40 Rabbana duası",
    "id": "40 Doa Rabbana",
    "bn": "৪০টি রব্বানা দোয়া",
    "ms": "40 Doa Rabbana",
}

RABBANA_DESCRIPTION = {
    "en": "Forty Quranic supplications beginning with Rabbana (Our Lord).",
    "ta": "ரப்பனா (எங்கள் இறைவா) என்று தொடங்கும் நாற்பது குர்ஆன் துஆக்கள்.",
    "ml": "റബ്ബനാ (ഞങ്ങളുടെ രക്ഷിതാവേ) എന്ന് തുടങ്ങുന്ന നാൽപ്പത് ഖുർആൻ പ്രാർഥനകൾ.",
    "ar": "أربعون دعاءً قرآنيًا تبدأ بقول ربنا.",
    "ur": "ربنا (اے ہمارے رب) سے شروع ہونے والی قرآن کی چالیس دعائیں۔",
    "fr": "Quarante invocations coraniques commençant par Rabbana (Notre Seigneur).",
    "tr": "Rabbana (Rabbimiz) ile başlayan kırk Kur'an duası.",
    "id": "Empat puluh doa Al-Qur'an yang dimulai dengan Rabbana (Wahai Tuhan kami).",
    "bn": "রব্বানা (হে আমাদের রব) দিয়ে শুরু হওয়া কুরআনের চল্লিশটি দোয়া।",
    "ms": "Empat puluh doa al-Quran yang bermula dengan Rabbana (Wahai Tuhan kami).",
}

RABBANA_TRANSLATIONS = {
    "rabbana-16": {
        "ta": "எங்கள் இறைவா! நாங்கள் எங்களுக்கே அநீதி இழைத்துக் கொண்டோம். நீ எங்களை மன்னித்து எங்கள் மீது கருணை காட்டாவிட்டால், நிச்சயமாக இழப்பாளர்களில் ஒருவராகிவிடுவோம்.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, ഞങ്ങൾ ഞങ്ങളോടുതന്നെ അനീതി ചെയ്തു. നീ ഞങ്ങളോട് പൊറുക്കുകയും കരുണ കാണിക്കുകയും ചെയ്തില്ലെങ്കിൽ, തീർച്ചയായും ഞങ്ങൾ നഷ്ടക്കാരിൽപ്പെടും.",
        "ur": "اے ہمارے رب! ہم نے اپنی جانوں پر ظلم کیا؛ اگر تو نے ہمیں معاف نہ کیا اور ہم پر رحم نہ فرمایا تو ہم یقیناً نقصان اٹھانے والوں میں ہو جائیں گے۔",
        "fr": "Notre Seigneur, nous nous sommes fait du tort à nous-mêmes. Si Tu ne nous pardonnes pas et ne nous fais pas miséricorde, nous serons assurément parmi les perdants.",
        "tr": "Rabbimiz! Kendimize zulmettik. Bizi bağışlamaz ve bize merhamet etmezsen mutlaka ziyana uğrayanlardan oluruz.",
        "id": "Ya Tuhan kami, kami telah menzalimi diri kami sendiri. Jika Engkau tidak mengampuni kami dan merahmati kami, niscaya kami termasuk orang-orang yang rugi.",
        "bn": "হে আমাদের রব, আমরা নিজেদের প্রতি জুলুম করেছি। আপনি যদি আমাদের ক্ষমা না করেন এবং আমাদের প্রতি দয়া না করেন, তবে আমরা অবশ্যই ক্ষতিগ্রস্তদের অন্তর্ভুক্ত হব।",
        "ms": "Wahai Tuhan kami, kami telah menzalimi diri kami sendiri. Jika Engkau tidak mengampuni kami dan merahmati kami, nescaya kami termasuk dalam kalangan orang yang rugi.",
    },
    "rabbana-17": {
        "ta": "எங்கள் இறைவா! அநீதியிழைத்த மக்களுடன் எங்களை ஆக்கிவிடாதே.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, അക്രമികളായ ജനതയോടൊപ്പം ഞങ്ങളെ ആക്കരുതേ.",
        "ur": "اے ہمارے رب! ہمیں ظالم لوگوں کے ساتھ نہ کر۔",
        "fr": "Notre Seigneur, ne nous place pas parmi les gens injustes.",
        "tr": "Rabbimiz! Bizi zalim toplumla birlikte kılma.",
        "id": "Ya Tuhan kami, janganlah Engkau tempatkan kami bersama kaum yang zalim.",
        "bn": "হে আমাদের রব, আমাদেরকে জালিম সম্প্রদায়ের সঙ্গে রাখবেন না।",
        "ms": "Wahai Tuhan kami, janganlah Engkau tempatkan kami bersama kaum yang zalim.",
    },
    "rabbana-18": {
        "ta": "எங்கள் இறைவா! எங்களுக்கும் எங்கள் மக்களுக்கும் இடையில் உண்மையைக் கொண்டு தீர்ப்பளிப்பாயாக. நீயே மிகச் சிறந்த தீர்ப்பளிப்பவனாவாய்.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, ഞങ്ങൾക്കും ഞങ്ങളുടെ ജനതയ്ക്കുമിടയിൽ സത്യപ്രകാരം നീ വിധിക്കേണമേ. വിധിക്കുന്നവരിൽ ഏറ്റവും ഉത്തമൻ നീയാകുന്നു.",
        "ur": "اے ہمارے رب! ہمارے اور ہماری قوم کے درمیان حق کے ساتھ فیصلہ فرما، اور تو سب سے بہتر فیصلہ کرنے والا ہے۔",
        "fr": "Notre Seigneur, tranche entre nous et notre peuple en toute vérité ; Tu es le meilleur des arbitres.",
        "tr": "Rabbimiz! Bizimle kavmimiz arasında hak ile hükmet. Sen hükmedenlerin en hayırlısısın.",
        "id": "Ya Tuhan kami, berilah keputusan antara kami dan kaum kami dengan kebenaran. Engkaulah pemberi keputusan yang terbaik.",
        "bn": "হে আমাদের রব, আমাদের ও আমাদের সম্প্রদায়ের মধ্যে ন্যায়ের সঙ্গে মীমাংসা করে দিন। আপনিই শ্রেষ্ঠ মীমাংসাকারী।",
        "ms": "Wahai Tuhan kami, berilah keputusan antara kami dengan kaum kami menurut kebenaran. Engkaulah sebaik-baik pemberi keputusan.",
    },
    "rabbana-19": {
        "ta": "எங்கள் இறைவா! எங்கள் மீது பொறுமையைப் பொழிவாயாக; முஸ்லிம்களாக இருக்கும்போதே எங்களை மரணிக்கச் செய்வாயாக.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, ഞങ്ങളുടെ മേൽ ക്ഷമ ചൊരിയേണമേ; മുസ്‌ലിംകളായിരിക്കെ ഞങ്ങളെ മരിപ്പിക്കേണമേ.",
        "ur": "اے ہمارے رب! ہم پر صبر انڈیل دے اور ہمیں مسلمان ہونے کی حالت میں وفات دے۔",
        "fr": "Notre Seigneur, répands sur nous la patience et fais-nous mourir en musulmans.",
        "tr": "Rabbimiz! Üzerimize sabır yağdır ve canımızı Müslümanlar olarak al.",
        "id": "Ya Tuhan kami, limpahkanlah kesabaran kepada kami dan wafatkanlah kami dalam keadaan muslim.",
        "bn": "হে আমাদের রব, আমাদের ওপর ধৈর্য ঢেলে দিন এবং মুসলিম অবস্থায় আমাদের মৃত্যু দিন।",
        "ms": "Wahai Tuhan kami, limpahkanlah kesabaran kepada kami dan wafatkanlah kami dalam keadaan Muslim.",
    },
    "rabbana-20": {
        "ta": "என் இறைவா! என்னையும் என் சகோதரரையும் மன்னித்து, உன் கருணையில் எங்களைப் பிரவேசிக்கச் செய்வாயாக. கருணை காட்டுவோரில் நீயே மிகச் சிறந்தவன்.",
        "ml": "എന്റെ രക്ഷിതാവേ, എനിക്കും എന്റെ സഹോദരനും പൊറുത്തുതരേണമേ; ഞങ്ങളെ നിന്റെ കാരുണ്യത്തിൽ പ്രവേശിപ്പിക്കേണമേ. കാരുണ്യം കാണിക്കുന്നവരിൽ ഏറ്റവും ഉത്തമൻ നീയാകുന്നു.",
        "ur": "اے میرے رب! مجھے اور میرے بھائی کو بخش دے اور ہمیں اپنی رحمت میں داخل فرما۔ تو سب رحم کرنے والوں سے بڑھ کر رحم کرنے والا ہے۔",
        "fr": "Mon Seigneur, pardonne-moi ainsi qu'à mon frère, fais-nous entrer dans Ta miséricorde ; Tu es le plus miséricordieux des miséricordieux.",
        "tr": "Rabbim! Beni ve kardeşimi bağışla, bizi rahmetine kabul et. Sen merhamet edenlerin en merhametlisisin.",
        "id": "Ya Tuhanku, ampunilah aku dan saudaraku, masukkanlah kami ke dalam rahmat-Mu. Engkaulah Yang Maha Penyayang di antara para penyayang.",
        "bn": "হে আমার রব, আমাকে ও আমার ভাইকে ক্ষমা করুন এবং আমাদেরকে আপনার রহমতে প্রবেশ করান। আপনিই দয়াশীলদের মধ্যে সর্বশ্রেষ্ঠ দয়ালু।",
        "ms": "Wahai Tuhanku, ampunilah aku dan saudaraku, serta masukkanlah kami ke dalam rahmat-Mu. Engkaulah Yang Maha Penyayang antara para penyayang.",
    },
    "rabbana-21": {
        "ta": "எங்கள் இறைவா! அநீதியிழைத்த மக்களுக்கு எங்களை ஒரு சோதனையாக ஆக்காதே.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, അക്രമികളായ ജനതയ്ക്ക് ഞങ്ങളെ ഒരു പരീക്ഷണമാക്കരുതേ.",
        "ur": "اے ہمارے رب! ہمیں ظالم لوگوں کے لیے آزمائش نہ بنا۔",
        "fr": "Notre Seigneur, ne fais pas de nous une épreuve pour les gens injustes.",
        "tr": "Rabbimiz! Bizi zalim kavim için bir imtihan vesilesi kılma.",
        "id": "Ya Tuhan kami, janganlah Engkau jadikan kami sebagai cobaan bagi kaum yang zalim.",
        "bn": "হে আমাদের রব, জালিম সম্প্রদায়ের জন্য আমাদেরকে পরীক্ষার বিষয় করবেন না।",
        "ms": "Wahai Tuhan kami, janganlah Engkau jadikan kami sebagai ujian bagi kaum yang zalim.",
    },
    "rabbana-22": {
        "ta": "எங்கள் இறைவா! நாங்கள் எங்களுக்கே அநீதி இழைத்துக் கொண்டோம். நீ எங்களை மன்னித்து எங்கள் மீது கருணை காட்டாவிட்டால், நிச்சயமாக இழப்பாளர்களில் ஒருவராகிவிடுவோம்.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, ഞങ്ങൾ ഞങ്ങളോടുതന്നെ അനീതി ചെയ്തു. നീ ഞങ്ങളോട് പൊറുക്കുകയും കരുണ കാണിക്കുകയും ചെയ്തില്ലെങ്കിൽ, തീർച്ചയായും ഞങ്ങൾ നഷ്ടക്കാരിൽപ്പെടും.",
        "ur": "اے ہمارے رب! ہم نے اپنی جانوں پر ظلم کیا۔ اگر تو نے ہمیں معاف نہ کیا اور ہم پر رحم نہ فرمایا تو ہم یقیناً نقصان اٹھانے والوں میں ہو جائیں گے۔",
        "fr": "Notre Seigneur, nous nous sommes fait du tort à nous-mêmes. Si Tu ne nous pardonnes pas et ne nous fais pas miséricorde, nous serons assurément parmi les perdants.",
        "tr": "Rabbimiz! Kendimize zulmettik. Bizi bağışlamaz ve bize merhamet etmezsen mutlaka ziyana uğrayanlardan oluruz.",
        "id": "Ya Tuhan kami, kami telah menzalimi diri kami sendiri. Jika Engkau tidak mengampuni kami dan merahmati kami, niscaya kami termasuk orang-orang yang rugi.",
        "bn": "হে আমাদের রব, আমরা নিজেদের প্রতি জুলুম করেছি। আপনি যদি আমাদের ক্ষমা না করেন এবং আমাদের প্রতি দয়া না করেন, তবে আমরা অবশ্যই ক্ষতিগ্রস্তদের অন্তর্ভুক্ত হব।",
        "ms": "Wahai Tuhan kami, kami telah menzalimi diri kami sendiri. Jika Engkau tidak mengampuni kami dan merahmati kami, nescaya kami termasuk dalam kalangan orang yang rugi.",
    },
    "rabbana-23": {
        "ta": "எங்கள் இறைவா! உன்னையே நாங்கள் நம்பியுள்ளோம்; உன்னிடமே திரும்பியுள்ளோம்; உன்னிடமே இறுதித் திரும்புதல் உள்ளது.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, നിന്നിൽ ഞങ്ങൾ ഭരമേൽപ്പിച്ചിരിക്കുന്നു; നിന്നിലേക്കാണ് ഞങ്ങൾ മടങ്ങിയിരിക്കുന്നത്; നിന്നിലേക്കാണ് മടക്കം.",
        "ur": "اے ہمارے رب! ہم نے تجھ ہی پر بھروسا کیا، تیری ہی طرف رجوع کیا، اور تیری ہی طرف لوٹ کر جانا ہے۔",
        "fr": "Notre Seigneur, c'est en Toi que nous plaçons notre confiance, vers Toi que nous revenons, et vers Toi est le retour.",
        "tr": "Rabbimiz! Sana tevekkül ettik, Sana yöneldik ve dönüş yalnız Sanadır.",
        "id": "Ya Tuhan kami, hanya kepada-Mu kami bertawakal, kepada-Mu kami kembali, dan kepada-Mulah tempat kembali.",
        "bn": "হে আমাদের রব, আমরা আপনারই ওপর ভরসা করেছি, আপনারই দিকে ফিরেছি এবং আপনারই কাছে ফিরে যেতে হবে।",
        "ms": "Wahai Tuhan kami, kepada-Mu kami bertawakal, kepada-Mu kami kembali, dan kepada-Mu tempat kembali.",
    },
    "rabbana-24": {
        "ta": "எங்கள் இறைவா! அநீதியிழைத்த மக்களுக்கு எங்களை ஒரு சோதனையாக ஆக்காதே.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, അക്രമികളായ ജനതയ്ക്ക് ഞങ്ങളെ ഒരു പരീക്ഷണമാക്കരുതേ.",
        "ur": "اے ہمارے رب! ہمیں ظالم لوگوں کے لیے آزمائش نہ بنا۔",
        "fr": "Notre Seigneur, ne fais pas de nous une épreuve pour les gens injustes.",
        "tr": "Rabbimiz! Bizi zalim kavim için bir imtihan vesilesi kılma.",
        "id": "Ya Tuhan kami, janganlah Engkau jadikan kami sebagai cobaan bagi kaum yang zalim.",
        "bn": "হে আমাদের রব, জালিম সম্প্রদায়ের জন্য আমাদেরকে পরীক্ষার বিষয় করবেন না।",
        "ms": "Wahai Tuhan kami, janganlah Engkau jadikan kami sebagai ujian bagi kaum yang zalim.",
    },
    "rabbana-25": {
        "ta": "எங்கள் இறைவா! அநீதியிழைத்த மக்களிடமிருந்து எங்களைக் காப்பாற்றுவாயாக.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, അക്രമികളായ ജനതയിൽ നിന്ന് ഞങ്ങളെ രക്ഷിക്കേണമേ.",
        "ur": "اے ہمارے رب! ہمیں ظالم لوگوں سے نجات دے۔",
        "fr": "Notre Seigneur, sauve-nous des gens injustes.",
        "tr": "Rabbimiz! Bizi zalim kavimden kurtar.",
        "id": "Ya Tuhan kami, selamatkanlah kami dari kaum yang zalim.",
        "bn": "হে আমাদের রব, জালিম সম্প্রদায়ের হাত থেকে আমাদের রক্ষা করুন।",
        "ms": "Wahai Tuhan kami, selamatkanlah kami daripada kaum yang zalim.",
    },
    "rabbana-26": {
        "ta": "என் இறைவா! இந்த நகரத்தைப் பாதுகாப்பானதாக ஆக்குவாயாக; என்னையும் என் மகன்களையும் சிலைகளை வணங்குவதிலிருந்து விலக்குவாயாக.",
        "ml": "എന്റെ രക്ഷിതാവേ, ഈ നാടിനെ സുരക്ഷിതമാക്കേണമേ; എന്നെയും എന്റെ പുത്രന്മാരെയും വിഗ്രഹങ്ങളെ ആരാധിക്കുന്നതിൽ നിന്ന് അകറ്റേണമേ.",
        "ur": "اے میرے رب! اس شہر کو امن والا بنا دے اور مجھے اور میری اولاد کو بتوں کی عبادت سے بچا۔",
        "fr": "Mon Seigneur, fais de cette cité un lieu sûr et préserve-moi, ainsi que mes fils, de l'adoration des idoles.",
        "tr": "Rabbim! Bu şehri güvenli kıl; beni ve oğullarımı putlara tapmaktan uzak tut.",
        "id": "Ya Tuhanku, jadikanlah negeri ini aman dan jauhkanlah aku serta anak-anakku dari menyembah berhala.",
        "bn": "হে আমার রব, এই নগরীকে নিরাপদ করুন এবং আমাকে ও আমার সন্তানদের মূর্তিপূজা থেকে দূরে রাখুন।",
        "ms": "Wahai Tuhanku, jadikanlah negeri ini aman dan jauhkanlah aku serta anak-anakku daripada menyembah berhala.",
    },
    "rabbana-27": {
        "ta": "என் இறைவா! நிச்சயமாக அவை மக்களில் பலரை வழிதவறச் செய்துவிட்டன.",
        "ml": "എന്റെ രക്ഷിതാവേ, അവ ജനങ്ങളിൽ പലരെയും വഴിതെറ്റിച്ചിരിക്കുന്നു.",
        "ur": "اے میرے رب! بے شک انہوں نے بہت سے لوگوں کو گمراہ کر دیا ہے۔",
        "fr": "Mon Seigneur, elles ont certes égaré un grand nombre de gens.",
        "tr": "Rabbim! Gerçekten onlar insanlardan birçoğunu saptırdılar.",
        "id": "Ya Tuhanku, sesungguhnya berhala-berhala itu telah menyesatkan banyak manusia.",
        "bn": "হে আমার রব, নিশ্চয়ই তারা বহু মানুষকে পথভ্রষ্ট করেছে।",
        "ms": "Wahai Tuhanku, sesungguhnya berhala-berhala itu telah menyesatkan ramai manusia.",
    },
    "rabbana-28": {
        "ta": "என் இறைவா! என்னையும் என் சந்ததியினரில் சிலரையும் தொழுகையை நிலைநாட்டுவோராக்குவாயாக. எங்கள் இறைவா! என் பிரார்த்தனையை ஏற்றுக்கொள்வாயாக.",
        "ml": "എന്റെ രക്ഷിതാവേ, എന്നെയും എന്റെ സന്തതികളിൽ ചിലരെയും നമസ്കാരം നിലനിർത്തുന്നവരാക്കേണമേ. ഞങ്ങളുടെ രക്ഷിതാവേ, എന്റെ പ്രാർഥന സ്വീകരിക്കേണമേ.",
        "ur": "اے میرے رب! مجھے اور میری اولاد میں سے بعض کو نماز قائم کرنے والا بنا۔ اے ہمارے رب! میری دعا قبول فرما۔",
        "fr": "Mon Seigneur, fais de moi et de certains de mes descendants des gens assidus à la prière. Notre Seigneur, accepte ma supplication.",
        "tr": "Rabbim! Beni ve soyumdan gelenleri namazı dosdoğru kılanlardan eyle. Rabbimiz! Duamı kabul buyur.",
        "id": "Ya Tuhanku, jadikanlah aku dan sebagian keturunanku orang yang tetap mendirikan salat. Ya Tuhan kami, perkenankanlah doaku.",
        "bn": "হে আমার রব, আমাকে ও আমার বংশধরদের মধ্য থেকে কাউকে সালাত কায়েমকারী করুন। হে আমাদের রব, আমার প্রার্থনা কবুল করুন।",
        "ms": "Wahai Tuhanku, jadikanlah aku dan sebahagian keturunanku orang yang mendirikan solat. Wahai Tuhan kami, terimalah doaku.",
    },
    "rabbana-29": {
        "ta": "எங்கள் இறைவா! கணக்கு நிலைநாட்டப்படும் நாளில் என்னையும் என் பெற்றோரையும் நம்பிக்கையாளர்களையும் மன்னிப்பாயாக.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, വിചാരണ നിലവിൽ വരുന്ന ദിവസം എനിക്കും എന്റെ മാതാപിതാക്കൾക്കും വിശ്വാസികൾക്കും പൊറുത്തുതരേണമേ.",
        "ur": "اے ہمارے رب! جس دن حساب قائم ہوگا، مجھے، میرے والدین کو اور اہل ایمان کو بخش دینا۔",
        "fr": "Notre Seigneur, pardonne-moi, à mes parents et aux croyants, le jour où le compte sera établi.",
        "tr": "Rabbimiz! Hesabın görüleceği gün beni, anne babamı ve müminleri bağışla.",
        "id": "Ya Tuhan kami, ampunilah aku, kedua orang tuaku, dan orang-orang beriman pada hari perhitungan ditegakkan.",
        "bn": "হে আমাদের রব, যেদিন হিসাব অনুষ্ঠিত হবে সেদিন আমাকে, আমার পিতা-মাতাকে এবং মুমিনদের ক্ষমা করুন।",
        "ms": "Wahai Tuhan kami, ampunilah aku, kedua-dua ibu bapaku dan orang yang beriman pada hari perhitungan ditegakkan.",
    },
    "rabbana-30": {
        "ta": "என் இறைவா! என்னை உண்மையான நுழைவிடத்தில் நுழையச் செய்து, உண்மையான வெளியேற்றத்துடன் வெளியேற்றுவாயாக; உன்னிடமிருந்து எனக்கு உதவும் அதிகாரத்தை வழங்குவாயாக.",
        "ml": "എന്റെ രക്ഷിതാവേ, സത്യസന്ധമായ പ്രവേശനത്തിലൂടെ എന്നെ പ്രവേശിപ്പിക്കുകയും സത്യസന്ധമായ പുറപ്പെടലിലൂടെ എന്നെ പുറപ്പെടുവിക്കുകയും ചെയ്യേണമേ; നിന്റെ പക്കൽ നിന്ന് സഹായിക്കുന്ന അധികാരം എനിക്ക് നൽകേണമേ.",
        "ur": "اے میرے رب! مجھے سچائی کے ساتھ داخل فرما اور سچائی کے ساتھ نکال، اور اپنے پاس سے میرے لیے مددگار اقتدار عطا فرما۔",
        "fr": "Mon Seigneur, fais-moi entrer par une entrée véridique et sortir par une sortie véridique, et accorde-moi de Ta part une autorité secourable.",
        "tr": "Rabbim! Beni doğrulukla gireceğim bir yere sok, doğrulukla çıkacağım bir yerden çıkar ve katından bana yardımcı bir güç ver.",
        "id": "Ya Tuhanku, masukkanlah aku dengan cara yang benar dan keluarkanlah aku dengan cara yang benar, serta berilah aku dari sisi-Mu kekuasaan yang menolong.",
        "bn": "হে আমার রব, আমাকে সত্যতার সঙ্গে প্রবেশ করান এবং সত্যতার সঙ্গে বের করুন; আর আপনার পক্ষ থেকে আমাকে সহায়ক কর্তৃত্ব দান করুন।",
        "ms": "Wahai Tuhanku, masukkanlah aku dengan cara yang benar dan keluarkanlah aku dengan cara yang benar, serta kurniakanlah kepadaku daripada sisi-Mu kekuasaan yang membantu.",
    },
    "rabbana-31": {
        "ta": "எங்கள் இறைவா! உன்னிடமிருந்து எங்களுக்கு அருளை வழங்கி, எங்கள் காரியத்தில் எங்களுக்கு நேர்வழியை ஏற்படுத்துவாயாக.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, നിന്റെ പക്കൽ നിന്ന് ഞങ്ങൾക്ക് കാരുണ്യം നൽകുകയും ഞങ്ങളുടെ കാര്യത്തിൽ ശരിയായ മാർഗം ഒരുക്കുകയും ചെയ്യേണമേ.",
        "ur": "اے ہمارے رب! ہمیں اپنے پاس سے رحمت عطا فرما اور ہمارے معاملے میں ہمارے لیے درست رہنمائی مہیا کر۔",
        "fr": "Notre Seigneur, accorde-nous une miséricorde venant de Toi et assure-nous une bonne conduite dans notre affaire.",
        "tr": "Rabbimiz! Bize katından rahmet ver ve işimizde bize doğru yolu hazırla.",
        "id": "Ya Tuhan kami, anugerahkanlah rahmat kepada kami dari sisi-Mu dan siapkanlah petunjuk yang tepat bagi urusan kami.",
        "bn": "হে আমাদের রব, আপনার পক্ষ থেকে আমাদেরকে রহমত দান করুন এবং আমাদের কাজের জন্য সঠিক পথের ব্যবস্থা করুন।",
        "ms": "Wahai Tuhan kami, kurniakanlah rahmat kepada kami daripada sisi-Mu dan sediakanlah petunjuk yang tepat dalam urusan kami.",
    },
    "rabbana-32": {
        "ta": "என் இறைவா! எனக்கு அறிவை அதிகப்படுத்துவாயாக.",
        "ml": "എന്റെ രക്ഷിതാവേ, എനിക്ക് അറിവ് വർധിപ്പിച്ചുതരേണമേ.",
        "ur": "اے میرے رب! میرے علم میں اضافہ فرما۔",
        "fr": "Mon Seigneur, accrois mon savoir.",
        "tr": "Rabbim! İlmimi artır.",
        "id": "Ya Tuhanku, tambahkanlah ilmu kepadaku.",
        "bn": "হে আমার রব, আমার জ্ঞান বৃদ্ধি করুন।",
        "ms": "Wahai Tuhanku, tambahkanlah ilmuku.",
    },
    "rabbana-33": {
        "ta": "என் இறைவா! என்னைத் தனியாக விட்டுவிடாதே; வாரிசுகளில் நீயே மிகச் சிறந்தவன்.",
        "ml": "എന്റെ രക്ഷിതാവേ, എന്നെ ഏകനായി വിട്ടേക്കരുതേ; അനന്തരാവകാശികളിൽ നീയാകുന്നു ഏറ്റവും ഉത്തമൻ.",
        "ur": "اے میرے رب! مجھے اکیلا نہ چھوڑ، اور تو سب وارثوں سے بہتر ہے۔",
        "fr": "Mon Seigneur, ne me laisse pas seul ; Tu es le meilleur des héritiers.",
        "tr": "Rabbim! Beni yalnız bırakma. Sen mirasçıların en hayırlısısın.",
        "id": "Ya Tuhanku, janganlah Engkau membiarkanku hidup seorang diri; Engkaulah sebaik-baik pewaris.",
        "bn": "হে আমার রব, আমাকে একা ছেড়ে দেবেন না; আপনিই সর্বোত্তম উত্তরাধিকারী।",
        "ms": "Wahai Tuhanku, janganlah Engkau membiarkan aku bersendirian; Engkaulah sebaik-baik pewaris.",
    },
    "rabbana-34": {
        "ta": "என் இறைவா! என்னை அருள்மிக்க இறங்குமிடத்தில் இறங்கச் செய்வாயாக; இறங்கச் செய்வோரில் நீயே மிகச் சிறந்தவன்.",
        "ml": "എന്റെ രക്ഷിതാവേ, അനുഗ്രഹീതമായ ഒരു സ്ഥലത്ത് എന്നെ ഇറക്കേണമേ; ഇറക്കുന്നതിൽ ഏറ്റവും ഉത്തമൻ നീയാകുന്നു.",
        "ur": "اے میرے رب! مجھے بابرکت مقام پر اتار، اور تو اتارنے والوں میں سب سے بہتر ہے۔",
        "fr": "Mon Seigneur, fais-moi débarquer en un lieu béni ; Tu es le meilleur de ceux qui accordent l'hospitalité.",
        "tr": "Rabbim! Beni mübarek bir yere indir. Sen konuk edenlerin en hayırlısısın.",
        "id": "Ya Tuhanku, tempatkanlah aku di tempat yang diberkahi. Engkaulah sebaik-baik pemberi tempat.",
        "bn": "হে আমার রব, আমাকে বরকতময় স্থানে অবতরণ করান; আপনিই শ্রেষ্ঠ অবতরণকারী।",
        "ms": "Wahai Tuhanku, tempatkanlah aku di tempat yang diberkati; Engkaulah sebaik-baik pemberi tempat.",
    },
    "rabbana-35": {
        "ta": "என் இறைவா! அநீதியிழைத்த மக்களுடன் என்னை ஆக்கிவிடாதே.",
        "ml": "എന്റെ രക്ഷിതാവേ, അക്രമികളായ ജനതയോടൊപ്പം എന്നെ ആക്കരുതേ.",
        "ur": "اے میرے رب! مجھے ظالم لوگوں میں شامل نہ فرما۔",
        "fr": "Mon Seigneur, ne me place pas parmi les gens injustes.",
        "tr": "Rabbim! Beni zalim topluluğun içinde kılma.",
        "id": "Ya Tuhanku, janganlah Engkau tempatkan aku di antara kaum yang zalim.",
        "bn": "হে আমার রব, আমাকে জালিম সম্প্রদায়ের অন্তর্ভুক্ত করবেন না।",
        "ms": "Wahai Tuhanku, janganlah Engkau tempatkan aku dalam kalangan kaum yang zalim.",
    },
    "rabbana-36": {
        "ta": "எங்கள் இறைவா! நாங்கள் நம்பிக்கை கொண்டோம்; ஆகவே எங்களை மன்னித்து எங்கள் மீது கருணை காட்டுவாயாக. கருணை காட்டுவோரில் நீயே மிகச் சிறந்தவன்.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, ഞങ്ങൾ വിശ്വസിച്ചിരിക്കുന്നു; അതിനാൽ ഞങ്ങളോട് പൊറുക്കുകയും കരുണ കാണിക്കുകയും ചെയ്യേണമേ. കരുണ കാണിക്കുന്നവരിൽ ഏറ്റവും ഉത്തമൻ നീയാകുന്നു.",
        "ur": "اے ہمارے رب! ہم ایمان لے آئے، پس ہمیں بخش دے اور ہم پر رحم فرما؛ تو سب رحم کرنے والوں سے بہتر ہے۔",
        "fr": "Notre Seigneur, nous avons cru ; pardonne-nous et fais-nous miséricorde. Tu es le meilleur des miséricordieux.",
        "tr": "Rabbimiz! İman ettik; bizi bağışla ve bize merhamet et. Sen merhamet edenlerin en hayırlısısın.",
        "id": "Ya Tuhan kami, kami telah beriman, maka ampunilah kami dan rahmatilah kami. Engkaulah sebaik-baik pemberi rahmat.",
        "bn": "হে আমাদের রব, আমরা ঈমান এনেছি; তাই আমাদের ক্ষমা করুন ও আমাদের প্রতি দয়া করুন। আপনিই শ্রেষ্ঠ দয়ালু।",
        "ms": "Wahai Tuhan kami, kami telah beriman; maka ampunilah kami dan rahmatilah kami. Engkaulah sebaik-baik pemberi rahmat.",
    },
    "rabbana-37": {
        "ta": "என் இறைவா! மன்னித்து, கருணை காட்டுவாயாக; கருணை காட்டுவோரில் நீயே மிகச் சிறந்தவன்.",
        "ml": "എന്റെ രക്ഷിതാവേ, പൊറുത്തുതരേണമേ, കരുണ കാണിക്കേണമേ; കരുണ കാണിക്കുന്നവരിൽ ഏറ്റവും ഉത്തമൻ നീയാകുന്നു.",
        "ur": "اے میرے رب! بخش دے اور رحم فرما، اور تو سب رحم کرنے والوں سے بہتر ہے۔",
        "fr": "Mon Seigneur, pardonne et fais miséricorde ; Tu es le meilleur des miséricordieux.",
        "tr": "Rabbim! Bağışla ve merhamet et. Sen merhamet edenlerin en hayırlısısın.",
        "id": "Ya Tuhanku, ampunilah dan rahmatilah; Engkaulah sebaik-baik pemberi rahmat.",
        "bn": "হে আমার রব, ক্ষমা করুন ও দয়া করুন; আপনিই শ্রেষ্ঠ দয়ালু।",
        "ms": "Wahai Tuhanku, ampunilah dan rahmatilah; Engkaulah sebaik-baik pemberi rahmat.",
    },
    "rabbana-38": {
        "ta": "எங்கள் இறைவா! நரகத்தின் வேதனையை எங்களிடமிருந்து அகற்றுவாயாக. நிச்சயமாக அதன் வேதனை நிலைத்திருப்பதாகும்.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, നരകശിക്ഷ ഞങ്ങളിൽ നിന്ന് നീക്കേണമേ. തീർച്ചയായും അതിന്റെ ശിക്ഷ സ്ഥിരമായി നിലനിൽക്കുന്നതാണ്.",
        "ur": "اے ہمارے رب! ہم سے جہنم کا عذاب پھیر دے؛ بے شک اس کا عذاب چمٹിക്കൊ رہنے والا ہے۔",
        "fr": "Notre Seigneur, écarte de nous le châtiment de l'Enfer ; son châtiment est certes permanent.",
        "tr": "Rabbimiz! Cehennem azabını bizden uzaklaştır. Onun azabı gerçekten sürekli ve ayrılmazdır.",
        "id": "Ya Tuhan kami, jauhkanlah dari kami azab Jahanam. Sungguh, azabnya itu melekat dan kekal.",
        "bn": "হে আমাদের রব, আমাদের থেকে জাহান্নামের শাস্তি দূর করুন। নিশ্চয়ই তার শাস্তি অবিরাম ও স্থায়ী।",
        "ms": "Wahai Tuhan kami, jauhkanlah daripada kami azab neraka Jahanam. Sesungguhnya azabnya sentiasa melekat.",
    },
    "rabbana-39": {
        "ta": "எங்கள் இறைவா! எங்கள் துணைவர்களிடமிருந்தும் சந்ததியினரிடமிருந்தும் எங்கள் கண்களுக்கு மகிழ்ச்சி அளிப்பவர்களை வழங்கி, இறையச்சமுடையோருக்கு எங்களை முன்மாதிரியாக ஆக்குவாயாக.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, ഞങ്ങളുടെ ഇണകളിൽ നിന്നും സന്തതികളിൽ നിന്നും ഞങ്ങളുടെ കണ്ണുകൾക്ക് കുളിർമ നൽകുന്നവരെ ഞങ്ങൾക്ക് നൽകേണമേ; ഭക്തർക്കു ഞങ്ങളെ മാതൃകയാക്കേണമേ.",
        "ur": "اے ہمارے رب! ہمیں ہماری بیویوں اور اولاد سے آنکھوں کی ٹھنڈک عطا فرما اور ہمیں پرہیزگاروں کا پیشوا بنا۔",
        "fr": "Notre Seigneur, accorde-nous, en nos épouses et nos descendants, la joie des yeux, et fais de nous un modèle pour les pieux.",
        "tr": "Rabbimiz! Eşlerimizi ve çocuklarımızı bize göz aydınlığı kıl ve bizi takva sahiplerine önder yap.",
        "id": "Ya Tuhan kami, anugerahkanlah kepada kami pasangan dan keturunan sebagai penyejuk hati, serta jadikanlah kami teladan bagi orang-orang bertakwa.",
        "bn": "হে আমাদের রব, আমাদের স্ত্রী ও সন্তানদেরকে আমাদের চোখের শীতলতা দান করুন এবং আমাদেরকে মুত্তাকিদের নেতা করুন।",
        "ms": "Wahai Tuhan kami, anugerahkanlah kepada kami pasangan dan keturunan yang menyejukkan mata, serta jadikanlah kami teladan bagi orang yang bertakwa.",
    },
    "rabbana-40": {
        "ta": "எங்கள் இறைவா! நம்பிக்கையில் எங்களுக்கு முன்பே சென்ற எங்கள் சகோதரர்களை மன்னித்து, நம்பிக்கை கொண்டவர்களிடம் எங்கள் உள்ளங்களில் வெறுப்பை ஏற்படுத்தாதே.",
        "ml": "ഞങ്ങളുടെ രക്ഷിതാവേ, വിശ്വാസത്തിൽ ഞങ്ങൾക്ക് മുമ്പേ കടന്നുപോയ ഞങ്ങളുടെ സഹോദരങ്ങൾക്ക് പൊറുത്തുതരേണമേ; വിശ്വസിച്ചവരോട് ഞങ്ങളുടെ ഹൃദയങ്ങളിൽ വിദ്വേഷം ഉണ്ടാക്കരുതേ.",
        "ur": "اے ہمارے رب! ہمیں اور ایمان میں ہم سے پہلے گزر جانے والے ہمارے بھائیوں کو بخش دے، اور ایمان والوں کے لیے ہمارے دلوں میں کوئی کینہ نہ رکھ۔",
        "fr": "Notre Seigneur, pardonne-nous ainsi qu'à nos frères qui nous ont précédés dans la foi, et ne mets dans nos cœurs aucune rancœur envers ceux qui ont cru.",
        "tr": "Rabbimiz! Bizi ve imanla bizden önce geçmiş kardeşlerimizi bağışla; iman edenlere karşı kalplerimizde kin bırakma.",
        "id": "Ya Tuhan kami, ampunilah kami dan saudara-saudara kami yang telah beriman lebih dahulu, dan janganlah Engkau tanamkan kedengkian dalam hati kami terhadap orang-orang beriman.",
        "bn": "হে আমাদের রব, আমাদেরকে এবং ঈমানে আমাদের আগে অগ্রসর হওয়া ভাইদের ক্ষমা করুন; মুমিনদের প্রতি আমাদের অন্তরে কোনো বিদ্বেষ রাখবেন না।",
        "ms": "Wahai Tuhan kami, ampunilah kami dan saudara-saudara kami yang lebih dahulu beriman, serta janganlah Engkau jadikan dalam hati kami perasaan dengki terhadap orang yang beriman.",
    },
}

RABBANA_TRANSLITERATIONS = {
    "rabbana-01": "Rabbana taqabbal minna innaka anta as-sami'u al-'alim.",
    "rabbana-02": "Rabbana waj'alna muslimayni laka wa min dhurriyyatina ummatan muslimatan laka.",
    "rabbana-03": "Rabbana wa arina manasikana wa tub 'alayna innaka anta at-tawwabu ar-rahim.",
    "rabbana-04": "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar.",
    "rabbana-05": "Rabbana afrigh 'alayna sabran wa thabbit aqdamana wansurna 'alal-qawmil-kafirin.",
    "rabbana-06": "Rabbana la tu'akhidhna in nasina aw akhta'na.",
    "rabbana-07": "Rabbana wa la tahmil 'alayna isran kama hamaltahu 'alalladhina min qablina.",
    "rabbana-08": "Rabbana wa la tuhammilna ma la taqata lana bih.",
    "rabbana-09": "Rabbana wa'fu 'anna waghfir lana warhamna anta mawlana fansurna 'alal-qawmil-kafirin.",
    "rabbana-10": "Rabbana la tuzigh qulubana ba'da idh hadaytana wa hab lana min ladunka rahmah.",
    "rabbana-11": "Rabbana innana amanna faghfir lana dhunubana wa qina 'adhaban-nar.",
    "rabbana-12": "Rabbana ighfir lana dhunubana wa israfana fi amrina wa thabbit aqdamana wansurna 'alal-qawmil-kafirin.",
    "rabbana-13": "Rabbana ma khalaqta hadha batilan subhanaka faqina 'adhaban-nar.",
    "rabbana-14": "Rabbana innana sami'na munadiyan yunadi lil-imani an aminu bi-rabbikum fa-amanna.",
    "rabbana-15": "Rabbana faghfir lana dhunubana wa kaffir 'anna sayyiatina wa tawaffana ma'al-abrar.",
    "rabbana-16": "Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khasirin.",
    "rabbana-17": "Rabbana la taj'alna ma'al-qawmiz-zalimin.",
    "rabbana-18": "Rabbana iftah baynana wa bayna qawmina bil-haqqi wa anta khayrul-fatihin.",
    "rabbana-19": "Rabbana afrigh 'alayna sabran wa tawaffana muslimin.",
    "rabbana-20": "Rabbana ighfir li wa li-akhi wa adkhilna fi rahmatika wa anta arhamur-rahimin.",
    "rabbana-21": "Rabbana la taj'alna fitnatan lil-qawmiz-zalimin.",
    "rabbana-22": "Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khasirin.",
    "rabbana-23": "Rabbana 'alayka tawakkalna wa ilayka anabna wa ilaykal-masir.",
    "rabbana-24": "Rabbana la taj'alna fitnatan lil-qawmiz-zalimin.",
    "rabbana-25": "Rabbana najjina minal-qawmiz-zalimin.",
    "rabbana-26": "Rabbi ij'al hadhal-balada aminan wa ajnubni wa baniyya an na'budal-asnam.",
    "rabbana-27": "Rabbi innahunna adlalna kathiran minan-nas.",
    "rabbana-28": "Rabbi ij'alni muqimas-salati wa min dhurriyyati rabbana wa taqabbal du'a'i.",
    "rabbana-29": "Rabbana ighfir li wa li-walidayya wa lil-mu'minina yawma yaqumul-hisab.",
    "rabbana-30": "Rabbi adkhilni mudkhala sidqin wa akhrijni mukhraja sidqin waj'al li min ladunka sultanan nasira.",
    "rabbana-31": "Rabbana atina min ladunka rahmatan wa hayyi' lana min amrina rashada.",
    "rabbana-32": "Rabbi zidni 'ilma.",
    "rabbana-33": "Rabbi la tadharni fardan wa anta khayrul-warithin.",
    "rabbana-34": "Rabbi anzilni munzalan mubarakan wa anta khayrul-munzilin.",
    "rabbana-35": "Rabbi fala taj'alni fil-qawmiz-zalimin.",
    "rabbana-36": "Rabbana amanna faghfir lana warhamna wa anta khayrur-rahimin.",
    "rabbana-37": "Rabbi ighfir warham wa anta khayrur-rahimin.",
    "rabbana-38": "Rabbana isrif 'anna 'adhaba jahannama inna 'adhabaha kana gharama.",
    "rabbana-39": "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yunin waj'alna lil-muttaqina imama.",
    "rabbana-40": "Rabbana ighfir lana wa li-ikhwanina alladhina sabaquna bil-imani wa la taj'al fi qulubina ghillan lilladhina amanu.",
}

SALAWAT_DESCRIPTION = {
    "en": "User-supplied devotional Salawat formulas. The Ibrahimiyyah is identified as the Tashahhud formula; no authenticity claim is made for the other formulas.",
    "ta": "பயனர் வழங்கிய ஸலவாத் துஆ வடிவங்கள். இப்ராஹீமிய்யா தஷஹ்ஹுதில் ஓதும் வடிவமாகக் குறிப்பிடப்பட்டுள்ளது; மற்ற வடிவங்களுக்கு நம்பகத்தன்மை குறித்த எந்தக் கூற்றும் முன்வைக்கப்படவில்லை.",
    "ml": "ഉപയോക്താവ് നൽകിയ സ്വലാത്ത് പ്രാർഥനാ രൂപങ്ങൾ. ഇബ്രാഹീമിയ്യ തശഹ്ഹുദിൽ ചൊല്ലുന്ന രൂപമായി അടയാളപ്പെടുത്തിയിരിക്കുന്നു; മറ്റ് രൂപങ്ങളുടെ ആധികാരികതയെക്കുറിച്ച് അവകാശവാദമില്ല.",
    "ar": "صيغ الصلاة على النبي التي قدمها المستخدم. وقد حُددت الإبراهيمية بصيغة التشهد، ولا يُدّعى ثبوت الصيغ الأخرى.",
    "ur": "صارف کی فراہم کردہ صلوات کی دعائیہ صورتیں۔ ابراہیمیہ کو تشہد میں پڑھی جانے والی صورت کے طور پر شناخت کیا گیا ہے؛ دیگر صورتوں کی صحت کا دعویٰ نہیں کیا گیا۔",
    "fr": "Formules de Salawat fournies par l’utilisateur. L’Ibrahimiyyah est identifiée comme la formule du Tashahhud ; aucune authenticité n’est revendiquée pour les autres formules.",
    "tr": "Kullanıcının sağladığı salavat duaları. İbrahimiyye, Tahiyyat'ta okunan biçim olarak belirtilmiştir; diğer biçimlerin sahih olduğu iddia edilmemektedir.",
    "id": "Bentuk-bentuk Salawat yang diberikan pengguna. Ibrahimiyyah ditandai sebagai bacaan Tasyahud; tidak ada klaim keaslian untuk bentuk lainnya.",
    "bn": "ব্যবহারকারীর দেওয়া দরুদের দোয়ার রূপ। ইবরাহিমিয়্যাকে তাশাহহুদের রূপ হিসেবে চিহ্নিত করা হয়েছে; অন্য রূপগুলোর সত্যতা দাবি করা হয়নি।",
    "ms": "Bentuk-bentuk selawat yang diberikan pengguna. Ibrahimiyyah dikenal pasti sebagai lafaz Tasyahhud; tiada dakwaan kesahihan dibuat bagi bentuk yang lain.",
}

FRIDAY_FINAL_STANZA_TRANSLATIONS = {
    "ta": "அதை நினைத்து வருந்தும்போது, என் விரல் நுனிகளைக் கடித்து, என் பாவத்தை உணர்கிறேன்.",
    "ml": "അതിനെക്കുറിച്ചുള്ള പശ്ചാത്താപം ചിന്തിക്കുമ്പോൾ, വിരൽത്തുമ്പുകൾ കടിച്ച് എന്റെ പാപം ഞാൻ തിരിച്ചറിയുന്നു.",
    "ur": "جب میں اس پر اپنی ندامت کے بارے میں سوچتا ہوں، تو اپنی انگلیوں کے پور کاٹتا ہوں اور اپنے گناہ کو پہچانتا ہوں۔",
    "fr": "Lorsque je pense au regret que j'en éprouve, je me mords les doigts et reconnais mon péché.",
    "tr": "Ona dair pişmanlığımı düşündüğümde parmak uçlarımı ısırır ve günahımı anlarım.",
    "bn": "এ নিয়ে আমার অনুশোচনার কথা ভাবলে, আমি আঙুলের ডগা কামড়াই এবং আমার পাপ বুঝতে পারি।",
}

MORNING_EVENING_TAMIL_TITLES = {
    "me-1": "காலையில் ஓத வேண்டிய துஆ",
    "me-2": "மாலையில் ஓத வேண்டிய துஆ",
    "me-3": "பாவமன்னிப்பிற்காக ஓத வேண்டிய துஆ",
}

QASEEDAH_SECTION_NAMES = [
    {
        "en": "SECTION ONE",
        "ta": "முதல் பகுதி",
        "ml": "ഒന്നാം ഭാഗം",
        "ar": "القسم الأول",
        "ur": "پہلا حصہ",
        "fr": "SECTION UN",
        "tr": "BİRİNCİ BÖLÜM",
        "id": "BAGIAN SATU",
        "bn": "প্রথম অংশ",
        "ms": "BAHAGIAN SATU",
    },
    {
        "en": "SECTION TWO",
        "ta": "இரண்டாம் பகுதி",
        "ml": "രണ്ടാം ഭാഗം",
        "ar": "القسم الثاني",
        "ur": "دوسرا حصہ",
        "fr": "SECTION DEUX",
        "tr": "İKİNCİ BÖLÜM",
        "id": "BAGIAN DUA",
        "bn": "দ্বিতীয় অংশ",
        "ms": "BAHAGIAN DUA",
    },
    {
        "en": "SECTION THREE",
        "ta": "மூன்றாம் பகுதி",
        "ml": "മൂന്നാം ഭാഗം",
        "ar": "القسم الثالث",
        "ur": "تیسرا حصہ",
        "fr": "SECTION TROIS",
        "tr": "ÜÇÜNCÜ BÖLÜM",
        "id": "BAGIAN TIGA",
        "bn": "তৃতীয় অংশ",
        "ms": "BAHAGIAN TIGA",
    },
    {
        "en": "SECTION FOUR",
        "ta": "நான்காம் பகுதி",
        "ml": "നാലാം ഭാഗം",
        "ar": "القسم الرابع",
        "ur": "چوتھا حصہ",
        "fr": "SECTION QUATRE",
        "tr": "DÖRDÜNCÜ BÖLÜM",
        "id": "BAGIAN EMPAT",
        "bn": "চতুর্থ অংশ",
        "ms": "BAHAGIAN EMPAT",
    },
]


def read_json(relative_path):
    with open(os.path.join(ROOT, relative_path), encoding="utf-8") as file:
        return json.load(file)


def write_json(relative_path, value):
    path = os.path.join(ROOT, relative_path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as file:
        json.dump(value, file, ensure_ascii=False, indent=2)
        file.write("\n")

def repair_mojibake(value):
    if isinstance(value, dict):
        return {key: repair_mojibake(item) for key, item in value.items()}
    if isinstance(value, list):
        return [repair_mojibake(item) for item in value]
    if isinstance(value, str):
        for broken, corrected in MOJIBAKE_REPLACEMENTS.items():
            value = value.replace(broken, corrected)
    return value


def set_category_name(categories, category_id, name):
    for category in categories:
        if category.get("id") == category_id:
            category["name"] = copy.deepcopy(name)
            return
    raise ValueError(f"Missing category {category_id}.")


def to_runtime_dua(dua):
    runtime_dua = {
        "id": dua["id"],
        "title": copy.deepcopy(dua["title"]),
        "arabic": dua["arabic"],
        "translation": copy.deepcopy(dua["translation"]),
        "reference": dua.get("reference", {}).get("reference_text", ""),
        "times": dua.get("repetition_count", 1),
    }
    if "transliteration" in dua:
        runtime_dua["transliteration"] = dua["transliteration"]
    return runtime_dua


def update_qaseedah_sections(value):
    for index, section in enumerate(value["sections"]):
        section["title_localized"] = copy.deepcopy(QASEEDAH_SECTION_NAMES[index])


def main():
    for base in ("data", "metadata"):
        base_path = os.path.join(ROOT, base)
        for directory, _, filenames in os.walk(base_path):
            for filename in filenames:
                if filename.lower().endswith(".json"):
                    relative_path = os.path.relpath(
                        os.path.join(directory, filename), ROOT
                    )
                    original = read_json(relative_path)
                    repaired = repair_mojibake(original)
                    if repaired != original:
                        write_json(relative_path, repaired)

    category_index = read_json("data/duas/categories/index.json")
    category_metadata = {}
    category_data = {}
    for entry in category_index["categories"]:
        category_metadata[entry["id"]] = read_json(entry["metadata_file"])
        category_data[entry["id"]] = read_json(entry["data_file"])

    rabbana_records = category_data["rabbana-duas"]["duas"]
    expected_rabbana_ids = {f"rabbana-{number:02d}" for number in range(1, 41)}
    if {dua["id"] for dua in rabbana_records} != expected_rabbana_ids:
        raise ValueError("Rabbana collection must contain exactly the expected 40 IDs.")
    for dua in rabbana_records:
        dua_id = dua["id"]
        if dua_id in RABBANA_TRANSLATIONS:
            dua["translation"].update(RABBANA_TRANSLATIONS[dua_id])
        dua["translation"]["ar"] = dua["arabic"]
        dua["transliteration"] = RABBANA_TRANSLITERATIONS[dua_id]
        missing_languages = set(
            ("en", "ta", "ml", "ar", "ur", "fr", "tr", "id", "bn", "ms")
        ) - set(dua["translation"])
        if missing_languages:
            raise ValueError(
                f"{dua_id} is missing translations: {sorted(missing_languages)}"
            )

    sickness = category_metadata["sickness"]
    sickness["name"] = copy.deepcopy(SICKNESS_NAME)
    sickness["description"] = copy.deepcopy(SICKNESS_DESCRIPTION)
    sickness_data = category_data["sickness"]
    for dua in sickness_data["duas"]:
        if dua["id"] == "sck-1":
            dua["translation"]["tr"] = "Endişe etme; Allah dilerse bu bir arınmadır."

    friday_data = category_data["friday"]
    friday_dua = next(dua for dua in friday_data["duas"] if dua["id"] == "fri-2")
    for language, final_stanza in FRIDAY_FINAL_STANZA_TRANSLATIONS.items():
        existing_translation = friday_dua["translation"][language]
        valid_translation = existing_translation.rsplit("\n\n", 1)[0]
        friday_dua["translation"][language] = f"{valid_translation}\n\n{final_stanza}"
    friday_dua["reference"]["reference_text"] = (
        "Supplied devotional poem; no verified prophetic attribution."
    )

    morning_evening_data = category_data["morning-evening"]
    for dua in morning_evening_data["duas"]:
        if dua["id"] in MORNING_EVENING_TAMIL_TITLES:
            dua["title"]["ta"] = MORNING_EVENING_TAMIL_TITLES[dua["id"]]

    prophets = category_metadata["asma-ul-anbiya"]
    prophets["name"] = copy.deepcopy(PROPHET_NAMES)
    prophets["description"] = copy.deepcopy(PROPHET_NAMES)

    salawat = category_metadata["salawat"]
    salawat["description"] = copy.deepcopy(SALAWAT_DESCRIPTION)

    qaseedah_data = category_data["qaseedah-burdah"]
    update_qaseedah_sections(qaseedah_data)
    section_names = {
        section["id"]: section["title_localized"]
        for section in qaseedah_data["sections"]
    }
    for dua in qaseedah_data["duas"]:
        labels = section_names[dua["section_id"]]
        dua["title"] = {
            language: f"{title} · {dua['verse_number']}"
            for language, title in labels.items()
        }
    qaseedah_content = read_json(
        "data/duas/categories/qaseedah-burdah/content.json"
    )
    update_qaseedah_sections(qaseedah_content)

    for category_id in (
        "sickness", "asma-ul-anbiya", "salawat", "qaseedah-burdah",
        "rabbana-duas",
    ):
        write_json(
            f"data/duas/categories/{category_id}/metadata.json",
            category_metadata[category_id],
        )
        write_json(
            f"data/duas/categories/{category_id}/duas.json",
            category_data[category_id],
        )
    write_json(
        "data/duas/categories/qaseedah-burdah/content.json",
        qaseedah_content,
    )
    write_json("data/duas/categories/friday/duas.json", friday_data)
    write_json(
        "data/duas/categories/morning-evening/duas.json",
        morning_evening_data,
    )

    for category in category_index["categories"]:
        if category["id"] == "sickness":
            category["name"] = copy.deepcopy(SICKNESS_NAME)
    write_json("data/duas/categories/index.json", category_index)

    rabbana_metadata = category_metadata["rabbana-duas"]
    rabbana_metadata["name"] = copy.deepcopy(RABBANA_NAME)
    rabbana_metadata["description"] = copy.deepcopy(RABBANA_DESCRIPTION)
    write_json(
        "data/duas/categories/rabbana-duas/metadata.json",
        rabbana_metadata,
    )

    rabbana_index = read_json("data/duas/categories/rabbana-duas/index.json")
    rabbana_index["collection_id"] = "duas"
    rabbana_index["category_id"] = "rabbana-duas"
    rabbana_index["title"] = copy.deepcopy(RABBANA_NAME)
    rabbana_index["description"] = copy.deepcopy(RABBANA_DESCRIPTION)
    write_json(
        "data/duas/categories/rabbana-duas/index.json",
        rabbana_index,
    )

    global_index = read_json("metadata/categories.json")
    set_category_name(global_index["categories"], "sickness", SICKNESS_NAME)
    set_category_name(global_index["categories"], "asma-ul-anbiya", PROPHET_NAMES)
    set_category_name(
        global_index["categories"], "rabbana-duas", RABBANA_NAME
    )
    write_json("metadata/categories.json", global_index)

    canonical_records = {
        dua["id"]: dua
        for category in category_data.values()
        for dua in category["duas"]
    }

    runtime = repair_mojibake(read_json("src/data/allData.json"))
    runtime_categories = runtime["categories"]
    set_category_name(runtime_categories, "sickness", SICKNESS_NAME)
    set_category_name(runtime_categories, "asma-ul-anbiya", PROPHET_NAMES)
    rabbana_runtime = next(
        category for category in runtime_categories
        if category["id"] == "rabbana-duas"
    )
    rabbana_runtime.update({
        "color": "emerald",
        "gradient": "from-emerald-500 to-teal-700",
        "bg": "bg-emerald-50",
        "border": "border-emerald-200",
        "text": "text-emerald-700",
        "name": copy.deepcopy(RABBANA_NAME),
        "duas": [
            to_runtime_dua(dua)
            for dua in category_data["rabbana-duas"]["duas"]
        ],
    })
    for category in runtime_categories:
        for dua in category["duas"]:
            canonical = canonical_records.get(dua["id"])
            if canonical is None:
                continue
            if dua["id"] == "sck-1":
                dua["translation"]["tr"] = canonical["translation"]["tr"]
            if dua["id"] == "fri-2":
                dua["translation"] = copy.deepcopy(canonical["translation"])
                dua["reference"] = copy.deepcopy(canonical["reference"])
            if dua["id"] in MORNING_EVENING_TAMIL_TITLES:
                dua["title"]["ta"] = canonical["title"]["ta"]
            if dua["id"].startswith("qbur-"):
                dua["title"] = copy.deepcopy(canonical["title"])
                if category.get("sections"):
                    section_by_id = {
                        section["id"]: section for section in qaseedah_data["sections"]
                    }
                    for section in category["sections"]:
                        section["title_localized"] = copy.deepcopy(
                            section_by_id[section["id"]]["title_localized"]
                        )
    flags = {
        "en": "🇬🇧", "ta": "🇮🇳", "ml": "🇮🇳", "ar": "🇸🇦",
        "ur": "🇵🇰", "fr": "🇫🇷", "tr": "🇹🇷", "id": "🇮🇩",
        "bn": "🇧🇩", "ms": "🇲🇾",
    }
    for language in runtime["languages"]:
        language["flag"] = flags[language["code"]]
    write_json("src/data/allData.json", runtime)

    api = repair_mojibake(read_json("public/api/v1/duas.json"))
    set_category_name(api["categories"], "sickness", SICKNESS_NAME)
    set_category_name(api["categories"], "asma-ul-anbiya", PROPHET_NAMES)
    rabbana_api = next(
        category for category in api["categories"]
        if category["id"] == "rabbana-duas"
    )
    rabbana_api["name"] = copy.deepcopy(RABBANA_NAME)
    rabbana_api["duas"] = copy.deepcopy(
        category_data["rabbana-duas"]["duas"]
    )
    for category in api["categories"]:
        for dua in category["duas"]:
            canonical = canonical_records.get(dua["id"])
            if canonical is None:
                continue
            if dua["id"] == "sck-1":
                dua["translation"]["tr"] = canonical["translation"]["tr"]
            if dua["id"] == "fri-2":
                dua["translation"] = copy.deepcopy(canonical["translation"])
                dua["reference"] = copy.deepcopy(canonical["reference"])
            if dua["id"] in MORNING_EVENING_TAMIL_TITLES:
                dua["title"]["ta"] = canonical["title"]["ta"]
            if dua["id"].startswith("qbur-"):
                dua["title"] = copy.deepcopy(canonical["title"])
                if category.get("sections"):
                    section_by_id = {
                        section["id"]: section for section in qaseedah_data["sections"]
                    }
                    for section in category["sections"]:
                        section["title_localized"] = copy.deepcopy(
                            section_by_id[section["id"]]["title_localized"]
                        )
    write_json("public/api/v1/duas.json", api)

    api_index = repair_mojibake(read_json("public/api/v1/index.json"))
    set_category_name(api_index["categories"], "sickness", SICKNESS_NAME)
    set_category_name(api_index["categories"], "asma-ul-anbiya", PROPHET_NAMES)
    set_category_name(api_index["categories"], "rabbana-duas", RABBANA_NAME)
    api_index["endpoints"]["rabbana_duas"] = "/api/v1/rabbana-duas.json"
    api_index["rabbana_duas_count"] = 40
    write_json("public/api/v1/index.json", api_index)
    rabbana_records = category_data["rabbana-duas"]["duas"]
    write_json(
        "public/api/v1/rabbana-duas.json",
        {
            "schema_version": "3.0.0",
            "count": len(rabbana_records),
            "duas": [
                {
                    "id": dua["id"],
                    "number": dua.get("number", dua["order"]),
                    "arabic": dua["arabic"],
                    "transliteration": dua["transliteration"],
                    "translation": copy.deepcopy(dua["translation"]),
                    "reference": copy.deepcopy(dua["reference"]),
                }
                for dua in rabbana_records
            ],
        },
    )

    print(
        "Updated illness and prophet localization, Qaseedah section labels, "
        "Rabbana collection metadata/API endpoint, and React language flags."
    )


if __name__ == "__main__":
    main()
