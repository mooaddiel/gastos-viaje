/* ============================================================
   Control de Gastos de Viaje - almacenamiento en localStorage
   ============================================================ */

const STORAGE_KEYS = {
  expenses: 'travel_expenses',
  cards: 'travel_cards',
  foodBudget: 'travel_food_budget',
};

// Paleta de colores disponible para las tarjetas
const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#78716c', '#64748b', '#94a3b8',
];

// Tarjetas por defecto (nombre + color)
const DEFAULT_CARDS = [
  { name: 'Efectivo', color: '#22c55e' },
  { name: 'Tarjeta personal', color: '#3b82f6' },
  { name: 'Tarjeta empresa', color: '#a855f7' },
];

// Color fijo por categoría
const CATEGORY_COLORS = {
  'Comida': '#f59e0b',
  'Taxi': '#0ea5e9',
  'Hospedaje': '#a855f7',
  'Otros': '#64748b',
};
const DEFAULT_CATEGORY_COLOR = '#64748b';

// Subtipos disponibles por categoría (las que no aparecen aquí no tienen subtipo)
const CATEGORY_SUBTYPES = {
  'Comida': ['Desayuno', 'Almuerzo', 'Cena'],
  'Taxi': ['Ida', 'Vuelta'],
};

const DEFAULT_FOOD_BUDGET = 800;

// ---- Estado ----
let expenses = load(STORAGE_KEYS.expenses, []);
let cards = migrateCards(load(STORAGE_KEYS.cards, DEFAULT_CARDS));
let foodBudget = load(STORAGE_KEYS.foodBudget, DEFAULT_FOOD_BUDGET);
let currentFilter = 'all';

// Migra tarjetas antiguas (string) al nuevo formato { name, color }
function migrateCards(list) {
  let changed = false;
  const migrated = list.map((c, i) => {
    if (typeof c === 'string') {
      changed = true;
      return { name: c, color: COLOR_PALETTE[i % COLOR_PALETTE.length] };
    }
    return c;
  });
  if (changed) save(STORAGE_KEYS.cards, migrated);
  return migrated;
}

// Busca el color de una tarjeta por su nombre
function cardColor(name) {
  const c = cards.find((c) => c.name === name);
  return c ? c.color : '#64748b';
}

function categoryColor(name) {
  return CATEGORY_COLORS[name] || DEFAULT_CATEGORY_COLOR;
}

// Devuelve negro o blanco según el brillo del color de fondo, para legibilidad
function textOn(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

// ---- Utilidades de almacenamiento ----
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveExpenses() { save(STORAGE_KEYS.expenses, expenses); }
function saveCards() { save(STORAGE_KEYS.cards, cards); }

// ---- Formato ----
function money(n) {
  return '$' + Number(n).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ---- Elementos del DOM ----
const form = document.getElementById('expenseForm');
const listEl = document.getElementById('expenseList');
const emptyState = document.getElementById('emptyState');
const cardSelect = document.getElementById('card');
const cardsListEl = document.getElementById('cardsList');
const categorySelect = document.getElementById('category');
const subtypeField = document.getElementById('subtypeField');
const subtypeSelect = document.getElementById('subtype');

// Muestra u oculta el campo "Tipo" según la categoría seleccionada
function updateSubtypeField() {
  const options = CATEGORY_SUBTYPES[categorySelect.value];
  if (options) {
    subtypeSelect.innerHTML = '';
    options.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      subtypeSelect.appendChild(o);
    });
    subtypeField.hidden = false;
  } else {
    subtypeField.hidden = true;
    subtypeSelect.innerHTML = '';
  }
}

categorySelect.addEventListener('change', updateSubtypeField);

// ============================================================
//  Modal de confirmación (con doble confirmación cuando aplica)
// ============================================================
const modalOverlay = document.getElementById('modalOverlay');
const modalMessage = document.getElementById('modalMessage');
const modalConfirm = document.getElementById('modalConfirm');
const modalCancel = document.getElementById('modalCancel');

