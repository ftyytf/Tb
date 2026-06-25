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
  const PAGE_SIZE = [595.28, 841.89]; // A4 в пунктах
  const MARGIN = 50;

  function newPage(pdfDoc) {
    const page = pdfDoc.addPage(PAGE_SIZE);
    return { page, y: page.getSize().height - MARGIN, width: page.getSize().width };
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

  async function generatePDF(carNumber, signedAtFormatted) {
    try {
      const fontUrl = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf';
      const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());

      const { PDFDocument, rgb } = PDFLib;
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      const font = await pdfDoc.embedFont(fontBytes);

      let { page, y, width } = newPage(pdfDoc);

      page.drawText('СТЕПЬ', { x: MARGIN, y, size: 24, font, color: rgb(0.106, 0.263, 0.196) });
      y -= 34;
      page.drawText('Агрохолдинг «СТЕПЬ»', { x: MARGIN, y, size: 14, font, color: rgb(0.353, 0.478, 0.416) });
      y -= 26;

      page.drawText('Соглашение по охране труда', { x: MARGIN, y, size: 18, font, color: rgb(0.106, 0.263, 0.196) });
      y -= 22;

      page.drawLine({
        start: { x: MARGIN, y: y + 6 },
        end: { x: width - MARGIN, y: y + 6 },
        thickness: 1,
        color: rgb(0.831, 0.627, 0.09)
      });
      y -= 20;

      page.drawText(`Номер ТС: ${carNumber}`, { x: MARGIN, y, size: 14, font, color: rgb(0.106, 0.263, 0.196) });
      y -= 20;
      page.drawText(`Время подписания: ${signedAtFormatted}`, { x: MARGIN, y, size: 14, font, color: rgb(0.106, 0.263, 0.196) });
      y -= 28;

      page.drawText('Требования промышленной безопасности:', { x: MARGIN, y, size: 14, font, color: rgb(0.106, 0.263, 0.196) });
      y -= 20;

      const fontSize = 11;
      const lineHeight = 16;
      for (const rule of RULES) {
        const maxWidth = width - MARGIN * 2;
        const lines = wrapText('• ' + rule, font, fontSize, maxWidth);
        for (const line of lines) {
          if (y < MARGIN) {
            ({ page, y, width } = newPage(pdfDoc));
          }
          page.drawText(line, { x: MARGIN, y, size: fontSize, font, color: rgb(0.118, 0.18, 0.157) });
          y -= lineHeight;
        }
      }

      if (y < MARGIN + 70) {
        ({ page, y, width } = newPage(pdfDoc));
      }

      y -= 10;
      const ackLines = wrapText(
        'Я ознакомлен(а) с указанными требованиями и обязуюсь их неукоснительно соблюдать.',
        font, 13, width - MARGIN * 2
      );
      for (const line of ackLines) {
        page.drawText(line, { x: MARGIN, y, size: 13, font, color: rgb(0.106, 0.263, 0.196) });
        y -= 18;
      }
      y -= 4;
      page.drawText(`Дата и время подписания: ${signedAtFormatted}`, { x: MARGIN, y, size: 10, font, color: rgb(0.353, 0.478, 0.416) });
      y -= 16;
      page.drawText('Документ сформирован автоматически в Агрохолдинге «СТЕПЬ».', { x: MARGIN, y, size: 10, font, color: rgb(0.353, 0.478, 0.416) });

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
