export interface TextAnnotation {
  text: string;
}

/**
 * Reinigt tekst voor weergave door citations, markdown en overmatige formatting te verwijderen
 */
export function cleanTextForDisplay(
  content: string,
  annotations?: TextAnnotation[]
): string {
  let processed = content;

  // Verwijder ALLE vormen van citations uit de lopende tekst:

  // 1. Verwijder OpenAI citation format: 【4:0†source】, 【nummer:titel】, etc.
  processed = processed.replace(/【[^】]*】/g, "");

  // 2. Verwijder lege citation links zoals [](citation:file-xxx)
  processed = processed.replace(/\[\]\(citation:[^)]+\)/g, "");

  // 3. Verwijder ook citation links met tekst zoals [4:0†source](citation:file-xxx)
  processed = processed.replace(/\[[^\]]*\]\(citation:[^)]+\)/g, "");

  // 4. Verwijder eventuele losse citation markers
  if (annotations && annotations.length > 0) {
    annotations.forEach((annotation) => {
      if (annotation.text && annotation.text.trim().length > 0) {
        const escapedText = annotation.text.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );
        const regex = new RegExp(escapedText, "g");
        processed = processed.replace(regex, "");
      }
    });
  }

  // 5. Verwijder overmatige #### markers aan het begin van regels
  processed = processed.replace(/^####\s+/gm, "");
  processed = processed.replace(/\n####\s+/g, "\n\n");

  // 6. Verwijder andere markdown headers voor schone plain text
  processed = processed.replace(/^###\s+/gm, "");
  processed = processed.replace(/^##\s+/gm, "");
  processed = processed.replace(/^#\s+/gm, "");

  // 7. Verwijder markdown bold/italic markers
  processed = processed.replace(/\*\*([^*]+)\*\*/g, "$1"); // **bold**
  processed = processed.replace(/\*([^*]+)\*/g, "$1"); // *italic*

  // Cleanup: verwijder dubbele spaties BINNEN regels, maar behoud newlines
  processed = processed.replace(/[^\S\n]+/g, " ").trim();
  // Verwijder meer dan 2 newlines (max 1 lege regel tussen alinea's)
  processed = processed.replace(/\n{3,}/g, "\n\n");

  return processed;
}