function confirmDialog(message) {
  return new Promise((resolve) => {
    modalMessage.textContent = message;
    modalOverlay.hidden = false;

    const cleanup = () => {
      modalConfirm.removeEventListener('click', onConfirm);
      modalCancel.removeEventListener('click', onCancel);
      modalOverlay.hidden = true;
    };
    const onConfirm = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };

    modalConfirm.addEventListener('click', onConfirm);
    modalCancel.addEventListener('click', onCancel);
  });
}

// Doble confirmación: pide confirmar dos veces seguidas
async function doubleConfirm(msg1, msg2) {
  const first = await confirmDialog(msg1);
  if (!first) return false;
  return confirmDialog(msg2);
}

// ---- Toast ----
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// ============================================================
//  Tarjetas
// ============================================================
// Color seleccionado en el picker para la nueva tarjeta
let selectedColor = COLOR_PALETTE[0];

function renderCardOptions() {
  cardSelect.innerHTML = '';
  cards.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    cardSelect.appendChild(opt);
  });
}

function renderCardsList() {
  cardsListEl.innerHTML = '';
  cards.forEach((c, i) => {
    const li = document.createElement('li');

    const left = document.createElement('span');
    left.className = 'card-name-with-dot';
    left.innerHTML = `<span class="color-dot" style="background:${c.color}"></span>${escapeHtml(c.name)}`;

    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '🗑️';
    del.setAttribute('aria-label', `Eliminar ${c.name}`);
    del.addEventListener('click', () => removeCard(i));

    li.append(left, del);
    cardsListEl.appendChild(li);
  });
}

// Dibuja el selector de colores (paleta de puntos)
function renderColorPicker() {
  const picker = document.getElementById('colorPicker');
  if (!picker) return;
  picker.innerHTML = '';
  COLOR_PALETTE.forEach((color) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-swatch' + (color === selectedColor ? ' selected' : '');
    btn.style.background = color;
    btn.setAttribute('aria-label', `Color ${color}`);
    btn.addEventListener('click', () => {
      selectedColor = color;
      renderColorPicker();
    });
    picker.appendChild(btn);
  });
}

function addCard() {
  const input = document.getElementById('newCardName');
  const name = input.value.trim();
  if (!name) return;
  if (cards.some((c) => c.name === name)) {
    toast('Esa tarjeta ya existe');
    return;
  }
  cards.push({ name, color: selectedColor });
  saveCards();
  input.value = '';
  renderCardOptions();
  renderCardsList();
  render();
  toast('Tarjeta añadida');
}

async function removeCard(index) {
  const name = cards[index].name;
  const ok = await confirmDialog(`¿Eliminar la tarjeta "${name}"? Los gastos ya registrados no cambian.`);
  if (!ok) return;
  cards.splice(index, 1);
  saveCards();
  renderCardOptions();
  renderCardsList();
  render();
}

document.getElementById('addCardBtn').addEventListener('click', addCard);

// ============================================================
//  Gastos
// ============================================================
function addExpense(data) {
  expenses.unshift({
    id: Date.now().toString(),
    concept: data.concept,
    amount: parseFloat(data.amount),
    date: data.date,
    category: data.category,
    subtype: data.subtype || '',
    card: data.card,
    uploaded: false,
  });
  saveExpenses();
  render();
}

async function toggleUploaded(id) {
  const exp = expenses.find((e) => e.id === id);
  if (!exp) return;

  if (!exp.uploaded) {
    // Doble confirmación para marcar como subido (evita marcarlo por error)
    const ok = await doubleConfirm(
      `¿Ya subiste este gasto?\n"${exp.concept}" · ${money(exp.amount)}`,
      'Confirma de nuevo: marcar como SUBIDO'
    );
    if (!ok) return;
    exp.uploaded = true;
    toast('Marcado como subido ✅');
  } else {
    const ok = await confirmDialog('¿Quitar la marca de "subido"?');
    if (!ok) return;
    exp.uploaded = false;
  }
  saveExpenses();
  render();
}

