// KidsBe — общий модуль настроек интерфейса: тема, язык, палитра, прелоудер.
// Хранение выбранных пользователем параметров — localStorage (см. LS_KEYS).
// Файл подключается на всех страницах после <script src="js/data.js"> (KB уже доступен).

(function (global) {
  'use strict';

  var LS_KEYS = {
    theme: 'kidsbe_theme',       // 'light' | 'dark'
    lang: 'kidsbe_lang',         // 'ru' | 'en'
    palette: 'kidsbe_palette',   // 'purple' | 'green' | 'orange'
    a11yOn: 'kidsbe_a11y_on',        // '1' | '0'
    a11yFont: 'kidsbe_a11y_font',    // '0' (100%) | '1' (150%) | '2' (200%)
    a11yScheme: 'kidsbe_a11y_scheme',// '0'..'4'
    a11yImages: 'kidsbe_a11y_images' // 'on' | 'off'
  };

  var DEFAULTS = { theme: 'light', lang: 'ru', palette: 'purple', a11yOn: '0', a11yFont: '0', a11yScheme: '0', a11yImages: 'on' };

  /* ============================================================
     ТЕМА И ПАЛИТРА
     ============================================================ */
  function getTheme() { return localStorage.getItem(LS_KEYS.theme) || DEFAULTS.theme; }
  function getPalette() { return localStorage.getItem(LS_KEYS.palette) || DEFAULTS.palette; }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
  function applyPalette(p) {
    document.documentElement.setAttribute('data-palette', p);
  }
  function setTheme(theme) {
    localStorage.setItem(LS_KEYS.theme, theme);
    applyTheme(theme);
    updateWidgetState();
  }
  function setPalette(p) {
    localStorage.setItem(LS_KEYS.palette, p);
    applyPalette(p);
    updateWidgetState();
  }
  function toggleTheme() {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  /* ============================================================
     ВЕРСИЯ ДЛЯ СЛАБОВИДЯЩИХ
     — размер шрифта (1 из 3): 100% / 150% / 200%
     — цветовая схема (1 из 5 стандартных сочетаний)
     — отключение изображений (с поясняющей подписью вместо картинки)
     Всё это — общий переключаемый режим: пока он выключен, сайт
     выглядит как обычно, а сделанные внутри него настройки просто
     сохраняются на будущее.
     ============================================================ */
  function getA11yOn() { return localStorage.getItem(LS_KEYS.a11yOn) === '1'; }
  function getA11yFont() { return localStorage.getItem(LS_KEYS.a11yFont) || DEFAULTS.a11yFont; }
  function getA11yScheme() { return localStorage.getItem(LS_KEYS.a11yScheme) || DEFAULTS.a11yScheme; }
  function getA11yImages() { return localStorage.getItem(LS_KEYS.a11yImages) || DEFAULTS.a11yImages; }

  function applyA11yDom() {
    var root = document.documentElement;
    var on = getA11yOn();
    root.setAttribute('data-a11y', on ? 'on' : 'off');
    root.setAttribute('data-a11y-font', getA11yFont());
    root.setAttribute('data-a11y-scheme', getA11yScheme());
    root.setAttribute('data-a11y-images', getA11yImages());
    applyImagesToggle(on && getA11yImages() === 'off');
  }

  function setA11yOn(v) {
    localStorage.setItem(LS_KEYS.a11yOn, v ? '1' : '0');
    applyA11yDom();
    updateWidgetState();
  }
  function setA11yFont(v) {
    localStorage.setItem(LS_KEYS.a11yFont, v);
    applyA11yDom();
    updateWidgetState();
  }
  function setA11yScheme(v) {
    localStorage.setItem(LS_KEYS.a11yScheme, v);
    applyA11yDom();
    updateWidgetState();
  }
  function setA11yImages(v) {
    localStorage.setItem(LS_KEYS.a11yImages, v);
    applyA11yDom();
    updateWidgetState();
  }

  // ---- Отключение изображений с поясняющей надписью вместо картинки ----
  var a11yImagesOff = false;
  var a11yImgObserver = null;

  function hideOneImage(img) {
    if (img._kbA11yHidden || img.closest('.kb-settings')) return; // не трогаем иконки самого виджета
    img._kbA11yHidden = true;
    img._kbPrevDisplay = img.style.display;
    var label = document.createElement('span');
    label.className = 'kb-img-placeholder';
    label.textContent = '🚫 Изображение отключено' + (img.alt ? ': ' + img.alt : '');
    img.insertAdjacentElement('afterend', label);
    img._kbA11yLabel = label;
    img.style.display = 'none';
  }
  function showOneImage(img) {
    if (!img._kbA11yHidden) return;
    img._kbA11yHidden = false;
    img.style.display = img._kbPrevDisplay || '';
    if (img._kbA11yLabel) { img._kbA11yLabel.remove(); img._kbA11yLabel = null; }
  }

  function applyImagesToggle(off) {
    a11yImagesOff = off;
    document.querySelectorAll('img').forEach(function (img) {
      if (off) hideOneImage(img); else showOneImage(img);
    });
    if (off && !a11yImgObserver) {
      // Некоторые страницы дорисовывают карточки (курсы/педагоги) уже
      // после загрузки — следим за новыми <img> и тоже их прячем.
      a11yImgObserver = new MutationObserver(function (mutations) {
        if (!a11yImagesOff) return;
        mutations.forEach(function (m) {
          m.addedNodes && m.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            if (node.tagName === 'IMG') hideOneImage(node);
            else if (node.querySelectorAll) node.querySelectorAll('img').forEach(hideOneImage);
          });
        });
      });
      a11yImgObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  /* ============================================================
     I18N
     ============================================================ */
  var DICT = {
    ru: {
      nav_home: 'Главная', 
      nav_courses: 'Курсы', 
      nav_calendar: 'Календарь', 
      nav_teachers: 'Педагоги',
      
      login: 'Войти', 
      logout: 'Выйти', 
      admin: 'Админ',
      
      settings_title: 'Настройки', 
      theme_light: 'Светлая', 
      theme_dark: 'Тёмная',
      lang_label: 'Язык', 
      palette_label: 'Цвет темы', 
      reset_settings: 'Сбросить настройки',
      reset_done: 'Настройки сброшены',
      
      palette_purple: 'Фиолетовый', 
      palette_green: 'Зелёный', 
      palette_orange: 'Оранжевый',
      
      preloader_text: 'Загружаем KidsBe…',
      
      gallery_title: 'Атмосфера наших занятий',
      gallery_sub: 'Немного фотографий с офлайн- и онлайн-занятий KidsBe',
      
      auth_login_tab: 'Вход', 
      auth_register_tab: 'Регистрация',
      auth_via_email: 'Через почту', 
      auth_via_phone: 'Через телефон',
      auth_email: 'Электронная почта', 
      auth_phone: 'Номер телефона', 
      auth_password: 'Пароль',
      auth_password2: 'Повторите пароль', 
      auth_name: 'Имя',
      auth_remember: 'Запомнить меня', 
      auth_forgot: 'Забыли пароль?',
      auth_submit_login: 'Войти', 
      auth_submit_register: 'Зарегистрироваться',
      
      courses_title: 'Выберите готовый курс или соберите свою программу',
      teachers_title: 'Педагоги, которые работают с вашим ребёнком',
      calendar_title: 'Календарь занятости и расположение центра',
      
      page_of: 'Страница {cur} из {total}', 
      prev_page: 'Назад', 
      next_page: 'Вперёд',
      
      admin_gate_title: 'Вход в админ-панель', 
      admin_pass_label: 'Пароль администратора',
      
      save: 'Сохранить', 
      cancel: 'Отмена', 
      edit: 'Изменить', 
      del: 'Удалить',

      // === КЛЮЧИ ДЛЯ СТРАНИЦЫ "МОИ КУРСЫ" ===
      my_courses_title: 'Мои курсы',
      my_courses_sub: 'История ваших записей и активные программы',
      enrolled_date: 'Записан:',
      status_new: 'Новая запись',
      status_paid: 'Оплачено',
      completed: 'Завершено',

      // === ДОПОЛНИТЕЛЬНЫЕ КЛЮЧИ ДЛЯ КАРТОЧЕК КУРСОВ ===
      age: 'Возраст',
      years: 'лет',
      price_label: 'Стоимость',
      currency: 'руб.',
      lesson: 'занятие',
      empty_my_courses: 'Вы пока не записались ни на один курс.',
      go_to_courses: 'Перейти к выбору курсов →',

      unsubscribe: 'Отписаться',
      confirm_unsubscribe: 'Вы уверены, что хотите отписаться от этого курса?',
      unsubscribe_success: 'Вы успешно отписались от курса.',
      unsubscribe_error: 'Ошибка при отписке.',

      nav_my_courses: 'Мои курсы',

      // === ВЕРСИЯ ДЛЯ СЛАБОВИДЯЩИХ ===
      a11y_title: 'Версия для слабовидящих',
      a11y_enable: 'Включить особую версию',
      a11y_font_label: 'Размер шрифта',
      a11y_font_0: 'Обычный',
      a11y_font_1: 'Крупный (150%)',
      a11y_font_2: 'Очень крупный (200%)',
      a11y_scheme_label: 'Цветовая схема',
      a11y_scheme_0: 'Чёрный фон — белый текст',
      a11y_scheme_1: 'Чёрный фон — зелёный текст',
      a11y_scheme_2: 'Белый фон — чёрный текст',
      a11y_scheme_3: 'Бежевый фон — коричневый текст',
      a11y_scheme_4: 'Голубой фон — тёмно-синий текст',
      a11y_images_label: 'Изображения',
      a11y_images_on: 'Показывать',
      a11y_images_off: 'Отключить',

      // === ДЛЯ ГЛАВНОЙ СТРАНИЦЫ ===
hero_title: 'KidsBe - продуктивный подход к обучению детей от 3 до 7 лет',
hero_sub: 'Книга + мобильное приложение + онлайн-школа работают как единая система для развития речи, ума и навыков общения',
hero_phone_placeholder: 'Ваш номер телефона',
hero_btn: 'Получить демо-доступ',

feature_1: 'Домашняя альтернатива детским центрам',
feature_2: 'Простое применение',
feature_3: '33 занятия за 2 месяца',
feature_4: 'Результат с первого урока',

joy_title: 'Откройте ребенку радость увлекательного развития без скуки и стресса',
joy_intro: 'Практическое пособие KidsBe создано для домашнего обучения детей чтению, письму, мышлению и другим навыкам',
joy_card_1: 'Методика разработана специалистами по детскому развитию, поэтому эффективна и безопасна',
joy_card_2: 'Задания продуманы таким образом, чтобы принести ребенку максимум пользы и удовольствия',
joy_outro: 'Вы получите материалы с подробными инструкциями — просто следуйте рекомендациям, и все пройдет отлично',
joy_notebook_text: 'Пропиши буквы, обведи по точкам, назови слова на картинках',
joy_bubble_left: 'Комплект включает печатные материалы, мобильное приложение и доступ к онлайн-школе — занятия проходят сразу в нескольких форматах',
joy_bubble_right: 'Программа состоит из 33 уроков и рассчитана в среднем на 2 месяца, однако скорость прохождения у разных детей отличается',

benefits_title: 'Занимайтесь с удовольствием и достигайте новых вершин следующие 2 месяца и всю жизнь',
benefits_sub: 'KidsBe — это комплексная программа, помогающая получить положительные результаты сразу в нескольких сферах',
benefits_item_1: 'Равномерное развитие обоих полушарий мозга и межполушарных связей',
benefits_item_2: 'Укрепление памяти и внимания',
benefits_item_3: 'Развитие мышления и познавательного интереса',
benefits_item_4: 'Раскрытие творческих способностей',
benefits_item_5: 'Налаживание эмоциональных связей с родителями',
benefits_item_6: 'Повышение самостоятельности',

harmony_title: 'Гармония традиционных методик и новейших возможностей педагогики',
harmony_sub: 'Практическое пособие KidsBe совмещает офлайн и онлайн-занятия. Ребенок привыкает учиться в нескольких форматах:',
harmony_point_1: 'Читать и писать с помощью красивых книг, прописей, карточек',
harmony_point_2: 'Слушать, запоминать и играть в мобильном приложении',
harmony_final: 'Разные варианты работы поддерживают интерес ребенка к занятиям и взаимно усиливают друг друга, что помогает учиться без скуки и развиваться гармонично.',

cta_banner_title: '33 занятия — и ваш ребенок на новом уровне знаний',
cta_banner_sub: 'Учитесь без скуки и стресса с KidsBe',
cta_banner_name_label: 'Ваше имя',
cta_banner_name_placeholder: 'Александр',
cta_banner_phone_label: 'Ваш телефон',
cta_banner_phone_placeholder: '+ 375',
cta_banner_consent: 'Нажимая на кнопку, Вы даёте согласие на обработку персональных данных',
cta_banner_btn: 'Узнать стоимость',

app_tools_title: 'Полный арсенал развивающих инструментов в вашем смартфоне',
app_tools_sub: 'Часть заданий и полезной информации для родителей доступна в мобильном приложении. Оно включает:',
app_tools_card_1: 'Карты развития ФГОС — перечни умений и навыков детей в разном возрасте и бланки для личных заметок — просто введите возраст ребенка, и приложение покажет, что он уже должен уметь.',
app_tools_card_2: 'Мультфильмы и мини-игры с элементами дополненной реальности для вовлечения в образовательный процесс.',
app_tools_card_3: 'Видеоуроки с подробными инструкциями по выполнению физических и логопедических упражнений.',
app_tools_card_4: 'Чат со специалистами для оперативной поддержки и личных консультаций.',
app_tools_closing: 'Приложение удобно и интуитивно понятно. Все получится, даже если вы впервые пробуете такой формат обучения.',

support_title: 'Пошаговые инструкции и обратная связь от экспертов',
support_text_1: 'В обучающую методику интегрирована онлайн-школа KidsBe. С первого дня вы получите доступ к пошаговым инструкциям по домашнему обучению в целом и отдельным занятиям в частности. Полезные советы и видеоинструкции упростят обучение ребенка.',
support_text_2: 'В онлайн-школе вы будете получать от педагогов обратную связь по прогрессу, проверку домашних заданий и персональные рекомендации.',

ar_title: 'Исследуйте мир в дополненной реальности',
ar_text_1: 'С помощью фигурок героев и моделей KidsBe ребенок запомнит животных, углубит знания о природе и планете, а также разовьет мелкую моторику рук.',
ar_text_2: 'Яркие впечатления малышу подарят игры с элементами дополненной реальности: интересные персонажи и звери оживут на экране телефона. Ассоциативные мультфильмы помогут детям вовлечься в образовательный процесс и научиться мыслить по-новому.',

cta_green_title: 'Современный подход к дошкольному образованию',
cta_green_sub: 'Покажите ребенку, что учиться — это весело',
cta_green_btn: 'Узнать стоимость',

author_title: 'Раскройте педагогический потенциал',
author_text_1: 'KidsBe развивается и создает инновационные обучающие программы для детей, поэтому мы открыты для сотрудничества с новыми авторами.',
author_text_2: 'Если вы активный родитель, специалист в этой области или просто располагаете хорошей идеей, обратитесь к нам.',
author_text_3: 'Вместе мы сделаем дошкольное образование еще интереснее — приходите сами и приводите друзей.',
author_btn: 'Стать автором',

advantages_title: 'Оптимальное решение для тех, кто выбирает счастливое будущее',
adv_card_1_title: 'Гибкий график',
adv_card_1_text: 'Комплекс позволяет заниматься с ребенком, когда удобно вам, без привязки к расписанию детского центра или специалиста.',
adv_card_2_title: 'Дистанционное обучение',
adv_card_2_text: 'Занимайтесь дома и в поездках — нужны только печатные материалы и смартфон.',
adv_card_3_title: 'Персональная программа',
adv_card_3_text: 'Уроки легко адаптировать под вашего малыша — возраст, характер, уровень знаний и даже настроение.',
adv_card_4_title: 'Для детей с особенностями развития',
adv_card_4_text: 'Программа подходит малышам с ЗРР, ЗПР и СДВГ',

testimonials_title: 'Родители и педагоги отмечают захватывающее содержание и эффективность методик',
testimonials_tab_parents: 'Родители',
testimonials_tab_teachers: 'Педагоги',
testimonials_video_title: 'Методика для развития детей',
testimonials_video_tag1: 'Психология',
testimonials_video_tag2: 'Физиология',
testimonials_video_tag3: 'Педагогика',
testimonials_ask_btn: 'Спросить лично',
testimonials_review_1: '«Мы занимаемся уже второй месяц, и я вижу, как сын стал увереннее говорить и с удовольствием садится за занятия сам, без напоминаний».',
testimonials_review_2: '«Понравился формат — печатные материалы плюс приложение. Ребенку интересно, а мне удобно следить за прогрессом и рекомендациями педагогов».',

cta_red_title: 'Откройте мир знаний своему ребенку',
cta_red_sub: 'Пусть старт в образовании пройдет без стресса и скуки',
cta_red_btn: 'Узнать стоимость',

footer_legal: 'ИП Максименко Павел Викторович',
footer_inn: 'ИНН 860702788054',
footer_ogrn: 'ОГРНИП 311860718500013',

// === ЧАТ (поддержка) ===
chat_name_sv: 'Светлана',
chat_name_support: 'Служба поддержки',
chat_message_1: 'А можно каким-нибудь образом посмотреть видеоинструкции, в которых показано правильное выполнение дыхательной и пальчиковой гимнастики?',
chat_message_2: 'Откройте приложение и наведите камеру смартфона на первую иллюстрацию любого занятия, после этого нажмите на появившуюся кнопку «видео уроки».',
chat_message_3: 'Спасибо большое. Ребенку очень нравится 👍',
courses_eyebrow: 'Курсы KidsBe',
courses_sub: 'Каждый курс состоит из модулей — их можно комбинировать под возраст и цели ребёнка. Ниже — калькулятор, который сразу считает итоговую стоимость.',
courses_search_placeholder: 'Поиск по названию...',
courses_sort_label: 'Сортировка:',
courses_sort_default: 'По умолчанию',
courses_sort_price_asc: 'Цена: от низкой к высокой',
courses_sort_price_desc: 'Цена: от высокой к низкой',
courses_sort_name_asc: 'А-Я',
courses_category_label: 'Категория:',
courses_category_all: 'Все',
courses_category_speech: 'Речь',
courses_category_math: 'Математика',
courses_category_art: 'Творчество',
courses_category_english: 'Английский',
courses_pick_btn: 'Выбрать курс',
courses_not_found: 'Курсы по вашему запросу не найдены.',
courses_error: 'Ошибка сети или данных.',

builder_title: 'Конструктор курса',
builder_title_prefix: 'Конструктор:',
builder_sub: 'Выберите курс, формат занятий и нужные модули — стоимость обновится автоматически.',
builder_format_label: 'Формат занятий',
builder_format_online: 'Онлайн',
builder_format_offline: 'Очно в центре',
builder_lessons_label: 'Количество занятий в месяц',
builder_modules_label: 'Модули курса',
builder_empty: 'Выберите курс...',

summary_title: 'Итоговый расчёт',
summary_course: 'Курс',
summary_format: 'Формат',
summary_lessons: 'Занятий в месяц',
summary_modules_selected: 'Модулей выбрано',
summary_price_per_lesson: 'Цена за занятие',
summary_total: 'Итого за месяц',
summary_order_btn: 'Записаться на курс',

from: 'от',
of: 'из',
enroll_success: 'Вы записаны!',

lessons_one: 'занятие',
lessons_few: 'занятия',
lessons_many: 'занятий',

calendar_eyebrow: 'Запись на занятия',
calendar_sub: 'Зелёным отмечены свободные дни, красным — уже занятые, серым — дни, когда центр не работает. Точные даты открывает и закрывает администратор.',
calendar_load_error: 'Не удалось загрузить данные. Запустите json-server (npm run server).',
address_title: 'Наш адрес',
address_hours: 'Работаем ежедневно, кроме воскресенья',
legend_free: 'Свободно',
legend_busy: 'Уже занято',
legend_closed: 'Центр закрыт',
status_free: 'Свободно',
status_busy: 'Занято',
status_closed: 'Закрыто',
slot_free: 'свободно',
slot_busy: 'занято',
day_closed: 'В этот день центр не работает',
select_day_hint: 'Выберите день в календаре, чтобы увидеть свободное время',

// Дни недели
mon: 'Пн',
tue: 'Вт',
wed: 'Ср',
thu: 'Чт',
fri: 'Пт',
sat: 'Сб',
sun: 'Вс',

// Месяцы
month_jan: 'январь',
month_feb: 'февраль',
month_mar: 'март',
month_apr: 'апрель',
month_may: 'май',
month_jun: 'июнь',
month_jul: 'июль',
month_aug: 'август',
month_sep: 'сентябрь',
month_oct: 'октябрь',
month_nov: 'ноябрь',
month_dec: 'декабрь',

teachers_eyebrow: 'Наша команда',
teachers_sub: 'Все преподаватели — практикующие специалисты по дошкольному развитию, дефектологии и раннему обучению языкам.',
teachers_filter_all: 'Все',
teachers_empty: 'Педагоги с таким направлением пока не добавлены',
teachers_load_error: 'Не удалось загрузить педагогов. Запустите json-server (npm run server).',
teachers_exp_label: 'лет опыта',
teachers_students_label: 'учеников',
pagination_prev: '‹',
pagination_next: '›',

// === СТРАНИЦА АВТОРИЗАЦИИ ===
auth_visual_title: 'Личный кабинет KidsBe',
auth_visual_sub: 'Отслеживайте прогресс ребёнка, записывайтесь на занятия и собирайте курс под свои задачи в конструкторе.',

auth_login_title: 'С возвращением!',
auth_login_sub: 'Войдите, чтобы продолжить обучение',
auth_email_placeholder: 'you@example.com',
auth_phone_placeholder: '+375 29 000-00-00',
auth_password_placeholder: 'Минимум 6 символов',
auth_email_error: 'Введите корректный email',
auth_phone_error: 'Введите корректный номер телефона',
auth_password_error: 'Пароль должен быть не короче 6 символов',
auth_user_not_found: 'Пользователь не найден',
auth_wrong_password: 'Неверный пароль',
auth_login_success: 'Успешный вход! Перенаправляем…',
auth_login_error: 'Ошибка входа',

auth_register_title: 'Создать аккаунт',
auth_register_sub: 'Заполните все обязательные поля',
auth_surname: 'Фамилия',
auth_surname_placeholder: 'Иванов',
auth_surname_error: 'Введите фамилию',
auth_name_placeholder: 'Пётр',
auth_name_error: 'Введите имя',
auth_patronymic: 'Отчество',
auth_patronymic_placeholder: 'Иванович',
auth_phone_rb: 'Номер телефона (РБ)',
auth_phone_rb_error: 'Введите номер в формате +375 (25/29/33/44) 7 цифр',
auth_birthdate: 'Дата рождения',
auth_birthdate_error: 'Вам должно быть не менее 16 лет',
auth_nickname: 'Никнейм',
auth_nickname_placeholder: 'Придумайте никнейм',
auth_nickname_generate: 'Сгенерировать новый',
auth_nickname_error: 'Пожалуйста, введите никнейм вручную',
auth_nickname_manual_placeholder: 'Введите никнейм вручную',
auth_nickname_manual_error: 'Попытки закончились. Введите никнейм вручную.',
auth_pass_method_label: 'Способ задания пароля',
auth_pass_method_auto: 'Сгенерировать автоматически',
auth_pass_method_manual: 'Ввести самостоятельно',
auth_auto_password_label: 'Сгенерированный пароль',
auth_auto_password_toggle: '👁',
auth_auto_password_copy: '📋',
auth_auto_password_hint: 'Пароль сгенерирован автоматически. Сохраните его!',
auth_password_manual_placeholder: 'Минимум 8 символов',
auth_password_manual_error: 'Пароль должен содержать минимум 8 символов, заглавную и строчную буквы, цифру и спецсимвол',
auth_password2_placeholder: 'Повторите пароль',
auth_password2_error: 'Пароли не совпадают',
auth_agreement_text: 'Я прочитал и принимаю условия',
auth_agreement_link: 'Соглашения пользователя',
auth_agreement_error: 'Необходимо принять соглашение',
auth_register_success: 'Аккаунт создан! Перенаправляем…',
auth_register_error: 'Ошибка регистрации',

auth_switch_login_text: 'Ещё нет аккаунта?',
auth_switch_login_link: 'Зарегистрироваться',
auth_switch_register_text: 'Уже есть аккаунт?',
auth_switch_register_link: 'Войти',
auth_switch_admin: 'Войти как администратор →',

auth_password_copied: 'Пароль скопирован в буфер обмена',
auth_already_logged_in: 'Вы уже вошли как {name}.',
    },
    en: {
      nav_home: 'Home', 
      nav_courses: 'Courses', 
      nav_calendar: 'Calendar', 
      nav_teachers: 'Teachers',
      
      login: 'Log in', 
      logout: 'Log out', 
      admin: 'Admin',
      
      settings_title: 'Settings', 
      theme_light: 'Light', 
      theme_dark: 'Dark',
      lang_label: 'Language', 
      palette_label: 'Accent color',
      reset_settings: 'Reset settings',
      reset_done: 'Settings reset',
      
      palette_purple: 'Purple', 
      palette_green: 'Green', 
      palette_orange: 'Orange',
      
      preloader_text: 'Loading KidsBe…',
      
      gallery_title: 'The vibe of our classes',
      gallery_sub: 'A few photos from KidsBe offline and online lessons',
      
      auth_login_tab: 'Log in', 
      auth_register_tab: 'Sign up',
      auth_via_email: 'By email', 
      auth_via_phone: 'By phone',
      auth_email: 'Email address', 
      auth_phone: 'Phone number', 
      auth_password: 'Password',
      auth_password2: 'Repeat password', 
      auth_name: 'Name',
      auth_remember: 'Remember me', 
      auth_forgot: 'Forgot password?',
      auth_submit_login: 'Log in', 
      auth_submit_register: 'Sign up',
      
      courses_title: 'Pick a ready-made course or build your own program',
      teachers_title: 'Teachers who work with your child',
      calendar_title: 'Availability calendar and center location',
      
      page_of: 'Page {cur} of {total}', 
      prev_page: 'Prev', 
      next_page: 'Next',
      
      admin_gate_title: 'Admin panel login', 
      admin_pass_label: 'Admin password',
      
      save: 'Save', 
      cancel: 'Cancel', 
      edit: 'Edit', 
      del: 'Delete',

      // === КЛЮЧИ ДЛЯ СТРАНИЦЫ "МОИ КУРСЫ" ===
      my_courses_title: 'My Courses',
      my_courses_sub: 'Your enrollment history and active programs',
      enrolled_date: 'Enrolled on:',
      status_new: 'New booking',
      status_paid: 'Paid',
      completed: 'Completed',

      // === ДОПОЛНИТЕЛЬНЫЕ КЛЮЧИ ДЛЯ КАРТОЧЕК КУРСОВ ===
      age: 'Age',
      years: 'years',
      price_label: 'Price',
      currency: 'rub.',
      lesson: 'class',
      empty_my_courses: "You haven't enrolled in any course yet.",
      go_to_courses: 'Go to courses →',
      unsubscribe: 'Unsubscribe',
      confirm_unsubscribe: 'Are you sure you want to unsubscribe from this course?',
      unsubscribe_success: 'You have successfully unsubscribed from the course.',
      unsubscribe_error: 'Error unsubscribing.',

      nav_my_courses: 'My courses',

      // === ACCESSIBLE (LOW-VISION) VERSION ===
      a11y_title: 'Accessible version',
      a11y_enable: 'Enable accessible mode',
      a11y_font_label: 'Font size',
      a11y_font_0: 'Normal',
      a11y_font_1: 'Large (150%)',
      a11y_font_2: 'Extra large (200%)',
      a11y_scheme_label: 'Color scheme',
      a11y_scheme_0: 'Black background — white text',
      a11y_scheme_1: 'Black background — green text',
      a11y_scheme_2: 'White background — black text',
      a11y_scheme_3: 'Beige background — brown text',
      a11y_scheme_4: 'Light blue background — dark blue text',
      a11y_images_label: 'Images',
      a11y_images_on: 'Show',
      a11y_images_off: 'Hide',

      hero_title: 'KidsBe - a productive approach to teaching children from 3 to 7 years old',
hero_sub: 'Book + mobile app + online school work as a single system for developing speech, mind and communication skills',
hero_phone_placeholder: 'Your phone number',
hero_btn: 'Get demo access',

feature_1: 'Home alternative to children\'s centers',
feature_2: 'Easy to use',
feature_3: '33 lessons in 2 months',
feature_4: 'Results from the first lesson',

joy_title: 'Give your child the joy of exciting development without boredom and stress',
joy_intro: 'The KidsBe practical guide is designed for home learning of reading, writing, thinking and other skills',
joy_card_1: 'The methodology was developed by child development specialists, so it is effective and safe',
joy_card_2: 'Tasks are designed to bring maximum benefit and pleasure to the child',
joy_outro: 'You will receive materials with detailed instructions — just follow the recommendations and everything will go fine',
joy_notebook_text: 'Write letters, trace dots, name words in pictures',
joy_bubble_left: 'The kit includes printed materials, a mobile application and access to an online school — classes take place in several formats at once',
joy_bubble_right: 'The program consists of 33 lessons and is designed for an average of 2 months, but the pace of completion varies from child to child',

benefits_title: 'Study with pleasure and reach new heights for the next 2 months and for life',
benefits_sub: 'KidsBe is a comprehensive program that helps you get positive results in several areas at once',
benefits_item_1: 'Balanced development of both hemispheres of the brain and interhemispheric connections',
benefits_item_2: 'Strengthening memory and attention',
benefits_item_3: 'Development of thinking and cognitive interest',
benefits_item_4: 'Unlocking creative abilities',
benefits_item_5: 'Building emotional bonds with parents',
benefits_item_6: 'Increasing independence',

harmony_title: 'Harmony of traditional methods and the latest pedagogical possibilities',
harmony_sub: 'KidsBe combines offline and online classes. The child gets used to learning in several formats:',
harmony_point_1: 'Read and write with beautiful books, copybooks, flashcards',
harmony_point_2: 'Listen, remember and play in the mobile app',
harmony_final: 'Different work formats support the child\'s interest in learning and mutually reinforce each other, which helps to learn without boredom and develop harmoniously.',

cta_banner_title: '33 lessons — and your child will reach a new level of knowledge',
cta_banner_sub: 'Learn without boredom and stress with KidsBe',
cta_banner_name_label: 'Your name',
cta_banner_name_placeholder: 'Alexander',
cta_banner_phone_label: 'Your phone',
cta_banner_phone_placeholder: '+ 375',
cta_banner_consent: 'By clicking the button, you consent to the processing of personal data',
cta_banner_btn: 'Find out the cost',

app_tools_title: 'A full arsenal of developmental tools in your smartphone',
app_tools_sub: 'Some tasks and useful information for parents are available in the mobile app. It includes:',
app_tools_card_1: 'FGOS development maps — lists of skills and abilities of children of different ages and forms for personal notes — just enter the child\'s age and the app will show what they should already be able to do.',
app_tools_card_2: 'Cartoons and mini-games with augmented reality elements to engage in the educational process.',
app_tools_card_3: 'Video tutorials with detailed instructions for physical and speech therapy exercises.',
app_tools_card_4: 'Chat with specialists for prompt support and personal consultations.',
app_tools_closing: 'The app is convenient and intuitive. Everything will work out, even if you are trying this format of education for the first time.',

support_title: 'Step-by-step instructions and feedback from experts',
support_text_1: 'The online school KidsBe is integrated into the training methodology. From the first day you will get access to step-by-step instructions for home education in general and for individual lessons in particular. Useful tips and video instructions will simplify your child\'s learning.',
support_text_2: 'In the online school, you will receive feedback from teachers on progress, homework checking and personal recommendations.',

ar_title: 'Explore the world in augmented reality',
ar_text_1: 'With the help of KidsBe hero figures and models, the child will remember animals, deepen knowledge about nature and the planet, and develop fine motor skills.',
ar_text_2: 'Bright impressions will be given to the child by games with augmented reality: interesting characters and animals will come to life on the phone screen. Associative cartoons will help children get involved in the educational process and learn to think in a new way.',

cta_green_title: 'A modern approach to preschool education',
cta_green_sub: 'Show your child that learning is fun',
cta_green_btn: 'Find out the cost',

author_title: 'Unlock your pedagogical potential',
author_text_1: 'KidsBe is developing and creating innovative educational programs for children, so we are open to cooperation with new authors.',
author_text_2: 'If you are an active parent, a specialist in this field, or just have a good idea, contact us.',
author_text_3: 'Together we will make preschool education even more interesting — come yourself and bring your friends.',
author_btn: 'Become an author',

advantages_title: 'The optimal solution for those who choose a happy future',
adv_card_1_title: 'Flexible schedule',
adv_card_1_text: 'The kit allows you to study with your child at a time convenient for you, without being tied to the schedule of a children\'s center or specialist.',
adv_card_2_title: 'Distance learning',
adv_card_2_text: 'Study at home and on trips — you only need printed materials and a smartphone.',
adv_card_3_title: 'Personalized program',
adv_card_3_text: 'Lessons can be easily adapted to your baby — age, character, level of knowledge and even mood.',
adv_card_4_title: 'For children with special needs',
adv_card_4_text: 'The program is suitable for children with speech delay, mental retardation and ADHD',

testimonials_title: 'Parents and teachers note the exciting content and effectiveness of the methods',
testimonials_tab_parents: 'Parents',
testimonials_tab_teachers: 'Teachers',
testimonials_video_title: 'Methodology for child development',
testimonials_video_tag1: 'Psychology',
testimonials_video_tag2: 'Physiology',
testimonials_video_tag3: 'Pedagogy',
testimonials_ask_btn: 'Ask personally',
testimonials_review_1: '«We\'ve been studying for the second month, and I see how my son has become more confident in speaking and sits down for classes with pleasure, without reminders».',
testimonials_review_2: '«I liked the format — printed materials plus an app. The child is interested, and it is convenient for me to track progress and teachers\' recommendations».',

cta_red_title: 'Open the world of knowledge to your child',
cta_red_sub: 'Let the start in education be without stress and boredom',
cta_red_btn: 'Find out the cost',

footer_legal: 'IP Maksimenko Pavel Viktorovich',
footer_inn: 'INN 860702788054',
footer_ogrn: 'OGRNIP 311860718500013',

chat_name_sv: 'Svetlana',
chat_name_support: 'Support service',
chat_message_1: 'Is there any way to view video instructions showing the correct performance of breathing and finger exercises?',
chat_message_2: 'Open the app and point your smartphone camera at the first illustration of any activity, then click the “video lessons” button that appears.',
chat_message_3: 'Thank you very much. The child really likes it 👍',
courses_eyebrow: 'KidsBe Courses',
courses_sub: 'Each course consists of modules — you can combine them according to the child\'s age and goals. Below is a calculator that immediately calculates the total cost.',
courses_search_placeholder: 'Search by name...',
courses_sort_label: 'Sort by:',
courses_sort_default: 'Default',
courses_sort_price_asc: 'Price: low to high',
courses_sort_price_desc: 'Price: high to low',
courses_sort_name_asc: 'A-Z',
courses_category_label: 'Category:',
courses_category_all: 'All',
courses_category_speech: 'Speech',
courses_category_math: 'Math',
courses_category_art: 'Art',
courses_category_english: 'English',
courses_pick_btn: 'Select course',
courses_not_found: 'No courses found for your request.',
courses_error: 'Network or data error.',

builder_title: 'Course Builder',
builder_title_prefix: 'Builder:',
builder_sub: 'Select a course, class format and the desired modules — the price will update automatically.',
builder_format_label: 'Class format',
builder_format_online: 'Online',
builder_format_offline: 'In-person at the center',
builder_lessons_label: 'Number of classes per month',
builder_modules_label: 'Course modules',
builder_empty: 'Select a course...',

summary_title: 'Total calculation',
summary_course: 'Course',
summary_format: 'Format',
summary_lessons: 'Classes per month',
summary_modules_selected: 'Modules selected',
summary_price_per_lesson: 'Price per class',
summary_total: 'Total per month',
summary_order_btn: 'Enroll in the course',

from: 'from',
of: 'of',
enroll_success: 'You are enrolled!',

lessons_one: 'class',
lessons_few: 'classes',
lessons_many: 'classes',
calendar_eyebrow: 'Booking classes',
calendar_sub: 'Green days are free, red are already busy, gray are days when the center is closed. Exact dates are managed by the administrator.',
calendar_load_error: 'Failed to load data. Please run json-server (npm run server).',
address_title: 'Our address',
address_hours: 'Open daily, except Sunday',
legend_free: 'Free',
legend_busy: 'Already busy',
legend_closed: 'Center closed',
status_free: 'Free',
status_busy: 'Busy',
status_closed: 'Closed',
slot_free: 'free',
slot_busy: 'busy',
day_closed: 'The center is closed on this day',
select_day_hint: 'Select a day in the calendar to see available time slots',

// Days of the week
mon: 'Mon',
tue: 'Tue',
wed: 'Wed',
thu: 'Thu',
fri: 'Fri',
sat: 'Sat',
sun: 'Sun',

// Months
month_jan: 'January',
month_feb: 'February',
month_mar: 'March',
month_apr: 'April',
month_may: 'May',
month_jun: 'June',
month_jul: 'July',
month_aug: 'August',
month_sep: 'September',
month_oct: 'October',
month_nov: 'November',
month_dec: 'December',

teachers_eyebrow: 'Our team',
teachers_sub: 'All teachers are practicing specialists in preschool development, defectology and early language learning.',
teachers_filter_all: 'All',
teachers_empty: 'No teachers with this specialization have been added yet',
teachers_load_error: 'Failed to load teachers. Please run json-server (npm run server).',
teachers_exp_label: 'years of experience',
teachers_students_label: 'students',
pagination_prev: '‹',
pagination_next: '›',

// === AUTH PAGE ===
auth_visual_title: 'KidsBe Personal Account',
auth_visual_sub: 'Track your child\'s progress, enroll in classes and build a course tailored to your needs in the constructor.',

auth_login_title: 'Welcome back!',
auth_login_sub: 'Log in to continue learning',
auth_email_placeholder: 'you@example.com',
auth_phone_placeholder: '+375 29 000-00-00',
auth_password_placeholder: 'Minimum 6 characters',
auth_email_error: 'Please enter a valid email',
auth_phone_error: 'Please enter a valid phone number',
auth_password_error: 'Password must be at least 6 characters long',
auth_user_not_found: 'User not found',
auth_wrong_password: 'Incorrect password',
auth_login_success: 'Login successful! Redirecting…',
auth_login_error: 'Login error',

auth_register_title: 'Create account',
auth_register_sub: 'Fill in all required fields',
auth_surname: 'Surname',
auth_surname_placeholder: 'Ivanov',
auth_surname_error: 'Please enter your surname',
auth_name_placeholder: 'Peter',
auth_name_error: 'Please enter your name',
auth_patronymic: 'Patronymic',
auth_patronymic_placeholder: 'Ivanovich',
auth_phone_rb: 'Phone number (Belarus)',
auth_phone_rb_error: 'Please enter a number in the format +375 (25/29/33/44) 7 digits',
auth_birthdate: 'Date of birth',
auth_birthdate_error: 'You must be at least 16 years old',
auth_nickname: 'Nickname',
auth_nickname_placeholder: 'Choose a nickname',
auth_nickname_generate: 'Generate new one',
auth_nickname_error: 'Please enter a nickname manually',
auth_nickname_manual_placeholder: 'Enter a nickname manually',
auth_nickname_manual_error: 'Attempts are over. Enter a nickname manually.',
auth_pass_method_label: 'Password method',
auth_pass_method_auto: 'Generate automatically',
auth_pass_method_manual: 'Enter manually',
auth_auto_password_label: 'Generated password',
auth_auto_password_toggle: '👁',
auth_auto_password_copy: '📋',
auth_auto_password_hint: 'Password generated automatically. Save it!',
auth_password_manual_placeholder: 'Minimum 8 characters',
auth_password_manual_error: 'Password must contain at least 8 characters, uppercase and lowercase letters, a digit and a special character',
auth_password2_placeholder: 'Repeat password',
auth_password2_error: 'Passwords do not match',
auth_agreement_text: 'I have read and agree to the',
auth_agreement_link: 'User Agreement',
auth_agreement_error: 'You must accept the agreement',
auth_register_success: 'Account created! Redirecting…',
auth_register_error: 'Registration error',

auth_switch_login_text: 'Don\'t have an account?',
auth_switch_login_link: 'Sign up',
auth_switch_register_text: 'Already have an account?',
auth_switch_register_link: 'Log in',
auth_switch_admin: 'Log in as admin →',

auth_password_copied: 'Password copied to clipboard',
auth_already_logged_in: 'You are already logged in as {name}.',
    }
  };

  function getLang() { return localStorage.getItem(LS_KEYS.lang) || DEFAULTS.lang; }

  function t(key, vars) {
    var lang = getLang();
    var str = (DICT[lang] && DICT[lang][key]) || (DICT.ru[key]) || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        str = str.replace('{' + k + '}', vars[k]);
      });
    }
    return str;
  }

  function applyI18n(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    document.documentElement.setAttribute('lang', getLang());
  }

  function setLang(lang) {
    localStorage.setItem(LS_KEYS.lang, lang);
    applyI18n();
    updateWidgetState();
    document.dispatchEvent(new CustomEvent('kidsbe:langchange', { detail: { lang: lang } }));
  }

  /* ============================================================
     СБРОС НАСТРОЕК
     ============================================================ */
  function resetSettings() {
    Object.keys(LS_KEYS).forEach(function (k) { localStorage.removeItem(LS_KEYS[k]); });
    applyTheme(DEFAULTS.theme);
    applyPalette(DEFAULTS.palette);
    applyA11yDom();
    applyI18n();
    updateWidgetState();
  }

  /* ============================================================
     ВИДЖЕТ НАСТРОЕК (в шапке каждой страницы)
     ============================================================ */
  var widgetRoot = null;

  function updateWidgetState() {
    if (!widgetRoot) return;
    var theme = getTheme(), lang = getLang(), palette = getPalette();
    var themeBtn = widgetRoot.querySelector('[data-role="theme-toggle"]');
    if (themeBtn) themeBtn.textContent = theme === 'dark' ? '☀' : '☾';
    widgetRoot.querySelectorAll('[data-role="lang-option"]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    widgetRoot.querySelectorAll('[data-role="palette-option"]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.palette === palette);
    });

    var a11yOn = getA11yOn();
    var a11yBody = widgetRoot.querySelector('[data-role="a11y-body"]');
    var a11yToggle = widgetRoot.querySelector('[data-role="a11y-toggle"]');
    if (a11yToggle) a11yToggle.checked = a11yOn;
    if (a11yBody) a11yBody.classList.toggle('kb-a11y-disabled', !a11yOn);
    widgetRoot.querySelectorAll('[data-role="a11y-font"]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.font === getA11yFont());
    });
    widgetRoot.querySelectorAll('[data-role="a11y-scheme"]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.scheme === getA11yScheme());
    });
    widgetRoot.querySelectorAll('[data-role="a11y-images"]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.images === getA11yImages());
    });
  }

  function buildWidget(container) {
    widgetRoot = container;
    container.classList.add('kb-settings');
    container.innerHTML =
      '<button type="button" class="kb-settings-toggle" data-role="settings-toggle" title="' + t('settings_title') + '">⚙</button>' +
      '<div class="kb-settings-panel" data-role="settings-panel">' +
        '<div class="kb-settings-row">' +
          '<span data-i18n="theme_light" class="kb-settings-caption"></span>' +
          '<button type="button" class="kb-theme-btn" data-role="theme-toggle" title="Theme"></button>' +
        '</div>' +
        '<div class="kb-settings-row">' +
          '<span data-i18n="lang_label" class="kb-settings-caption"></span>' +
          '<div class="kb-lang-set">' +
            '<button type="button" data-role="lang-option" data-lang="ru">RU</button>' +
            '<button type="button" data-role="lang-option" data-lang="en">EN</button>' +
          '</div>' +
        '</div>' +
        '<div class="kb-settings-row">' +
          '<span data-i18n="palette_label" class="kb-settings-caption"></span>' +
          '<div class="kb-palette-set">' +
            '<button type="button" data-role="palette-option" data-palette="purple" style="--sw:#5B4FE9"></button>' +
            '<button type="button" data-role="palette-option" data-palette="green" style="--sw:#2FBF71"></button>' +
            '<button type="button" data-role="palette-option" data-palette="orange" style="--sw:#E9573F"></button>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="kb-reset-btn" data-role="reset-settings" data-i18n="reset_settings"></button>' +

        '<div class="kb-settings-row" style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border, #E4E2F2);">' +
          '<span class="kb-settings-caption" data-i18n="a11y_title" style="font-weight:800;"></span>' +
          '<label class="kb-a11y-switch">' +
            '<input type="checkbox" data-role="a11y-toggle">' +
            '<span class="kb-a11y-slider"></span>' +
          '</label>' +
        '</div>' +
        '<div class="kb-a11y-body" data-role="a11y-body">' +
          '<div class="kb-settings-row" style="align-items:flex-start; flex-direction:column; gap:6px;">' +
            '<span class="kb-settings-caption" data-i18n="a11y_font_label"></span>' +
            '<div class="kb-a11y-set">' +
              '<button type="button" data-role="a11y-font" data-font="0" data-i18n="a11y_font_0"></button>' +
              '<button type="button" data-role="a11y-font" data-font="1" data-i18n="a11y_font_1"></button>' +
              '<button type="button" data-role="a11y-font" data-font="2" data-i18n="a11y_font_2"></button>' +
            '</div>' +
          '</div>' +
          '<div class="kb-settings-row" style="align-items:flex-start; flex-direction:column; gap:6px;">' +
            '<span class="kb-settings-caption" data-i18n="a11y_scheme_label"></span>' +
            '<div class="kb-a11y-set kb-a11y-scheme-set">' +
              '<button type="button" data-role="a11y-scheme" data-scheme="0" data-i18n="a11y_scheme_0" style="background:#000;color:#fff;"></button>' +
              '<button type="button" data-role="a11y-scheme" data-scheme="1" data-i18n="a11y_scheme_1" style="background:#000;color:#00ff66;"></button>' +
              '<button type="button" data-role="a11y-scheme" data-scheme="2" data-i18n="a11y_scheme_2" style="background:#fff;color:#000;border:1px solid #ccc;"></button>' +
              '<button type="button" data-role="a11y-scheme" data-scheme="3" data-i18n="a11y_scheme_3" style="background:#F5EFDD;color:#4A2E1E;"></button>' +
              '<button type="button" data-role="a11y-scheme" data-scheme="4" data-i18n="a11y_scheme_4" style="background:#DCEEFB;color:#08306B;"></button>' +
            '</div>' +
          '</div>' +
          '<div class="kb-settings-row" style="align-items:flex-start; flex-direction:column; gap:6px;">' +
            '<span class="kb-settings-caption" data-i18n="a11y_images_label"></span>' +
            '<div class="kb-a11y-set">' +
              '<button type="button" data-role="a11y-images" data-images="on" data-i18n="a11y_images_on"></button>' +
              '<button type="button" data-role="a11y-images" data-images="off" data-i18n="a11y_images_off"></button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var toggle = container.querySelector('[data-role="settings-toggle"]');
    var panel = container.querySelector('[data-role="settings-panel"]');
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!container.contains(e.target)) panel.classList.remove('open');
    });

    container.querySelector('[data-role="theme-toggle"]').addEventListener('click', toggleTheme);
    container.querySelectorAll('[data-role="lang-option"]').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.dataset.lang); });
    });
    container.querySelectorAll('[data-role="palette-option"]').forEach(function (b) {
      b.addEventListener('click', function () { setPalette(b.dataset.palette); });
    });
    container.querySelector('[data-role="reset-settings"]').addEventListener('click', function () {
      resetSettings();
      var caption = container.querySelector('[data-role="reset-settings"]');
      var old = caption.textContent;
      caption.textContent = t('reset_done');
      setTimeout(function () { caption.textContent = t('reset_settings'); }, 1400);
    });

    container.querySelector('[data-role="a11y-toggle"]').addEventListener('change', function (e) {
      setA11yOn(e.target.checked);
    });
    container.querySelectorAll('[data-role="a11y-font"]').forEach(function (b) {
      b.addEventListener('click', function () { setA11yFont(b.dataset.font); });
    });
    container.querySelectorAll('[data-role="a11y-scheme"]').forEach(function (b) {
      b.addEventListener('click', function () { setA11yScheme(b.dataset.scheme); });
    });
    container.querySelectorAll('[data-role="a11y-images"]').forEach(function (b) {
      b.addEventListener('click', function () { setA11yImages(b.dataset.images); });
    });

    applyI18n(container);
    updateWidgetState();
  }

  function mountSettingsWidget(selectorOrEl) {
    var el = typeof selectorOrEl === 'string' ? document.querySelector(selectorOrEl) : selectorOrEl;
    if (!el) return;
    buildWidget(el);
  }

  /* ============================================================
     ПРЕЛОУДЕР
     ============================================================ */
  function hidePreloader() {
    var el = document.getElementById('kbPreloader');
    if (!el) return;
    el.classList.add('hide');
    setTimeout(function () { el.remove(); }, 450);
  }

  /* ============================================================
     МОДАЛЬНОЕ ОКНО
     ============================================================ */
  function showModal(title, message) {
    // Удаляем старую модалку, если есть
    var oldBackdrop = document.querySelector('.kb-modal-backdrop');
    if (oldBackdrop) oldBackdrop.remove();

    var backdrop = document.createElement('div');
    backdrop.className = 'kb-modal-backdrop';
    backdrop.innerHTML = `
        <div class="kb-modal-box">
            <button type="button" class="kb-modal-close">&times;</button>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    function destroy() {
        backdrop.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(function() {
            if (backdrop.parentNode) backdrop.remove();
        }, 300);
    }

    // Показываем с анимацией
    requestAnimationFrame(function() {
        backdrop.classList.add('show');
    });

    // Закрытие по крестику
    backdrop.querySelector('.kb-modal-close').addEventListener('click', destroy);
    // Закрытие по клику на фон
    backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) destroy();
    });
    // Закрытие по Escape
    document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') {
            destroy();
            document.removeEventListener('keydown', handler);
        }
    });
  }

  /* ============================================================
     УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК ФОРМ (для форм с name="phone")
     ============================================================ */
  function setupUniversalForms() {
    document.addEventListener('submit', function(e) {
      var form = e.target.closest('form');
      // Проверяем, есть ли в форме поле с name="phone"
      if (!form || !form.querySelector('[name="phone"]')) return;

      e.preventDefault();

      var phoneInput = form.querySelector('[name="phone"]');
      var nameInput = form.querySelector('[name="name"]');
      var rawPhone = phoneInput ? phoneInput.value.trim() : '';
      var userName = 'Клиент';

      // Валидация белорусского номера (можно ослабить или убрать)
      function validateBelarusPhone(phone) {
        var cleaned = phone.replace(/[^\d+]/g, '');
        return /^\+375(25|29|33|44)\d{7}$/.test(cleaned);
      }

      if (!validateBelarusPhone(rawPhone)) {
        alert('Пожалуйста, введите корректный номер Беларуси.\nФормат: +375 XX XXX-XX-XX');
        if (phoneInput) phoneInput.focus();
        return;
      }

      // Показываем модалку успеха
      showModal(
        'Спасибо!',
        userName + ', ваша заявка принята!\nМы позвоним на ' + rawPhone + ' в ближайшее время.'
      );

      // Очищаем форму
      form.reset();

      // Здесь можно добавить отправку на сервер (например, KB.apiPost)
      // KB.apiPost('/orders', { phone: rawPhone, name: userName });
    });
  }

  /* ============================================================
     Применяем тему/палитру максимально рано
     ============================================================ */
  applyTheme(getTheme());
  applyPalette(getPalette());
  applyA11yDom();

  document.addEventListener('DOMContentLoaded', function () {
    applyI18n();
    // Запускаем обработчик форм
    setupUniversalForms();
    // На случай, если <img> в момент выполнения скрипта ещё не было в DOM
    if (getA11yOn() && getA11yImages() === 'off') applyImagesToggle(true);
  });

  /* ============================================================
     ЭКСПОРТ В ГЛОБАЛЬНЫЙ ОБЪЕКТ KBUI
     ============================================================ */
  global.KBUI = {
    getTheme: getTheme, setTheme: setTheme, toggleTheme: toggleTheme,
    getPalette: getPalette, setPalette: setPalette,
    getLang: getLang, setLang: setLang, t: t, applyI18n: applyI18n,
    resetSettings: resetSettings,
    mountSettingsWidget: mountSettingsWidget,
    hidePreloader: hidePreloader,
    showModal: showModal,
    setupUniversalForms: setupUniversalForms,
    getA11yOn: getA11yOn, setA11yOn: setA11yOn,
    getA11yFont: getA11yFont, setA11yFont: setA11yFont,
    getA11yScheme: getA11yScheme, setA11yScheme: setA11yScheme,
    getA11yImages: getA11yImages, setA11yImages: setA11yImages
  };
})(window);