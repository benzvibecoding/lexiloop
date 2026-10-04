"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { StudySession } from "@/components/study/StudySession";
import { ModeTabs } from "@/components/study/ModeTabs";
import { CustomStudy } from "@/components/study/modes/CustomStudy";

const LearnMode = dynamic(() => import("@/components/study/modes/LearnMode").then((m) => m.LearnMode), { ssr: false, loading: () => <ModeFallback /> });
const TypingMode = dynamic(() => import("@/components/study/modes/TypingMode").then((m) => m.TypingMode), { ssr: false, loading: () => <ModeFallback /> });
const QuizMode = dynamic(() => import("@/components/study/modes/QuizMode").then((m) => m.QuizMode), { ssr: false, loading: () => <ModeFallback /> });
const MatchingMode = dynamic(() => import("@/components/study/modes/MatchingMode").then((m) => m.MatchingMode), { ssr: false, loading: () => <ModeFallback /> });
const ClozeMode = dynamic(() => import("@/components/study/modes/ClozeMode").then((m) => m.ClozeMode), { ssr: false, loading: () => <ModeFallback /> });
const PronunciationMode = dynamic(() => import("@/components/study/modes/PronunciationMode").then((m) => m.PronunciationMode), { ssr: false, loading: () => <ModeFallback /> });
const SprintMode = dynamic(() => import("@/components/study/modes/SprintMode").then((m) => m.SprintMode), { ssr: false, loading: () => <ModeFallback /> });

function ModeFallback() {
  return <div aria-busy="true" className="h-48 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800" />;
}

function Inner() {
  const sp = useSearchParams();
  const deck = sp.get("deck");
  const mode = sp.get("mode") ?? "flashcard";
  const cram = sp.get("cram") === "1";

  return (
    <div>
      <ModeTabs />
      <div className="mt-3">
        {mode === "learn" ? <LearnMode deckId={deck} /> : null}
        {mode === "typing" ? <TypingMode deckId={deck} /> : null}
        {mode === "listening" ? <TypingMode deckId={deck} listening /> : null}
        {mode === "quiz" ? <QuizMode deckId={deck} /> : null}
        {mode === "matching" ? <MatchingMode deckId={deck} /> : null}
        {mode === "cloze" ? <ClozeMode deckId={deck} /> : null}
        {mode === "pronunciation" ? <PronunciationMode deckId={deck} /> : null}
        {mode === "sprint" ? <SprintMode deckId={deck} /> : null}
        {mode === "custom" ? <CustomStudy /> : null}
        {mode === "flashcard" || !["learn", "typing", "listening", "quiz", "matching", "cloze", "pronunciation", "sprint", "custom"].includes(mode) ? (
          <StudySession deckId={deck} cram={cram} />
        ) : null}
      </div>
    </div>
  );
}

export default function StudyPage() {
  return (
    <div>
      <Link href="/review" className="text-sm underline">← Ôn tập hôm nay</Link>
      <div className="mt-2">
        <Suspense fallback={<div aria-busy="true" className="h-64 animate-pulse rounded-3xl bg-stone-200" />}>
          <Inner />
        </Suspense>
      </div>
    </div>
  );
}
