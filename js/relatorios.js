import {
    db,
    collection,
    getDocs
} from "./firebase.js";

import {
    protect,
    money,
    monthKey,
    dateBR,
    escapeHtml
} from "./common.js";

let uid;

// ===============================
// INICIALIZAÇÃO
// ===============================

protect(async u => {

    uid = u.uid;

    reportMonth.value = monthKey(new Date());

    reportMonth.onchange = render;

    printReport.onclick = () => window.print();

    await render();

});

// ===============================
// GERAR RELATÓRIO
// ===============================

async function render() {

    const k = reportMonth.value;

    const [y, m] = k.split("-").map(Number);

    const f = new Intl.DateTimeFormat(
        "pt-BR",
        {
            month: "long",
            year: "numeric"
        }
    ).format(new Date(y, m - 1, 1));

    reportLabel.textContent =
        f[0].toUpperCase() + f.slice(1);

    const [es, bs] = await Promise.all([

        getDocs(
            collection(
                db,
                "users",
                uid,
                "entries"
            )
        ),

        getDocs(
            collection(
                db,
                "users",
                uid,
                "bills"
            )
        )

    ]);

    const e = es.docs
        .map(d => d.data())
        .filter(i => i.monthKey === k);

    const b = bs.docs
        .map(d => d.data())
        .filter(i => i.monthKey === k);

    const te = e.reduce(
        (s, i) => s + Number(i.amount),
        0
    );

    const tb = b.reduce(
        (s, i) => s + Number(i.amount),
        0
    );

    const tp = b
        .filter(i => i.status === "paid")
        .reduce(
            (s, i) => s + Number(i.amount),
            0
        );

    reportEntries.textContent = money(te);

    reportBills.textContent = money(tb);

    reportPaid.textContent = money(tp);

    reportBalance.textContent = money(te - tb);

    reportEntriesList.innerHTML = e.length

        ? e.map(i => `
            <div class="item">

                <span>
                    ${dateBR(i.date)}
                    • ${escapeHtml(i.description)}
                </span>

                <strong>
                    ${money(i.amount)}
                </strong>

            </div>
        `).join("")

        : '<p class="empty">Nenhuma entrada.</p>';

    reportBillsList.innerHTML = b.length

        ? b.map(i => `
            <div class="item">

                <span>
                    ${dateBR(i.dueDate)}
                    • ${escapeHtml(i.name)}
                    ${i.status === "paid"
                        ? "✓ Pago"
                        : "• Pendente"}
                </span>

                <strong>
                    ${money(i.amount)}
                </strong>

            </div>
        `).join("")

        : '<p class="empty">Nenhuma conta.</p>';

}