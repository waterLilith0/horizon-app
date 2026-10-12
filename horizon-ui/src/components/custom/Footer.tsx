import { footerRows } from "@/dataAtoms";
import { useAtomValue } from "jotai";
import packageJson from "../../../package.json";
import { Link } from "react-router";

function Footer() {
  const rows = useAtomValue(footerRows);

  return (
    <div className="flex flex-row pr-15 items-center w-full h-35 text-sidebar-foreground bg-sidebar dark:text-sidebar-foreground dark:bg-sidebar">
      <table>
        <tbody>
          {rows.map((row) => {
            return (
              <tr key={crypto.randomUUID()}>
                {row.links.map((link) => {
                  return (
                    <td className="ps-5" key={crypto.randomUUID()}>
                      {link.type === "extern" && (
                        <a href={link.url}>{link.text}</a>
                      )}
                      {link.type === "intern" && (
                        <Link to={link.url}>{link.text}</Link>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="self-end ml-auto text-xs">
        ©Miriam Lilith Fix, 2026 Version: {packageJson.version}
      </p>
    </div>
  );
}

export default Footer;
