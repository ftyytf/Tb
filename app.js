(function() {
  'use strict';

  const { TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, YANDEX_DISK_TOKEN } = window.APP_CONFIG;

  // ============================================================
  // ДОПУСТИМЫЕ СИМВОЛЫ И КОДЫ РЕГИОНОВ
  // ============================================================
  const ALLOWED_LETTERS = ['А','В','Е','К','М','Н','О','Р','С','Т','У','Х'];
  const DIGITS = ['0','1','2','3','4','5','6','7','8','9'];
  const ALLOWED_CHARS = ALLOWED_LETTERS.concat(DIGITS);

  const REGION_CODES = new Set([
    // Республики
    '01','101',                          // Адыгея
    '02','102','702',                    // Башкортостан
    '03','103',                          // Бурятия
    '04',                                // Алтай
    '05','105',                          // Дагестан
    '06',                                // Ингушетия
    '07',                                // Кабардино-Балкария
    '08',                                // Калмыкия
    '09','109',                          // Карачаево-Черкесия
    '10',                                // Карелия
    '11','111',                          // Коми
    '12',                                // Марий Эл
    '13','113',                          // Мордовия
    '14',                                // Саха (Якутия)
    '15',                                // Северная Осетия — Алания
    '16','116','716',                    // Татарстан
    '17',                                // Тыва
    '18','118',                          // Удмуртия
    '19',                                // Хакасия
    '20','95',                           // Чеченская Республика
    '21','121',                          // Чувашия
    // Края
    '22','222',                          // Алтайский
    '23','93','123','193','323',         // Краснодарский
    '24','88','124','224',              // Красноярский
    '25','125','725',                    // Приморский
    '26','126',                          // Ставропольский
    '27','127',                          // Хабаровский
    '28',                                // Амурская область
    // Области
    '29',                                // Архангельская
    '30','130',                          // Астраханская
    '31',                                // Белгородская
    '32',                                // Брянская
    '33',                                // Владимирская
    '34','134',                          // Волгоградская
    '35',                                // Вологодская
    '36','136',                          // Воронежская
    '37',                                // Ивановская
    '38','138',                          // Иркутская
    '39','139',                          // Калининградская
    '40',                                // Калужская
    '41',                                // Камчатский край
    '42','142',                          // Кемеровская
    '43',                                // Кировская
    '44',                                // Костромская
    '45',                                // Курганская
    '46',                                // Курская
    '47','147',                          // Ленинградская
    '48',                                // Липецкая
    '49',                                // Магаданская
    '50','90','150','190','250','550','750','790', // Московская
    '51',                                // Мурманская
    '52','152','252',                    // Нижегородская
    '53',                                // Новгородская
    '54','154',                          // Новосибирская
    '55','155',                          // Омская
    '56','156',                          // Оренбургская
    '57',                                // Орловская
    '58','158',                          // Пензенская
    '59','159',                          // Пермский край
    '60',                                // Псковская
    '61','161','761',                    // Ростовская
    '62',                                // Рязанская
    '63','163','763',                    // Самарская
    '64','164',                          // Саратовская
    '65',                                // Сахалинская
    '66','96','166','196',              // Свердловская
    '67',                                // Смоленская
    '68',                                // Тамбовская
    '69','169',                          // Тверская
    '70',                                // Томская
    '71',                                // Тульская
    '72','172',                          // Тюменская
    '73','173',                          // Ульяновская
    '74','174','774',                    // Челябинская
    '75',                                // Забайкальский край
    '76',                                // Ярославская
    // Города федерального значения
    '77','97','99','177','197','199','777','797','799','977', // Москва
    '78','98','178','198','778',         // Санкт-Петербург
    // Автономные округа и области
    '79',                                // Еврейская АО
    '80','180',                          // (бывш. Читинская обл., ныне Забайкальский край)
    '81','181',                          // (бывш. Коми-Пермяцкий АО)
    '82','182',                          // Республика Крым
    '83',                                // Ненецкий АО
    '84','184',                          // (бывш. Таймырский АО)
    '85','185',                          // (бывш. Усть-Ордынский Бурятский АО)
    '86','186',                          // Ханты-Мансийский АО — Югра
    '87',                                // Чукотский АО
    '89',                                // Ямало-Ненецкий АО
    '92','192',                          // Севастополь
    '94',                                // Байконур
    // Новые субъекты РФ (с 2022 г.)
    '480',                               // Запорожская область
    '481',                               // Херсонская область
    '482',                               // Донецкая Народная Республика
    '483',                               // Луганская Народная Республика
  ]);

  const INTRO_TEXT =
    'Зерновой терминал является опасным производственным объектом. На территории терминала ' +
    'задействованы различные машины и механизмы, производятся различные виды работ повышенной ' +
    'опасности. Все это делает территорию терминала местом, при посещении которого необходимо ' +
    'уделять особое внимание собственной безопасности.';

  const SECTIONS = [
    {
      title: '1. Опасности на территории терминала и как их избежать',
      items: [
        'Падение при движении — не отвлекайтесь и не отвлекайте других, не спешите при ходьбе, смотрите под ноги, аккуратно выходите из кабины, держась за поручни.',
        'Поражение электрическим током — запрещается дотрагиваться до электрических кабелей, проводов, электроинструмента. Во время грозы запрещается приближаться к устройствам молниеотвода (прожекторные мачты являются устройствами молниеотвода) ближе, чем на 4 метра.',
        'Наезд движущегося транспорта — строго следуйте маршруту движения, соблюдая разметку и ПДД.',
        'Падение в зоне проведения земляных работ — не приближайтесь ближе 2 метров к краю траншеи, котлована, выемки грунта. Не заходите и не заезжайте за защитные ограждения.',
        'Опасность травмирования при разгрузке — необходимо быть осторожным, действовать согласованно с сотрудниками терминала.'
      ]
    },
    {
      title: '2. На территории Зернового терминала запрещается',
      items: [
        'Проходить в местах, не предназначенных для прохода, и за внешнее ограждение.',
        'Употреблять алкогольные напитки, наркотические и токсические вещества.',
        'Загрязнять территорию предприятия.',
        'Разжигать огонь, проводить огнеопасные работы без разрешительных документов.',
        'Скрывать информацию об авариях, пожарах, инцидентах, случаях нарушения требований безопасности.',
        'Перевозить людей и грузы с нарушением требований безопасности.',
        'Осуществлять фото- и видеосъёмку производственной деятельности или установок без специального (письменного) разрешения со стороны руководства терминала.',
        'Приносить, хранить и использовать огнестрельное оружие, боеприпасы и взрывчатые вещества.',
        'Курить в запрещённых и необорудованных для курения местах, в кабине.',
        'Отдыхать или спать в кабине или закрытом кузове на стоянке при работающем двигателе.'
      ]
    },
    {
      title: '3. Требования при движении и разгрузке',
      items: [
        'Водители зерновозов заезжают на территорию после оформления документов у диспетчера.',
        'При передвижении на автотранспорте обязательно используйте ремень безопасности.',
        'Соблюдайте скоростной режим — не более 20 км/ч.',
        'При передвижении по скользким, мокрым и неровным поверхностям соблюдайте осторожность.',
        'Соблюдайте личную осторожность при посещении объекта.',
        'Проверяйте надёжность крепления бортов перед заездом на платформу разгрузки для исключения самопроизвольного падения борта.',
        'Очистку поднятого кузова от остатков груза производите специальным инструментом с удлинённой ручкой, находясь на разгрузочной площадке. Находиться в кузове или на колесе автомобиля, наносить удары по кузову, а также встряхивать кузов гидросистемой подъёмника для удаления остатков груза запрещается.',
        'При падении предметов в завальную яму запрещается спускаться за ними во избежание затягивания в продукт.',
        'Соблюдайте личную осторожность при выходе из кабины, передвижении по территории, растентовке кузова, открытии и закрытии бортов.'
      ]
    }
  ];

  // ============================================================
  // ФУНКЦИИ ПРОВЕРКИ
  // ============================================================
  function isAllowedChar(ch, pos) {
    ch = ch.toUpperCase();
    if (pos === 0) return ALLOWED_LETTERS.includes(ch);
    if (pos >= 1 && pos <= 3) return DIGITS.includes(ch);
    if (pos >= 4 && pos <= 5) return ALLOWED_LETTERS.includes(ch);
    if (pos >= 6 && pos <= 8) return DIGITS.includes(ch);
    return false;
  }

  function getRegionCode(value) {
    // Body is always 6 chars (L+DDD+LL), region follows: 2 or 3 digits
    if (value.length === 8) return value.substring(6, 8);  // 2-digit region
    if (value.length === 9) return value.substring(6, 9);  // 3-digit region
    return '';
  }

  function isValidFull(value) {
    if (value.length !== 8 && value.length !== 9) return false;
    for (let i = 0; i < value.length; i++) {
      if (!isAllowedChar(value[i], i)) return false;
    }
    if (value.substring(1, 4) === '000') return false;
    const regionCode = getRegionCode(value);
    if (!regionCode) return false;
    return REGION_CODES.has(regionCode);
  }

  function maskInput(rawValue) {
    let filtered = '';
    for (const ch of rawValue.toUpperCase()) {
      if (ALLOWED_CHARS.includes(ch)) filtered += ch;
    }
    let masked = '';
    for (let i = 0; i < filtered.length; i++) {
      const ch = filtered[i];
      if (isAllowedChar(ch, i)) masked += ch;
      else break;
    }
    return masked.slice(0, 9);
  }

  // Принимает как инициалы «ИВАНОВ И.И.», так и полное ФИО «ИВАНОВ ИВАН ИВАНОВИЧ».
  // Всё в верхнем регистре (фильтр ниже автоматически делает toUpperCase).
  // Фамилия: 2+ букв, необязательный дефис (двойная фамилия).
  // Имя: полное слово (2+ букв) с необязательным отчеством, ИЛИ инициал(ы) с точкой.
  const NAME_PATTERN = /^[А-ЯЁ]{2,}(-[А-ЯЁ]{2,})? ([А-ЯЁ]{2,}( [А-ЯЁ]+\.?)?|[А-ЯЁ]\.?([А-ЯЁ]\.?)?)$/;
  const NAME_ALLOWED_CHARS = /[А-ЯЁ .\-]/;

  function isValidName(value) {
    return NAME_PATTERN.test(value.trim());
  }

  function filterNameInput(rawValue) {
    let filtered = '';
    for (const ch of rawValue.toUpperCase()) {
      if (NAME_ALLOWED_CHARS.test(ch)) filtered += ch;
    }
    return filtered.replace(/\.{2,}/g, '.').replace(/ {2,}/g, ' ');
  }

  // ============================================================
  // ЭЛЕМЕНТЫ
  // ============================================================
  const nameInput = document.getElementById('nameInput');
  const carInput = document.getElementById('carInput');
  const plateSepLine = document.getElementById('plateSepLine');
  const confirmBtn = document.getElementById('confirmBtn');
  const statusEl = document.getElementById('statusMessage');
  const errorText = document.getElementById('errorText');
  const nameErrorText = document.getElementById('nameErrorText');
  const ackCheckbox = document.getElementById('ackCheckbox');
  const historyToggle = document.getElementById('historyToggle');
  const historyList = document.getElementById('historyList');
  const historyCount = document.getElementById('historyCount');

  // Вертикальная черта-разделитель между телом номера (6 символов) и кодом региона.
  // Видна всегда; позиционируется по 6 символам через Canvas.measureText.
  const _sepCanvas = document.createElement('canvas');
  const _sepCtx = _sepCanvas.getContext('2d');

  function updatePlateSep() {
    if (!plateSepLine) return;
    const style = window.getComputedStyle(carInput);
    const paddingLeft = parseFloat(style.paddingLeft) || 18;
    const letterSpacing = parseFloat(style.letterSpacing) || 2;
    // Используем введённое значение или шаблон заполнителя
    const val = carInput.value;
    const bodyText = val.length >= 6 ? val.slice(0, 6) : 'А777АА';
    try {
      // style.font — надёжная сводная строка CSS-шрифта, пригодная для Canvas
      _sepCtx.font = style.font || (style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily);
      const bodyWidth = _sepCtx.measureText(bodyText).width;
      plateSepLine.style.left = Math.round(paddingLeft + bodyWidth + 6 * letterSpacing) + 'px';
    } catch (e) {
      plateSepLine.style.left = '116px'; // запасное положение
    }
    plateSepLine.style.display = 'block';
  }

  function showStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = 'status ' + type;
    statusEl.style.display = 'block';
  }
  function hideStatus() { statusEl.style.display = 'none'; }
  function hideError() {
    errorText.classList.remove('visible');
    carInput.classList.remove('invalid');
  }
  function showError() {
    errorText.classList.add('visible');
    carInput.classList.add('invalid');
  }
  function hideNameError() {
    nameErrorText.classList.remove('visible');
    nameInput.classList.remove('invalid');
  }
  function showNameError() {
    nameErrorText.classList.add('visible');
    nameInput.classList.add('invalid');
  }

  // ============================================================
  // ЧЕКБОКС СОГЛАСИЯ — БЛОКИРУЕТ КНОПКУ
  // ============================================================
  ackCheckbox.addEventListener('change', function() {
    confirmBtn.disabled = !this.checked;
  });

  // ============================================================
  // ИСТОРИЯ ПОДПИСАНИЙ
  // ============================================================
  function getHistory() {
    return JSON.parse(localStorage.getItem('tb_signatures') || '[]');
  }

  function renderHistory() {
    const history = getHistory().slice().reverse();
    historyCount.textContent = `(${history.length})`;

    if (history.length === 0) {
      historyList.innerHTML = '<div class="history-empty">Подписаний пока нет</div>';
      return;
    }

    historyList.innerHTML = history.map(record => {
      const date = new Date(record.signedAt);
      const timeStr = date.toLocaleString('ru-RU', { hour12: false });
      const nameLabel = record.driverName ? `${record.driverName} · ` : '';
      return `<div class="history-item"><span class="car">${nameLabel}${record.carNumber}</span><span class="time">${timeStr}</span></div>`;
    }).join('');
  }

  historyToggle.addEventListener('click', function() {
    const isHidden = historyList.hidden;
    historyList.hidden = !isHidden;
    this.classList.toggle('open', isHidden);
    if (isHidden) renderHistory();
  });

  // ============================================================
  // ФИЛЬТРАЦИЯ ВВОДА
  // ============================================================
  carInput.addEventListener('input', function() {
    this.value = maskInput(this.value);
    hideError();
    hideStatus();
    updatePlateSep();
  });

  carInput.addEventListener('blur', function() {
    const val = this.value;
    if (val.length > 0 && !isValidFull(val)) {
      showError();
    } else {
      hideError();
    }
  });

  nameInput.addEventListener('input', function() {
    this.value = filterNameInput(this.value);
    hideNameError();
    hideStatus();
  });

  nameInput.addEventListener('blur', function() {
    const val = this.value.trim();
    if (val.length > 0 && !isValidName(val)) {
      showNameError();
    } else {
      hideNameError();
    }
  });

  // ============================================================
  // ГЕНЕРАЦИЯ PDF С ПОДДЕРЖКОЙ КИРИЛЛИЦЫ (pdf-lib)
  // ============================================================
  // Поля документа по ГОСТ Р 7.0.97-2016: левое/верхнее/нижнее – не менее 20 мм, правое – не менее 10 мм.
  // Шрифты кэшируются в памяти: при повторной генерации не скачиваются заново.
  // ============================================================
  let _fontBytesCache = null;
  let _fontBoldBytesCache = null;

  async function _loadFontBytesWithRetry(url, retries) {
    retries = retries || 2;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const tid = setTimeout(function() { controller.abort(); }, 20000);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.arrayBuffer();
      } catch (err) {
        clearTimeout(tid);
        if (attempt === retries) throw err;
        await new Promise(function(r) { setTimeout(r, 1500 * (attempt + 1)); });
      } finally {
        clearTimeout(tid);
      }
    }
  }
  const PAGE_SIZE = [595.28, 841.89]; // A4 в пунктах
  const MM = 2.8346; // 1 мм в пунктах
  const MARGIN_LEFT = 20 * MM;
  const MARGIN_RIGHT = 10 * MM;
  const MARGIN_TOP = 20 * MM;
  const MARGIN_BOTTOM = 20 * MM;
  const PARAGRAPH_INDENT = 12.5 * MM; // абзацный отступ 1,25 см

  function newPage(pdfDoc) {
    const page = pdfDoc.addPage(PAGE_SIZE);
    const { width } = page.getSize();
    return {
      page,
      y: page.getSize().height - MARGIN_TOP,
      contentWidth: width - MARGIN_LEFT - MARGIN_RIGHT
    };
  }

  function wrapText(text, font, fontSize, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? current + ' ' + word : word;
      if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  async function generatePDF(driverName, carNumber, signedAtFormatted) {
    try {
      const { PDFDocument, rgb } = PDFLib;
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      const baseUrl = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/';
      // Загружаем шрифты один раз — при повторных нажатиях используем кэш
      if (!_fontBytesCache) _fontBytesCache = await _loadFontBytesWithRetry(baseUrl + 'DejaVuSans.ttf');
      if (!_fontBoldBytesCache) _fontBoldBytesCache = await _loadFontBytesWithRetry(baseUrl + 'DejaVuSans-Bold.ttf');
      // embedFont нужен новый экземпляр для каждого PDFDocument, но байты шрифта переиспользуем
      const font = await pdfDoc.embedFont(_fontBytesCache, { subset: true });
      const fontBold = await pdfDoc.embedFont(_fontBoldBytesCache, { subset: true });

      const textColor = rgb(0.1, 0.1, 0.1);
      const mutedColor = rgb(0.4, 0.4, 0.4);

      let { page, y, contentWidth } = newPage(pdfDoc);

      function ensureSpace(needed) {
        if (y - needed < MARGIN_BOTTOM) {
          ({ page, y, contentWidth } = newPage(pdfDoc));
        }
      }

      function drawCentered(text, size, useFont, color) {
        const textWidth = useFont.widthOfTextAtSize(text, size);
        const x = MARGIN_LEFT + (contentWidth - textWidth) / 2;
        page.drawText(text, { x, y, size, font: useFont, color });
      }

      function drawParagraph(text, { size = 12, useFont = font, color = textColor, lineHeight = size * 1.4, indent = 0 } = {}) {
        const lines = wrapText(text, useFont, size, contentWidth - indent);
        lines.forEach((line, idx) => {
          ensureSpace(lineHeight);
          page.drawText(line, { x: MARGIN_LEFT + (idx === 0 ? indent : 0), y, size, font: useFont, color });
          y -= lineHeight;
        });
      }

      // ---------- Шапка организации ----------
      drawCentered('ЗЕРНОВОЙ ТЕРМИНАЛ «СТЕПЬ»', 14, fontBold, textColor);
      y -= 20;

      // ---------- Заголовок документа ----------
      drawCentered('ПРАВИЛА ПОСЕЩЕНИЯ', 16, fontBold, textColor);
      y -= 20;
      drawCentered('Зернового терминала «СТЕПЬ»', 13, font, textColor);
      y -= 28;

      // ---------- Реквизиты документа ----------
      const docDate = signedAtFormatted.split(',')[0] || signedAtFormatted;
      drawParagraph(`Дата составления: ${docDate}`, { size: 11, color: mutedColor, lineHeight: 16 });
      drawParagraph(`Водитель: ${driverName}`, { size: 11, color: mutedColor, lineHeight: 16 });
      drawParagraph(`Государственный регистрационный номер транспортного средства: ${carNumber}`, { size: 11, color: mutedColor, lineHeight: 16 });
      y -= 12;

      page.drawLine({
        start: { x: MARGIN_LEFT, y: y + 6 },
        end: { x: MARGIN_LEFT + contentWidth, y: y + 6 },
        thickness: 0.75,
        color: rgb(0.7, 0.7, 0.7)
      });
      y -= 18;

      // ---------- Преамбула ----------
      drawParagraph(INTRO_TEXT, { size: 12, lineHeight: 17, indent: PARAGRAPH_INDENT });
      y -= 8;

      // ---------- Разделы правил ----------
      SECTIONS.forEach((section, sectionIndex) => {
        ensureSpace(40);
        drawParagraph(section.title, { size: 13, useFont: fontBold, lineHeight: 20 });
        y -= 4;
        section.items.forEach((item, itemIndex) => {
          drawParagraph(`${sectionIndex + 1}.${itemIndex + 1}. ${item}`, { size: 11, lineHeight: 15.5, indent: PARAGRAPH_INDENT });
        });
        y -= 10;
      });

      // ---------- Подтверждение и подпись ----------
      ensureSpace(90);
      drawParagraph(`${SECTIONS.length + 1}. Подтверждение согласия`, { size: 13, useFont: fontBold, lineHeight: 20 });
      y -= 4;
      drawParagraph(
        'Я ознакомлен(а) с указанными правилами посещения Зернового терминала «СТЕПЬ» и обязуюсь их неукоснительно соблюдать.',
        { size: 12, lineHeight: 17, indent: PARAGRAPH_INDENT }
      );
      y -= 14;

      ensureSpace(60);
      const signX = MARGIN_LEFT + contentWidth - 200;
      page.drawText('Подпись подтверждена электронно', { x: MARGIN_LEFT, y, size: 10.5, font, color: textColor });
      page.drawText(signedAtFormatted, { x: signX, y, size: 10.5, font, color: textColor });
      y -= 14;
      page.drawLine({ start: { x: MARGIN_LEFT, y: y + 10 }, end: { x: MARGIN_LEFT + 150, y: y + 10 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });
      page.drawLine({ start: { x: signX, y: y + 10 }, end: { x: signX + 150, y: y + 10 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });
      page.drawText('способ подтверждения', { x: MARGIN_LEFT, y, size: 8, font, color: mutedColor });
      page.drawText('дата, время', { x: signX, y, size: 8, font, color: mutedColor });

      // ---------- Подвал ----------
      ensureSpace(30);
      y -= 20;
      drawParagraph('С заботой о Вас, Зерновой терминал «СТЕПЬ». Документ сформирован автоматически.', { size: 9, color: mutedColor, lineHeight: 12 });

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
      showStatus('❌ Не удалось создать PDF. Попробуйте ещё раз.', 'error');
      return null;
    }
  }

  // ============================================================
  // ОТПРАВКА В TELEGRAM
  // ============================================================
  async function sendPDFToTelegram(pdfBlob, driverName, carNumber, signedAt) {
    const dateForName = new Date().toISOString().slice(0, 10);
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    // Номер ТС, ФИО и дата — в имени файла и подписи, чтобы находить через поиск Telegram
    // (по тексту) и через «Перейти к дате» в поиске чата (по календарю).
    formData.append('document', pdfBlob, `ТБ_${carNumber}_${dateForName}.pdf`);
    formData.append('caption', `✅ Подписание правил посещения терминала\nВодитель: ${driverName}\nНомер ТС: ${carNumber}\nДата: ${dateForName}\nВремя: ${signedAt}`);

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.ok) {
        console.log('PDF отправлен в Telegram');
      } else {
        console.error('Ошибка отправки в Telegram:', data.description);
      }
    } catch (err) {
      console.error('Ошибка соединения с Telegram:', err);
    }
  }

  // ============================================================
  // ЗАГРУЗКА НА ЯНДЕКС.ДИСК
  // ============================================================
  async function uploadToYandexDisk(pdfBlob, carNumber, signedAt) {
    if (!YANDEX_DISK_TOKEN) return;

    const dateForName = new Date().toISOString().slice(0, 10);
    // "app:/" — корень папки приложения (доступ ограничен только ей, scope disk.app_folder)
    const path = `app:/ТБ_${carNumber}_${dateForName}_${Date.now()}.pdf`;
    const authHeader = `OAuth ${YANDEX_DISK_TOKEN}`;

    try {
      // Шаг 1: получить временную ссылку для загрузки
      const linkResponse = await fetch(
        `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(path)}&overwrite=true`,
        { headers: { Authorization: authHeader } }
      );
      const linkData = await linkResponse.json();
      if (!linkResponse.ok || !linkData.href) {
        console.error('Ошибка получения ссылки для загрузки на Яндекс.Диск:', linkData);
        return;
      }

      // Шаг 2: загрузить сам файл по полученной ссылке
      const uploadResponse = await fetch(linkData.href, {
        method: linkData.method || 'PUT',
        body: pdfBlob
      });

      if (uploadResponse.ok) {
        console.log('PDF загружен на Яндекс.Диск');
      } else {
        console.error('Ошибка загрузки файла на Яндекс.Диск:', uploadResponse.status);
      }
    } catch (err) {
      console.error('Ошибка соединения с Яндекс.Диском:', err);
    }
  }

  // ============================================================
  // ОБРАБОТЧИК ПОДТВЕРЖДЕНИЯ
  // ============================================================
  async function handleConfirm() {
    hideStatus();
    hideError();
    hideNameError();

    if (!ackCheckbox.checked) {
      showStatus('⚠️ Отметьте, что согласны с условиями соглашения', 'error');
      return;
    }

    const driverName = nameInput.value.trim();
    if (driverName === '') {
      showStatus('⚠️ Введите ФИО водителя', 'error');
      nameInput.focus();
      return;
    }
    if (!isValidName(driverName)) {
      showNameError();
      showStatus('⚠️ Укажите ФИО в формате «ИВАНОВ И.» или «ИВАНОВ ИВАН ИВАНОВИЧ»', 'error');
      nameInput.focus();
      return;
    }

    const car = carInput.value.trim().toUpperCase();
    if (car === '') {
      showStatus('⚠️ Введите государственный номер', 'error');
      carInput.focus();
      return;
    }

    if (car.substring(1, 4) === '000') {
      showError();
      showStatus('⚠️ Номер с тремя нулями (000) запрещён.', 'error');
      return;
    }

    if (!isValidFull(car)) {
      showError();
      const regionPart = getRegionCode(car);
      let hint = 'Проверьте формат (Б ЦЦЦ ББ РР) и код региона.';
      if (regionPart && !REGION_CODES.has(regionPart)) {
        hint = `Код региона "${regionPart}" не существует.`;
      }
      showStatus(`⚠️ Некорректный номер. ${hint}`, 'error');
      return;
    }

    const originalLabel = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = '⏳ Отправка...';

    try {
      const now = new Date();
      const timeStr = now.toLocaleString('ru-RU', { hour12: false });
      const record = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        driverName: driverName,
        carNumber: car,
        signedAt: now.toISOString(),
        version: '2.0'
      };
      const history = getHistory();
      history.push(record);
      localStorage.setItem('tb_signatures', JSON.stringify(history));
      if (!historyList.hidden) renderHistory();
      historyCount.textContent = `(${history.length})`;

      showStatus(`✅ Согласие подтверждено для ${driverName} (${car}) в ${timeStr}`, 'success');

      const pdfBlob = await generatePDF(driverName, car, timeStr);
      if (!pdfBlob) return;

      // Сначала отправляем в Telegram/на Яндекс.Диск и ждём завершения: на iOS Safari клик
      // по ссылке-скачиванию blob: иногда открывает PDF в той же вкладке вместо скачивания,
      // что прерывает ещё не завершённые запросы.
      if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
        await sendPDFToTelegram(pdfBlob, driverName, car, timeStr);
      }
      if (YANDEX_DISK_TOKEN) {
        await uploadToYandexDisk(pdfBlob, car, timeStr);
      }

      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `Правила_посещения_${car}_${new Date().toISOString().slice(0,10)}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      confirmBtn.disabled = !ackCheckbox.checked;
      confirmBtn.textContent = originalLabel;
    }
  }

  // ============================================================
  // АВТОЗАПОЛНЕНИЕ ИЗ URL
  // ============================================================
  function autoFillFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const car = params.get('car');
    if (!car) return;
    const masked = maskInput(car.trim());
    carInput.value = masked;
    if (masked.length >= 7 && isValidFull(masked)) {
      showStatus(`Номер подставлен: ${masked}`, 'info');
      setTimeout(hideStatus, 3000);
    } else if (masked.length > 0) {
      showStatus('⚠️ Автозаполненный номер не соответствует формату', 'error');
    }
  }

  // ============================================================
  // СОБЫТИЯ
  // ============================================================
  confirmBtn.addEventListener('click', handleConfirm);
  carInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  });

  // ============================================================
  // ЗАПУСК
  // ============================================================
  autoFillFromUrl();
  historyCount.textContent = `(${getHistory().length})`;
  updatePlateSep(); // показать разделитель сразу при загрузке
  if (!carInput.value) carInput.focus();

  console.log('Форма подписания ТБ (СТЕПЬ) с PDF (pdf-lib) и Telegram загружена.');
})();
