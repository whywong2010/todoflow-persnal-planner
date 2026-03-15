import Link from "next/link";

const highlights = [
  {
    title: "日曆總覽",
    description: "在月曆上直接看到每天任務量與未完成項目，快速找出高壓時段。",
  },
  {
    title: "到期提醒",
    description: "任務到期前 30 分鐘通知，重要事項不再臨時抱佛腳。",
  },
  {
    title: "本機優先",
    description: "資料儲存在你的瀏覽器，不依賴帳號登入，打開即用。",
  },
];

const workflow = [
  "在指定日期建立任務，補上描述與優先級。",
  "按日期檢視清單，完成即標記，進度一眼可見。",
  "用篩選器聚焦特定時間區間與狀態，快速清空待辦。",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(20,184,166,0.2),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(251,191,36,0.22),transparent_38%),radial-gradient(circle_at_90%_90%,rgba(14,116,144,0.3),transparent_45%),#04120f] px-4 py-6 text-emerald-50 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-2xl border border-emerald-200/20 bg-emerald-950/50 px-4 py-3 backdrop-blur-sm md:px-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold tracking-[0.18em] text-emerald-200">
              TODOFLOW
            </p>
            <Link
              href="/dashboard"
              className="rounded-lg border border-emerald-300/40 px-3 py-1.5 text-sm text-emerald-100 transition hover:bg-emerald-500/20"
            >
              進入任務面板
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <article className="rounded-3xl border border-emerald-200/25 bg-emerald-950/45 p-6 shadow-[0_24px_70px_-28px_rgba(16,185,129,0.8)] backdrop-blur-sm md:p-8">
            <p className="inline-flex rounded-full border border-amber-200/40 bg-amber-400/15 px-3 py-1 text-xs tracking-[0.18em] text-amber-100">
              SMART PERSONAL PLANNER
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-5xl">
              今天的重點任務，
              <br />
              先看清楚再開工。
            </h1>
            <p className="mt-4 max-w-xl text-sm text-emerald-100/85 md:text-base">
              TodoFlow 把待辦與日曆結合，讓你在「日期、優先級、完成狀態」之間快速切換，專注真正要完成的工作。
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-amber-200"
              >
                立即開始
              </Link>
              <a
                href="#features"
                className="rounded-xl border border-emerald-200/35 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/15"
              >
                看功能亮點
              </a>
            </div>
          </article>

          <article className="rounded-3xl border border-emerald-200/20 bg-slate-950/65 p-6 backdrop-blur-sm md:p-7">
            <p className="text-xs tracking-[0.16em] text-emerald-300">TODAY SNAPSHOT</p>
            <div className="mt-4 space-y-3">
              {[
                { time: "09:00", task: "更新本週發版清單", badge: "高" },
                { time: "14:30", task: "客戶回饋整理與分派", badge: "中" },
                { time: "18:00", task: "明日會議 Agenda", badge: "低" },
              ].map((item) => (
                <div
                  key={`${item.time}-${item.task}`}
                  className="rounded-xl border border-emerald-100/15 bg-emerald-950/40 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-emerald-50">{item.task}</p>
                    <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs text-emerald-100">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-200/70">截止 {item.time}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section
          id="features"
          className="mt-6 grid gap-4 md:grid-cols-3"
        >
          {highlights.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-emerald-200/20 bg-emerald-950/35 p-5"
            >
              <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
              <p className="mt-2 text-sm text-emerald-100/80">
                {feature.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-emerald-200/20 bg-slate-950/60 p-6 md:p-8">
          <p className="text-xs tracking-[0.16em] text-amber-200">WORKFLOW</p>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {workflow.map((step, index) => (
              <li
                key={step}
                className="rounded-xl border border-emerald-200/15 bg-emerald-950/35 p-4 text-sm text-emerald-100/85"
              >
                <p className="text-xs text-amber-100">STEP {index + 1}</p>
                <p className="mt-2">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
