// Highlights the "____" blank of a fill-in-the-blank question
export function BlankPrompt({ prompt }: { prompt: string }) {
  const parts = prompt.split(/(_{2,})/);

  return (
    <>
      {parts.map((part, i) =>
        /^_{2,}$/.test(part) ? (
          <span key={i}>
            <span
              aria-hidden="true"
              className="mx-1 inline-block min-w-16 rounded-md border-b-2 border-primary bg-primary/10 px-2 text-center font-bold text-primary"
            >
              ____
            </span>
            <span className="sr-only">(فراغ)</span>
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}