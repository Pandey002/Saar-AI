interface FollowUpChipsProps {
  topics: string[];
  onSelect: (topic: string) => void;
}

export function FollowUpChips({ topics, onSelect }: FollowUpChipsProps) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-900">
        Explore Related Topics
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Continue with a deeper or adjacent concept in one click.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {topics.map((topic) => (
          <button
            key={topic}
            type="button"
            onClick={() => onSelect(topic)}
            className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary shadow-sm"
          >
            {topic}
          </button>
        ))}
      </div>
    </section>
  );
}
