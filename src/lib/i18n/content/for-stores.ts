// Тексты страницы «Для магазинов» (/magazinam) на трёх языках.
// Длинный рекламный текст держим отдельно от общих словарей интерфейса.
import type { Locale } from "@/lib/i18n/config";

type Item = { title: string; text: string };

export type ForStoresContent = {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  heading: string;
  lead: string;
  connect: string;
  alreadyIn: string;
  tagline: string;
  howTitle: string;
  how: Item[];
  benefitsTitle: string;
  benefits: (Item & { icon: string })[];
  stepsTitle: string;
  steps: Item[];
  start: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  thisPage: string;
};

const ICONS = ["📍", "🛍", "🔗", "📱", "📊", "💬"];
const withIcons = (items: Item[]) => items.map((item, i) => ({ ...item, icon: ICONS[i] }));

export const FOR_STORES: Record<Locale, ForStoresContent> = {
  ru: {
    metaTitle: "ShopTour для магазинов — покупатели рядом с вами",
    metaDescription:
      "Бесплатная витрина для магазина одежды: покупатели рядом видят ваши вещи, откладывают размер и приходят примерить. Брони — в Telegram.",
    kicker: "ShopTour для магазинов",
    heading: "Покупатели рядом увидят ваши вещи до того, как придут",
    lead: "ShopTour собирает одежду из магазинов Алматы в один каталог и на карту. Человек находит вещь рядом с домом, откладывает размер и приходит примерить — к вам.",
    connect: "Подключить магазин бесплатно",
    alreadyIn: "Я уже с вами — войти",
    tagline: "Бесплатно · без комиссии с продаж · всё с телефона",
    howTitle: "Как это выглядит для покупателя",
    how: [
      { title: "Находит", text: "В каталоге или через «Рядом со мной» — вещи в магазинах поблизости, с ценой и размерами в наличии." },
      { title: "Откладывает", text: "Нажимает «Отложить размер» — вам приходит бронь в Telegram, вы подтверждаете одной кнопкой." },
      { title: "Приходит к вам", text: "Примеряет и покупает в магазине. Или строит маршрут по нескольким магазинам на прогулку." },
    ],
    benefitsTitle: "Что получает магазин",
    benefits: withIcons([
      { title: "Вас находят те, кто рядом", text: "Покупатель открывает «Рядом со мной» и видит вещи в магазинах в 15 минутах пешком. Ваш магазин — на карте и в маршрутах." },
      { title: "Брони приходят в Telegram", text: "Покупатель просит отложить размер — вам приходит сообщение. Отвечаете одной кнопкой: «Отложили» или «Нет в наличии»." },
      { title: "Витрина вместо Taplink", text: "Ссылка shoptour.kz/s/ваш-магазин для шапки Instagram: все вещи, размеры в наличии, адрес на карте и кнопка WhatsApp." },
      { title: "Всё с телефона", text: "Сфотографировали вещь — она на сайте за минуту. Продали — нажали «−» у размера. Никаких таблиц и компьютера." },
      { title: "Видно, что работает", text: "Каждое утро в Telegram: сколько людей смотрели ваш магазин вчера, что добавили в избранное, сколько броней." },
      { title: "Покупатели сами пишут вам", text: "Кнопка WhatsApp на каждом товаре — с готовым сообщением: какая вещь и какой размер нужен." },
    ]),
    stepsTitle: "Подключение за 15 минут",
    steps: [
      { title: "Зарегистрируйте магазин", text: "Email, пароль, название и адрес. Подтвердите почту по ссылке из письма." },
      { title: "Добавьте товары", text: "Хотя бы 5–10 вещей с фото, ценой и размерами. С телефона это пара минут на вещь." },
      { title: "Поставьте точку на карте", text: "В разделе «Магазин» — по адресу или пальцем на карте. Без неё вас нет в «Рядом»." },
      { title: "Подключите Telegram", text: "Кнопка в кабинете → «Start» в боте. Брони и утренняя сводка будут приходить туда." },
      { title: "Поставьте ссылку в Instagram", text: "Скопируйте адрес витрины в кабинете и добавьте в шапку профиля." },
    ],
    start: "Начать — это бесплатно",
    faqTitle: "Частые вопросы",
    faq: [
      { q: "Сколько это стоит?", a: "Сейчас подключение бесплатное. Никаких комиссий с продаж — покупатель платит вам в магазине, как обычно." },
      { q: "Кто добавляет товары?", a: "Вы — из кабинета с телефона. На старте можем помочь завести первые товары вместе." },
      { q: "А если вещь уже продали?", a: "Нажмите «−» у размера или «Снять с продажи» — на сайте она сразу пропадёт из наличия. Если бронь пришла на проданную вещь, ответьте «Нет в наличии»." },
      { q: "Как покупатель платит?", a: "В вашем магазине, после примерки. ShopTour не принимает деньги и не доставляет — только приводит людей к вам." },
      { q: "Когда магазин появится на сайте?", a: "После короткой проверки командой ShopTour — обычно в течение дня. Пока идёт проверка, можно спокойно заполнить товары." },
      { q: "Нужен ли свой сайт или Kaspi?", a: "Нет. ShopTour — отдельная витрина. Если у вас уже есть Instagram или Kaspi, одно другому не мешает." },
    ],
    thisPage: "Эта страница:",
  },

  kk: {
    metaTitle: "ShopTour дүкендерге — сатып алушылар жаныңызда",
    metaDescription:
      "Киім дүкеніне арналған тегін витрина: жақын жердегі сатып алушылар заттарыңызды көреді, өлшемін сақтап қояды да, киіп көруге келеді. Брондар — Telegram-да.",
    kicker: "ShopTour дүкендерге",
    heading: "Жақын жердегі сатып алушылар заттарыңызды келмей тұрып көреді",
    lead: "ShopTour Алматы дүкендеріндегі киімді бір каталог пен картаға жинайды. Адам үйінің жанынан затты табады, өлшемін сақтап қояды да, киіп көруге сізге келеді.",
    connect: "Дүкенді тегін қосу",
    alreadyIn: "Мен тіркелгенмін — кіру",
    tagline: "Тегін · сатылымнан комиссиясыз · бәрі телефоннан",
    howTitle: "Сатып алушыға бұл қалай көрінеді",
    how: [
      { title: "Табады", text: "Каталогтан немесе «Маған жақын» арқылы — жақын дүкендердегі заттар, бағасы және қолда бар өлшемдерімен." },
      { title: "Сақтап қояды", text: "«Өлшемді сақтап қою» түймесін басады — сізге Telegram-ға брон келеді, бір түймемен растайсыз." },
      { title: "Сізге келеді", text: "Дүкенде киіп көріп, сатып алады. Немесе серуенге бірнеше дүкенді аралайтын маршрут құрады." },
    ],
    benefitsTitle: "Дүкен не алады",
    benefits: withIcons([
      { title: "Сізді жақын жүргендер табады", text: "Сатып алушы «Маған жақын» бөлімін ашып, жаяу 15 минуттық жердегі дүкендердің заттарын көреді. Дүкеніңіз картада және маршруттарда." },
      { title: "Брондар Telegram-ға келеді", text: "Сатып алушы өлшемді сақтап қоюды сұрайды — сізге хабарлама келеді. Бір түймемен жауап бересіз: «Сақтап қойдық» немесе «Қолда жоқ»." },
      { title: "Taplink орнына витрина", text: "Instagram профиліне арналған shoptour.kz/s/сіздің-дүкен сілтемесі: барлық зат, қолда бар өлшемдер, картадағы мекенжай және WhatsApp түймесі." },
      { title: "Бәрі телефоннан", text: "Затты суретке түсірдіңіз — бір минутта сайтта. Саттыңыз — өлшемнің жанындағы «−» түймесін бастыңыз. Кесте де, компьютер де керек емес." },
      { title: "Не жұмыс істейтіні көрінеді", text: "Әр таң сайын Telegram-да: кеше дүкеніңізді қанша адам қарады, таңдаулыларға не қосты, қанша брон түсті." },
      { title: "Сатып алушылар өздері жазады", text: "Әр тауарда WhatsApp түймесі бар — дайын хабарламамен: қай зат және қай өлшем керек." },
    ]),
    stepsTitle: "15 минутта қосылу",
    steps: [
      { title: "Дүкенді тіркеңіз", text: "Email, құпиясөз, атауы және мекенжайы. Хаттағы сілтеме арқылы поштаны растаңыз." },
      { title: "Тауарларды қосыңыз", text: "Кемінде 5–10 зат: фотосы, бағасы және өлшемдері. Телефоннан бір затқа бір-екі минут кетеді." },
      { title: "Картаға нүкте қойыңыз", text: "«Дүкен» бөлімінде — мекенжай бойынша немесе картада саусақпен. Онсыз «Жақын жерде» көрінбейсіз." },
      { title: "Telegram-ды қосыңыз", text: "Кабинеттегі түйме → боттағы «Start». Брондар мен таңғы есеп сонда келеді." },
      { title: "Сілтемені Instagram-ға қойыңыз", text: "Кабинеттен витрина мекенжайын көшіріп, профиль сипаттамасына қосыңыз." },
    ],
    start: "Бастау — бұл тегін",
    faqTitle: "Жиі қойылатын сұрақтар",
    faq: [
      { q: "Бұл қанша тұрады?", a: "Қазір қосылу тегін. Сатылымнан комиссия жоқ — сатып алушы әдеттегідей сізге дүкенде төлейді." },
      { q: "Тауарларды кім қосады?", a: "Өзіңіз — кабинеттен, телефон арқылы. Бастапқыда алғашқы тауарларды бірге енгізуге көмектесе аламыз." },
      { q: "Зат сатылып кетсе ше?", a: "Өлшемнің жанындағы «−» немесе «Сатылымнан алу» түймесін басыңыз — сайтта ол бірден қолда жоқ болып көрсетіледі. Сатылған затқа брон келсе, «Қолда жоқ» деп жауап беріңіз." },
      { q: "Сатып алушы қалай төлейді?", a: "Сіздің дүкеніңізде, киіп көргеннен кейін. ShopTour ақша қабылдамайды және жеткізбейді — тек адамдарды сізге әкеледі." },
      { q: "Дүкен сайтта қашан пайда болады?", a: "ShopTour командасының қысқа тексеруінен кейін — әдетте бір күн ішінде. Тексеру жүріп жатқанда тауарларды асықпай толтыра беруге болады." },
      { q: "Өз сайтым немесе Kaspi керек пе?", a: "Жоқ. ShopTour — бөлек витрина. Instagram немесе Kaspi болса, бір-біріне кедергі келтірмейді." },
    ],
    thisPage: "Бұл бет:",
  },

  en: {
    metaTitle: "ShopTour for stores — shoppers near you",
    metaDescription:
      "A free storefront for a clothing store: shoppers nearby see your items, reserve a size and come to try it on. Reservations arrive in Telegram.",
    kicker: "ShopTour for stores",
    heading: "Shoppers nearby see your items before they come",
    lead: "ShopTour gathers clothes from Almaty stores into one catalog and onto a map. A person finds an item near home, reserves a size and comes to try it on — in your store.",
    connect: "Connect your store for free",
    alreadyIn: "I'm already with you — sign in",
    tagline: "Free · no sales commission · everything from your phone",
    howTitle: "What it looks like for a shopper",
    how: [
      { title: "Finds", text: "In the catalog or through “Near me” — items in stores close by, with the price and sizes in stock." },
      { title: "Reserves", text: "Taps “Reserve size” — you get a reservation in Telegram and confirm it with one button." },
      { title: "Comes to you", text: "Tries it on and buys in the store. Or builds a walking route through several stores." },
    ],
    benefitsTitle: "What the store gets",
    benefits: withIcons([
      { title: "People nearby find you", text: "A shopper opens “Near me” and sees items in stores within a 15-minute walk. Your store is on the map and in routes." },
      { title: "Reservations arrive in Telegram", text: "A shopper asks to set a size aside — you get a message. You answer with one button: “Set aside” or “Out of stock”." },
      { title: "A storefront instead of Taplink", text: "The link shoptour.kz/s/your-store for your Instagram bio: all items, sizes in stock, address on the map and a WhatsApp button." },
      { title: "Everything from your phone", text: "Take a photo of an item — it is on the site in a minute. Sold it — tap “−” next to the size. No spreadsheets, no computer." },
      { title: "You see what works", text: "Every morning in Telegram: how many people viewed your store yesterday, what they added to favorites, how many reservations." },
      { title: "Shoppers message you themselves", text: "A WhatsApp button on every item — with a ready message: which item and which size they need." },
    ]),
    stepsTitle: "Connected in 15 minutes",
    steps: [
      { title: "Register your store", text: "Email, password, name and address. Confirm your email using the link in the letter." },
      { title: "Add your items", text: "At least 5–10 items with a photo, price and sizes. From a phone it takes a couple of minutes per item." },
      { title: "Put a pin on the map", text: "In the “Store” section — by address or with a finger on the map. Without it you are not in “Nearby”." },
      { title: "Connect Telegram", text: "A button in the dashboard → “Start” in the bot. Reservations and the morning summary will arrive there." },
      { title: "Put the link in Instagram", text: "Copy the storefront address in the dashboard and add it to your profile bio." },
    ],
    start: "Start — it's free",
    faqTitle: "Frequently asked questions",
    faq: [
      { q: "How much does it cost?", a: "Connecting is free for now. No sales commission — the shopper pays you in the store, as usual." },
      { q: "Who adds the items?", a: "You do — from the dashboard on your phone. At the start we can help you add the first items together." },
      { q: "What if the item is already sold?", a: "Tap “−” next to the size or “Take off sale” — it is shown as out of stock right away. If a reservation arrives for a sold item, answer “Out of stock”." },
      { q: "How does the shopper pay?", a: "In your store, after trying it on. ShopTour does not take money or deliver — it only brings people to you." },
      { q: "When will the store appear on the site?", a: "After a short check by the ShopTour team — usually within a day. While the check is in progress, you can add your items." },
      { q: "Do I need my own website or Kaspi?", a: "No. ShopTour is a separate storefront. If you already have Instagram or Kaspi, they do not get in each other's way." },
    ],
    thisPage: "This page:",
  },
};
