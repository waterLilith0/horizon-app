import { Link } from "react-router";

function NotFound() {
  return (
    <>
      <title>ERROR 404</title>
      <div className="text-center p-8">
        <h1>404 - Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link to={"/"}>Back to Home</Link>
      </div>
    </>
  );
}

export default NotFound;
