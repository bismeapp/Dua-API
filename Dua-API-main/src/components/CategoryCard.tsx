export default function CategoryCard({
  category,
  language,
  onClick,
}: {
  category: { color?: string; name: Record<string, string>; duas: unknown[] };
  language: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="category-card animate-fade-in"
    >
      <span className="category-label">
        {category.name[language] || category.name.en}
      </span>
      <span className="category-count">
        {category.duas.length}
      </span>
    </button>
  );
}
