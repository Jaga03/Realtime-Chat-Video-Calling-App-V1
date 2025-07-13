import DOMPurify from "dompurify";

export function safeLinkifyText(text) {
  const cleanText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

  const urlRegex = /(\b(https?:\/\/|www\.)[^\s<>"']+[^\s<>"'.])/gi;
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

  return cleanText.split(" ").map((word, i) => {
    if (urlRegex.test(word)) {
      const href = word.startsWith("http") ? word : `http://${word}`;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-secondary focus:outline-none break-all mr-1 transition-colors"
        >
          {word}
        </a>
      );
    } else if (emailRegex.test(word)) {
      return (
        <a
          key={i}
          href={`mailto:${word}`}
          className="underline hover:text-secondary focus:outline-none mr-1 transition-colors"
        >
          {word}
        </a>
      );
    }
    return <span key={i} className="mr-1">{word}</span>;
  });
}