async function deleteExpense(id) {
  const exp = expenses.find((e) => e.id === id);
  if (!exp) return;
  const ok = await confirmDialog(`¿Eliminar "${exp.concept}" (${money(exp.amount)})?`);
  if (!ok) return;
  expenses = expenses.filter((e) => e.id !== id);
  saveExpenses();
  render();
}

// ============================================================
//  Render
// ============================================================
function getFiltered() {
  if (currentFilter === 'pending') return expenses.filter((e) => !e.uploaded);
  if (currentFilter === 'uploaded') return expenses.filter((e) => e.uploaded);
  return expenses;
}

function render() {
  renderSummary();
  renderDailyFood();
  renderCategoryTotals();
  renderSubtypeTotals();
  renderCardTotals();
  renderDayChart();
  const items = getFiltered();

  listEl.innerHTML = '';
  emptyState.style.display = items.length ? 'none' : 'block';

  // Agrupa por fecha (más reciente primero)
  const byDay = {};
  items.forEach((exp) => {
    (byDay[exp.date] = byDay[exp.date] || []).push(exp);
  });
  const days = Object.keys(byDay).sort((a, b) => b.localeCompare(a));

  days.forEach((date) => {
    const group = byDay[date];
    const dayTotal = group.reduce((s, e) => s + e.amount, 0);

    // Encabezado del día
    const header = document.createElement('div');
    header.className = 'day-header';
    header.innerHTML = `
      <span class="day-header-date">${formatDate(date)}</span>
      <span class="day-header-total">${money(dayTotal)}</span>
    `;
    listEl.appendChild(header);

    // Gastos del día
    group.forEach((exp) => listEl.appendChild(buildExpenseRow(exp)));
  });
}

function buildExpenseRow(exp) {
  const div = document.createElement('div');
  div.className = 'expense' + (exp.uploaded ? ' uploaded' : '');

  const check = document.createElement('button');
  check.className = 'expense-check';
  check.textContent = '✓';
  check.title = exp.uploaded ? 'Subido' : 'Marcar como subido';
  check.addEventListener('click', () => toggleUploaded(exp.id));

  const body = document.createElement('div');
  body.className = 'expense-body';
  const catColor = categoryColor(exp.category);
  const crdColor = cardColor(exp.card);
  body.innerHTML = `
    <div class="expense-top">
      <span class="expense-concept">${escapeHtml(exp.concept)}</span>
      <span class="expense-amount">${money(exp.amount)}</span>
    </div>
    <div class="expense-meta">
      <span class="tag" style="background:${catColor};color:${textOn(catColor)}">${escapeHtml(exp.category)}</span>
      ${exp.subtype ? `<span class="tag tag-subtype">${escapeHtml(exp.subtype)}</span>` : ''}
      <span class="tag" style="background:${crdColor};color:${textOn(crdColor)}">${escapeHtml(exp.card)}</span>
    </div>
  `;

  const del = document.createElement('button');
  del.className = 'expense-delete';
  del.textContent = '✕';
  del.setAttribute('aria-label', 'Eliminar gasto');
  del.addEventListener('click', () => deleteExpense(exp.id));

  div.append(check, body, del);
  return div;
}

// ---- Resumen de comida por día ----
const dailyFoodList = document.getElementById('dailyFoodList');
const dailyFoodEmpty = document.getElementById('dailyFoodEmpty');

