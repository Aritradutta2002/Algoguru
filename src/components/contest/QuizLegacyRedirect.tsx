import { Navigate, useLocation } from "react-router-dom";

/**
 * Backward compatibility for the pre-Contest MCQ route.
 *
 * A bare `<Navigate to="/contest/quiz" />` would DROP the query string, which
 * would break every existing deep link such as
 * `/quiz?language=java&difficulty=easy`. Forwarding `location.search`
 * explicitly is the whole point of this component — the MCQ setup page reads
 * `language` and `difficulty` from the query to preselect the filters.
 */
export function QuizLegacyRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: "/contest/quiz", search }} replace />;
}

export default QuizLegacyRedirect;
