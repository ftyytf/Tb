(function() {
  'use strict';

  const { TELEGRAM_TOKEN, TELEGRAM_CHAT_ID } = window.APP_CONFIG;

  // ============================================================
  // ДОПУСТИМЫЕ СИМВОЛЫ И КОДЫ РЕГИОНОВ
  // ============================================================
  const ALLOWED_LETTERS = ['А','В','Е','К','М','Н','О','Р','С','Т','У','Х'];
  const DIGITS = ['0','1','2','3','4','5','6','7','8','9'];
  const ALLOWED_CHARS = ALLOWED_LETTERS.concat(DIGITS);

  const REGION_CODES = new Set([
    '01','101','02','102','702','03','103','04','05','105','06','07','08','09','109',
    '10','11','111','12','13','113','14','15','16','116','716','17','18','118','19',
    '21','121','82','182','95','22','222','23','93','123','193','323','24','88','124',
    '224','25','125','725','26','126','27','41','59','159','75','28','29','30','130',
    '31','32','33','34','134','35','36','136','37','38','138','39','139','40','42',
    '142','43','44','45','46','47','147','48','49','50','90','150','190','250','550',
    '750','790','51','52','152','252','53','54','154','55','155','56','156','57','58',
    '158','60','61','161','761','62','63','163','763','64','164','65','66','96','196',
    '166','67','68','69','169','70','71','72','172','73','173','74','174','774','76',
    '77','97','99','177','197','199','777','797','799','977','78','98','178','198',
    '778','92','192','79','83','86','186','87','89','80','180','81','181','84','184',
    '85','185','94'
  ]);

  const RULES = [
    'Скорость движения на территории – не более 10 км/ч.',
    'Запрещается курить, использовать открытый огонь и пиротехнику.',
    'Двигайтесь только по утверждённым маршрутам, следуйте указателям.',
    'Перед выездом убедитесь в исправности тормозов, рулевого управления и звукового сигнала.',
    'При погрузочно-разгрузочных работах надевайте защитную каску и сигнальный жилет.',
    'Не находитесь в зоне работы погрузчиков без ограждения.',
    'При аварии или поломке немедленно сообщите диспетчеру по рации или телефону.',
    'Ремонт и ТО на территории производите только с разрешения ответственного лица.',
    'Содержите в исправности средства пожаротушения (огнетушитель, кошма).',
    'Соблюдайте правила пожарной безопасности – не загромождайте проезды.',
    'Проходите ежесменный инструктаж у мастера смены.',
    'При обнаружении разливов ГСМ, посторонних предметов – немедленно сообщите.'
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
    if (value.length === 7) return value.substring(5, 7);
    if (value.length === 8) return value.substring(5, 8);
    if (value.length === 9) return value.substring(6, 9);
    return '';
  }

  function isValidFull(value) {
    if (value.length < 7 || value.length > 9) return false;
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

  // ============================================================
  // ЭЛЕМЕНТЫ
  // ============================================================
  const carInput = document.getElementById('carInput');
  const confirmBtn = document.getElementById('confirmBtn');
  const statusEl = document.getElementById('statusMessage');
  const errorText = document.getElementById('errorText');

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

  // ============================================================
  // ФИЛЬТРАЦИЯ ВВОДА
  // ============================================================
  carInput.addEventListener('input', function() {
    this.value = maskInput(this.value);
    hideError();
    hideStatus();
  });

  carInput.addEventListener('blur', function() {
    const val = this.value;
    if (val.length > 0 && !isValidFull(val)) {
      showError();
    } else {
      hideError();
    }
  });

  // ============================================================
  // ГЕНЕРАЦИЯ PDF С ПОДДЕРЖКОЙ КИРИЛЛИЦЫ (pdf-lib)
  // ============================================================
  // Поля документа по ГОСТ Р 7.0.97-2016: левое/верхнее/нижнее – не менее 20 мм, правое – не менее 10 мм.
  // ============================================================
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

  async function loadFont(pdfDoc, url) {
    const bytes = await fetch(url).then(res => res.arrayBuffer());
    return pdfDoc.embedFont(bytes);
  }

  async function generatePDF(carNumber, signedAtFormatted) {
    try {
      const { PDFDocument, rgb } = PDFLib;
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      const baseUrl = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/';
      const font = await loadFont(pdfDoc, baseUrl + 'DejaVuSans.ttf');
      const fontBold = await loadFont(pdfDoc, baseUrl + 'DejaVuSans-Bold.ttf');

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
      drawCentered('АГРОХОЛДИНГ «СТЕПЬ»', 14, fontBold, textColor);
      y -= 20;

      // ---------- Заголовок документа ----------
      drawCentered('СОГЛАШЕНИЕ', 16, fontBold, textColor);
      y -= 20;
      drawCentered('по охране труда и промышленной безопасности', 13, font, textColor);
      y -= 28;

      // ---------- Реквизиты документа ----------
      const docDate = signedAtFormatted.split(',')[0] || signedAtFormatted;
      drawParagraph(`Дата составления: ${docDate}`, { size: 11, color: mutedColor, lineHeight: 16 });
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
      drawParagraph(
        'Настоящим подтверждается, что водитель указанного транспортного средства ознакомлен ' +
        'с требованиями промышленной и пожарной безопасности, действующими на территории ' +
        'Агрохолдинга «СТЕПЬ», и обязуется их соблюдать в полном объёме.',
        { size: 12, lineHeight: 17, indent: PARAGRAPH_INDENT }
      );
      y -= 8;

      // ---------- Раздел с требованиями ----------
      drawParagraph('1. Требования промышленной безопасности', { size: 13, useFont: fontBold, lineHeight: 20 });
      y -= 4;

      RULES.forEach((rule, index) => {
        drawParagraph(`1.${index + 1}. ${rule}`, { size: 11.5, lineHeight: 16, indent: PARAGRAPH_INDENT });
      });
      y -= 10;

      // ---------- Подтверждение и подпись ----------
      ensureSpace(90);
      drawParagraph('2. Подтверждение согласия', { size: 13, useFont: fontBold, lineHeight: 20 });
      y -= 4;
      drawParagraph(
        'Я ознакомлен(а) с указанными требованиями и обязуюсь их неукоснительно соблюдать.',
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
      drawParagraph('Документ сформирован автоматически в электронной системе Агрохолдинга «СТЕПЬ».', { size: 9, color: mutedColor, lineHeight: 12 });

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
  function sendPDFToTelegram(pdfBlob, carNumber, signedAt) {
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('document', pdfBlob, `Соглашение_ТБ_${carNumber}_${new Date().toISOString().slice(0,10)}.pdf`);
    formData.append('caption', `✅ Новое подписание ТБ\n🚛 Номер ТС: ${carNumber}\n🕒 Время: ${signedAt}`);

    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          console.log('PDF отправлен в Telegram');
        } else {
          console.error('Ошибка отправки в Telegram:', data.description);
        }
      })
      .catch(err => {
        console.error('Ошибка соединения с Telegram:', err);
      });
  }

  // ============================================================
  // ОБРАБОТЧИК ПОДТВЕРЖДЕНИЯ
  // ============================================================
  async function handleConfirm() {
    hideStatus();
    hideError();

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

    const now = new Date();
    const timeStr = now.toLocaleString('ru-RU', { hour12: false });
    const record = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      carNumber: car,
      signedAt: now.toISOString(),
      version: '1.0'
    };
    const history = JSON.parse(localStorage.getItem('tb_signatures') || '[]');
    history.push(record);
    localStorage.setItem('tb_signatures', JSON.stringify(history));

    showStatus(`✅ Согласие подтверждено для ${car} в ${timeStr}`, 'success');

    const pdfBlob = await generatePDF(car, timeStr);
    if (!pdfBlob) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = `Соглашение_ТБ_${car}_${new Date().toISOString().slice(0,10)}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);

    if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
      sendPDFToTelegram(pdfBlob, car, timeStr);
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
  if (!carInput.value) carInput.focus();

  console.log('Форма подписания ТБ (СТЕПЬ) с PDF (pdf-lib) и Telegram загружена.');
})();
