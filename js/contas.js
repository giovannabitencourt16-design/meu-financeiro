import {
    db,
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc
} from "./firebase.js";

import {
    protect,
    money,
    dateBR,
    monthKey,
    today,
    toast,
    escapeHtml,
    billStatus
} from "./common.js";

// ===============================
// VARIÁVEIS
// ===============================

let uid;
let data = [];

// ===============================
// INICIALIZAÇÃO
// ===============================

protect(async u => {

    uid = u.uid;

    billMonth.value = monthKey(new Date());

    billMonth.onchange = async () => {
        await createRecurring(billMonth.value);
        render();
    };

    billFilter.onchange = render;
    billSearch.oninput = render;

    newBill.onclick = () => open();

    closeBill.onclick =
        cancelBill.onclick =
        () => billModal.classList.add("hidden");

    billBackdrop.onclick = () =>
        billModal.classList.add("hidden");

    billForm.onsubmit = save;

    billsList.onclick = act;

    await load();

});

// ===============================
// CARREGAR CONTAS
// ===============================

async function load() {

    const s = await getDocs(
        collection(db, "users", uid, "bills")
    );

    data = s.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));

    await createRecurring(billMonth.value);

    render();

}

// ===============================
// CRIAR CONTAS RECORRENTES
// ===============================

async function createRecurring(target) {

    const existing = new Set(

        data
            .filter(i =>
                i.monthKey === target &&
                i.recurringSourceId
            )
            .map(i => i.recurringSourceId)

    );

    const latest = new Map();

    data
        .filter(i =>
            i.recurring &&
            i.monthKey < target
        )
        .forEach(i => {

            const source =
                i.recurringSourceId || i.id;

            const old = latest.get(source);

            if (!old || i.monthKey > old.monthKey) {
                latest.set(source, i);
            }

        });

    for (const [sourceId, source] of latest) {

        if (existing.has(sourceId)) {
            continue;
        }

        const [y, m] = target
            .split("-")
            .map(Number);

        const day = Number(
            source.dueDate.split("-")[2]
        );

        const last = new Date(y, m, 0).getDate();

        const due =
            `${target}-${String(
                Math.min(day, last)
            ).padStart(2, "0")}`;

        const item = {
            ...source,
            id: crypto.randomUUID(),
            dueDate: due,
            monthKey: target,
            status: "pending",
            recurringSourceId: sourceId,
            createdAt: Date.now()
        };

        await setDoc(
            doc(db, "users", uid, "bills", item.id),
            item
        );

        data.push(item);

    }

}

// ===============================
// DEFINIR URGÊNCIA
// ===============================

function urgency(i) {

    const now = new Date();

    now.setHours(0, 0, 0, 0);

    const due = new Date(`${i.dueDate}T00:00:00`);

    const diff = Math.ceil(
        (due - now) / 86400000
    );

    if (i.status === "paid") {
        return "Pagas";
    }

    if (diff < 0) {
        return "Atrasadas";
    }

    if (diff === 0) {
        return "Vence hoje";
    }

    if (diff === 1) {
        return "Vence amanhã";
    }

    if (diff <= 7) {
        return "Esta semana";
    }

    return "Próximas";

}

// ===============================
// RENDERIZAR LISTA
// ===============================

