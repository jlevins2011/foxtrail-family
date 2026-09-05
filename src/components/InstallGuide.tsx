export function InstallGuide({ compact = false }: { compact?: boolean }) {
  const steps = [
    {
      title: "Open this hub in Safari",
      body: "On iPad, Add to Home Screen is most reliable in Safari — not a third-party browser.",
    },
    {
      title: "Tap Share",
      body: "The square with an arrow, usually at the top of Safari. Scroll the sheet if you do not see the next step.",
    },
    {
      title: "Tap Add to Home Screen",
      body: "Name it Foxtrail (or your family name) and tap Add. The lantern-fox icon lands on the iPad home screen.",
    },
    {
      title: "Open from the icon",
      body: "The hub opens as its own app. After the family is unlocked, the library is one tap away.",
    },
  ];

  return (
    <div className="rounded-3xl border border-pine/10 bg-snow/90 p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-mist">
        iPad home screen
      </p>
      <h2 className="mt-2 font-display text-3xl text-pine">
        Add {compact ? "to Home Screen" : "Foxtrail to the family iPad"}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-bark/80">
        This site is a small PWA: it has a web app manifest and a light service
        worker so Safari can offer Add to Home Screen. Kids get a camp icon.
        Parents keep the key.
      </p>
      <ol className="mt-6 grid gap-4 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-2xl bg-cream/80 p-4 ring-1 ring-pine/8"
          >
            <p className="text-sm font-bold text-ember">Step {index + 1}</p>
            <p className="mt-1 font-display text-xl text-pine">{step.title}</p>
            <p className="mt-2 text-sm leading-6 text-bark/80">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