function renderDailyFood() {
  // Agrupa gastos de comida por fecha
  const byDay = {};
  expenses
    .filter((e) => e.category === 'Comida')
    .forEach((e) => {
      byDay[e.date] = (byDay[e.date] || 0) + e.amount;
    });

  const days = Object.keys(byDay).sort((a, b) => b.localeCompare(a)); // más reciente primero

  dailyFoodList.innerHTML = '';
  dailyFoodEmpty.style.display = days.length ? 'none' : 'block';

  let totalMissing = 0; // suma de lo que falta por día para llegar a los 800

  days.forEach((date) => {
    const spent = byDay[date];
    const remaining = foodBudget - spent;
    if (remaining > 0) totalMissing += remaining;
    const pct = foodBudget > 0 ? Math.min((spent / foodBudget) * 100, 100) : 0;

    // Verde mientras no te pases de los 800 (aún falta o justo completo).
    // Rojo cuando te pasaste.
    const over = spent > foodBudget;
    const stateClass = over ? 'over' : 'ok';
    let remainingText;
    if (remaining > 0) {
      remainingText = `Faltan ${money(remaining)}`;
    } else if (remaining === 0) {
      remainingText = 'Completo';
    } else {
      remainingText = `Excedido ${money(Math.abs(remaining))}`;
    }

    const item = document.createElement('div');
    item.className = `daily-item ${stateClass}`;
    item.innerHTML = `
      <div class="daily-item-top">
        <span class="daily-date">${formatDate(date)}</span>
        <span class="daily-remaining ${stateClass}">${remainingText}</span>
      </div>
      <div class="daily-detail">Gastado ${money(spent)} de ${money(foodBudget)}</div>
      <div class="daily-bar">
        <div class="daily-bar-fill ${stateClass}" style="width:${pct}%"></div>
      </div>
    `;
    dailyFoodList.appendChild(item);
  });

  // Total faltante (suma de los faltantes de cada día)
  const missingBox = document.getElementById('foodMissingBox');
  const missingValue = document.getElementById('foodMissingValue');
  if (days.length) {
    missingBox.hidden = false;
    missingValue.textContent = money(totalMissing);
  } else {
    missingBox.hidden = true;
  }
}

// ---- Gasto por categoría ----
const categoryTotalList = document.getElementById('categoryTotalList');
const categoryTotalEmpty = document.getElementById('categoryTotalEmpty');

function renderCategoryTotals() {
  const byCat = {};
  const countByCat = {};
  expenses.forEach((e) => {
    byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    countByCat[e.category] = (countByCat[e.category] || 0) + 1;
  });

  const names = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]); // mayor gasto primero

  categoryTotalList.innerHTML = '';
  categoryTotalEmpty.style.display = names.length ? 'none' : 'block';

  names.forEach((name) => {
    const color = categoryColor(name);
    const n = countByCat[name];
    const item = document.createElement('div');
    item.className = 'cardtotal-item';
    item.style.borderLeft = `4px solid ${color}`;
    item.innerHTML = `
      <span class="cardtotal-name">
        <span class="color-dot" style="background:${color}"></span>${escapeHtml(name)}
      </span>
      <span class="cardtotal-right">
        <span class="cardtotal-amount">${money(byCat[name])}</span>
        <span class="cardtotal-count">${n} ${n === 1 ? 'gasto' : 'gastos'}</span>
      </span>
    `;
    categoryTotalList.appendChild(item);
  });
}

// ---- Detalle por tipo (subtipos de Comida y Taxi) ----
const subtypeCard = document.getElementById('subtypeCard');
const subtypeTotalList = document.getElementById('subtypeTotalList');

function renderSubtypeTotals() {
  // Agrupa: categoría -> subtipo -> {amount, count}
  const grouped = {};
  expenses.forEach((e) => {
    if (!e.subtype) return;
    grouped[e.category] = grouped[e.category] || {};
    const g = grouped[e.category];
    g[e.subtype] = g[e.subtype] || { amount: 0, count: 0 };
    g[e.subtype].amount += e.amount;
    g[e.subtype].count += 1;
  });

  const categories = Object.keys(grouped);
  subtypeCard.hidden = categories.length === 0;
  subtypeTotalList.innerHTML = '';

  categories.forEach((cat) => {
    const color = categoryColor(cat);

    // Encabezado de la categoría
    const heading = document.createElement('div');
    heading.className = 'subtype-parent';
    heading.textContent = cat;
    subtypeTotalList.appendChild(heading);

    // Subtipos ordenados por gasto
    const subs = Object.keys(grouped[cat]).sort(
      (a, b) => grouped[cat][b].amount - grouped[cat][a].amount
    );
    subs.forEach((sub) => {
      const { amount, count } = grouped[cat][sub];
      const item = document.createElement('div');
      item.className = 'cardtotal-item';
      item.style.borderLeft = `4px solid ${color}`;
      item.innerHTML = `
        <span class="cardtotal-name">
          <span class="color-dot" style="background:${color}"></span>${escapeHtml(sub)}
        </span>
        <span class="cardtotal-right">
          <span class="cardtotal-amount">${money(amount)}</span>
          <span class="cardtotal-count">${count} ${count === 1 ? 'gasto' : 'gastos'}</span>
        </span>
      `;
      subtypeTotalList.appendChild(item);
    });
  });
}

