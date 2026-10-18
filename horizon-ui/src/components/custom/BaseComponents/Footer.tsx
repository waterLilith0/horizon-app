import { footerRows } from "@/dataAtoms";
import { useAtomValue } from "jotai";
import packageJson from "../../../../package.json";
import { Link } from "react-router";

export default function Footer() {
  const rows = useAtomValue(footerRows);

  return (
    <footer className="w-full bg-sidebar text-sidebar-foreground px-5 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <nav aria-label="Footer">
          {rows.map((row, i) => (
            <ul key={i} className="flex flex-wrap gap-x-5 gap-y-1">
              {row.links.map((link) => (
                <li key={link.url}>
                  {link.type === "extern" ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {link.text}
                    </a>
                  ) : (
                    <Link to={link.url} className="hover:underline">
                      {link.text}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </nav>

        <p className="text-xs">
          © {new Date().getFullYear()} Miriam Lilith Fix
          <span className="ml-2 opacity-70">v{packageJson.version}</span>
        </p>
      </div>
    </footer>
  );
}
