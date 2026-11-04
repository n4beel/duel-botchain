export function formatDuelError(err: any): string {
  const msg = err?.shortMessage || err?.message || String(err);

  if (msg.includes("BadOpponent")) {
    return "Invalid opponent address. You cannot challenge yourself or a zero address.";
  }
  if (msg.includes("BadDays")) {
    return "Duel length must be between 3 and 30 days.";
  }
  if (msg.includes("BadStake")) {
    return "Stake must be between 0.01 BOT and 100,000 BOT.";
  }
  if (msg.includes("BadMemo")) {
    return "Memo must be 80 bytes or fewer.";
  }
  if (msg.includes("NotOpponent")) {
    return "Only the challenged opponent can accept this duel.";
  }
  if (msg.includes("TooLate")) {
    return "Accept window has expired (challenges must be accepted within 3 days).";
  }
  if (msg.includes("WrongPayment")) {
    return "Payment does not match the required duel stake.";
  }
  if (msg.includes("NotChallenger")) {
    return "Only the challenger can cancel an unaccepted challenge.";
  }
  if (msg.includes("NotAPlayer")) {
    return "Only active duel participants can check in.";
  }
  if (msg.includes("NotRunning")) {
    return "The duel is not running today. Check-ins are only open during active UTC days.";
  }
  if (msg.includes("AlreadyCheckedIn")) {
    return "You already checked in for today's UTC day.";
  }
  if (msg.includes("NothingToSettle")) {
    return "Nobody has missed a day yet, and the duel isn't over.";
  }
  if (msg.includes("NothingToWithdraw")) {
    return "No pending earnings or stake refunds to withdraw.";
  }

  return msg;
}
