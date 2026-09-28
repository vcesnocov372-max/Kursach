// KidsBe — общий слой данных для всех внутренних страниц.
// Все содержательные данные (курсы, педагоги, календарь) хранятся в db.json 
// и отдаются через json-server: npm run server

const KB = (function () {
  const API = 'http://localhost:3000';
  
  // === КЛЮЧИ LOCALSTORAGE ===
  const SESSION_KEY = 'kidsbe_session_v1';          // Профиль юзера {id, name, login}
  const ADMIN_KEY = 'kidsbe_admin_session_v1';      // Флаг админа
  const ENROLLED_KEY_PREFIX = 'kidsbe_enrolled_';   // ID курсов юзера: kidsbe_enrolled_{userId}
  const PENDING_COURSE_KEY = 'kidsbe_pending_course'; // Курс, который выбрали до входа

  const COURSE_ICONS = ['📖', '🧩', '🎨', '🔤', '🧮', '🎭', '🌍', '🎵'];
  const COURSE_COLORS = ['#5B4FE9', '#2FBF71', '#E9573F', '#F6C445', '#4A3FD6'];
  const AVATAR_COLORS = ['#5B4FE9', '#2FBF71', '#E9573F', '#F6C445'];

  function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 9);
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function toKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  /* =========================================================== */
  /* НИЗКОУРОВНЕВЫЕ ОБЁРТКИ НАД REST API */
  /* =========================================================== */
  async function apiGet(path) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // Таймаут 8 сек

        const res = await fetch(API + path, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('GET ' + path + ' -> ' + res.statusText);
        return res.json();
    } catch (err) {
        console.error("Ошибка сети при GET:", err.message);
        throw err; 
    }
  }

  async function apiPost(path, body) {
    try {
        const res = await fetch(API + path, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('POST ' + path + ' -> ' + res.statusText);
        return res.json();
    } catch (err) {
        console.error("Ошибка сети при POST:", err.message);
        throw err;
    }
  }

  async function apiPut(path, body) {
    try {
        const res = await fetch(API + path, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('PUT ' + path + ' -> ' + res.statusText);
        return res.json();
    } catch (err) {
        console.error("Ошибка сети при PUT:", err.message);
        throw err;
    }
  }

  async function apiDelete(path) {
    try {
        const res = await fetch(API + path, { method: 'DELETE' });
        if (!res.ok) throw new Error('DELETE ' + path + ' -> ' + res.statusText);
    } catch (err) {
        console.error("Ошибка сети при DELETE:", err.message);
        throw err;
    }
  }

  /* =========================================================== */
  /* ДАННЫЕ СЕРВЕРА (Курсы, Учителя, Календарь) */
  /* =========================================================== */
  async function loadCourses() { return apiGet('/courses'); }
  async function saveCourse(course) {
    if (course.id) return apiPut('/courses/' + course.id, course);
    course.id = uid('c');
    return apiPost('/courses', course);
  }
  async function deleteCourse(id) { return apiDelete('/courses/' + id); }

  async function loadTeachers() { return apiGet('/teachers'); }
  async function saveTeacher(teacher) {
    if (teacher.id) return apiPut('/teachers/' + teacher.id, teacher);
    teacher.id = uid('t');
    return apiPost('/teachers', teacher);
  }
  async function deleteTeacher(id) { return apiDelete('/teachers/' + id); }

  async function loadCalendar() { return apiGet('/calendar'); }
  async function saveCalendar(calendar) { return apiPut('/calendar', calendar); }

  /* =========================================================== */
  /* СЕССИЯ ПОЛЬЗОВАТЕЛЯ (Профиль) */
  /* =========================================================== */
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }
  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, login: user.login }));
  }
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    // Очищаем запись о курсах этого пользователя
    const key = getMyEnrolledKey();
    if(key) localStorage.removeItem(key);
  }

  /* =========================================================== */
  /* МОИ КУРСЫ (Привязка к сессии) */
  /* =========================================================== */
  function getMyEnrolledKey() {
    const session = getSession();
    if (!session) return null;
    return ENROLLED_KEY_PREFIX + session.id;
  }

  function getEnrolledCourses() {
    const key = getMyEnrolledKey();
    if (!key) return [];
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; }
  }

  /* =========================================================== */
  /* ЗАПИСЬ НА КУРС (БЕЗОПАСНАЯ ВЕРСИЯ) */
  /* =========================================================== */
  // config: courseId (обязательно) либо строка courseId для обратной совместимости,
  // а также опционально: format, lessonsPerMonth, modules (массив {id,name,price}),
  // pricePerLesson, total — вся конфигурация, собранная в конструкторе курса.
  async function enrollCourse(config) {
      // Обратная совместимость: раньше сюда передавали просто courseId строкой
      if (typeof config === 'string') config = { courseId: config };
      const courseId = config.courseId;

      const session = getSession();
      if (!session) {
          throw new Error('Необходимо войти в аккаунт');
      }
  
      // 1. Загружаем курсы для проверки ID
      const allCourses = await apiGet('/courses');
      const course = allCourses.find(c => c.id === courseId);
      if (!course) {
          throw new Error('Курс не найден.');
      }
  
      try {
          // 2. Загружаем всех пользователей с сервера
          const users = await apiGet('/users');
          const userIndex = users.findIndex(u => u.id === session.id);
          
          if (userIndex === -1) {
              throw new Error('Профиль не найден на сервере.');
          }
  
          let currentUser = users[userIndex];
  
          // === КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ ===
          // Если поля orders еще нет в объекте юзера (например, старая регистрация), создаем его
          if (!currentUser.orders || !Array.isArray(currentUser.orders)) {
              currentUser.orders = [];
          }
  
          // Проверка дублей — с учётом того, что конфигурация могла измениться
          // (одинаковые курс+формат+модули+кол-во занятий считаем дублем,
          // а тот же курс с другой конфигурацией — новой записью)
          const configSignature = JSON.stringify({
            format: config.format || null,
            lessonsPerMonth: config.lessonsPerMonth || null,
            modules: (config.modules || []).map(function(m){ return m && m.id ? m.id : m; }).sort()
          });
          const isDuplicate = currentUser.orders.some(function(o){
            if (o.courseId !== courseId) return false;
            var existingSignature = JSON.stringify({
              format: o.format || null,
              lessonsPerMonth: o.lessonsPerMonth || null,
              modules: (o.modules || []).map(function(m){ return m && m.id ? m.id : m; }).sort()
            });
            return existingSignature === configSignature;
          });
          if (isDuplicate) {
              console.log("Вы уже записаны на этот курс с такой же конфигурацией.");
              return currentUser.orders;
          }
  
          // Создаём заказ — сохраняем ПОЛНУЮ конфигурацию из конструктора,
          // чтобы «Мои курсы» могли показать её один в один, без пересчёта.
          const newOrder = {
              orderId: uid('ord'),
              courseId: course.id,
              courseTitle: course.title,
              dateOrdered: toKey(new Date()),
              status: 'new',
              format: config.format || null,
              lessonsPerMonth: config.lessonsPerMonth || null,
              modules: config.modules || [],              // [{id, name, price}, ...]
              pricePerLesson: (typeof config.pricePerLesson === 'number') ? config.pricePerLesson : null,
              total: (typeof config.total === 'number') ? config.total : null
          };
  
          // Добавляем в массив
          currentUser.orders.push(newOrder);
  
          // Сохраняем ОБНОВЛЕННЫЙ объект обратно на сервер
          await apiPut('/users/' + session.id, currentUser);
          
          // ВАЖНО: Обновляем localStorage, чтобы UI знал о новом массиве
          setSession(currentUser); 
          
          console.log("Заказ успешно добавлен:", newOrder);
          return currentUser.orders;
  
      } catch (err) {
          console.error("Ошибка записи заказа:", err.message);
          throw err;
      }
  }

  function getPendingCourse() {
    try {
      var raw = localStorage.getItem(PENDING_COURSE_KEY);
      if (!raw) return null;
      // Новый формат — JSON с полной конфигурацией конструктора.
      // Старый формат (просто ID курса строкой) тоже поддерживаем.
      try { return JSON.parse(raw); } catch (e) { return { courseId: raw }; }
    } catch(e) { return null; }
  }
  function setPendingCourse(config) {
    try { localStorage.setItem(PENDING_COURSE_KEY, JSON.stringify(config)); } catch(e) {}
  }
  function clearPendingCourse() {
    localStorage.removeItem(PENDING_COURSE_KEY);
  }
  // Вызывается сразу после успешного входа/регистрации: если перед этим
  // пользователь настраивал курс в конструкторе и его отправили входить,
  // это подтверждает запись с той же самой (а не сброшенной) конфигурацией.
  async function completePendingEnrollment() {
    var pending = getPendingCourse();
    if (!pending || !pending.courseId) return null;
    try {
      var orders = await enrollCourse(pending);
      clearPendingCourse();
      return orders;
    } catch (err) {
      console.error('Не удалось завершить отложенную запись на курс:', err.message);
      clearPendingCourse();
      throw err;
    }
  }

  /* =========================================================== */
  /* АДМИН-ДОСТУП */
  /* =========================================================== */
  async function checkAdminPass(pass) {
    const settings = await apiGet('/settings');
    if (pass === settings.adminPass) {
      sessionStorage.setItem(ADMIN_KEY, '1');
      return true;
    }
    return false;
  }
  function isAdmin() {
    try { return window.sessionStorage.getItem(ADMIN_KEY) === '1'; } catch (e) { return false; }
  }
  function adminLogout() { try { window.sessionStorage.removeItem(ADMIN_KEY); } catch (e) {} }

  /* =========================================================== */
  /* АУТЕНТИФИКАЦИЯ (Регистрация/Вход) */
  /* =========================================================== */
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return 'h' + h;
  }
  function normalizePhone(v) { return v.replace(/[^\d+]/g, ''); }
  function normalizeEmail(v) { return v.trim().toLowerCase(); }

  async function registerUser(name, contact, password, loginType) {
    loginType = loginType || 'email';
    const login = (loginType === 'phone') ? normalizePhone(contact) : normalizeEmail(contact);
    
    const existing = await apiGet('/users?login=' + encodeURIComponent(login));
    if (existing.length) {
      return { ok: false, error: (loginType === 'phone') ? 'Пользователь с таким телефоном уже зарегистрирован' : 'Пользователь с такой почтой уже зарегистрирован' };
    }
    
    const user = { id: uid('u'), name: name.trim(), login, loginType, passHash: hash(password) };
    const saved = await apiPost('/users', user);
    setSession(saved);
    return { ok: true, user: saved };
  }

  async function loginUser(contact, password, loginType) {
    loginType = loginType || (contact.indexOf('@') > -1 ? 'email' : 'phone');
    const login = (loginType === 'phone') ? normalizePhone(contact) : normalizeEmail(contact);
    
    const found = await apiGet('/users?login=' + encodeURIComponent(login));
    const user = found[0];
    
    if (!user || user.passHash !== hash(password)) {
      return { ok: false, error: 'Неверные данные для входа' };
    }
    
    setSession(user);
    return { ok: true, user };
  }

  // В самом конце файла js/data.js перед закрывающей скобкой })();

    return {
        API,
        uid, pad, toKey,
        COURSE_ICONS, COURSE_COLORS, AVATAR_COLORS,
        
        // Data
        loadCourses, saveCourse, deleteCourse,
        loadTeachers, saveTeacher, deleteTeacher,
        loadCalendar, saveCalendar,
        
        // Session
        getSession, setSession, logout,
        
        // Enroll
        getEnrolledCourses, enrollCourse, getPendingCourse, setPendingCourse, clearPendingCourse, completePendingEnrollment,
        
        // Auth
        registerUser, loginUser,
        
        // Admin
        checkAdminPass, isAdmin, adminLogout,
        
        apiGet 
    };
})();