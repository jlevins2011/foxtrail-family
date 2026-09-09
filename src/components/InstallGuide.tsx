export function InstallGuide({
  compact = false,
  asPageTitle = false,
}: {
  compact?: boolean;
  asPageTitle?: boolean;
}) {
  const steps = [
    {
      title: "Open your family’s game screen in Safari",
      body: "On your iPad, sign in with a parent, then open Play to reach the explorer picker.",
    },
    {
      title: "Tap Share",
      body: "The square with an arrow, usually at the top of Safari. Scroll the sheet if you do not see the next step.",
    },
    {
      title: "Tap Add to Home Screen",
      body: "Keep Open as Web App turned on if shown, then tap Add. Your camp icon appears on the iPad home screen.",
    },
    {
      title: "Open from the icon",
      body: "Choose an explorer, enter their child PIN, and play. If the app asks, sign in with a parent once inside it. Parent settings still need your parent PIN.",
    },
  ];

  return (
    <div className="rounded-3xl border border-pine/10 bg-snow/90 p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-mist">
        iPad home screen
      </p>
      {asPageTitle ? (
        <h1 className="mt-2 font-display text-3xl text-pine">
          Add Foxtrail to the family iPad
        </h1>
      ) : (
        <h2 className="mt-2 font-display text-3xl text-pine">
          Add {compact ? "to Home Screen" : "Foxtrail to the family iPad"}
        </h2>
      )}
      <p className="mt-3 max-w-2xl text-base leading-7 text-bark/80">
        A camp icon opens straight to the children’s game space, without the usual website menus. Children stay under your family account. An internet connection is needed to sign in, load games, and save progress.
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
