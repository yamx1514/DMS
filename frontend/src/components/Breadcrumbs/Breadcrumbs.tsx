import { Link, useLocation } from "react-router-dom";

const formatSegment = (segment: string) =>
  segment
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const Breadcrumbs = () => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;

    return {
      label: formatSegment(segment),
      href,
      isCurrent: index === segments.length - 1,
    };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
    >
      <Link
        to="/"
        className="transition hover:text-gray-900 hover:underline dark:hover:text-gray-100"
      >
        Home
      </Link>
      {crumbs.map(({ label, href, isCurrent }) => (
        <span key={href} className="flex items-center gap-2">
          <span aria-hidden="true" className="text-gray-400 dark:text-gray-600">
            /
          </span>
          {isCurrent ? (
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {label}
            </span>
          ) : (
            <Link
              to={href}
              className="transition hover:text-gray-900 hover:underline dark:hover:text-gray-100"
            >
              {label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
