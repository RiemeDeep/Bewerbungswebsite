export type ProfileAssistantProtectionClass = "withdrawn_or_private" | "medical_capability";

function normalizedQuestion(question: string) {
  const normalized = question.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("de-DE");
  return (
    normalized
      .split(/[.!?]+/u)
      .map((part) => part.trim())
      .filter(Boolean)
      .at(-1) ?? ""
  );
}

export function classifyProtectedProfileQuestion(
  question: string,
): ProfileAssistantProtectionClass | null {
  const normalized = normalizedQuestion(question);
  const asksForRestrictedContent =
    normalized.includes("zuruckgezogen") ||
    [
      "gib private",
      "nenne private",
      "welche private",
      "private wohnanschrift",
      "private adresse",
      "interne quelle nennen",
      "interne quellen nennen",
    ].some((term) => normalized.includes(term));
  if (asksForRestrictedContent) return "withdrawn_or_private";

  const medicalSubject = ["diagnos", "therap", "heilwirkung", "medizinische wirkung"].some((term) =>
    normalized.includes(term),
  );
  const capabilityQuestion = [
    "kann ",
    "darf ",
    "befahig",
    "berechtig",
    "kompetenz",
    "wirkung ableiten",
    "wirkung belegt",
  ].some((term) => normalized.includes(term));
  return medicalSubject && capabilityQuestion ? "medical_capability" : null;
}
