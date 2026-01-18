import { Link } from "react-router";
import type { Application } from "../types/Application";

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
}

const cardClassName = `
  group
  block
  p-6
  border-2
  border-slate-200
  rounded-xl
  bg-gradient-to-br
  from-white
  to-slate-50
  shadow-md
  hover:shadow-xl
  hover:border-slate-400
  transition-all
  duration-300
  h-full
  transform
  hover:-translate-y-1
`;

export function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
          {application.appName}
        </h3>
        <span
          className={`
            px-3
            py-1
            rounded-full
            text-xs
            font-semibold
            ${
              application.isActive
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }
          `}
        >
          {application.isActive ? "Activo" : "Inactivo"}
        </span>
      </div>

      {application.description && (
        <p className="text-slate-600 mb-4 line-clamp-2 group-hover:text-slate-700 transition-colors">
          {application.description}
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-500 group-hover:text-slate-600 transition-colors">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <span className="truncate font-mono text-xs">{application.url}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end">
        <span className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors">
          Ver aplicación →
        </span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cardClassName + " text-left w-full cursor-pointer"}
      >
        {content}
      </button>
    );
  }

  return (
    <Link to={application.url} className={cardClassName}>
      {content}
    </Link>
  );
}

