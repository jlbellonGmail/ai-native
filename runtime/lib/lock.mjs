// Shared by the file-lock loops (runtime/bootstrap/install.mjs withLock,
// runtime/circuit/claims.mjs withClaimsLock). Creating the lock with "wx"
// reports EEXIST when it is held. On Windows, a lock file another process is
// in the middle of deleting reports EPERM/EBUSY instead (found by
// PAR-CACHE-CONCURRENT on windows-latest CI): that is transient contention to
// retry, not a failure. Anywhere else those codes stay real errors.
export function isLockContention(error, platform = process.platform) {
  if (error?.code === "EEXIST") return true;
  return platform === "win32" && (error?.code === "EPERM" || error?.code === "EBUSY");
}
