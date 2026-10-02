// Политика конфиденциальности на трёх языках. Описывает то, что сайт делает на самом деле:
// при изменении сбора данных (новые поля, сервисы, счётчики) текст нужно обновить.
// Перед публичным запуском текст должен проверить юрист.
import type { Locale } from "@/lib/i18n/config";

type Block = string | string[];

export type PrivacyContent = {
  metaTitle: string;
  title: string;
  updated: (date: string) => string;
  operatorLabel: string;
  operatorFallback: string;
  contactLabel: string;
  contactFallback: string;
  sections: { title: string; blocks: Block[] }[];
  /** Согласие под формами регистрации и брони: текст до ссылки, текст ссылки */
  consentBefore: string;
  consentLink: string;
  footerLink: string;
};

export const PRIVACY: Record<Locale, PrivacyContent> = {
  ru: {
    metaTitle: "Политика конфиденциальности — ShopTour",
    title: "Политика конфиденциальности",
    updated: (date) => `Редакция от ${date}`,
    operatorLabel: "Кто отвечает за ваши данные",
    operatorFallback: "владелец сервиса ShopTour",
    contactLabel: "Куда писать по вопросам о данных",
    contactFallback: "адрес будет указан до запуска сервиса",
    sections: [
      {
        title: "Коротко",
        blocks: [
          "ShopTour — каталог одежды из магазинов вашего города. Каталогом, картой, избранным и маршрутами можно пользоваться без регистрации и без передачи нам личных данных.",
          "Личные данные мы просим только тогда, когда без них нельзя: чтобы создать аккаунт и чтобы магазин мог отложить для вас вещь. Мы не продаём данные и не показываем рекламу.",
        ],
      },
      {
        title: "Какие данные мы получаем",
        blocks: [
          [
            "Аккаунт покупателя: email, пароль (хранится в зашифрованном виде, мы его не видим), имя — если вы его указали.",
            "Бронь вещи: имя, номер телефона, когда вы придёте и ваш комментарий.",
            "Избранное, маршруты и история просмотров: без аккаунта они хранятся только в вашем браузере; с аккаунтом — ещё и у нас, чтобы быть на всех ваших устройствах.",
            "Магазины и их сотрудники: email и имя сотрудника, а также данные магазина, которые видят все — название, адрес, телефон, WhatsApp, Instagram, товары и фото.",
            "Статистика посещений: какие страницы, магазины и товары открывали, нажатия на WhatsApp, телефон, карту и маршрут, поисковые запросы в каталоге. Посетитель в статистике — случайный номер из вашего браузера, без имени, email и телефона.",
          ],
        ],
      },
      {
        title: "Местоположение",
        blocks: [
          "Функция «Рядом» спрашивает местоположение только когда вы сами её включаете. Вместо этого можно ввести адрес.",
          "Точка округляется примерно до 100 метров, хранится в вашем браузере и попадает в адрес страницы, чтобы показать магазины поблизости. В базе данных мы ваше местоположение не сохраняем.",
        ],
      },
      {
        title: "Зачем нам эти данные",
        blocks: [
          [
            "чтобы вы могли войти в аккаунт и восстановить пароль;",
            "чтобы магазин отложил вещь и мог связаться с вами по брони;",
            "чтобы избранное и маршруты были одинаковыми на телефоне и компьютере;",
            "чтобы магазины видели, сколько людей смотрят их товары, а мы понимали, что на сайте работает, а что нет;",
            "чтобы защищать сайт от спама и злоупотреблений.",
          ],
        ],
      },
      {
        title: "Кому мы передаём данные",
        blocks: [
          "Магазину, в котором вы откладываете вещь: ваше имя, телефон, время визита и комментарий. Магазин получает их в своём кабинете на сайте и, если подключил, в Telegram.",
          "Сервисам, без которых сайт не работает. Они обрабатывают данные по нашему поручению:",
          [
            "Supabase — база данных и вход в аккаунт (серверы в Японии);",
            "Vercel — размещение сайта;",
            "Resend — отправка писем о подтверждении email и восстановлении пароля;",
            "Telegram — уведомления магазинам о бронях;",
            "OpenStreetMap — карта и поиск адреса: запрос адреса, который вы вводите, уходит в этот сервис.",
          ],
          "Когда вы открываете маршрут в Google Картах или Яндекс Картах либо пишете магазину в WhatsApp, вы переходите в эти сервисы — дальше действуют их правила.",
          "Государственным органам — только по законному требованию. Никому другому мы данные не передаём и не продаём.",
        ],
      },
      {
        title: "Где хранятся данные",
        blocks: [
          "Данные хранятся на серверах наших подрядчиков за пределами Республики Казахстан (в том числе в Японии и США). Создавая аккаунт или отправляя бронь, вы соглашаетесь на такую передачу.",
        ],
      },
      {
        title: "Сколько мы храним данные",
        blocks: [
          [
            "Аккаунт, избранное и маршруты — пока вы не удалите аккаунт. Удалить его можно самостоятельно на странице «Мой аккаунт».",
            "Брони остаются у магазина для учёта и после удаления аккаунта, уже без привязки к нему. Чтобы удалить имя и телефон из броней, напишите нам.",
            "Статистика посещений хранится в обезличенном виде.",
          ],
        ],
      },
      {
        title: "Файлы в вашем браузере",
        blocks: [
          "Мы используем cookie и хранилище браузера только для работы сайта: вход в аккаунт, выбранный язык и раздел каталога, избранное, маршрут, недавно просмотренные товары, имя и телефон для следующей брони, случайный номер посетителя для статистики.",
          "Рекламных и сторонних отслеживающих cookie на сайте нет. Очистить эти данные можно в настройках браузера.",
        ],
      },
      {
        title: "Ваши права",
        blocks: [
          "Вы можете в любой момент:",
          [
            "узнать, какие ваши данные у нас есть, и получить их копию;",
            "исправить неточные данные;",
            "удалить аккаунт и попросить удалить остальные данные;",
            "отозвать согласие на обработку данных.",
          ],
          "Для этого напишите нам по адресу, указанному выше. Мы ответим в течение 15 рабочих дней.",
        ],
      },
      {
        title: "Изменения",
        blocks: [
          "Если мы начнём собирать новые данные или изменим то, как их используем, мы обновим эту страницу и дату редакции наверху.",
        ],
      },
    ],
    consentBefore: "Нажимая кнопку, вы соглашаетесь с",
    consentLink: "политикой конфиденциальности",
    footerLink: "Конфиденциальность",
  },

  kk: {
    metaTitle: "Құпиялық саясаты — ShopTour",
    title: "Құпиялық саясаты",
    updated: (date) => `${date} редакциясы`,
    operatorLabel: "Деректеріңізге кім жауап береді",
    operatorFallback: "ShopTour сервисінің иесі",
    contactLabel: "Деректер туралы сұрақтарды қайда жазу керек",
    contactFallback: "мекенжай сервис іске қосылғанға дейін көрсетіледі",
    sections: [
      {
        title: "Қысқаша",
        blocks: [
          "ShopTour — қалаңыздағы дүкендердің киім каталогы. Каталогты, картаны, таңдаулыларды және маршруттарды тіркелусіз әрі бізге жеке деректер бермей-ақ пайдалануға болады.",
          "Жеке деректерді біз тек қажет болғанда ғана сұраймыз: аккаунт ашу үшін және дүкен сізге затты сақтап қоя алуы үшін. Біз деректерді сатпаймыз және жарнама көрсетпейміз.",
        ],
      },
      {
        title: "Қандай деректерді аламыз",
        blocks: [
          [
            "Сатып алушының аккаунты: email, құпиясөз (шифрланған түрде сақталады, біз оны көрмейміз), атыңыз — егер көрсетсеңіз.",
            "Затты брондау: атыңыз, телефон нөміріңіз, қашан келетініңіз және түсініктемеңіз.",
            "Таңдаулылар, маршруттар және қарау тарихы: аккаунтсыз олар тек браузеріңізде сақталады; аккаунтпен — барлық құрылғыңызда болуы үшін бізде де сақталады.",
            "Дүкендер мен олардың қызметкерлері: қызметкердің email-і мен аты, сондай-ақ бәріне көрінетін дүкен деректері — атауы, мекенжайы, телефоны, WhatsApp, Instagram, тауарлары мен фотолары.",
            "Кіру статистикасы: қай беттер, дүкендер мен тауарлар ашылды, WhatsApp, телефон, карта және маршрут түймелерінің басылуы, каталогтағы іздеу сұраулары. Статистикадағы келуші — браузеріңіздегі кездейсоқ нөмір, аты, email-і және телефоны жоқ.",
          ],
        ],
      },
      {
        title: "Орналасқан жер",
        blocks: [
          "«Жақын жерде» функциясы орналасқан жеріңізді тек өзіңіз қосқанда ғана сұрайды. Оның орнына мекенжайды енгізуге болады.",
          "Нүкте шамамен 100 метрге дейін дөңгелектенеді, браузеріңізде сақталады және жақын дүкендерді көрсету үшін бет мекенжайына қосылады. Дерекқорда орналасқан жеріңізді сақтамаймыз.",
        ],
      },
      {
        title: "Бұл деректер бізге не үшін керек",
        blocks: [
          [
            "аккаунтқа кіріп, құпиясөзді қалпына келтіре алуыңыз үшін;",
            "дүкен затты сақтап қойып, брон бойынша сізбен байланыса алуы үшін;",
            "таңдаулылар мен маршруттар телефонда да, компьютерде де бірдей болуы үшін;",
            "дүкендер тауарларын қанша адам қарайтынын көруі, ал біз сайтта не жұмыс істейтінін түсінуіміз үшін;",
            "сайтты спам мен теріс пайдаланудан қорғау үшін.",
          ],
        ],
      },
      {
        title: "Деректерді кімге береміз",
        blocks: [
          "Затты сақтап қоятын дүкенге: атыңыз, телефоныңыз, келу уақытыңыз және түсініктемеңіз. Дүкен оларды сайттағы кабинетінде және қосқан болса, Telegram-да алады.",
          "Сайт оларсыз жұмыс істемейтін сервистерге. Олар деректерді біздің тапсырмамыз бойынша өңдейді:",
          [
            "Supabase — дерекқор және аккаунтқа кіру (серверлері Жапонияда);",
            "Vercel — сайтты орналастыру;",
            "Resend — email-ді растау және құпиясөзді қалпына келтіру хаттарын жіберу;",
            "Telegram — дүкендерге брондар туралы хабарламалар;",
            "OpenStreetMap — карта және мекенжай іздеу: сіз енгізген мекенжай сұрауы осы сервиске жіберіледі.",
          ],
          "Маршрутты Google Карталарда немесе Яндекс Карталарда ашқанда, не болмаса дүкенге WhatsApp арқылы жазғанда, сіз сол сервистерге өтесіз — одан әрі солардың ережелері қолданылады.",
          "Мемлекеттік органдарға — тек заңды талап бойынша. Басқа ешкімге деректерді бермейміз және сатпаймыз.",
        ],
      },
      {
        title: "Деректер қайда сақталады",
        blocks: [
          "Деректер мердігерлеріміздің Қазақстан Республикасынан тыс жердегі серверлерінде (соның ішінде Жапония мен АҚШ-та) сақталады. Аккаунт ашу немесе брон жіберу арқылы сіз осындай беруге келісесіз.",
        ],
      },
      {
        title: "Деректерді қанша уақыт сақтаймыз",
        blocks: [
          [
            "Аккаунт, таңдаулылар және маршруттар — аккаунтты жойғанға дейін. Оны «Менің аккаунтым» бетінде өзіңіз жоя аласыз.",
            "Брондар есеп жүргізу үшін дүкенде аккаунт жойылғаннан кейін де, бірақ аккаунтқа байланыстырылмай қалады. Брондардан атыңыз бен телефоныңызды жою үшін бізге жазыңыз.",
            "Кіру статистикасы иесіздендірілген түрде сақталады.",
          ],
        ],
      },
      {
        title: "Браузеріңіздегі файлдар",
        blocks: [
          "Cookie мен браузер қоймасын біз тек сайттың жұмысы үшін пайдаланамыз: аккаунтқа кіру, таңдалған тіл мен каталог бөлімі, таңдаулылар, маршрут, жақында қаралған тауарлар, келесі бронға арналған ат пен телефон, статистикаға арналған келушінің кездейсоқ нөмірі.",
          "Сайтта жарнамалық немесе бөгде бақылаушы cookie жоқ. Бұл деректерді браузер баптауларынан тазалауға болады.",
        ],
      },
      {
        title: "Сіздің құқықтарыңыз",
        blocks: [
          "Сіз кез келген уақытта:",
          [
            "бізде қандай деректеріңіз бар екенін біліп, олардың көшірмесін ала аласыз;",
            "дәл емес деректерді түзете аласыз;",
            "аккаунтты жойып, қалған деректерді жоюды сұрай аласыз;",
            "деректерді өңдеуге берген келісіміңізді қайтарып ала аласыз.",
          ],
          "Ол үшін жоғарыда көрсетілген мекенжайға жазыңыз. Біз 15 жұмыс күні ішінде жауап береміз.",
        ],
      },
      {
        title: "Өзгерістер",
        blocks: [
          "Жаңа деректер жинай бастасақ немесе оларды пайдалану тәсілін өзгертсек, осы бетті және жоғарыдағы редакция күнін жаңартамыз.",
        ],
      },
    ],
    consentBefore: "Түймені басу арқылы сіз мынамен келісесіз:",
    consentLink: "құпиялық саясаты",
    footerLink: "Құпиялық",
  },

  en: {
    metaTitle: "Privacy policy — ShopTour",
    title: "Privacy policy",
    updated: (date) => `Last updated ${date}`,
    operatorLabel: "Who is responsible for your data",
    operatorFallback: "the owner of the ShopTour service",
    contactLabel: "Where to write about your data",
    contactFallback: "the address will be published before the service launches",
    sections: [
      {
        title: "In short",
        blocks: [
          "ShopTour is a catalog of clothes from the stores of your city. You can use the catalog, the map, favorites and routes without signing up and without giving us any personal data.",
          "We ask for personal data only when it is necessary: to create an account and to let a store set an item aside for you. We do not sell data and we do not show ads.",
        ],
      },
      {
        title: "What data we receive",
        blocks: [
          [
            "Shopper account: email, password (stored encrypted — we cannot see it), your name if you provide it.",
            "Item reservation: your name, phone number, when you will come and your comment.",
            "Favorites, routes and viewing history: without an account they are stored only in your browser; with an account they are also stored with us so that they are available on all your devices.",
            "Stores and their staff: the staff member's email and name, and the store details that everyone can see — name, address, phone, WhatsApp, Instagram, items and photos.",
            "Visit statistics: which pages, stores and items were opened, taps on WhatsApp, phone, map and route, search queries in the catalog. A visitor in the statistics is a random number from your browser, with no name, email or phone.",
          ],
        ],
      },
      {
        title: "Location",
        blocks: [
          "The “Nearby” feature asks for your location only when you turn it on yourself. You can enter an address instead.",
          "The point is rounded to about 100 meters, stored in your browser and added to the page address to show stores near you. We do not save your location in our database.",
        ],
      },
      {
        title: "Why we need this data",
        blocks: [
          [
            "so that you can sign in and recover your password;",
            "so that a store can set an item aside and contact you about the reservation;",
            "so that favorites and routes are the same on your phone and computer;",
            "so that stores see how many people view their items, and we understand what works on the site;",
            "to protect the site from spam and abuse.",
          ],
        ],
      },
      {
        title: "Who we share data with",
        blocks: [
          "The store where you reserve an item: your name, phone, visit time and comment. The store receives them in its dashboard on the site and, if connected, in Telegram.",
          "Services the site cannot work without. They process data on our behalf:",
          [
            "Supabase — database and sign-in (servers in Japan);",
            "Vercel — site hosting;",
            "Resend — sending email confirmation and password recovery letters;",
            "Telegram — reservation notifications to stores;",
            "OpenStreetMap — the map and address search: the address you type is sent to this service.",
          ],
          "When you open a route in Google Maps or Yandex Maps, or message a store on WhatsApp, you move to those services and their rules apply.",
          "Government bodies — only on a lawful request. We do not share or sell data to anyone else.",
        ],
      },
      {
        title: "Where the data is stored",
        blocks: [
          "The data is stored on our contractors' servers outside the Republic of Kazakhstan (including in Japan and the USA). By creating an account or sending a reservation you agree to this transfer.",
        ],
      },
      {
        title: "How long we keep the data",
        blocks: [
          [
            "Account, favorites and routes — until you delete your account. You can delete it yourself on the “My account” page.",
            "Reservations stay with the store for its records even after the account is deleted, no longer linked to it. To remove your name and phone from reservations, write to us.",
            "Visit statistics are kept in anonymized form.",
          ],
        ],
      },
      {
        title: "Files in your browser",
        blocks: [
          "We use cookies and browser storage only to make the site work: sign-in, the chosen language and catalog section, favorites, route, recently viewed items, the name and phone for your next reservation, a random visitor number for statistics.",
          "There are no advertising or third-party tracking cookies on the site. You can clear this data in your browser settings.",
        ],
      },
      {
        title: "Your rights",
        blocks: [
          "At any time you can:",
          [
            "find out what data of yours we hold and get a copy;",
            "correct inaccurate data;",
            "delete your account and ask us to delete the rest of your data;",
            "withdraw your consent to data processing.",
          ],
          "To do so, write to the address above. We will reply within 15 working days.",
        ],
      },
      {
        title: "Changes",
        blocks: [
          "If we start collecting new data or change how we use it, we will update this page and the date at the top.",
        ],
      },
    ],
    consentBefore: "By tapping the button you agree to the",
    consentLink: "privacy policy",
    footerLink: "Privacy",
  },
};