// ---- Gasto por tarjeta ----
const cardTotalList = document.getElementById('cardTotalList');
const cardTotalEmpty = document.getElementById('cardTotalEmpty');

function renderCardTotals() {
  const byCard = {};
  const countByCard = {};
  expenses.forEach((e) => {
    byCard[e.card] = (byCard[e.card] || 0) + e.amount;
    countByCard[e.card] = (countByCard[e.card] || 0) + 1;
  });

  const names = Object.keys(byCard).sort((a, b) => byCard[b] - byCard[a]); // mayor gasto primero

  cardTotalList.innerHTML = '';
  cardTotalEmpty.style.display = names.length ? 'none' : 'block';

  names.forEach((name) => {
    const item = document.createElement('div');
    item.className = 'cardtotal-item';
    item.style.borderLeft = `4px solid ${cardColor(name)}`;
    const n = countByCard[name];
    item.innerHTML = `
      <span class="cardtotal-name">
        <span class="color-dot" style="background:${cardColor(name)}"></span>${escapeHtml(name)}
      </span>
      <span class="cardtotal-right">
        <span class="cardtotal-amount">${money(byCard[name])}</span>
        <span class="cardtotal-count">${n} ${n === 1 ? 'gasto' : 'gastos'}</span>
      </span>
    `;
    cardTotalList.appendChild(item);
  });
}

// ---- Gráfica: gasto total por día (todas las categorías) ----
const dayChart = document.getElementById('dayChart');
const chartEmpty = document.getElementById('chartEmpty');

function renderDayChart() {
  const byDay = {};
  expenses.forEach((e) => {
    byDay[e.date] = (byDay[e.date] || 0) + e.amount;
  });

  const days = Object.keys(byDay).sort((a, b) => a.localeCompare(b)); // cronológico
  dayChart.innerHTML = '';
  chartEmpty.style.display = days.length ? 'none' : 'block';
  dayChart.style.display = days.length ? 'flex' : 'none';

  if (!days.length) return;

  const max = Math.max(...days.map((d) => byDay[d]));

  days.forEach((date) => {
    const amount = byDay[date];
    const heightPct = max > 0 ? (amount / max) * 100 : 0;
    const [, m, d] = date.split('-');

    const col = document.createElement('div');
    col.className = 'chart-col';
    // La gráfica usa el presupuesto de comida solo como referencia visual del color:
    // rojo si el total del día supera el presupuesto diario de comida.
    const over = amount > foodBudget;
    col.innerHTML = `
      <span class="chart-amount">${money(amount)}</span>
      <div class="chart-bar ${over ? 'over' : 'ok'}" style="height:${heightPct}%"></div>
      <span class="chart-label">${d}/${m}</span>
    `;
    dayChart.appendChild(col);
  });
}

function renderSummary() {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingItems = expenses.filter((e) => !e.uploaded);
  const pending = pendingItems.reduce((s, e) => s + e.amount, 0);
  document.getElementById('totalAmount').textContent = money(total);
  document.getElementById('pendingAmount').textContent = money(pending);
  document.getElementById('pendingCount').textContent =
    `${pendingItems.length} ${pendingItems.length === 1 ? 'gasto' : 'gastos'}`;
  document.getElementById('countAmount').textContent = expenses.length;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
//  Filtros
// ============================================================
document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelector('.chip.active').classList.remove('active');
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    render();
  });
});

