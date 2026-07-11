const fallbackAdminEmails = ["gatchebert@gmail.com"];

export function getAdminEmails() {
  const configuredEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return configuredEmails.length > 0 ? configuredEmails : fallbackAdminEmails;
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.trim().toLowerCase());
}