function render() {

    let l = data.filter(
        i => i.monthKey === billMonth.value
    );

    const q = billSearch.value
        .trim()
        .toLowerCase();

    if (q) {
        l = l.filter(i =>
            i.name
                .toLowerCase()
                .includes(q)
        );
    }

    if (billFilter.value !== "all") {

        l = l.filter(
            i => billStatus(i) === billFilter.value
        );

    }

    l.sort((a, b) =>
        a.dueDate.localeCompare(b.dueDate)
    );

    const t = data
        .filter(i =>
            i.monthKey === billMonth.value
        )
        .reduce(
            (s, i) => s + Number(i.amount),
            0
        );

    billSummary.textContent = l.length
        ? `${l.length} conta(s) • Total ${money(t)}`
        : "Nenhuma conta.";

    if (!l.length) {

        billsList.innerHTML =
            '<p class="empty">Cadastre sua primeira conta.</p>';

        return;

    }

    const groups = [
        "Atrasadas",
        "Vence hoje",
        "Vence amanhã",
        "Esta semana",
        "Próximas",
        "Pagas"
    ];

    billsList.innerHTML = groups
        .map(g => {

            const items = l.filter(
                i => urgency(i) === g
            );

            if (!items.length) {
                return "";
            }

            return `
<section class="bill-group">
    <h3>${g}</h3>

    ${items.map(i => {

        const s = billStatus(i);

        const lab =
            s === "paid"
                ? "Pago"
                : s === "overdue"
                    ? "Atrasado"
                    : "Pendente";

        const due = new Date(`${i.dueDate}T00:00:00`);

        const now = new Date();

        now.setHours(0, 0, 0, 0);

        const days = Math.abs(
            Math.floor(
                (now - due) / 86400000
            )
        );

        const late =
            s === "overdue"
                ? ` • venceu há ${days} dia(s)`
                : "";

        return `
<div class="record ${s === "overdue" ? "record-overdue" : ""}">

    <div>

        <strong>${escapeHtml(i.name)}</strong>

        <small>
            ${dateBR(i.dueDate)}
            ${late}
            • ${escapeHtml(i.category)}
            • ${escapeHtml(i.paymentMethod || "Não informado")}
            ${i.recurring ? " • recorrente" : ""}
        </small>

    </div>

    <strong>${money(i.amount)}</strong>

    <span class="status ${s}">
        ${lab}
    </span>

    <div>

        <button data-a="toggle" data-id="${i.id}">
            ${i.status === "paid" ? "↩" : "✓"}
        </button>

        <button data-a="edit" data-id="${i.id}">
            ✎
        </button>

        <button data-a="delete" data-id="${i.id}">
            🗑
        </button>

    </div>

</div>
`;

    }).join("")}

</section>
`;

        })
        .join("");

}
// ===============================
// ABRIR MODAL
// ===============================

function open(i) {

    billForm.reset();

    billId.value = "";
    billDueDate.value = today();
    billPaymentMethod.value = "Pix";

    if (i) {

        billId.value = i.id;
        billName.value = i.name;
        billAmount.value = i.amount;
        billDueDate.value = i.dueDate;
        billCategory.value = i.category;
        billPaymentMethod.value = i.paymentMethod || "Pix";
        billRecurring.checked = Boolean(i.recurring);
        billNotes.value = i.notes || "";

    }

    billModal.classList.remove("hidden");

}

// ===============================
// SALVAR CONTA
// ===============================

async function save(e) {

    e.preventDefault();

    const id = billId.value || crypto.randomUUID();

    const d = billDueDate.value;

    const o = data.find(i => i.id === id);

    const i = {

        id,

        name: billName.value.trim(),

        amount: Number(billAmount.value),

        dueDate: d,

        monthKey: d.slice(0, 7),

        category: billCategory.value,

        paymentMethod: billPaymentMethod.value,

        recurring: billRecurring.checked,

        notes: billNotes.value.trim(),

        status: o?.status || "pending",

        recurringSourceId: o?.recurringSourceId || null,

        createdAt: o?.createdAt || Date.now()

    };

    await setDoc(
        doc(db, "users", uid, "bills", id),
        i
    );

    const x = data.findIndex(v => v.id === id);

    if (x >= 0) {

        data[x] = i;

    } else {

        data.push(i);

    }

    billModal.classList.add("hidden");

    render();

    toast("Conta salva.");

}

// ===============================
// AÇÕES DA LISTA
// ===============================

async function act(e) {

    const b = e.target.closest("[data-a]");

    if (!b) {
        return;
    }

    const i = data.find(v => v.id === b.dataset.id);

    // ===============================
    // EDITAR
    // ===============================

    if (b.dataset.a === "edit") {

        open(i);

    }

    // ===============================
    // MARCAR COMO PAGA / PENDENTE
    // ===============================

    if (b.dataset.a === "toggle") {

        i.status =
            i.status === "paid"
                ? "pending"
                : "paid";

        await setDoc(
            doc(db, "users", uid, "bills", i.id),
            i
        );

        render();

        toast("Status atualizado.");

    }

    // ===============================
    // EXCLUIR
    // ===============================

    if (
        b.dataset.a === "delete" &&
        confirm(`Excluir "${i.name}"?`)
    ) {

        await deleteDoc(
            doc(db, "users", uid, "bills", i.id)
        );

        data = data.filter(v => v.id !== i.id);

        render();

        toast("Conta excluída.");

    }

}