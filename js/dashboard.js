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
    escapeHtml,
    billStatus
} from "./common.js";

let cur = new Date();

cur.setDate(1);

protect(async u => {

    prevMonth.onclick = async () => {

        cur.setMonth(cur.getMonth() - 1);

        await render(u);

    };

    nextMonth.onclick = async () => {

        cur.setMonth(cur.getMonth() + 1);

        await render(u);

    };

    await render(u);

});

async function render(u) {

    const k = monthKey(cur);

    const f = new Intl.DateTimeFormat(
        "pt-BR",
        {
            month: "long",
            year: "numeric"
        }
    ).format(cur);

    monthLabel.textContent =
        f[0].toUpperCase() + f.slice(1);

    const [es, bs] = await Promise.all([

        getDocs(
            collection(
                db,
                "users",
                u.uid,
                "entries"
            )
        ),

        getDocs(
            collection(
                db,
                "users",
                u.uid,
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

    const ti = e.reduce(
        (s, i) => s + Number(i.amount),
        0
    );

    const tb = b.reduce(
        (s, i) => s + Number(i.amount),
        0
    );

    const p = b
        .filter(i => i.status !== "paid")
        .reduce(
            (s, i) => s + Number(i.amount),
            0
        );

    totalEntries.textContent = money(ti);

    totalBills.textContent = money(tb);

    pendingBills.textContent = money(p);

    balance.textContent = money(ti - tb);

    paidCount.textContent =
        b.filter(i => i.status === "paid").length;

    pendingCount.textContent =
        b.filter(i => billStatus(i) === "pending").length;

    overdueCount.textContent =
        b.filter(i => billStatus(i) === "overdue").length;

    const now = new Date();

    now.setHours(0, 0, 0, 0);

    const n = [...b]
        .filter(i => i.status !== "paid")
        .sort((a, b) =>
            a.dueDate.localeCompare(b.dueDate)
        )
        .slice(0, 7);

    upcoming.innerHTML = n.length
        ? n
            .map(i => {

                const due = new Date(
                    `${i.dueDate}T00:00:00`
                );

                const diff = Math.ceil(
                    (due - now) / 86400000
                );

                const msg =
                    diff < 0
                        ? `Atrasada há ${Math.abs(diff)} dia(s)`
                        : diff === 0
                            ? "Vence hoje"
                            : diff === 1
                                ? "Vence amanhã"
                                : `Vence em ${diff} dias`;

                return `
                    <div class="item ${diff < 0 ? "item-danger" : ""}">

                        <div>

                            <strong>
                                ${escapeHtml(i.name)}
                            </strong>

                            <small>
                                ${msg} • ${dateBR(i.dueDate)}
                            </small>

                        </div>

                        <strong>
                            ${money(i.amount)}
                        </strong>

                    </div>
                `;

            })
            .join("")
        : '<p class="empty">Nenhuma conta pendente.</p>';

    const r = [...e]
        .sort((a, b) =>
            b.date.localeCompare(a.date)
        )
        .slice(0, 5);

    recentEntries.innerHTML = r.length
        ? r
            .map(i => `
                <div class="item">

                    <div>

                        <strong>
                            ${escapeHtml(i.description)}
                        </strong>

                        <small>
                            ${dateBR(i.date)}
                        </small>

                    </div>

                    <strong>
                        ${money(i.amount)}
                    </strong>

                </div>
            `)
            .join("")
        : '<p class="empty">Nenhuma entrada.</p>';

}