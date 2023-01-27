import { Link } from "@remix-run/react";

export default function NoteIndexPage() {
  return (
    <p>
      No order selected. Select an order on the left, or{" "}
      <Link to="new" className="text-blue-500 underline">
        create a new order.
      </Link>
    </p>
  );
}
