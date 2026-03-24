"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DIAGNOSIS_RESULTS,
  DIAGNOSIS_QUESTIONS,
  resolveDiagnosisType,
  type DiagnosisTypeKey,
  type DiagnosisTypeResult,
} from "@/lib/energy-diagnosis";

type AnswerMap = Record<string, string>;

const INITIAL_ANSWERS: AnswerMap = {};

export function EnergyDiagnosis() {
  const searchParams = useSearchParams();
  const [answers, setAnswers] = useState<AnswerMap>(INITIAL_ANSWERS);
  const [submitted, setSubmitted] = useState(false);
  const [ignoreSharedResult, setIgnoreSharedResult] = useState(false);
  const [copied, setCopied] = useState(false);

  const sharedResult = useMemo<DiagnosisTypeResult | null>(() => {
    if (ignoreSharedResult) {
      return null;
    }

    const sharedType = searchParams.get("type") as DiagnosisTypeKey | null;
    if (!sharedType || !(sharedType in DIAGNOSIS_RESULTS)) {
      return null;
    }

    return DIAGNOSIS_RESULTS[sharedType];
  }, [ignoreSharedResult, searchParams]);

  const unansweredCount = useMemo(
    () =>
      DIAGNOSIS_QUESTIONS.filter((question) => !answers[question.id]).length,
    [answers],
  );

  const calculatedResult = useMemo<DiagnosisTypeResult | null>(() => {
    if (!submitted) {
      return null;
    }

    return resolveDiagnosisType(answers);
  }, [answers, submitted]);

  const result = calculatedResult ?? sharedResult;

  function selectOption(questionId: string, optionId: string): void {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
  }

  function submitDiagnosis(): void {
    if (unansweredCount > 0) {
      return;
    }

    setIgnoreSharedResult(true);
    setSubmitted(true);
  }

  function restartDiagnosis(): void {
    setAnswers(INITIAL_ANSWERS);
    setSubmitted(false);
    setIgnoreSharedResult(true);
    setCopied(false);
  }

  function startDiagnosisFromShared(): void {
    setIgnoreSharedResult(true);
    setSubmitted(false);
    setAnswers(INITIAL_ANSWERS);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("type");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

  function getShareLink(target: DiagnosisTypeResult): string {
    if (typeof window === "undefined") {
      return `/diagnosis?type=${target.key}`;
    }

    return `${window.location.origin}/diagnosis?type=${target.key}`;
  }

  function wrapCanvasText(
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): string[] {
    const lines: string[] = [];
    let current = "";

    for (const char of text) {
      const next = current + char;
      if (context.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = char;
      } else {
        current = next;
      }
    }

    if (current) {
      lines.push(current);
    }

    return lines;
  }

  function drawWrappedText(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    lineHeight: number,
  ): number {
    const lines = wrapCanvasText(context, text, maxWidth);
    lines.forEach((line, index) => {
      context.fillText(line, x, startY + index * lineHeight);
    });

    return startY + lines.length * lineHeight;
  }

  function downloadPoster(): void {
    if (!result || typeof document === "undefined") {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const gradient = context.createLinearGradient(0, 0, 1080, 1920);
    gradient.addColorStop(0, "#052e2b");
    gradient.addColorStop(0.55, "#0b1f38");
    gradient.addColorStop(1, "#111827");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1080, 1920);

    context.fillStyle = "#6ee7b7";
    context.font = "600 38px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
    context.fillText("TODAY ENERGY CARD", 90, 140);

    context.fillStyle = "#fef3c7";
    context.font = "700 88px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
    context.fillText(result.shareTitle, 90, 280);

    context.fillStyle = "#d1fae5";
    context.font = "400 42px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
    let y = drawWrappedText(context, result.shareSubtitle, 90, 380, 900, 60);
    y = drawWrappedText(context, result.shareAction, 90, y + 20, 900, 60);

    context.fillStyle = "#ffffff";
    context.font = "700 44px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
    context.fillText("今日 3 步策略", 90, y + 100);

    context.fillStyle = "#dbeafe";
    context.font = "400 38px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
    result.steps.forEach((step, index) => {
      context.fillText(`${index + 1}. ${step}`, 100, y + 180 + index * 72);
    });

    context.fillStyle = "#fca5a5";
    context.font = "500 34px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
    drawWrappedText(context, `禁忌：${result.avoid}`, 90, y + 420, 900, 52);

    context.fillStyle = "#fde68a";
    context.font = "500 34px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
    drawWrappedText(context, `「${result.quote}」`, 90, y + 540, 900, 52);

    context.fillStyle = "#a7f3d0";
    context.font = "400 30px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
    context.fillText("立即測你的行動類型", 90, 1730);

    context.fillStyle = "#f8fafc";
    context.font = "500 28px 'PingFang TC', 'Microsoft JhengHei', sans-serif";
    context.fillText(getShareLink(result), 90, 1780);

    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = `todoflow-energy-card-${result.key}.png`;
    anchor.click();
  }

  async function copyShareText(): Promise<void> {
    if (!result) {
      return;
    }

    const text = [
      `${result.shareTitle}`,
      `${result.shareSubtitle}`,
      `${result.shareAction}`,
      "",
      "我剛做完今日逆襲診斷，你也來測：",
      getShareLink(result),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_5%_10%,rgba(16,185,129,0.22),transparent_32%),radial-gradient(circle_at_90%_5%,rgba(251,191,36,0.18),transparent_35%),radial-gradient(circle_at_90%_90%,rgba(59,130,246,0.2),transparent_40%),#020617] px-4 py-6 text-emerald-50 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="rounded-2xl border border-emerald-200/20 bg-emerald-950/45 p-5 backdrop-blur-sm md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.2em] text-emerald-200/90">
                ENERGY CHECK
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                今日逆襲診斷
              </h1>
              <p className="mt-2 text-sm text-emerald-100/85 md:text-base">
                6 題看懂你的行動模式，立刻拿到「今天該怎麼做」的策略卡。
              </p>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-emerald-300/40 px-3 py-1.5 text-sm text-emerald-100 transition hover:bg-emerald-500/20"
            >
              返回首頁
            </Link>
          </div>
        </header>

        {!result ? (
          <section className="space-y-4 rounded-3xl border border-emerald-200/15 bg-slate-950/70 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-emerald-100/85">
                尚未作答：<span className="font-semibold text-amber-200">{unansweredCount}</span>{" "}
                題
              </p>
              <button
                type="button"
                onClick={submitDiagnosis}
                disabled={unansweredCount > 0}
                className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-200/40 disabled:text-emerald-100/70"
              >
                生成我的逆襲卡
              </button>
            </div>

            <div className="space-y-4">
              {DIAGNOSIS_QUESTIONS.map((question, index) => (
                <article
                  key={question.id}
                  className="rounded-2xl border border-emerald-200/15 bg-emerald-950/30 p-4"
                >
                  <h2 className="text-base font-medium text-white md:text-lg">
                    {index + 1}. {question.title}
                  </h2>
                  <div className="mt-3 grid gap-2">
                    {question.options.map((option) => {
                      const selected = answers[question.id] === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => selectOption(question.id, option.id)}
                          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                            selected
                              ? "border-amber-200/60 bg-amber-300/15 text-amber-100"
                              : "border-emerald-200/15 bg-slate-950/45 text-emerald-100/90 hover:border-emerald-200/40 hover:bg-emerald-500/10"
                          }`}
                        >
                          {option.id}. {option.label}
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-emerald-200/20 bg-slate-950/75 p-5 md:p-7">
            <p className="text-xs tracking-[0.18em] text-amber-200">RESULT</p>
            <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
              你的類型：{result.title}
            </h2>
            <p className="mt-3 text-emerald-100/85">{result.diagnosis}</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-emerald-200/15 bg-emerald-950/35 p-4">
                <p className="text-sm font-medium text-amber-100">今日 3 步策略</p>
                <ol className="mt-3 space-y-2 text-sm text-emerald-100/90">
                  {result.steps.map((step, index) => (
                    <li key={step}>
                      {index + 1}. {step}
                    </li>
                  ))}
                </ol>
              </article>
              <article className="rounded-2xl border border-emerald-200/15 bg-emerald-950/35 p-4">
                <p className="text-sm font-medium text-amber-100">今日提醒</p>
                <p className="mt-3 text-sm text-emerald-100/90">
                  禁忌：{result.avoid}
                </p>
                <p className="mt-3 text-sm text-emerald-50">「{result.quote}」</p>
              </article>
            </div>

            <article className="mt-4 rounded-2xl border border-sky-200/25 bg-sky-900/25 p-4">
              <p className="text-sm text-sky-100">{result.shareTitle}</p>
              <p className="mt-1 text-sm text-sky-200/90">{result.shareSubtitle}</p>
              <p className="mt-1 text-sm text-sky-200/90">{result.shareAction}</p>
            </article>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyShareText}
                className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-amber-200"
              >
                {copied ? "已複製分享文案" : "複製分享文案"}
              </button>
              <button
                type="button"
                onClick={downloadPoster}
                className="rounded-xl border border-amber-200/45 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-300/15"
              >
                下載結果海報 PNG
              </button>
              {!submitted ? (
                <button
                  type="button"
                  onClick={startDiagnosisFromShared}
                  className="rounded-xl border border-emerald-200/30 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/15"
                >
                  我也要重新測試
                </button>
              ) : null}
              <button
                type="button"
                onClick={restartDiagnosis}
                className="rounded-xl border border-emerald-200/30 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/15"
              >
                重新測一次
              </button>
              <Link
                href="/dashboard"
                className="rounded-xl border border-emerald-200/30 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/15"
              >
                去任務面板執行
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
