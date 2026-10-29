import { Link } from "react-router-dom";

// Shared card list of a member's class bookings. Used on the /account page.
export function BookingList({ bookings, loading, error, onNavigate }) {
  if (loading)
    return <p className="text-[0.8rem] text-muted">Loading bookings...</p>;
  if (error)
    return (
      <p role="alert" className="text-[0.8rem] text-red-300 light:text-red-700">
        Could not load your bookings.
      </p>
    );
  if (!bookings?.length) {
    return (
      <div className="text-[0.8rem] text-muted">
        <p>No bookings yet.</p>
        <Link
          to="/#schedule"
          onClick={onNavigate}
          className="mt-2 inline-block text-brand transition hover:opacity-80"
        >
          Browse the schedule
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {bookings.map((booking) => (
        <li
          key={booking.id}
          className="rounded-2xl border border-line bg-ink/40 p-3 light:bg-gray-50"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[0.75rem] font-semibold text-white light:text-gray-900">
              {booking.reference}
            </p>
            <p className="text-[0.7rem] text-muted">
              {booking.totalSpots} {booking.totalSpots === 1 ? "spot" : "spots"}
            </p>
          </div>
          <ul className="mt-1.5 grid gap-1 text-[0.75rem] text-soft">
            {booking.items.map((item) => (
              <li key={item.classId}>
                {item.day} {item.time} &middot; {item.name}{" "}
                <span className="text-white light:text-gray-900">
                  &times; {item.spots}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[0.7rem] text-muted">
            Booked{" "}
            {new Date(booking.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </li>
      ))}
    </ul>
  );
}
