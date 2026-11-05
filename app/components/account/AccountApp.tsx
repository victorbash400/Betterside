"use client";
import AccountProvider from "../../state/AccountContext";
import AccountGate from "./AccountGate";
export default function AccountApp({
  showForm = false,
}: {
  showForm?: boolean;
}) {
  return (
    <AccountProvider>
      <AccountGate showForm={showForm} />
    </AccountProvider>
  );
}
