export const hasPendingSlotRequest = (bookings = [], chefProfileId, date, slot) => bookings.some((booking) =>
    booking.status === 'pending' &&
    String(booking.chefProfile?._id || booking.chefProfile) === String(chefProfileId) &&
    booking.date === date &&
    booking.slot === slot
)