// ============================================================
//  Formulario
// ============================================================
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const category = document.getElementById('category').value;
  const hasSubtype = !subtypeField.hidden;
  addExpense({
    concept: document.getElementById('concept').value.trim(),
    amount: document.getElementById('amount').value,
    date: document.getElementById('date').value,
    category,
    subtype: hasSubtype ? subtypeSelect.value : '',
    card: document.getElementById('card').value,
  });
  form.reset();
  setTodayAsDefault();
  updateSubtypeField();
  toast('Gasto agregado');
  goToTab('tab-list');
});

// Cambia de pestaña por código
function goToTab(tabId) {
  const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (btn) btn.click();
}

function setTodayAsDefault() {
  const today = new Date();
  const iso = today.toISOString().split('T')[0];
  document.getElementById('date').value = iso;
}

// ============================================================
//  Exportar / Importar
// ============================================================
document.getElementById('exportBtn').addEventListener('click', () => {
  const data = JSON.stringify({ expenses, cards }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gastos-viaje-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

const importFile = document.getElementById('importFile');
document.getElementById('importBtn').addEventListener('click', () => importFile.click());

importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      const ok = await confirmDialog('¿Importar estos datos? Reemplazará tus datos actuales.');
      if (!ok) return;
      if (Array.isArray(data.expenses)) expenses = data.expenses;
      if (Array.isArray(data.cards)) cards = data.cards;
      saveExpenses();
      saveCards();
      renderCardOptions();
      renderCardsList();
      render();
      toast('Datos importados');
    } catch {
      toast('Archivo inválido');
    }
    importFile.value = '';
  };
  reader.readAsText(file);
});

// ---- Borrar todo (protegido con contraseña) ----
const DELETE_PASSWORD = '050301';

document.getElementById('deleteAllBtn').addEventListener('click', async () => {
  // Primera barrera: doble confirmación
  const sure = await doubleConfirm(
    'Esto borrará TODOS los gastos y tarjetas. ¿Continuar?',
    'Confirma de nuevo: se perderán todos los datos'
  );
  if (!sure) return;

  // Segunda barrera: contraseña
  const entered = prompt('Escribe la contraseña para borrar todo:');
  if (entered === null) return; // canceló
  if (entered !== DELETE_PASSWORD) {
    toast('Contraseña incorrecta');
    return;
  }

  // Borrado
  expenses = [];
  cards = DEFAULT_CARDS.map((c) => ({ ...c }));
  foodBudget = DEFAULT_FOOD_BUDGET;
  saveExpenses();
  saveCards();
  save(STORAGE_KEYS.foodBudget, foodBudget);

  foodBudgetInput.value = foodBudget;
  renderCardOptions();
  renderCardsList();
  render();
  toast('Todo borrado');
});

// ============================================================
//  Inicio
// ============================================================
// ---- Presupuesto de comida ----
const foodBudgetInput = document.getElementById('foodBudget');

foodBudgetInput.addEventListener('input', () => {
  const val = parseFloat(foodBudgetInput.value);
  foodBudget = isNaN(val) || val < 0 ? 0 : val;
  save(STORAGE_KEYS.foodBudget, foodBudget);
  renderDailyFood();
});

// ---- Navegación por pestañas ----
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      document.querySelector('.tab-btn.active').classList.remove('active');
      btn.classList.add('active');

      document.querySelector('.tab-panel.active').classList.remove('active');
      document.getElementById(target).classList.add('active');

      window.scrollTo({ top: 0 });
    });
  });
}

function init() {
  foodBudgetInput.value = foodBudget;
  renderCardOptions();
  renderCardsList();
  renderColorPicker();
  updateSubtypeField();
  setTodayAsDefault();
  setupTabs();
  render();
}

init();
